/**
 * Job Processors Registry
 * Exports all job processors for the worker system
 */

const { sendEmail, processEmailJobs } = require("./email-send");
const { generateExport } = require("./export-generate");
const { moderateImage } = require("./image-moderate");
const { processSchedulePromote, promoteScheduledJobs } = require("./schedule-promote");
const { JOB_TYPES } = require("../queue");

/**
 * Legacy polling function - used by old worker
 * @deprecated Use QueueSystem instead
 */
const runOnce = async () => {
  const promoted = await promoteScheduledJobs();
  const processed = await processEmailJobs();
  return { promoted, processed };
};

/**
 * Register all processors with the queue system
 */
const registerProcessors = (queueSystem) => {
  // Email send processor
  queueSystem.process(JOB_TYPES.EMAIL_SEND, async (data, context) => {
    return sendEmail(data, context);
  });

  // Export generation processor
  queueSystem.process(JOB_TYPES.EXPORT_GENERATE, async (data, context) => {
    return generateExport(data, context);
  });

  // Image moderation processor
  queueSystem.process(JOB_TYPES.IMAGE_MODERATE, async (data, context) => {
    return moderateImage(data, context);
  });

  // Schedule promote processor
  queueSystem.process(JOB_TYPES.SCHEDULE_PROMOTE, async (data, context) => {
    return processSchedulePromote(data, context);
  });

  console.log('[jobs] All processors registered');
};

module.exports = {
  // Legacy exports
  runOnce,
  promoteScheduledJobs,
  processEmailJobs,
  
  // New processor exports
  registerProcessors,
  sendEmail,
  generateExport,
  moderateImage,
  processSchedulePromote
};
