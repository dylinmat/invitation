const {
  // Settings
  getProjectPhotoWallSettings,
  updateProjectPhotoWallSettings,

  // Upload
  createPhotoUploadUrl,
  processPhotoUpload,

  // Gallery
  listProjectPhotos,
  getPhoto,

  // Moderation
  getProjectModerationQueue,
  getProjectModerationStats,
  moderatePhoto,

  // Likes
  likePhoto,
  unlikePhoto,

  // Policy
  checkUploadPolicy,

  // Webhooks
  handleS3UploadWebhook
} = require("./service");

const { handlePhotosRoutes } = require("./routes");

// Fastify plugin for auto-registration
async function photosPlugin(fastify, options) {
  // Register routes via the handler pattern for consistency with existing code
  fastify.addHook("onRequest", async (request, reply) => {
    // Store route handler for use in main index
    request.photosRoutes = handlePhotosRoutes;
  });

  fastify.log.info("Photos module registered");
}

module.exports = {
  // Fastify plugin
  photosPlugin,

  // Route handler (for manual registration)
  handlePhotosRoutes,

  // Settings
  getProjectPhotoWallSettings,
  updateProjectPhotoWallSettings,

  // Upload
  createPhotoUploadUrl,
  processPhotoUpload,

  // Gallery
  listProjectPhotos,
  getPhoto,

  // Moderation
  getProjectModerationQueue,
  getProjectModerationStats,
  moderatePhoto,

  // Likes
  likePhoto,
  unlikePhoto,

  // Policy
  checkUploadPolicy,

  // Webhooks
  handleS3UploadWebhook
};
