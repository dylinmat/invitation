/**
 * Queue System - Redis-backed job queue with BullMQ-like semantics
 * Features: Priority queues, delayed jobs, retry with exponential backoff, dead letter queue
 */

const { createClient } = require('redis');
const { EventEmitter } = require('events');

const JOB_TYPES = {
  EMAIL_SEND: 'email-send',
  EXPORT_GENERATE: 'export-generate',
  IMAGE_MODERATE: 'image-moderate',
  SCHEDULE_PROMOTE: 'schedule-promote'
};

const PRIORITIES = {
  HIGH: 1,
  NORMAL: 5,
  LOW: 10
};

const QUEUE_NAMES = {
  HIGH: 'eios:queue:high',
  NORMAL: 'eios:queue:normal',
  LOW: 'eios:queue:low',
  DELAYED: 'eios:queue:delayed',
  DLQ: 'eios:queue:dlq',
  PROCESSING: 'eios:processing'
};

class QueueSystem extends EventEmitter {
  constructor(redisUrl, options = {}) {
    super();
    this.redisUrl = redisUrl;
    this.options = {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        timeout: 30000,
        removeOnComplete: 100,
        removeOnFail: 50
      },
      ...options
    };
    this.client = null;
    this.subscriber = null;
    this.isConnected = false;
    this.processors = new Map();
    this.running = false;
    this.metrics = {
      processed: 0,
      failed: 0,
      retried: 0,
      deadLettered: 0
    };
  }

  async connect() {
    if (this.isConnected) return;

    this.client = createClient({
      url: this.redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    this.subscriber = this.client.duplicate();

    this.client.on('error', (err) => {
      this.emit('error', err);
    });

    this.subscriber.on('error', (err) => {
      this.emit('error', err);
    });

    await this.client.connect();
    await this.subscriber.connect();

    this.isConnected = true;
    this.emit('connected');
  }

  async disconnect() {
    this.running = false;
    
    if (this.client) {
      await this.client.quit();
    }
    if (this.subscriber) {
      await this.subscriber.quit();
    }
    
    this.isConnected = false;
    this.emit('disconnected');
  }

  /**
   * Add a job to the queue
   */
  async add(jobType, data, options = {}) {
    if (!this.isConnected) {
      throw new Error('Queue not connected. Call connect() first.');
    }

    const jobOptions = { ...this.options.defaultJobOptions, ...options };
    const priority = jobOptions.priority || PRIORITIES.NORMAL;
    
    const job = {
      id: this.generateJobId(),
      type: jobType,
      data,
      options: jobOptions,
      attempts: 0,
      maxAttempts: jobOptions.attempts,
      createdAt: Date.now(),
      priority
    };

    // Handle delayed jobs
    if (jobOptions.delay && jobOptions.delay > 0) {
      const executeAt = Date.now() + jobOptions.delay;
      await this.client.zAdd(QUEUE_NAMES.DELAYED, {
        score: executeAt,
        value: JSON.stringify({ ...job, executeAt })
      });
      this.emit('job:delayed', { jobId: job.id, executeAt });
      return job;
    }

    // Add to appropriate priority queue
    const queueName = this.getQueueNameByPriority(priority);
    await this.client.lPush(queueName, JSON.stringify(job));
    
    this.emit('job:added', { jobId: job.id, type: jobType, priority });
    return job;
  }

  /**
   * Register a processor for a job type
   */
  process(jobType, processor) {
    if (typeof processor !== 'function') {
      throw new Error('Processor must be a function');
    }
    this.processors.set(jobType, processor);
    this.emit('processor:registered', { jobType });
  }

  /**
   * Get the next job from queues (priority order)
   */
  async getNextJob(timeout = 5000) {
    if (!this.isConnected) return null;

    // Check delayed jobs first
    await this.promoteDelayedJobs();

    // Try high priority first, then normal, then low
    const queues = [QUEUE_NAMES.HIGH, QUEUE_NAMES.NORMAL, QUEUE_NAMES.LOW];
    
    for (const queue of queues) {
      const jobData = await this.client.rPop(queue);
      if (jobData) {
        const job = JSON.parse(jobData);
        // Add to processing set for tracking
        await this.client.hSet(QUEUE_NAMES.PROCESSING, job.id, JSON.stringify({
          ...job,
          startedAt: Date.now()
        }));
        return job;
      }
    }

    return null;
  }

  /**
   * Mark job as completed
   */
  async completeJob(job, result) {
    await this.client.hDel(QUEUE_NAMES.PROCESSING, job.id);
    
    if (job.options.removeOnComplete) {
      // Keep last N completed jobs for metrics
      await this.client.lPush('eios:completed', JSON.stringify({
        jobId: job.id,
        type: job.type,
        completedAt: Date.now(),
        result
      }));
      await this.client.lTrim('eios:completed', 0, job.options.removeOnComplete - 1);
    }

    this.metrics.processed++;
    this.emit('job:completed', { jobId: job.id, type: job.type, result });
  }

  /**
   * Mark job as failed with retry logic
   */
  async failJob(job, error) {
    await this.client.hDel(QUEUE_NAMES.PROCESSING, job.id);

    job.attempts++;
    job.lastError = error.message;

    if (job.attempts < job.maxAttempts) {
      // Calculate retry delay with exponential backoff
      const backoffDelay = this.calculateBackoff(job);
      job.nextAttemptAt = Date.now() + backoffDelay;

      // Add back to delayed queue for retry
      await this.client.zAdd(QUEUE_NAMES.DELAYED, {
        score: job.nextAttemptAt,
        value: JSON.stringify(job)
      });

      this.metrics.retried++;
      this.emit('job:retry', { 
        jobId: job.id, 
        type: job.type, 
        attempt: job.attempts,
        nextAttemptIn: backoffDelay 
      });
    } else {
      // Move to dead letter queue
      await this.moveToDLQ(job, error);
    }
  }

  /**
   * Move failed job to dead letter queue
   */
  async moveToDLQ(job, error) {
    const dlqEntry = {
      ...job,
      failedAt: Date.now(),
      finalError: error.message,
      stack: error.stack
    };

    await this.client.lPush(QUEUE_NAMES.DLQ, JSON.stringify(dlqEntry));
    
    // Trim DLQ to prevent unbounded growth
    const dlqSize = await this.client.lLen(QUEUE_NAMES.DLQ);
    if (dlqSize > 1000) {
      await this.client.rPop(QUEUE_NAMES.DLQ);
    }

    this.metrics.deadLettered++;
    this.emit('job:failed', { 
      jobId: job.id, 
      type: job.type, 
      error: error.message,
      movedToDLQ: true 
    });
  }

  /**
   * Promote delayed jobs that are ready to execute
   */
  async promoteDelayedJobs() {
    const now = Date.now();
    const jobsToPromote = await this.client.zRangeByScore(QUEUE_NAMES.DELAYED, 0, now);

    for (const jobData of jobsToPromote) {
      const job = JSON.parse(jobData);
      await this.client.zRem(QUEUE_NAMES.DELAYED, jobData);
      
      const queueName = this.getQueueNameByPriority(job.priority || PRIORITIES.NORMAL);
      await this.client.lPush(queueName, jobData);
      
      this.emit('job:promoted', { jobId: job.id, type: job.type });
    }

    return jobsToPromote.length;
  }

  /**
   * Get queue metrics
   */
  async getMetrics() {
    const [high, normal, low, delayed, dlq, processing] = await Promise.all([
      this.client.lLen(QUEUE_NAMES.HIGH),
      this.client.lLen(QUEUE_NAMES.NORMAL),
      this.client.lLen(QUEUE_NAMES.LOW),
      this.client.zCard(QUEUE_NAMES.DELAYED),
      this.client.lLen(QUEUE_NAMES.DLQ),
      this.client.hLen(QUEUE_NAMES.PROCESSING)
    ]);

    return {
      queues: { high, normal, low, delayed, dlq, processing },
      total: high + normal + low + delayed,
      ...this.metrics
    };
  }

  /**
   * Retry a job from DLQ
   */
  async retryDLQJob(jobId) {
    const dlqJobs = await this.client.lRange(QUEUE_NAMES.DLQ, 0, -1);
    
    for (const jobData of dlqJobs) {
      const job = JSON.parse(jobData);
      if (job.id === jobId) {
        await this.client.lRem(QUEUE_NAMES.DLQ, 0, jobData);
        
        // Reset attempts and add back to queue
        job.attempts = 0;
        job.lastError = null;
        delete job.failedAt;
        delete job.finalError;
        delete job.stack;

        const queueName = this.getQueueNameByPriority(job.priority || PRIORITIES.NORMAL);
        await this.client.lPush(queueName, JSON.stringify(job));
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get all DLQ jobs
   */
  async getDLQJobs(limit = 100) {
    const jobs = await this.client.lRange(QUEUE_NAMES.DLQ, 0, limit - 1);
    return jobs.map(j => JSON.parse(j));
  }

  calculateBackoff(job) {
    const { backoff } = job.options;
    if (!backoff) return 2000;

    const attempt = job.attempts;
    
    switch (backoff.type) {
      case 'exponential':
        return Math.min(backoff.delay * Math.pow(2, attempt - 1), 60000);
      case 'linear':
        return backoff.delay * attempt;
      case 'fixed':
      default:
        return backoff.delay;
    }
  }

  getQueueNameByPriority(priority) {
    if (priority <= PRIORITIES.HIGH) return QUEUE_NAMES.HIGH;
    if (priority >= PRIORITIES.LOW) return QUEUE_NAMES.LOW;
    return QUEUE_NAMES.NORMAL;
  }

  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = {
  QueueSystem,
  JOB_TYPES,
  PRIORITIES,
  QUEUE_NAMES
};
