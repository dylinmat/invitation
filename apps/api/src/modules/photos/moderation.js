/**
 * AWS Rekognition Moderation Service
 * Handles content moderation for uploaded photos
 */

// Check if AWS SDK is available
let RekognitionClient;
let DetectModerationLabelsCommand;

try {
  const rekognition = require("@aws-sdk/client-rekognition");
  RekognitionClient = rekognition.RekognitionClient;
  DetectModerationLabelsCommand = rekognition.DetectModerationLabelsCommand;
} catch (e) {
  // AWS SDK not installed - moderation will use mock/stub
}

// Configuration
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const REKOGNITION_ENABLED = process.env.REKOGNITION_ENABLED === "true";
const S3_BUCKET = process.env.S3_PHOTO_BUCKET || process.env.S3_BUCKET;

// Moderation thresholds
const MODERATION_THRESHOLDS = {
  // Family-friendly mode - strict
  STRICT: {
    EXPLICIT: 50,      // Explicit nudity
    SUGGESTIVE: 60,    // Suggestive content
    VIOLENCE: 70,      // Violence/gore
    DRUGS: 70,         // Drug-related
    HATE: 80           // Hate symbols
  },
  // Relaxed mode - only block explicit content
  RELAXED: {
    EXPLICIT: 70,      // Only explicit nudity
    SUGGESTIVE: 90,    // Allow suggestive
    VIOLENCE: 85,      // Block extreme violence
    DRUGS: 85,         // Block drug paraphernalia
    HATE: 70           // Block hate symbols
  }
};

// Content categories we check
const CONTENT_CATEGORIES = {
  EXPLICIT: ["Explicit Nudity", "Graphic Male Nudity", "Graphic Female Nudity", "Sexual Activity"],
  SUGGESTIVE: ["Suggestive", "Female Swimwear Or Underwear", "Male Swimwear Or Underwear", "Partial Nudity"],
  VIOLENCE: ["Violence", "Graphic Violence", "Physical Violence", "Weapon Violence", "Self Injury"],
  DRUGS: ["Drugs", "Drug Products", "Drug Use", "Drug Paraphernalia", "Tobacco", "Smoking"],
  HATE: ["Hate Symbols", "Nazi Party", "White Supremacy", "Extremist"]
};

/**
 * Initialize Rekognition client
 */
const getRekognitionClient = () => {
  if (!RekognitionClient || !REKOGNITION_ENABLED) {
    return null;
  }

  return new RekognitionClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
};

/**
 * Check if content category should be flagged
 */
const checkCategory = (label, familyFriendly = true) => {
  const thresholds = familyFriendly ? MODERATION_THRESHOLDS.STRICT : MODERATION_THRESHOLDS.RELAXED;
  const confidence = label.Confidence || 0;
  const name = label.Name || "";
  const parentName = label.ParentName || "";

  // Check against all categories
  for (const [category, keywords] of Object.entries(CONTENT_CATEGORIES)) {
    for (const keyword of keywords) {
      if (name.includes(keyword) || parentName.includes(keyword)) {
        const threshold = thresholds[category];
        if (confidence >= threshold) {
          return {
            flagged: true,
            category,
            confidence,
            threshold,
            name
          };
        }
      }
    }
  }

  return { flagged: false };
};

/**
 * Moderate an image using AWS Rekognition
 * @param {string} s3Bucket - S3 bucket name
 * @param {string} s3Key - S3 object key
 * @param {boolean} familyFriendly - Whether to use strict moderation
 * @returns {Object} Moderation result
 */
const moderateImage = async (s3Bucket, s3Key, familyFriendly = true) => {
  // If Rekognition not configured, return safe result
  const client = getRekognitionClient();
  if (!client) {
    return {
      safe: true,
      labels: [],
      flagged: false,
      reason: null,
      skipped: true,
      message: "Rekognition not configured"
    };
  }

  try {
    const command = new DetectModerationLabelsCommand({
      Image: {
        S3Object: {
          Bucket: s3Bucket,
          Name: s3Key
        }
      },
      MinConfidence: 50 // Only return labels with confidence >= 50%
    });

    const response = await client.send(command);
    const labels = response.ModerationLabels || [];

    // Analyze labels
    const flaggedLabels = [];
    let maxFlaggedCategory = null;
    let maxConfidence = 0;

    for (const label of labels) {
      const check = checkCategory(label, familyFriendly);
      if (check.flagged) {
        flaggedLabels.push({
          name: label.Name,
          parentName: label.ParentName,
          confidence: label.Confidence,
          category: check.category
        });

        if (check.confidence > maxConfidence) {
          maxConfidence = check.confidence;
          maxFlaggedCategory = check.category;
        }
      }
    }

    const isFlagged = flaggedLabels.length > 0;

    return {
      safe: !isFlagged,
      labels: labels.map(l => ({
        name: l.Name,
        parentName: l.ParentName,
        confidence: l.Confidence
      })),
      flagged: isFlagged,
      flaggedLabels: isFlagged ? flaggedLabels : undefined,
      reason: isFlagged ? `Flagged for ${maxFlaggedCategory}` : null,
      confidence: isFlagged ? maxConfidence : undefined
    };
  } catch (error) {
    console.error("Rekognition moderation error:", error);
    
    // In case of error, return safe with error flag so admin can review
    return {
      safe: true,
      labels: [],
      flagged: false,
      reason: null,
      error: error.message,
      requiresReview: true
    };
  }
};

/**
 * Check multiple moderation labels for auto-rejection
 * @param {Object} moderationResult - Result from moderateImage
 * @param {boolean} familyFriendly - Whether in family-friendly mode
 * @returns {boolean} Whether photo should be auto-rejected
 */
const shouldAutoReject = (moderationResult, familyFriendly = true) => {
  if (!moderationResult.flagged) {
    return false;
  }

  // In family-friendly mode, auto-reject any flagged content
  if (familyFriendly) {
    return true;
  }

  // In relaxed mode, only auto-reject explicit content
  const hasExplicit = moderationResult.flaggedLabels?.some(
    l => l.category === "EXPLICIT" || l.category === "HATE"
  );
  
  return hasExplicit;
};

module.exports = {
  moderateImage,
  shouldAutoReject,
  CONTENT_CATEGORIES,
  MODERATION_THRESHOLDS
};
