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

// =====================
// Route Handlers - Settings (Admin)
// =====================

const handleGetPhotoSettings = async (req, res, projectId) => {
  const settings = await getProjectPhotoWallSettings(projectId);
  return { status: 200, body: { settings } };
};

const handleUpdatePhotoSettings = async (req, res, projectId, body) => {
  await updateProjectPhotoWallSettings(projectId, {
    enabled: body.enabled,
    uploadAccess: body.uploadAccess,
    moderationMode: body.moderationMode,
    familyFriendly: body.familyFriendly,
    maxUploadMb: body.maxUploadMb,
    allowedFormats: body.allowedFormats
  });
  return { status: 200, body: { message: "Photo wall settings updated" } };
};

// =====================
// Route Handlers - Upload (Public)
// =====================

const handleGetUploadUrl = async (req, res, query, reqInfo) => {
  const { projectId, filename, mimeType, fileSize, inviteToken } = query;

  if (!projectId || !filename) {
    return { status: 400, body: { error: "projectId and filename are required" } };
  }

  // Check upload policy
  const policy = await checkUploadPolicy(projectId, inviteToken);
  if (!policy.allowed) {
    return { status: 403, body: { error: policy.reason } };
  }

  const result = await createPhotoUploadUrl(projectId, policy.guestId, {
    filename,
    mimeType,
    fileSize: fileSize ? parseInt(fileSize, 10) : null
  }, reqInfo);

  return { 
    status: 200, 
    body: {
      uploadUrl: result.uploadUrl,
      storageKey: result.storageKey,
      publicUrl: result.publicUrl,
      expiresIn: result.expiresIn
    }
  };
};

const handleConfirmUpload = async (req, res, body, reqInfo) => {
  const { projectId, storageKey, caption, inviteToken, fileSizeBytes, mimeType } = body;

  if (!projectId || !storageKey) {
    return { status: 400, body: { error: "projectId and storageKey are required" } };
  }

  // Check upload policy
  const policy = await checkUploadPolicy(projectId, inviteToken);
  if (!policy.allowed) {
    return { status: 403, body: { error: policy.reason } };
  }

  const result = await processPhotoUpload(storageKey, {
    projectId,
    guestId: policy.guestId,
    inviteId: policy.inviteId,
    source: "UPLOAD",
    caption,
    fileSizeBytes,
    mimeType,
    uploadedByIp: reqInfo.ipAddress,
    uploadedByUserAgent: reqInfo.userAgent
  });

  return {
    status: 201,
    body: {
      photoId: result.photoId,
      status: result.status,
      moderation: result.moderation,
      message: result.status === "AUTO_REJECTED" 
        ? "Upload rejected due to inappropriate content"
        : result.status === "APPROVED"
        ? "Photo uploaded and approved"
        : "Photo uploaded and pending approval"
    }
  };
};

// =====================
// Route Handlers - Gallery (Public)
// =====================

const handleListPhotos = async (req, res, projectId, query) => {
  const limit = parseInt(query.limit, 10) || 50;
  const offset = parseInt(query.offset, 10) || 0;
  const guestId = query.guestId || null;

  const photos = await listProjectPhotos(projectId, {
    status: "APPROVED",
    limit,
    offset,
    guestId
  });

  return { status: 200, body: { photos } };
};

const handleGetPhoto = async (req, res, photoId, guestId) => {
  const photo = await getPhoto(photoId, guestId);
  
  // Only return approved photos via public endpoint
  if (photo.status !== "APPROVED") {
    return { status: 404, body: { error: "Photo not found" } };
  }

  return { status: 200, body: { photo } };
};

const handleLikePhoto = async (req, res, photoId, body, reqInfo) => {
  const { guestId } = body;

  if (!guestId) {
    return { status: 400, body: { error: "guestId is required" } };
  }

  const result = await likePhoto(photoId, guestId, reqInfo.ipAddress);
  return { 
    status: 200, 
    body: { 
      liked: result.liked, 
      likes: result.likes 
    } 
  };
};

const handleUnlikePhoto = async (req, res, photoId, body) => {
  const { guestId } = body;

  if (!guestId) {
    return { status: 400, body: { error: "guestId is required" } };
  }

  const result = await unlikePhoto(photoId, guestId);
  return { 
    status: 200, 
    body: { 
      unliked: result.unliked, 
      likes: result.likes 
    } 
  };
};

// =====================
// Route Handlers - Moderation (Admin)
// =====================

const handleGetModerationQueue = async (req, res, projectId, query) => {
  const status = query.status || "PENDING";
  const limit = parseInt(query.limit, 10) || 50;
  const offset = parseInt(query.offset, 10) || 0;

  const [photos, stats] = await Promise.all([
    getProjectModerationQueue(projectId, { status, limit, offset }),
    getProjectModerationStats(projectId)
  ]);

  return { 
    status: 200, 
    body: { 
      photos, 
      stats,
      pagination: { limit, offset }
    } 
  };
};

const handleModeratePhoto = async (req, res, photoId, body) => {
  const { action, notes } = body;
  const userId = body.userId; // Should come from auth context in production

  if (!action) {
    return { status: 400, body: { error: "action is required (APPROVE or REJECT)" } };
  }

  const result = await moderatePhoto(photoId, { action, userId, notes });
  return { 
    status: 200, 
    body: { 
      photoId: result.photoId,
      status: result.status,
      message: `Photo ${result.status.toLowerCase()}`
    } 
  };
};

// =====================
// Route Handlers - Webhooks
// =====================

const handleS3Webhook = async (req, res, body) => {
  // Verify webhook signature if configured
  const webhookSecret = process.env.S3_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = req.headers["x-webhook-signature"];
    // Implement signature verification here
  }

  const results = await handleS3UploadWebhook(body);
  return { status: 200, body: { processed: results.length, results } };
};

// =====================
// Route Matching
// =====================

const matchRoute = (method, pathname) => {
  // Settings (Admin)
  if (method === "GET" && /^\/projects\/[^/]+\/photo-settings$/.test(pathname)) {
    return { handler: "getPhotoSettings", params: { projectId: pathname.split("/")[2] } };
  }
  if (method === "PUT" && /^\/projects\/[^/]+\/photo-settings$/.test(pathname)) {
    return { handler: "updatePhotoSettings", params: { projectId: pathname.split("/")[2] } };
  }

  // Upload (Public)
  if (method === "GET" && pathname === "/photos/upload-url") {
    return { handler: "getUploadUrl", params: {} };
  }
  if (method === "POST" && pathname === "/photos/confirm-upload") {
    return { handler: "confirmUpload", params: {} };
  }

  // Gallery (Public)
  if (method === "GET" && /^\/projects\/[^/]+\/photos$/.test(pathname)) {
    return { handler: "listPhotos", params: { projectId: pathname.split("/")[2] } };
  }
  if (method === "GET" && /^\/photos\/[^/]+$/.test(pathname)) {
    return { handler: "getPhoto", params: { photoId: pathname.split("/")[2] } };
  }
  if (method === "POST" && /^\/photos\/[^/]+\/like$/.test(pathname)) {
    return { handler: "likePhoto", params: { photoId: pathname.split("/")[2] } };
  }
  if (method === "DELETE" && /^\/photos\/[^/]+\/like$/.test(pathname)) {
    return { handler: "unlikePhoto", params: { photoId: pathname.split("/")[2] } };
  }

  // Moderation (Admin)
  if (method === "GET" && /^\/projects\/[^/]+\/photos\/moderation-queue$/.test(pathname)) {
    return { handler: "getModerationQueue", params: { projectId: pathname.split("/")[2] } };
  }
  if (method === "POST" && /^\/photos\/[^/]+\/moderate$/.test(pathname)) {
    return { handler: "moderatePhoto", params: { photoId: pathname.split("/")[2] } };
  }

  // Webhooks
  if (method === "POST" && pathname === "/webhooks/s3/upload-complete") {
    return { handler: "s3Webhook", params: {} };
  }

  return null;
};

// =====================
// Main Handler
// =====================

const handlePhotosRoutes = async (req, res, body, reqInfo) => {
  const route = matchRoute(req.method, req.pathname);

  if (!route) {
    return null; // Not a photos route
  }

  const { handler, params } = route;

  try {
    let result;

    switch (handler) {
      // Settings
      case "getPhotoSettings":
        result = await handleGetPhotoSettings(req, res, params.projectId);
        break;
      case "updatePhotoSettings":
        result = await handleUpdatePhotoSettings(req, res, params.projectId, body);
        break;

      // Upload
      case "getUploadUrl": {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const query = Object.fromEntries(url.searchParams);
        result = await handleGetUploadUrl(req, res, query, reqInfo);
        break;
      }
      case "confirmUpload":
        result = await handleConfirmUpload(req, res, body, reqInfo);
        break;

      // Gallery
      case "listPhotos": {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const query = Object.fromEntries(url.searchParams);
        result = await handleListPhotos(req, res, params.projectId, query);
        break;
      }
      case "getPhoto":
        result = await handleGetPhoto(req, res, params.photoId, body?.guestId);
        break;
      case "likePhoto":
        result = await handleLikePhoto(req, res, params.photoId, body, reqInfo);
        break;
      case "unlikePhoto":
        result = await handleUnlikePhoto(req, res, params.photoId, body);
        break;

      // Moderation
      case "getModerationQueue": {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const query = Object.fromEntries(url.searchParams);
        result = await handleGetModerationQueue(req, res, params.projectId, query);
        break;
      }
      case "moderatePhoto":
        result = await handleModeratePhoto(req, res, params.photoId, body);
        break;

      // Webhooks
      case "s3Webhook":
        result = await handleS3Webhook(req, res, body);
        break;

      default:
        return null;
    }

    return result;
  } catch (error) {
    // Return error response
    return {
      status: 400,
      body: { error: error.message }
    };
  }
};

module.exports = {
  handlePhotosRoutes
};
