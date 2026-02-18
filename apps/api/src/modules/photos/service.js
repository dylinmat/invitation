const crypto = require("crypto");

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - Raw user input
 * @returns {string} - Sanitized output
 */
const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return input;
  
  // Basic HTML tag removal and entity encoding
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const {
  // Photo Wall Settings
  getPhotoWallSettings,
  createPhotoWallSettings,
  updatePhotoWallSettings,

  // Photo Uploads
  createPhotoUpload,
  getPhotoUploadById,
  listPhotoUploads,
  updatePhotoStatus,
  updatePhotoUrls,
  deletePhotoUpload,

  // Moderation Queue
  getModerationQueue,
  getModerationStats,

  // Photo Likes
  createPhotoLike,
  deletePhotoLike,
  getPhotoLikeCount,
  hasGuestLikedPhoto,

  // Upload Policy
  getInviteByTokenHash
} = require("./repository");

const { moderateImage, shouldAutoReject } = require("./moderation");
const {
  createUploadUrl,
  createDownloadUrl,
  getPublicUrl,
  validateFileType,
  validateFileSize,
  S3_BUCKET
} = require("./s3-service");

// =====================
// Photo Wall Settings Service
// =====================

const VALID_UPLOAD_ACCESS = ["LINK", "INVITE_TOKEN", "BOTH"];
const VALID_MODERATION_MODES = ["INSTANT", "APPROVAL"];
const VALID_FILE_FORMATS = ["jpg", "jpeg", "png", "webp", "gif"];

const getProjectPhotoWallSettings = async (projectId) => {
  let settings = await getPhotoWallSettings(projectId);
  
  // Auto-create default settings if not exists
  if (!settings) {
    await createPhotoWallSettings({ projectId });
    settings = await getPhotoWallSettings(projectId);
  }
  
  return settings;
};

const updateProjectPhotoWallSettings = async (projectId, updates) => {
  // Validate upload_access
  if (updates.uploadAccess && !VALID_UPLOAD_ACCESS.includes(updates.uploadAccess)) {
    throw new Error(`Invalid upload_access. Valid values: ${VALID_UPLOAD_ACCESS.join(", ")}`);
  }

  // Validate moderation_mode
  if (updates.moderationMode && !VALID_MODERATION_MODES.includes(updates.moderationMode)) {
    throw new Error(`Invalid moderation_mode. Valid values: ${VALID_MODERATION_MODES.join(", ")}`);
  }

  // Validate allowed_formats
  if (updates.allowedFormats) {
    const invalidFormats = updates.allowedFormats.filter(f => !VALID_FILE_FORMATS.includes(f.toLowerCase()));
    if (invalidFormats.length > 0) {
      throw new Error(`Invalid file formats: ${invalidFormats.join(", ")}. Valid: ${VALID_FILE_FORMATS.join(", ")}`);
    }
  }

  const settings = await getPhotoWallSettings(projectId);
  if (!settings) {
    // Create new settings
    return createPhotoWallSettings({
      projectId,
      enabled: updates.enabled,
      uploadAccess: updates.uploadAccess,
      moderationMode: updates.moderationMode,
      familyFriendly: updates.familyFriendly,
      maxUploadMb: updates.maxUploadMb,
      allowedFormats: updates.allowedFormats
    });
  }

  return updatePhotoWallSettings(projectId, updates);
};

// =====================
// Upload URL Generation
// =====================

const createPhotoUploadUrl = async (projectId, guestId, { filename, mimeType, fileSize }, reqInfo) => {
  // Get settings to validate
  const settings = await getProjectPhotoWallSettings(projectId);
  
  if (!settings.enabled) {
    throw new Error("Photo wall is not enabled for this project");
  }

  // Validate file type
  if (!validateFileType(filename, settings.allowed_formats)) {
    throw new Error(`Invalid file type. Allowed: ${settings.allowed_formats.join(", ")}`);
  }

  // Validate file size if provided
  if (fileSize && !validateFileSize(fileSize, settings.max_upload_mb)) {
    throw new Error(`File too large. Maximum: ${settings.max_upload_mb}MB`);
  }

  // Generate presigned S3 URL
  const s3Result = await createUploadUrl(projectId, filename, mimeType);

  return {
    uploadUrl: s3Result.uploadUrl,
    storageKey: s3Result.storageKey,
    publicUrl: s3Result.publicUrl,
    expiresIn: s3Result.expiresIn
  };
};

// =====================
// Photo Processing
// =====================

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const processPhotoUpload = async (storageKey, { 
  projectId, 
  guestId, 
  inviteId, 
  source = "UPLOAD",
  caption,
  fileSizeBytes,
  mimeType,
  uploadedByIp,
  uploadedByUserAgent
}) => {
  // SECURITY: Sanitize caption to prevent XSS
  const sanitizedCaption = sanitizeInput(caption);
  // Get settings
  const settings = await getProjectPhotoWallSettings(projectId);
  if (!settings) {
    throw new Error("Photo wall settings not found");
  }

  // Get public URL for the uploaded file
  const publicUrl = getPublicUrl(storageKey);

  // Create initial photo record with PENDING status
  const photoId = await createPhotoUpload({
    projectId,
    guestId,
    inviteId,
    source,
    originalUrl: publicUrl,
    storageKey,
    fileSizeBytes,
    mimeType,
    caption: sanitizedCaption,  // SECURITY: Use sanitized caption
    uploadedByIp,
    uploadedByUserAgent
  });

  // Run moderation if Rekognition is enabled
  let moderationResult = null;
  let finalStatus = "PENDING";

  if (S3_BUCKET) {
    moderationResult = await moderateImage(S3_BUCKET, storageKey, settings.family_friendly);

    // Auto-reject inappropriate content
    if (shouldAutoReject(moderationResult, settings.family_friendly)) {
      finalStatus = "AUTO_REJECTED";
      await updatePhotoStatus(photoId, {
        status: finalStatus,
        moderationScore: moderationResult,
        moderationLabels: moderationResult.labels.map(l => l.name)
      });
    } 
    // In instant mode, auto-approve safe content
    else if (settings.moderation_mode === "INSTANT" && moderationResult.safe) {
      finalStatus = "APPROVED";
      await updatePhotoStatus(photoId, {
        status: finalStatus,
        moderationScore: moderationResult,
        moderationLabels: moderationResult.labels.map(l => l.name)
      });
    }
    // Otherwise keep as PENDING for manual review
    else {
      await updatePhotoStatus(photoId, {
        status: "PENDING",
        moderationScore: moderationResult,
        moderationLabels: moderationResult.labels.map(l => l.name)
      });
    }
  }

  return {
    photoId,
    status: finalStatus,
    moderation: moderationResult ? {
      safe: moderationResult.safe,
      flagged: moderationResult.flagged,
      reason: moderationResult.reason
    } : null
  };
};

// =====================
// Photo Gallery
// =====================

const listProjectPhotos = async (projectId, { status = "APPROVED", limit = 50, offset = 0, guestId } = {}) => {
  const photos = await listPhotoUploads(projectId, { status, limit, offset, guestId });
  
  // Add signed URLs for viewing if needed
  const photosWithUrls = await Promise.all(
    photos.map(async (photo) => {
      // If using private bucket, generate signed URLs
      // For now, assume public URLs
      return {
        ...photo,
        likes: parseInt(photo.like_count, 10) || 0
      };
    })
  );

  return photosWithUrls;
};

const getPhoto = async (photoId, guestId) => {
  const photo = await getPhotoUploadById(photoId);
  if (!photo) {
    throw new Error("Photo not found");
  }

  // Add like info
  const likeCount = await getPhotoLikeCount(photoId);
  const hasLiked = guestId ? await hasGuestLikedPhoto(photoId, guestId) : false;

  return {
    ...photo,
    likes: likeCount,
    hasLiked
  };
};

// =====================
// Moderation
// =====================

const getProjectModerationQueue = async (projectId, { status = "PENDING", limit = 50, offset = 0 } = {}) => {
  return getModerationQueue(projectId, { status, limit, offset });
};

const getProjectModerationStats = async (projectId) => {
  return getModerationStats(projectId);
};

const moderatePhoto = async (photoId, { action, userId, notes }) => {
  const VALID_ACTIONS = ["APPROVE", "REJECT"];
  
  if (!VALID_ACTIONS.includes(action)) {
    throw new Error(`Invalid action. Valid: ${VALID_ACTIONS.join(", ")}`);
  }

  const photo = await getPhotoUploadById(photoId);
  if (!photo) {
    throw new Error("Photo not found");
  }

  const status = action === "APPROVE" ? "APPROVED" : "REJECTED";
  
  await updatePhotoStatus(photoId, {
    status,
    moderatedBy: userId,
    moderationNotes: notes
  });

  return {
    photoId,
    status,
    previousStatus: photo.status
  };
};

// =====================
// Photo Likes
// =====================

const likePhoto = async (photoId, guestId, ipAddress) => {
  // Verify photo exists and is approved
  const photo = await getPhotoUploadById(photoId);
  if (!photo) {
    throw new Error("Photo not found");
  }
  
  if (photo.status !== "APPROVED") {
    throw new Error("Cannot like a photo that is not approved");
  }

  const result = await createPhotoLike({ photoId, guestId, ipAddress });
  const likeCount = await getPhotoLikeCount(photoId);

  return {
    liked: result.created,
    likes: likeCount
  };
};

const unlikePhoto = async (photoId, guestId) => {
  const result = await deletePhotoLike(photoId, guestId);
  const likeCount = await getPhotoLikeCount(photoId);

  return {
    unliked: result.deleted,
    likes: likeCount
  };
};

// =====================
// Upload Policy
// =====================

const checkUploadPolicy = async (projectId, inviteToken) => {
  const settings = await getPhotoWallSettings(projectId);
  
  // Photo wall not enabled
  if (!settings || !settings.enabled) {
    return { allowed: false, reason: "Photo wall not enabled" };
  }

  // Public link access - no token needed
  if (settings.upload_access === "LINK") {
    return { allowed: true, requiresToken: false };
  }

  // Both - token optional but valid token allows tracking
  if (settings.upload_access === "BOTH") {
    if (!inviteToken) {
      return { allowed: true, requiresToken: false };
    }
    // Validate token if provided
    const tokenHash = hashToken(inviteToken);
    const invite = await getInviteByTokenHash(tokenHash);
    
    if (!invite || invite.revoked_at || (invite.expires_at && new Date(invite.expires_at) < new Date())) {
      return { allowed: true, requiresToken: false }; // Still allow but as anonymous
    }
    
    return { 
      allowed: true, 
      requiresToken: true, 
      guestId: invite.guest_id,
      inviteId: invite.id
    };
  }

  // INVITE_TOKEN mode - token required
  if (settings.upload_access === "INVITE_TOKEN") {
    if (!inviteToken) {
      return { allowed: false, reason: "Invite token required" };
    }

    const tokenHash = hashToken(inviteToken);
    const invite = await getInviteByTokenHash(tokenHash);

    if (!invite) {
      return { allowed: false, reason: "Invalid invite token" };
    }

    if (invite.revoked_at) {
      return { allowed: false, reason: "Invite has been revoked" };
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return { allowed: false, reason: "Invite has expired" };
    }

    return { 
      allowed: true, 
      requiresToken: true, 
      guestId: invite.guest_id,
      inviteId: invite.id
    };
  }

  return { allowed: false, reason: "Unknown upload access configuration" };
};

// =====================
// Webhook Handler
// =====================

const handleS3UploadWebhook = async (event) => {
  // Parse S3 event
  const records = event.Records || [];
  const results = [];

  for (const record of records) {
    const s3 = record.s3;
    if (!s3) continue;

    const bucket = s3.bucket?.name;
    const key = decodeURIComponent(s3.object?.key?.replace(/\+/g, " "));
    const size = s3.object?.size;

    // Extract project ID from key (projects/{projectId}/photos/...)
    const keyParts = key.split("/");
    const projectId = keyParts[1];

    if (!projectId) {
      results.push({ key, error: "Could not extract project ID from key" });
      continue;
    }

    // Process the upload
    try {
      // Look for existing photo record by storage_key
      // If not found, this might be a direct S3 upload that needs to be tracked
      // For now, assume processPhotoUpload was already called
      results.push({ key, projectId, processed: true });
    } catch (error) {
      results.push({ key, error: error.message });
    }
  }

  return results;
};

module.exports = {
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
