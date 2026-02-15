/**
 * S3 Service for Photo Uploads
 * Handles presigned URLs and S3 operations
 */

// Try to import AWS SDK
try {
  var { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
  var { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
} catch (e) {
  // S3 SDK not installed
}

const crypto = require("crypto");
const path = require("path");

// Configuration
const S3_REGION = process.env.AWS_REGION || "us-east-1";
const S3_BUCKET = process.env.S3_PHOTO_BUCKET || process.env.S3_BUCKET;
const S3_ENDPOINT = process.env.S3_ENDPOINT; // For MinIO compatibility
const S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE === "true";

const UPLOAD_URL_EXPIRY = 300; // 5 minutes
const DOWNLOAD_URL_EXPIRY = 3600; // 1 hour

/**
 * Get S3 client instance
 */
const getS3Client = () => {
  if (!S3Client) {
    throw new Error("AWS S3 SDK not installed. Run: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner");
  }

  const config = {
    region: S3_REGION,
  };

  if (S3_ENDPOINT) {
    config.endpoint = S3_ENDPOINT;
    config.forcePathStyle = S3_FORCE_PATH_STYLE;
  }

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
  }

  return new S3Client(config);
};

/**
 * Generate a unique storage key for a photo
 */
const generateStorageKey = (projectId, filename) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString("hex");
  const ext = path.extname(filename).toLowerCase() || ".jpg";
  const safeName = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
  
  return `projects/${projectId}/photos/${timestamp}_${random}_${safeName}${ext}`;
};

/**
 * Generate thumbnail key from original key
 */
const getThumbnailKey = (storageKey) => {
  const ext = path.extname(storageKey);
  const base = storageKey.substring(0, storageKey.length - ext.length);
  return `${base}_thumb${ext}`;
};

/**
 * Generate processed key from original key
 */
const getProcessedKey = (storageKey) => {
  const ext = path.extname(storageKey);
  const base = storageKey.substring(0, storageKey.length - ext.length);
  return `${base}_processed${ext}`;
};

/**
 * Create presigned URL for uploading a photo
 */
const createUploadUrl = async (projectId, filename, mimeType) => {
  if (!S3_BUCKET) {
    throw new Error("S3_BUCKET not configured");
  }

  const s3Client = getS3Client();
  const storageKey = generateStorageKey(projectId, filename);

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: storageKey,
    ContentType: mimeType || "image/jpeg",
    Metadata: {
      "project-id": projectId,
      "upload-timestamp": String(Date.now())
    }
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: UPLOAD_URL_EXPIRY
  });

  // Construct public URL for the file
  const publicUrl = S3_ENDPOINT
    ? `${S3_ENDPOINT}/${S3_BUCKET}/${storageKey}`
    : `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${storageKey}`;

  return {
    uploadUrl,
    storageKey,
    publicUrl,
    expiresIn: UPLOAD_URL_EXPIRY
  };
};

/**
 * Create presigned URL for downloading/viewing a photo
 */
const createDownloadUrl = async (storageKey, expirySeconds = DOWNLOAD_URL_EXPIRY) => {
  if (!S3_BUCKET) {
    throw new Error("S3_BUCKET not configured");
  }

  const s3Client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: storageKey
  });

  const downloadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expirySeconds
  });

  return {
    downloadUrl,
    expiresIn: expirySeconds
  };
};

/**
 * Get public URL for a photo (if bucket is public)
 */
const getPublicUrl = (storageKey) => {
  if (!S3_BUCKET) {
    return null;
  }

  if (S3_ENDPOINT) {
    return `${S3_ENDPOINT}/${S3_BUCKET}/${storageKey}`;
  }

  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${storageKey}`;
};

/**
 * Validate file type is allowed
 */
const validateFileType = (filename, allowedFormats = ["jpg", "jpeg", "png"]) => {
  const ext = path.extname(filename).toLowerCase().replace(".", "");
  return allowedFormats.includes(ext);
};

/**
 * Validate file size
 */
const validateFileSize = (sizeBytes, maxMb = 10) => {
  const maxBytes = maxMb * 1024 * 1024;
  return sizeBytes <= maxBytes;
};

module.exports = {
  createUploadUrl,
  createDownloadUrl,
  getPublicUrl,
  generateStorageKey,
  getThumbnailKey,
  getProcessedKey,
  validateFileType,
  validateFileSize,
  S3_BUCKET,
  S3_REGION
};
