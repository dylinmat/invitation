const crypto = require("crypto");
const { query } = require("../../db");

// Redis client placeholder - will be initialized via setRedisClient
let redis = null;

const setRedisClient = (client) => {
  redis = client;
};

const getRedisClient = () => {
  if (!redis) {
    throw new Error("Redis client not configured");
  }
  return redis;
};

// ============== User CRUD ==============

const createUser = async ({ email, fullName, locale = "en" }) => {
  const result = await query(
    `insert into users (email, full_name, locale)
     values ($1, $2, $3)
     returning id, email, full_name, locale, created_at`,
    [email.toLowerCase().trim(), fullName, locale]
  );
  return result.rows[0];
};

const getUserById = async (id) => {
  const result = await query(
    "select id, email, full_name, avatar, locale, created_at, updated_at from users where id = $1",
    [id]
  );
  return result.rows[0] || null;
};

const getUserByEmail = async (email) => {
  const result = await query(
    "select id, email, full_name, avatar, locale, created_at, updated_at from users where email = $1",
    [email.toLowerCase().trim()]
  );
  return result.rows[0] || null;
};

const updateUser = async (id, updates) => {
  const allowedFields = ["full_name", "locale", "avatar"];
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    return getUserById(id);
  }

  values.push(id);
  const result = await query(
    `update users set ${fields.join(", ")}, updated_at = now() where id = $${paramIndex} returning *`,
    values
  );
  return result.rows[0] || null;
};

// ============== Organization CRUD ==============

const createOrganization = async ({ type, name }) => {
  const result = await query(
    `insert into organizations (type, name)
     values ($1, $2)
     returning id, type, name, created_at`,
    [type, name]
  );
  return result.rows[0];
};

const getOrganizationById = async (id) => {
  const result = await query(
    "select id, type, name, created_at from organizations where id = $1",
    [id]
  );
  return result.rows[0] || null;
};

const listUserOrganizations = async (userId) => {
  const result = await query(
    `select o.id, o.type, o.name, o.created_at, om.role
     from organizations o
     join organization_members om on o.id = om.org_id
     where om.user_id = $1
     order by o.created_at desc`,
    [userId]
  );
  return result.rows;
};

// ============== Organization Membership CRUD ==============

const addOrganizationMember = async ({ orgId, userId, role }) => {
  const result = await query(
    `insert into organization_members (org_id, user_id, role)
     values ($1, $2, $3)
     on conflict (org_id, user_id)
     do update set role = excluded.role
     returning id, org_id, user_id, role, created_at`,
    [orgId, userId, role]
  );
  return result.rows[0];
};

const getOrganizationMember = async (orgId, userId) => {
  const result = await query(
    `select id, org_id, user_id, role, created_at
     from organization_members
     where org_id = $1 and user_id = $2`,
    [orgId, userId]
  );
  return result.rows[0] || null;
};

const removeOrganizationMember = async (orgId, userId) => {
  await query(
    "delete from organization_members where org_id = $1 and user_id = $2",
    [orgId, userId]
  );
  return true;
};

const listOrganizationMembers = async (orgId) => {
  const result = await query(
    `select om.id, om.user_id, om.role, om.created_at,
            u.email, u.full_name
     from organization_members om
     join users u on om.user_id = u.id
     where om.org_id = $1
     order by om.created_at desc`,
    [orgId]
  );
  return result.rows;
};

// ============== Magic Link Token Storage ==============

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const generateMagicLinkToken = () => {
  // Generate a cryptographically secure random token
  return crypto.randomBytes(32).toString("base64url");
};

const storeMagicLinkToken = async (email, token, expiresInMinutes = 15) => {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  const client = getRedisClient();
  const key = `magiclink:${tokenHash}`;

  await client.setEx(
    key,
    expiresInMinutes * 60, // Redis TTL in seconds
    JSON.stringify({
      email: email.toLowerCase().trim(),
      expires_at: expiresAt.toISOString()
    })
  );

  return { tokenHash, expiresAt };
};

const verifyMagicLinkToken = async (token) => {
  const tokenHash = hashToken(token);
  const client = getRedisClient();
  const key = `magiclink:${tokenHash}`;

  const data = await client.get(key);
  if (!data) {
    return null;
  }

  const parsed = JSON.parse(data);
  const expiresAt = new Date(parsed.expires_at);

  if (expiresAt < new Date()) {
    await client.del(key);
    return null;
  }

  // Delete the token after successful verification (one-time use)
  await client.del(key);

  return { email: parsed.email };
};

// ============== Session Management (Redis-backed) ==============

const generateSessionToken = () => {
  return crypto.randomBytes(32).toString("base64url");
};

const createSession = async (userId, options = {}) => {
  const token = generateSessionToken();
  const sessionId = hashToken(token);
  const createdAt = new Date();
  const expiresAt = new Date(
    Date.now() + (options.maxAgeDays || 7) * 24 * 60 * 60 * 1000
  );

  const session = {
    id: sessionId,
    user_id: userId,
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    ip_address: options.ipAddress || null,
    user_agent: options.userAgent || null
  };

  const client = getRedisClient();
  const key = `session:${sessionId}`;
  const ttlSeconds = Math.floor((expiresAt - new Date()) / 1000);

  await client.setEx(key, ttlSeconds, JSON.stringify(session));

  return { token, session };
};

const getSessionByToken = async (token) => {
  if (!token) return null;

  const sessionId = hashToken(token);
  const client = getRedisClient();
  const key = `session:${sessionId}`;

  const data = await client.get(key);
  if (!data) {
    return null;
  }

  const session = JSON.parse(data);
  const expiresAt = new Date(session.expires_at);

  if (expiresAt < new Date()) {
    await client.del(key);
    return null;
  }

  return session;
};

const deleteSession = async (token) => {
  if (!token) return false;

  const sessionId = hashToken(token);
  const client = getRedisClient();
  const key = `session:${sessionId}`;

  const result = await client.del(key);
  return result > 0;
};

const deleteAllUserSessions = async (userId) => {
  // Note: This requires a Redis scan or a secondary index.
  // For simplicity, we skip full implementation here.
  // In production, maintain a user:sessions:{userId} set.
  return true;
};

// ============== Pending Invitations ==============

const storePendingInvitation = async (orgId, email, role, invitedBy) => {
  const client = getRedisClient();
  const key = `invite:${orgId}:${email.toLowerCase().trim()}`;
  const expiresInMinutes = 60 * 24 * 7; // 7 days

  await client.setEx(
    key,
    expiresInMinutes * 60,
    JSON.stringify({
      org_id: orgId,
      email: email.toLowerCase().trim(),
      role,
      invited_by: invitedBy,
      created_at: new Date().toISOString()
    })
  );

  return true;
};

const getPendingInvitation = async (orgId, email) => {
  const client = getRedisClient();
  const key = `invite:${orgId}:${email.toLowerCase().trim()}`;

  const data = await client.get(key);
  if (!data) {
    return null;
  }

  return JSON.parse(data);
};

const deletePendingInvitation = async (orgId, email) => {
  const client = getRedisClient();
  const key = `invite:${orgId}:${email.toLowerCase().trim()}`;
  await client.del(key);
  return true;
};

module.exports = {
  // Redis
  setRedisClient,
  getRedisClient,

  // Users
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,

  // Organizations
  createOrganization,
  getOrganizationById,
  listUserOrganizations,

  // Memberships
  addOrganizationMember,
  getOrganizationMember,
  removeOrganizationMember,
  listOrganizationMembers,

  // Magic Links
  generateMagicLinkToken,
  storeMagicLinkToken,
  verifyMagicLinkToken,
  hashToken,

  // Sessions
  generateSessionToken,
  createSession,
  getSessionByToken,
  deleteSession,
  deleteAllUserSessions,

  // Invitations
  storePendingInvitation,
  getPendingInvitation,
  deletePendingInvitation
};
