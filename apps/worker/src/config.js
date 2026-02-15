/**
 * Worker Configuration
 * Environment-based configuration for all worker components
 */

// Redis configuration
const REDIS_URL = process.env.REDIS_URL || 
  process.env.REDISCLOUD_URL || 
  'redis://localhost:6379';

// Database
const DATABASE_URL = process.env.DATABASE_URL || "";

// Worker settings
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY, 10) || 5;
const WORKER_POLL_INTERVAL_MS = parseInt(process.env.WORKER_POLL_INTERVAL_MS, 10) || 1000;
const WORKER_SHUTDOWN_TIMEOUT_MS = parseInt(process.env.WORKER_SHUTDOWN_TIMEOUT_MS, 10) || 30000;

// Job processing settings
const JOB_TIMEOUT_MS = parseInt(process.env.JOB_TIMEOUT_MS, 10) || 30000;
const JOB_MAX_ATTEMPTS = parseInt(process.env.JOB_MAX_ATTEMPTS, 10) || 3;
const JOB_BACKOFF_DELAY_MS = parseInt(process.env.JOB_BACKOFF_DELAY_MS, 10) || 2000;

// Scheduler settings
const SCHEDULER_CAMPAIGN_PROMOTE_INTERVAL_MS = parseInt(
  process.env.SCHEDULER_CAMPAIGN_PROMOTE_INTERVAL_MS, 
  10
) || 60000;

const SCHEDULER_RETENTION_CHECK_INTERVAL_MS = parseInt(
  process.env.SCHEDULER_RETENTION_CHECK_INTERVAL_MS, 
  10
) || 3600000;

const SCHEDULER_SNAPSHOT_INTERVAL_MS = parseInt(
  process.env.SCHEDULER_SNAPSHOT_INTERVAL_MS, 
  10
) || 300000;

const DATA_RETENTION_DAYS = parseInt(process.env.DATA_RETENTION_DAYS, 10) || 90;

// Email settings (SES)
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || 'noreply@example.com';
const SES_ACCESS_KEY = process.env.SES_ACCESS_KEY || '';
const SES_SECRET_KEY = process.env.SES_SECRET_KEY || '';
const SES_REGION = process.env.SES_REGION || 'us-east-1';
const SES_RATE_LIMIT_PER_SECOND = parseInt(process.env.SES_RATE_LIMIT_PER_SECOND, 10) || 14;

// AWS Rekognition settings
const REKOGNITION_ACCESS_KEY = process.env.REKOGNITION_ACCESS_KEY || '';
const REKOGNITION_SECRET_KEY = process.env.REKOGNITION_SECRET_KEY || '';
const REKOGNITION_REGION = process.env.REKOGNITION_REGION || 'us-east-1';

// Export settings
const EXPORT_TEMP_DIR = process.env.EXPORT_TEMP_DIR || '/tmp/exports';
const EXPORT_MAX_ROWS = parseInt(process.env.EXPORT_MAX_ROWS, 10) || 100000;
const EXPORT_RETENTION_HOURS = parseInt(process.env.EXPORT_RETENTION_HOURS, 10) || 24;

// Health check settings
const HEALTH_CHECK_PORT = parseInt(process.env.HEALTH_CHECK_PORT, 10) || 0; // 0 = disabled
const HEALTH_CHECK_PATH = process.env.HEALTH_CHECK_PATH || '/health';

// Development settings
const SIMULATE_EMAIL_FAILURES = process.env.SIMULATE_EMAIL_FAILURES === 'true';
const SIMULATE_MODERATION_FLAGS = process.env.SIMULATE_MODERATION_FLAGS === 'true';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Feature flags
const FEATURES = {
  enableScheduler: process.env.ENABLE_SCHEDULER !== 'false',
  enableMetrics: process.env.ENABLE_METRICS !== 'false',
  enableDLQMonitoring: process.env.ENABLE_DLQ_MONITORING !== 'false',
  enableRetentionPolicy: process.env.ENABLE_RETENTION_POLICY !== 'false'
};

module.exports = {
  // Redis
  REDIS_URL,
  
  // Database
  DATABASE_URL,
  
  // Worker
  WORKER_CONCURRENCY,
  WORKER_POLL_INTERVAL_MS,
  WORKER_SHUTDOWN_TIMEOUT_MS,
  
  // Jobs
  JOB_TIMEOUT_MS,
  JOB_MAX_ATTEMPTS,
  JOB_BACKOFF_DELAY_MS,
  
  // Scheduler
  SCHEDULER_CAMPAIGN_PROMOTE_INTERVAL_MS,
  SCHEDULER_RETENTION_CHECK_INTERVAL_MS,
  SCHEDULER_SNAPSHOT_INTERVAL_MS,
  DATA_RETENTION_DAYS,
  
  // Email
  SES_FROM_EMAIL,
  SES_ACCESS_KEY,
  SES_SECRET_KEY,
  SES_REGION,
  SES_RATE_LIMIT_PER_SECOND,
  
  // Image moderation
  REKOGNITION_ACCESS_KEY,
  REKOGNITION_SECRET_KEY,
  REKOGNITION_REGION,
  
  // Exports
  EXPORT_TEMP_DIR,
  EXPORT_MAX_ROWS,
  EXPORT_RETENTION_HOURS,
  
  // Health check
  HEALTH_CHECK_PORT,
  HEALTH_CHECK_PATH,
  
  // Development
  SIMULATE_EMAIL_FAILURES,
  SIMULATE_MODERATION_FLAGS,
  LOG_LEVEL,
  
  // Features
  FEATURES
};
