/**
 * Scheduler - Cron-based recurring jobs and scheduled campaign promotion
 * Features: Campaign promotion, retention policy, periodic snapshots
 */

const { EventEmitter } = require('events');

class Scheduler extends EventEmitter {
  constructor(queueSystem, db, options = {}) {
    super();
    this.queue = queueSystem;
    this.db = db;
    this.options = {
      campaignPromoteInterval: 60000,     // Every minute
      retentionCheckInterval: 3600000,    // Every hour
      snapshotInterval: 300000,           // Every 5 minutes
      retentionDays: 90,
      ...options
    };
    
    this.jobs = new Map();
    this.running = false;
    this.timers = [];
  }

  start() {
    if (this.running) return;
    
    this.running = true;
    console.log('[scheduler] Started');
    
    // Schedule recurring jobs
    this.schedule('campaign-promote', this.options.campaignPromoteInterval, () => {
      return this.promoteScheduledCampaigns();
    });
    
    this.schedule('retention-enforce', this.options.retentionCheckInterval, () => {
      return this.enforceRetentionPolicy();
    });
    
    this.schedule('periodic-snapshot', this.options.snapshotInterval, () => {
      return this.createPeriodicSnapshot();
    });
    
    this.schedule('dlq-monitor', 300000, () => {  // Every 5 minutes
      return this.monitorDLQ();
    });

    this.emit('started');
  }

  stop() {
    this.running = false;
    
    for (const timer of this.timers) {
      clearInterval(timer);
    }
    this.timers = [];
    
    console.log('[scheduler] Stopped');
    this.emit('stopped');
  }

  /**
   * Schedule a recurring job
   */
  schedule(name, interval, handler) {
    if (this.jobs.has(name)) {
      throw new Error(`Job ${name} already scheduled`);
    }
    
    this.jobs.set(name, {
      name,
      interval,
      handler,
      lastRun: null,
      nextRun: Date.now() + interval,
      runCount: 0,
      errorCount: 0
    });

    const timer = setInterval(async () => {
      const job = this.jobs.get(name);
      if (!job || !this.running) return;

      try {
        job.lastRun = Date.now();
        await handler();
        job.runCount++;
        job.nextRun = Date.now() + interval;
        
        this.emit('job:success', { name, duration: Date.now() - job.lastRun });
      } catch (error) {
        job.errorCount++;
        console.error(`[scheduler] Job ${name} failed:`, error);
        this.emit('job:error', { name, error: error.message });
      }
    }, interval);

    this.timers.push(timer);
    
    // Run immediately on first schedule
    setImmediate(async () => {
      try {
        await handler();
      } catch (error) {
        console.error(`[scheduler] Initial run of ${name} failed:`, error);
      }
    });
  }

  /**
   * Promote scheduled campaigns from SCHEDULED to QUEUED
   */
  async promoteScheduledCampaigns() {
    if (!this.db || !this.db.pool) {
      console.log('[scheduler] DB not available, skipping campaign promotion');
      return;
    }

    const client = await this.db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update campaigns that are ready to go
      const campaignResult = await client.query(
        `UPDATE messaging_campaigns
         SET status = 'QUEUED', updated_at = NOW()
         WHERE status = 'SCHEDULED' 
           AND scheduled_at IS NOT NULL 
           AND scheduled_at <= NOW()
         RETURNING id, name, scheduled_at`
      );

      // Update associated message jobs
      const jobResult = await client.query(
        `UPDATE message_jobs AS mj
         SET status = 'QUEUED', updated_at = NOW()
         FROM messaging_campaigns AS mc
         WHERE mj.campaign_id = mc.id
           AND mj.status = 'SCHEDULED'
           AND mc.scheduled_at IS NOT NULL
           AND mc.scheduled_at <= NOW()
         RETURNING mj.id, mj.campaign_id`
      );

      await client.query('COMMIT');

      const promotedCampaigns = campaignResult.rowCount;
      const promotedJobs = jobResult.rowCount;

      if (promotedCampaigns > 0 || promotedJobs > 0) {
        console.log(`[scheduler] Promoted ${promotedCampaigns} campaigns, ${promotedJobs} jobs`);
        
        // Queue schedule-promote jobs for post-processing
        for (const campaign of campaignResult.rows) {
          await this.queue.add('schedule-promote', {
            campaignId: campaign.id,
            campaignName: campaign.name,
            scheduledAt: campaign.scheduled_at,
            promotedAt: new Date().toISOString()
          }, { 
            priority: 1,  // High priority
            attempts: 3 
          });
        }

        this.emit('campaigns:promoted', { 
          campaigns: promotedCampaigns, 
          jobs: promotedJobs 
        });
      }

      return { campaigns: promotedCampaigns, jobs: promotedJobs };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Enforce data retention policy
   */
  async enforceRetentionPolicy() {
    if (!this.db || !this.db.pool) {
      console.log('[scheduler] DB not available, skipping retention enforcement');
      return;
    }

    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - this.options.retentionDays);

    const client = await this.db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Archive old message events
      const eventsResult = await client.query(
        `DELETE FROM message_events
         WHERE created_at < $1
         RETURNING COUNT(*) as count`,
        [retentionDate]
      );

      // Archive old completed message jobs
      const jobsResult = await client.query(
        `DELETE FROM message_jobs
         WHERE status IN ('SENT', 'FAILED', 'BOUNCED')
           AND updated_at < $1
         RETURNING id`,
        [retentionDate]
      ];

      // Archive old campaigns
      const campaignsResult = await client.query(
        `DELETE FROM messaging_campaigns
         WHERE status IN ('COMPLETED', 'CANCELLED')
           AND updated_at < $1
         RETURNING id`,
        [retentionDate]
      );

      await client.query('COMMIT');

      const deletedEvents = eventsResult.rowCount;
      const deletedJobs = jobsResult.rowCount;
      const deletedCampaigns = campaignsResult.rowCount;

      if (deletedEvents > 0 || deletedJobs > 0 || deletedCampaigns > 0) {
        console.log(`[scheduler] Retention cleanup: ${deletedEvents} events, ${deletedJobs} jobs, ${deletedCampaigns} campaigns`);
        
        this.emit('retention:cleanup', {
          events: deletedEvents,
          jobs: deletedJobs,
          campaigns: deletedCampaigns,
          olderThan: retentionDate
        });
      }

      return { events: deletedEvents, jobs: deletedJobs, campaigns: deletedCampaigns };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create periodic system snapshot
   */
  async createPeriodicSnapshot() {
    try {
      const queueMetrics = await this.queue.getMetrics();
      const snapshot = {
        timestamp: new Date().toISOString(),
        queues: queueMetrics.queues,
        totalPending: queueMetrics.total,
        processed: queueMetrics.processed,
        failed: queueMetrics.failed,
        retried: queueMetrics.retried,
        deadLettered: queueMetrics.deadLettered
      };

      // Store snapshot in Redis for monitoring
      await this.queue.client.lPush('eios:snapshots', JSON.stringify(snapshot));
      await this.queue.client.lTrim('eios:snapshots', 0, 287); // Keep 24 hours (288 * 5min)

      this.emit('snapshot:created', snapshot);
      
      return snapshot;
    } catch (error) {
      console.error('[scheduler] Snapshot creation failed:', error);
      throw error;
    }
  }

  /**
   * Monitor dead letter queue and alert if needed
   */
  async monitorDLQ() {
    try {
      const metrics = await this.queue.getMetrics();
      
      if (metrics.queues.dlq > 10) {
        console.warn(`[scheduler] DLQ alert: ${metrics.queues.dlq} jobs in dead letter queue`);
        
        // Get sample of DLQ jobs for investigation
        const dlqJobs = await this.queue.getDLQJobs(5);
        
        this.emit('dlq:alert', {
          count: metrics.queues.dlq,
          sample: dlqJobs.map(j => ({
            id: j.id,
            type: j.type,
            failedAt: j.failedAt,
            error: j.finalError
          }))
        });
      }

      return { dlqSize: metrics.queues.dlq };
    } catch (error) {
      console.error('[scheduler] DLQ monitoring failed:', error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    const jobs = {};
    for (const [name, job] of this.jobs) {
      jobs[name] = {
        interval: job.interval,
        lastRun: job.lastRun,
        nextRun: job.nextRun,
        runCount: job.runCount,
        errorCount: job.errorCount
      };
    }

    return {
      running: this.running,
      jobs
    };
  }

  /**
   * Schedule a one-time job at a specific time
   */
  async scheduleAt(date, jobType, data, options = {}) {
    const delay = date.getTime() - Date.now();
    
    if (delay <= 0) {
      throw new Error('Schedule date must be in the future');
    }

    return this.queue.add(jobType, data, {
      ...options,
      delay
    });
  }

  /**
   * Schedule with cron-like pattern (simplified)
   * Supports: @hourly, @daily, @weekly, or interval in minutes
   */
  scheduleCron(pattern, jobType, data, options = {}) {
    let interval;
    
    switch (pattern) {
      case '@minutely':
        interval = 60000;
        break;
      case '@hourly':
        interval = 3600000;
        break;
      case '@daily':
        interval = 86400000;
        break;
      case '@weekly':
        interval = 604800000;
        break;
      default:
        // Try to parse as minutes
        const minutes = parseInt(pattern, 10);
        if (!isNaN(minutes)) {
          interval = minutes * 60000;
        } else {
          throw new Error(`Unknown cron pattern: ${pattern}`);
        }
    }

    const name = `cron:${jobType}:${Date.now()}`;
    
    this.schedule(name, interval, async () => {
      await this.queue.add(jobType, data, {
        ...options,
        priority: options.priority || 5
      });
    });

    return name;
  }
}

module.exports = { Scheduler };
