/**
 * Image Moderation Job Processor
 * Features: AWS Rekognition integration, content safety checks, async processing
 */

const { pool } = require("../db");

// Moderation configuration
const MODERATION_CONFIG = {
  minConfidence: 75,           // Minimum confidence threshold for flags
  maxImageSize: 10 * 1024 * 1024,  // 10MB max
  supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  categories: {
    explicit: ['Nudity', 'Graphic Male Nudity', 'Graphic Female Nudity', 'Sexual Activity'],
    suggestive: ['Suggestive', 'Female Swimwear Or Underwear', 'Male Swimwear Or Underwear'],
    violence: ['Violence', 'Graphic Violence', 'Physical Violence', 'Weapon Violence'],
    drugs: ['Drugs', 'Drug Products', 'Drug Use', 'Pills', 'Smoking'],
    hate: ['Hate Symbols', 'Nazi Party', 'White Supremacy']
  }
};

/**
 * Moderate image using AWS Rekognition or stub
 */
async function moderateImage(data, context) {
  const {
    imageId,
    imageUrl,
    imageKey,       // S3 key if already in S3
    organizationId,
    eventId,
    uploaderId,
    moderationType = 'standard'  // 'standard', 'strict', 'minimal'
  } = data;

  console.log(`[image-moderate] Starting moderation for image ${imageId}`, {
    imageUrl: imageUrl?.substring(0, 50) + '...',
    moderationType
  });

  // Update image status to processing
  await updateImageStatus(imageId, 'processing');

  try {
    let moderationResult;

    // Use Rekognition if configured, otherwise stub
    if (process.env.REKOGNITION_ACCESS_KEY && process.env.REKOGNITION_SECRET_KEY) {
      moderationResult = await moderateWithRekognition(imageKey || imageUrl, moderationType);
    } else {
      moderationResult = await moderateWithStub(imageUrl, moderationType);
    }

    // Determine final decision
    const decision = evaluateModerationResult(moderationResult, moderationType);

    // Update database with results
    await updateImageStatus(imageId, 'completed', {
      moderationResult: {
        ...moderationResult,
        decision
      },
      moderatedAt: new Date().toISOString(),
      moderatedBy: 'aws-rekognition',
      attempt: context.attempt || 1
    });

    // Log moderation event
    await logModerationEvent(imageId, organizationId, eventId, decision, moderationResult);

    console.log(`[image-moderate] Completed moderation for image ${imageId}`, {
      decision,
      flags: moderationResult.flags?.length || 0
    });

    // If image was rejected, take additional actions
    if (decision === 'rejected') {
      await handleRejectedImage(imageId, organizationId, uploaderId, moderationResult);
    }

    return {
      status: 'completed',
      imageId,
      decision,
      ...moderationResult
    };

  } catch (error) {
    console.error(`[image-moderate] Moderation failed for image ${imageId}:`, error);
    
    await updateImageStatus(imageId, 'failed', {
      error: error.message,
      failedAt: new Date().toISOString()
    });

    throw error;
  }
}

/**
 * Moderate image using AWS Rekognition
 */
async function moderateWithRekognition(imageSource, moderationType) {
  // Placeholder for AWS SDK Rekognition call
  // In production:
  // const { RekognitionClient, DetectModerationLabelsCommand } = require('@aws-sdk/client-rekognition');
  // const client = new RekognitionClient({ region: process.env.AWS_REGION });
  // const command = new DetectModerationLabelsCommand({
  //   Image: { S3Object: { Bucket: bucket, Name: key } },
  //   MinConfidence: MODERATION_CONFIG.minConfidence
  // });
  // const response = await client.send(command);

  console.log(`[image-moderate:rekognition] Analyzing image...`);

  // Mock response for development
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API latency

  // Simulate random moderation results for testing
  const mockFlags = [];
  
  if (process.env.SIMULATE_MODERATION_FLAGS === 'true') {
    const random = Math.random();
    if (random < 0.1) {
      mockFlags.push({
        name: 'Suggestive',
        confidence: 85.5,
        parentName: null
      });
    } else if (random < 0.05) {
      mockFlags.push({
        name: 'Violence',
        confidence: 92.3,
        parentName: null
      });
    }
  }

  return {
    flags: mockFlags,
    moderationLabels: mockFlags,
    confidence: mockFlags.length > 0 ? Math.max(...mockFlags.map(f => f.confidence)) : 0,
    provider: 'rekognition',
    version: 'v1'
  };
}

/**
 * Development stub for image moderation
 */
async function moderateWithStub(imageUrl, moderationType) {
  console.log(`[image-moderate:stub] Analyzing image...`);

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 200));

  // Return empty flags (image is safe)
  return {
    flags: [],
    moderationLabels: [],
    confidence: 0,
    provider: 'stub',
    version: 'dev'
  };
}

/**
 * Evaluate moderation result and return decision
 */
function evaluateModerationResult(result, moderationType) {
  const { flags } = result;
  
  if (!flags || flags.length === 0) {
    return 'approved';
  }

  const thresholds = {
    minimal: { reject: 95, flag: 90 },
    standard: { reject: 85, flag: 75 },
    strict: { reject: 75, flag: 60 }
  };

  const threshold = thresholds[moderationType] || thresholds.standard;

  // Check for explicit rejection categories
  for (const flag of flags) {
    const confidence = flag.confidence;
    
    // Auto-reject explicit content
    if (MODERATION_CONFIG.categories.explicit.includes(flag.name) && confidence >= threshold.reject) {
      return 'rejected';
    }
    
    // Reject hate symbols
    if (MODERATION_CONFIG.categories.hate.includes(flag.name) && confidence >= threshold.reject) {
      return 'rejected';
    }
    
    // Reject graphic violence
    if (MODERATION_CONFIG.categories.violence.includes(flag.name) && confidence >= threshold.reject) {
      return 'rejected';
    }
  }

  // Check for flags that need review
  for (const flag of flags) {
    if (flag.confidence >= threshold.flag) {
      return 'flagged';
    }
  }

  return 'approved';
}

/**
 * Update image moderation status in database
 */
async function updateImageStatus(imageId, status, metadata = {}) {
  if (!pool) return;

  await pool.query(
    `INSERT INTO image_moderations (image_id, status, metadata, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (image_id) DO UPDATE SET
       status = EXCLUDED.status,
       metadata = image_moderations.metadata || EXCLUDED.metadata,
       updated_at = NOW()`,
    [imageId, status, JSON.stringify(metadata)]
  );
}

/**
 * Log moderation event for auditing
 */
async function logModerationEvent(imageId, organizationId, eventId, decision, result) {
  if (!pool) return;

  await pool.query(
    `INSERT INTO moderation_events (
      image_id, organization_id, event_id, decision, 
      flags, confidence, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [
      imageId,
      organizationId,
      eventId,
      decision,
      JSON.stringify(result.flags),
      result.confidence
    ]
  );
}

/**
 * Handle rejected image
 */
async function handleRejectedImage(imageId, organizationId, uploaderId, result) {
  if (!pool) return;

  // Log rejection for admin review
  await pool.query(
    `INSERT INTO moderation_reviews (
      image_id, organization_id, uploader_id, 
      reason, auto_rejected, created_at
    ) VALUES ($1, $2, $3, $4, true, NOW())`,
    [
      imageId,
      organizationId,
      uploaderId,
      `Auto-rejected: ${result.flags.map(f => f.name).join(', ')}`
    ]
  );

  // Optionally: Move image to quarantine, notify uploader, etc.
  console.log(`[image-moderate] Image ${imageId} rejected and logged for review`);
}

/**
 * Batch moderate multiple images
 */
async function batchModerate(imageIds, options = {}) {
  const results = [];
  
  for (const imageId of imageIds) {
    try {
      // Get image info from database
      const result = await pool?.query(
        `SELECT i.id, i.url, i.key, i.organization_id, i.event_id, i.uploaded_by
         FROM images i
         WHERE i.id = $1`,
        [imageId]
      );

      if (!result?.rows[0]) {
        results.push({ imageId, status: 'error', error: 'Image not found' });
        continue;
      }

      const image = result.rows[0];
      
      const moderationResult = await moderateImage({
        imageId: image.id,
        imageUrl: image.url,
        imageKey: image.key,
        organizationId: image.organization_id,
        eventId: image.event_id,
        uploaderId: image.uploaded_by,
        ...options
      }, { attempt: 1 });

      results.push(moderationResult);

    } catch (error) {
      results.push({ imageId, status: 'error', error: error.message });
    }
  }

  return results;
}

/**
 * Get moderation statistics for organization
 */
async function getModerationStats(organizationId, dateRange = {}) {
  if (!pool) return null;

  const { from, to } = dateRange;
  
  const result = await pool.query(
    `SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN decision = 'approved' THEN 1 END) as approved,
      COUNT(CASE WHEN decision = 'rejected' THEN 1 END) as rejected,
      COUNT(CASE WHEN decision = 'flagged' THEN 1 END) as flagged,
      AVG(confidence) as avg_confidence
    FROM moderation_events
    WHERE organization_id = $1
      AND ($2::timestamp IS NULL OR created_at >= $2)
      AND ($3::timestamp IS NULL OR created_at <= $3)`,
    [organizationId, from || null, to || null]
  );

  return result.rows[0];
}

module.exports = {
  moderateImage,
  moderateWithRekognition,
  moderateWithStub,
  evaluateModerationResult,
  batchModerate,
  getModerationStats,
  MODERATION_CONFIG
};
