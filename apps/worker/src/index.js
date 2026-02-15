/**
 * Event Invitation OS (EIOS) - Worker Service
 * 
 * Production-ready worker system with:
 * - Redis-backed job queue (BullMQ-like semantics)
 * - Concurrent job processing
 * - Priority queues, delayed jobs, retries with exponential backoff
 * - Dead letter queue for failed jobs
 * - Cron-based scheduler for recurring tasks
 * - Health check endpoint
 * - Graceful shutdown handling
 */

const http = require('http');
const { QueueSystem } = require('./queue');
const { WorkerEngine } = require('./worker');
const { Scheduler } = require('./scheduler');
const { registerProcessors } = require('./jobs');
const db = require('./db');

const config = require('./config');

// Main application class
class WorkerApplication {
  constructor() {
    this.queue = null;
    this.worker = null;
    this.scheduler = null;
    this.server = null;
    this.started = false;
    
    // Bind methods
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.handleSignals = this.handleSignals.bind(this);
  }

  async start() {
    if (this.started) {
      console.log('[app] Worker already started');
      return;
    }

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     Event Invitation OS (EIOS) - Worker Service            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log();

    try {
      // 1. Initialize queue system
      console.log('[app] Connecting to Redis...');
      this.queue = new QueueSystem(config.REDIS_URL, {
        defaultJobOptions: {
          attempts: config.JOB_MAX_ATTEMPTS,
          backoff: {
            type: 'exponential',
            delay: config.JOB_BACKOFF_DELAY_MS
          },
          timeout: config.JOB_TIMEOUT_MS
        }
      });

      await this.queue.connect();
      console.log('[app] ✓ Redis connected');

      // 2. Register job processors
      console.log('[app] Registering job processors...');
      registerProcessors(this.queue);

      // 3. Initialize worker engine
      console.log('[app] Initializing worker engine...');
      this.worker = new WorkerEngine(this.queue, {
        concurrency: config.WORKER_CONCURRENCY,
        pollInterval: config.WORKER_POLL_INTERVAL_MS,
        shutdownTimeout: config.WORKER_SHUTDOWN_TIMEOUT_MS
      });

      // 4. Initialize scheduler (if enabled)
      if (config.FEATURES.enableScheduler) {
        console.log('[app] Initializing scheduler...');
        this.scheduler = new Scheduler(this.queue, db, {
          campaignPromoteInterval: config.SCHEDULER_CAMPAIGN_PROMOTE_INTERVAL_MS,
          retentionCheckInterval: config.SCHEDULER_RETENTION_CHECK_INTERVAL_MS,
          snapshotInterval: config.SCHEDULER_SNAPSHOT_INTERVAL_MS,
          retentionDays: config.DATA_RETENTION_DAYS
        });
      }

      // 5. Start health check server (if enabled)
      if (config.HEALTH_CHECK_PORT > 0) {
        this.startHealthServer();
      }

      // 6. Start components
      await this.worker.start();
      
      if (this.scheduler) {
        this.scheduler.start();
      }

      this.started = true;
      
      console.log();
      console.log('[app] ✓ Worker service started successfully');
      console.log(`     - Concurrency: ${config.WORKER_CONCURRENCY}`);
      console.log(`     - Redis: ${this.maskUrl(config.REDIS_URL)}`);
      console.log(`     - Health check: ${config.HEALTH_CHECK_PORT > 0 ? `:${config.HEALTH_CHECK_PORT}${config.HEALTH_CHECK_PATH}` : 'disabled'}`);
      console.log(`     - Scheduler: ${config.FEATURES.enableScheduler ? 'enabled' : 'disabled'}`);
      console.log();

      // Handle graceful shutdown
      this.handleSignals();

    } catch (error) {
      console.error('[app] Failed to start worker:', error);
      await this.stop(1);
    }
  }

  async stop(exitCode = 0) {
    if (!this.started) return;

    console.log();
    console.log('[app] Stopping worker service...');

    // Stop scheduler first
    if (this.scheduler) {
      this.scheduler.stop();
    }

    // Stop worker (graceful shutdown)
    if (this.worker) {
      await this.worker.stop();
    }

    // Close queue connection
    if (this.queue) {
      await this.queue.disconnect();
    }

    // Close health server
    if (this.server) {
      this.server.close();
    }

    this.started = false;
    
    console.log('[app] Worker service stopped');

    if (exitCode !== undefined) {
      process.exit(exitCode);
    }
  }

  startHealthServer() {
    this.server = http.createServer((req, res) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.url === config.HEALTH_CHECK_PATH && req.method === 'GET') {
        const health = this.getHealthStatus();
        const statusCode = health.status === 'healthy' ? 200 : 503;
        
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health, null, 2));
      } else if (req.url === '/metrics' && req.method === 'GET') {
        this.getMetrics().then(metrics => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(metrics, null, 2));
        }).catch(error => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    this.server.listen(config.HEALTH_CHECK_PORT, () => {
      console.log(`[app] Health check server listening on port ${config.HEALTH_CHECK_PORT}`);
    });
  }

  getHealthStatus() {
    const workerHealth = this.worker?.getHealth() || { status: 'unknown' };
    const schedulerStatus = this.scheduler?.getStatus() || { running: false };

    const status = workerHealth.status === 'healthy' && this.started
      ? 'healthy'
      : 'unhealthy';

    return {
      status,
      service: 'eios-worker',
      timestamp: new Date().toISOString(),
      worker: workerHealth,
      scheduler: schedulerStatus,
      uptime: process.uptime()
    };
  }

  async getMetrics() {
    const queueMetrics = await this.queue?.getMetrics() || {};
    const workerMetrics = this.worker?.metrics || {};

    return {
      timestamp: new Date().toISOString(),
      queues: queueMetrics.queues || {},
      totals: {
        processed: queueMetrics.processed || 0,
        failed: queueMetrics.failed || 0,
        retried: queueMetrics.retried || 0,
        deadLettered: queueMetrics.deadLettered || 0
      },
      worker: {
        jobsProcessed: workerMetrics.jobsProcessed || 0,
        jobsFailed: workerMetrics.jobsFailed || 0,
        jobsTimedOut: workerMetrics.jobsTimedOut || 0,
        averageProcessingTime: workerMetrics.averageProcessingTime || 0
      }
    };
  }

  handleSignals() {
    const shutdown = (signal) => {
      console.log(`\n[app] Received ${signal}`);
      this.stop(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  maskUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.password) {
        parsed.password = '****';
      }
      return parsed.toString();
    } catch {
      return url.replace(/:\/\/.*@/, '://****@');
    }
  }
}

// Create and start application
const app = new WorkerApplication();

// Export for testing
module.exports = { WorkerApplication, app };

// Start if run directly
if (require.main === module) {
  app.start().catch(error => {
    console.error('[app] Fatal error:', error);
    process.exit(1);
  });
}
