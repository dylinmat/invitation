/**
 * Worker Engine - Concurrent job processing with graceful shutdown
 * Features: Configurable concurrency, job timeout handling, metrics collection
 */

const { EventEmitter } = require('events');

class WorkerEngine extends EventEmitter {
  constructor(queueSystem, options = {}) {
    super();
    this.queue = queueSystem;
    this.options = {
      concurrency: 5,
      pollInterval: 1000,
      shutdownTimeout: 30000,
      ...options
    };
    
    this.running = false;
    this.shuttingDown = false;
    this.activeJobs = new Map();
    this.processingCount = 0;
    this.metrics = {
      startedAt: null,
      jobsProcessed: 0,
      jobsFailed: 0,
      jobsTimedOut: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0
    };
    
    this.pollTimer = null;
    this.metricsTimer = null;
    
    this.setupSignalHandlers();
  }

  setupSignalHandlers() {
    const shutdown = (signal) => {
      console.log(`[worker] Received ${signal}, starting graceful shutdown...`);
      this.shutdown();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    process.on('uncaughtException', (err) => {
      console.error('[worker] Uncaught exception:', err);
      this.shutdown(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[worker] Unhandled rejection at:', promise, 'reason:', reason);
    });
  }

  async start() {
    if (this.running) return;
    
    this.running = true;
    this.metrics.startedAt = Date.now();
    
    console.log(`[worker] Started with concurrency: ${this.options.concurrency}`);
    
    this.emit('started');
    
    // Start polling loop
    this.poll();
    
    // Start metrics reporting
    this.metricsTimer = setInterval(() => {
      this.reportMetrics();
    }, 60000);
  }

  async poll() {
    while (this.running && !this.shuttingDown) {
      try {
        // Check if we have capacity
        if (this.processingCount < this.options.concurrency) {
          const job = await this.queue.getNextJob(1000);
          
          if (job) {
            this.processJob(job).catch(err => {
              console.error(`[worker] Error processing job ${job.id}:`, err);
            });
          }
        }
        
        // Small delay to prevent tight polling
        await this.sleep(100);
      } catch (error) {
        console.error('[worker] Poll error:', error);
        await this.sleep(this.options.pollInterval);
      }
    }
  }

  async processJob(job) {
    const startTime = Date.now();
    this.processingCount++;
    this.activeJobs.set(job.id, {
      job,
      startedAt: startTime,
      timeoutId: null
    });

    this.emit('job:started', { jobId: job.id, type: job.type });

    try {
      const processor = this.queue.processors.get(job.type);
      
      if (!processor) {
        throw new Error(`No processor registered for job type: ${job.type}`);
      }

      // Set up timeout handling
      const timeout = job.options.timeout || 30000;
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Job timeout after ${timeout}ms`));
        }, timeout);
        
        const activeJob = this.activeJobs.get(job.id);
        if (activeJob) {
          activeJob.timeoutId = timeoutId;
        }
      });

      // Race between processor and timeout
      const result = await Promise.race([
        processor(job.data, { jobId: job.id, attempt: job.attempts }),
        timeoutPromise
      ]);

      // Clear timeout if job completed
      const activeJob = this.activeJobs.get(job.id);
      if (activeJob && activeJob.timeoutId) {
        clearTimeout(activeJob.timeoutId);
      }

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, true);
      
      await this.queue.completeJob(job, result);
      
      this.emit('job:completed', { 
        jobId: job.id, 
        type: job.type, 
        processingTime,
        result 
      });

    } catch (error) {
      // Clear timeout if error occurred
      const activeJob = this.activeJobs.get(job.id);
      if (activeJob && activeJob.timeoutId) {
        clearTimeout(activeJob.timeoutId);
      }

      const processingTime = Date.now() - startTime;
      
      if (error.message.includes('timeout')) {
        this.metrics.jobsTimedOut++;
        this.emit('job:timeout', { jobId: job.id, type: job.type });
      }

      this.updateMetrics(processingTime, false);
      
      await this.queue.failJob(job, error);
      
      this.emit('job:failed', { 
        jobId: job.id, 
        type: job.type, 
        error: error.message,
        processingTime
      });
    } finally {
      this.activeJobs.delete(job.id);
      this.processingCount--;
    }
  }

  updateMetrics(processingTime, success) {
    this.metrics.totalProcessingTime += processingTime;
    this.metrics.jobsProcessed++;
    
    if (!success) {
      this.metrics.jobsFailed++;
    }
    
    // Calculate running average
    this.metrics.averageProcessingTime = 
      this.metrics.totalProcessingTime / this.metrics.jobsProcessed;
  }

  async shutdown(exitCode = 0) {
    if (this.shuttingDown) return;
    
    this.shuttingDown = true;
    this.running = false;
    
    console.log(`[worker] Graceful shutdown initiated. ${this.processingCount} jobs active.`);
    
    // Clear timers
    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (this.metricsTimer) clearInterval(this.metricsTimer);

    // Wait for active jobs to complete (with timeout)
    const shutdownStart = Date.now();
    
    while (this.processingCount > 0) {
      const elapsed = Date.now() - shutdownStart;
      
      if (elapsed > this.options.shutdownTimeout) {
        console.error(`[worker] Shutdown timeout reached. ${this.processingCount} jobs still active.`);
        
        // Mark remaining jobs for retry
        for (const [jobId, activeJob] of this.activeJobs) {
          console.log(`[worker] Re-queueing job ${jobId}`);
          await this.queue.failJob(activeJob.job, new Error('Worker shutdown'));
        }
        
        break;
      }
      
      console.log(`[worker] Waiting for ${this.processingCount} jobs to complete...`);
      await this.sleep(1000);
    }

    // Disconnect from queue
    await this.queue.disconnect();
    
    this.emit('shutdown');
    
    console.log('[worker] Shutdown complete.');
    
    if (exitCode !== undefined) {
      process.exit(exitCode);
    }
  }

  reportMetrics() {
    const uptime = this.metrics.startedAt 
      ? Math.floor((Date.now() - this.metrics.startedAt) / 1000)
      : 0;
    
    console.log('[worker:metrics]', {
      uptime: `${uptime}s`,
      activeJobs: this.processingCount,
      jobsProcessed: this.metrics.jobsProcessed,
      jobsFailed: this.metrics.jobsFailed,
      jobsTimedOut: this.metrics.jobsTimedOut,
      avgProcessingTime: `${Math.round(this.metrics.averageProcessingTime)}ms`
    });
    
    this.emit('metrics', { ...this.metrics, uptime });
  }

  getHealth() {
    return {
      status: this.running && !this.shuttingDown ? 'healthy' : 'unhealthy',
      running: this.running,
      shuttingDown: this.shuttingDown,
      activeJobs: this.processingCount,
      concurrency: this.options.concurrency,
      metrics: { ...this.metrics }
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { WorkerEngine };
