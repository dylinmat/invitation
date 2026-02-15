const { query } = require("../../db");

// =====================
// Photo Wall Settings
// =====================

const getPhotoWallSettings = async (projectId) => {
  const result = await query(
    `SELECT id, project_id, enabled, upload_access, moderation_mode, family_friendly,
            max_upload_mb, allowed_formats, created_at, updated_at
     FROM photo_wall_settings
     WHERE project_id = $1`,
    [projectId]
  );
  return result.rows[0] || null;
};

const createPhotoWallSettings = async ({
  projectId,
  enabled = false,
  uploadAccess = "INVITE_TOKEN",
  moderationMode = "APPROVAL",
  familyFriendly = true,
  maxUploadMb = 10,
  allowedFormats = ["jpg", "jpeg", "png"]
}) => {
  const result = await query(
    `INSERT INTO photo_wall_settings (project_id, enabled, upload_access, moderation_mode,
                                      family_friendly, max_upload_mb, allowed_formats)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [projectId, enabled, uploadAccess, moderationMode, familyFriendly, maxUploadMb, allowedFormats]
  );
  return result.rows[0]?.id;
};

const updatePhotoWallSettings = async (projectId, updates) => {
  const fields = [];
  const values = [];
  let paramIdx = 1;

  if (updates.enabled !== undefined) {
    fields.push(`enabled = $${paramIdx++}`);
    values.push(updates.enabled);
  }
  if (updates.uploadAccess !== undefined) {
    fields.push(`upload_access = $${paramIdx++}`);
    values.push(updates.uploadAccess);
  }
  if (updates.moderationMode !== undefined) {
    fields.push(`moderation_mode = $${paramIdx++}`);
    values.push(updates.moderationMode);
  }
  if (updates.familyFriendly !== undefined) {
    fields.push(`family_friendly = $${paramIdx++}`);
    values.push(updates.familyFriendly);
  }
  if (updates.maxUploadMb !== undefined) {
    fields.push(`max_upload_mb = $${paramIdx++}`);
    values.push(updates.maxUploadMb);
  }
  if (updates.allowedFormats !== undefined) {
    fields.push(`allowed_formats = $${paramIdx++}`);
    values.push(updates.allowedFormats);
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = now()`);
  values.push(projectId);

  const result = await query(
    `UPDATE photo_wall_settings SET ${fields.join(", ")} WHERE project_id = $${paramIdx} RETURNING id`,
    values
  );
  return result.rows[0]?.id || null;
};

// =====================
// Photo Uploads
// =====================

const createPhotoUpload = async ({
  projectId,
  guestId,
  inviteId,
  source = "UPLOAD",
  originalUrl,
  storageKey,
  fileSizeBytes,
  mimeType,
  caption,
  uploadedByIp,
  uploadedByUserAgent
}) => {
  const result = await query(
    `INSERT INTO photo_uploads (project_id, guest_id, invite_id, source, original_url,
                                storage_key, file_size_bytes, mime_type, caption,
                                uploaded_by_ip, uploaded_by_user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id`,
    [
      projectId,
      guestId || null,
      inviteId || null,
      source,
      originalUrl,
      storageKey,
      fileSizeBytes || null,
      mimeType || null,
      caption || null,
      uploadedByIp || null,
      uploadedByUserAgent || null
    ]
  );
  return result.rows[0]?.id;
};

const getPhotoUploadById = async (photoId) => {
  const result = await query(
    `SELECT p.id, p.project_id, p.guest_id, p.invite_id, p.status, p.source,
            p.original_url, p.thumbnail_url, p.processed_url, p.storage_key,
            p.file_size_bytes, p.mime_type, p.caption,
            p.moderation_score, p.moderation_labels, p.moderated_at, p.moderated_by,
            p.moderation_notes, p.created_at, p.updated_at,
            g.first_name as guest_first_name, g.last_name as guest_last_name
     FROM photo_uploads p
     LEFT JOIN guests g ON p.guest_id = g.id
     WHERE p.id = $1`,
    [photoId]
  );
  return result.rows[0] || null;
};

const listPhotoUploads = async (projectId, { status, limit = 50, offset = 0, guestId } = {}) => {
  let sql = `
    SELECT p.id, p.project_id, p.guest_id, p.invite_id, p.status, p.source,
           p.original_url, p.thumbnail_url, p.processed_url, p.storage_key,
           p.file_size_bytes, p.mime_type, p.caption,
           p.moderation_labels, p.moderated_at, p.created_at,
           g.first_name as guest_first_name, g.last_name as guest_last_name,
           (SELECT COUNT(*) FROM photo_likes WHERE photo_id = p.id) as like_count
    FROM photo_uploads p
    LEFT JOIN guests g ON p.guest_id = g.id
    WHERE p.project_id = $1
  `;
  const params = [projectId];
  let paramIdx = 2;

  if (status) {
    sql += ` AND p.status = $${paramIdx++}`;
    params.push(status);
  }
  if (guestId) {
    sql += ` AND p.guest_id = $${paramIdx++}`;
    params.push(guestId);
  }

  sql += ` ORDER BY p.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
};

const updatePhotoStatus = async (photoId, { status, moderatedBy, moderationNotes, moderationScore, moderationLabels }) => {
  const fields = [`status = $1`];
  const values = [status];
  let paramIdx = 2;

  if (moderatedBy !== undefined) {
    fields.push(`moderated_by = $${paramIdx++}`);
    values.push(moderatedBy);
  }
  if (moderationNotes !== undefined) {
    fields.push(`moderation_notes = $${paramIdx++}`);
    values.push(moderationNotes);
  }
  if (moderationScore !== undefined) {
    fields.push(`moderation_score = $${paramIdx++}`);
    values.push(JSON.stringify(moderationScore));
  }
  if (moderationLabels !== undefined) {
    fields.push(`moderation_labels = $${paramIdx++}`);
    values.push(moderationLabels);
  }

  fields.push(`moderated_at = now()`);
  fields.push(`updated_at = now()`);
  values.push(photoId);

  const result = await query(
    `UPDATE photo_uploads SET ${fields.join(", ")} WHERE id = $${paramIdx} RETURNING id`,
    values
  );
  return result.rows[0]?.id || null;
};

const updatePhotoUrls = async (photoId, { thumbnailUrl, processedUrl }) => {
  const fields = [];
  const values = [];
  let paramIdx = 1;

  if (thumbnailUrl !== undefined) {
    fields.push(`thumbnail_url = $${paramIdx++}`);
    values.push(thumbnailUrl);
  }
  if (processedUrl !== undefined) {
    fields.push(`processed_url = $${paramIdx++}`);
    values.push(processedUrl);
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = now()`);
  values.push(photoId);

  const result = await query(
    `UPDATE photo_uploads SET ${fields.join(", ")} WHERE id = $${paramIdx} RETURNING id`,
    values
  );
  return result.rows[0]?.id || null;
};

const deletePhotoUpload = async (photoId) => {
  await query("DELETE FROM photo_uploads WHERE id = $1", [photoId]);
};

// =====================
// Moderation Queue
// =====================

const getModerationQueue = async (projectId, { status = "PENDING", limit = 50, offset = 0 } = {}) => {
  let sql = `
    SELECT p.id, p.project_id, p.guest_id, p.invite_id, p.status, p.source,
           p.original_url, p.thumbnail_url, p.storage_key,
           p.file_size_bytes, p.mime_type, p.caption,
           p.moderation_score, p.moderation_labels, p.created_at,
           g.first_name as guest_first_name, g.last_name as guest_last_name
    FROM photo_uploads p
    LEFT JOIN guests g ON p.guest_id = g.id
    WHERE p.project_id = $1
  `;
  const params = [projectId];
  let paramIdx = 2;

  if (status) {
    sql += ` AND p.status = $${paramIdx++}`;
    params.push(status);
  }

  sql += ` ORDER BY p.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
};

const getModerationStats = async (projectId) => {
  const result = await query(
    `SELECT status, COUNT(*) as count
     FROM photo_uploads
     WHERE project_id = $1
     GROUP BY status`,
    [projectId]
  );
  return result.rows.reduce((acc, row) => {
    acc[row.status] = parseInt(row.count, 10);
    return acc;
  }, {});
};

// =====================
// Photo Likes
// =====================

const createPhotoLike = async ({ photoId, guestId, ipAddress }) => {
  try {
    const result = await query(
      `INSERT INTO photo_likes (photo_id, guest_id, ip_address)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [photoId, guestId || null, ipAddress || null]
    );
    return { id: result.rows[0]?.id, created: true };
  } catch (err) {
    if (err.message?.includes("unique")) {
      return { created: false };
    }
    throw err;
  }
};

const deletePhotoLike = async (photoId, guestId) => {
  const result = await query(
    `DELETE FROM photo_likes WHERE photo_id = $1 AND guest_id = $2 RETURNING id`,
    [photoId, guestId]
  );
  return { deleted: result.rowCount > 0 };
};

const getPhotoLikeCount = async (photoId) => {
  const result = await query(
    `SELECT COUNT(*) as count FROM photo_likes WHERE photo_id = $1`,
    [photoId]
  );
  return parseInt(result.rows[0]?.count || 0, 10);
};

const hasGuestLikedPhoto = async (photoId, guestId) => {
  const result = await query(
    `SELECT 1 FROM photo_likes WHERE photo_id = $1 AND guest_id = $2`,
    [photoId, guestId]
  );
  return result.rowCount > 0;
};

// =====================
// Upload Policy Check
// =====================

const getInviteByTokenHash = async (tokenHash) => {
  const result = await query(
    `SELECT i.id, i.project_id, i.guest_id, i.revoked_at, i.expires_at,
            p.enabled as photo_wall_enabled, p.upload_access
     FROM invites i
     LEFT JOIN photo_wall_settings p ON i.project_id = p.project_id
     WHERE i.token_hash = $1`,
    [tokenHash]
  );
  return result.rows[0] || null;
};

module.exports = {
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
};
