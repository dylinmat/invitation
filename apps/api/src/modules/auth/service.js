const {
  createUser,
  getUserById,
  getUserByEmail,
  createOrganization,
  getOrganizationById,
  listUserOrganizations,
  addOrganizationMember,
  getOrganizationMember,
  listOrganizationMembers,
  generateMagicLinkToken,
  storeMagicLinkToken,
  verifyMagicLinkToken,
  createSession,
  getSessionByToken,
  deleteSession,
  storePendingInvitation,
  getPendingInvitation,
  deletePendingInvitation
} = require("./repository");

// ============== Configuration ==============

const MAGIC_LINK_EXPIRY_MINUTES = 15;
const SESSION_MAX_AGE_DAYS = 7;

// Email service placeholder - to be injected
let emailService = null;

const setEmailService = (service) => {
  emailService = service;
};

const getEmailService = () => {
  if (!emailService) {
    // Return a mock email service for development
    return {
      sendMagicLink: async ({ email, token }) => {
        console.log(`[MOCK EMAIL] Magic link for ${email}: token=${token}`);
        return { success: true };
      },
      sendOrganizationInvite: async ({ email, orgName, inviterName }) => {
        console.log(
          `[MOCK EMAIL] Org invite to ${email} for ${orgName} from ${inviterName}`
        );
        return { success: true };
      }
    };
  }
  return emailService;
};

// ============== User Registration & Magic Links ==============

/**
 * Register a new user and send a magic link for verification
 * @param {string} email - User email
 * @param {string} fullName - User full name
 * @returns {Promise<{user: object, emailSent: boolean}>}
 */
const registerUser = async (email, fullName) => {
  if (!email || !fullName) {
    throw new Error("email and fullName are required");
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  let user = await getUserByEmail(normalizedEmail);
  let isNewUser = false;

  if (!user) {
    // Create new user
    user = await createUser({ email: normalizedEmail, fullName });
    isNewUser = true;
  }

  // Generate and store magic link token
  const token = generateMagicLinkToken();
  await storeMagicLinkToken(normalizedEmail, token, MAGIC_LINK_EXPIRY_MINUTES);

  // Send magic link email
  const emailSvc = getEmailService();
  await emailSvc.sendMagicLink({
    email: normalizedEmail,
    token,
    fullName: user.full_name || fullName,
    isNewUser
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      isNewUser
    },
    emailSent: true,
    message:
      "Magic link sent to your email. Please check your inbox to continue."
  };
};

/**
 * Send a magic link for login (for existing users)
 * @param {string} email - User email
 * @returns {Promise<{emailSent: boolean, message: string}>}
 */
const sendLoginMagicLink = async (email) => {
  if (!email) {
    throw new Error("email is required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user exists
  const user = await getUserByEmail(normalizedEmail);
  if (!user) {
    // For security, don't reveal if user exists or not
    // But we also don't send an email
    return {
      emailSent: false,
      message:
        "If an account exists with this email, a magic link has been sent."
    };
  }

  // Generate and store magic link token
  const token = generateMagicLinkToken();
  await storeMagicLinkToken(normalizedEmail, token, MAGIC_LINK_EXPIRY_MINUTES);

  // Send magic link email
  const emailSvc = getEmailService();
  await emailSvc.sendMagicLink({
    email: normalizedEmail,
    token,
    fullName: user.full_name,
    isNewUser: false
  });

  return {
    emailSent: true,
    message: "Magic link sent to your email. Please check your inbox to log in."
  };
};

/**
 * Verify a magic link token and create a session
 * @param {string} token - Magic link token
 * @param {object} options - Session options (ipAddress, userAgent)
 * @returns {Promise<{user: object, sessionToken: string, isNewUser: boolean}>}
 */
const loginWithMagicLink = async (token, options = {}) => {
  if (!token) {
    throw new Error("token is required");
  }

  // Verify the token
  const verification = await verifyMagicLinkToken(token);
  if (!verification) {
    throw new Error("Invalid or expired token");
  }

  // Find or create user
  let user = await getUserByEmail(verification.email);
  let isNewUser = false;

  if (!user) {
    // This shouldn't happen for new registrations, but handle gracefully
    throw new Error("User not found");
  }

  // Check if this is the user's first login (no org memberships)
  const userOrgs = await listUserOrganizations(user.id);
  isNewUser = userOrgs.length === 0;

  // Create session
  const { token: sessionToken } = await createSession(user.id, {
    maxAgeDays: SESSION_MAX_AGE_DAYS,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent
  });

  // Check for pending invitations and auto-accept
  await processPendingInvitations(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      locale: user.locale
    },
    sessionToken,
    isNewUser
  };
};

/**
 * Process any pending invitations for the user
 * @param {object} user - User object
 */
const processPendingInvitations = async (user) => {
  // This would scan for pending invitations across all orgs
  // For now, this is a placeholder for the auto-accept logic
  // In production, you'd maintain an index of pending invitations by email
};

// ============== Session Management ==============

/**
 * Validate a session token
 * @param {string} sessionToken - Session token
 * @returns {Promise<{valid: boolean, user?: object, session?: object}>}
 */
const validateSession = async (sessionToken) => {
  if (!sessionToken) {
    return { valid: false };
  }

  const session = await getSessionByToken(sessionToken);
  if (!session) {
    return { valid: false };
  }

  const user = await getUserById(session.user_id);
  if (!user) {
    return { valid: false };
  }

  return {
    valid: true,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      locale: user.locale
    },
    session: {
      id: session.id,
      createdAt: session.created_at,
      expiresAt: session.expires_at
    }
  };
};

/**
 * Logout a user by invalidating their session
 * @param {string} sessionToken - Session token
 * @returns {Promise<{success: boolean}>}
 */
const logout = async (sessionToken) => {
  if (!sessionToken) {
    return { success: false };
  }

  await deleteSession(sessionToken);
  return { success: true };
};

/**
 * Get current user with their organizations
 * @param {string} userId - User ID
 * @returns {Promise<object|null>}
 */
const getCurrentUser = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    return null;
  }

  const organizations = await listUserOrganizations(userId);

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    locale: user.locale,
    createdAt: user.created_at,
    organizations: organizations.map((org) => ({
      id: org.id,
      type: org.type,
      name: org.name,
      role: org.role,
      joinedAt: org.created_at
    }))
  };
};

// ============== Organization Management ==============

/**
 * Create a new organization and add the user as admin
 * @param {string} userId - Creator user ID
 * @param {string} type - Organization type (COUPLE, PLANNER, VENUE)
 * @param {string} name - Organization name
 * @returns {Promise<object>}
 */
const createOrganizationForUser = async (userId, type, name) => {
  if (!userId || !type || !name) {
    throw new Error("userId, type, and name are required");
  }

  // Validate org type
  const validTypes = ["COUPLE", "PLANNER", "VENUE"];
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid organization type. Must be one of: ${validTypes.join(", ")}`);
  }

  // Verify user exists
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Create organization
  const org = await createOrganization({ type, name });

  // Add user as admin
  await addOrganizationMember({
    orgId: org.id,
    userId,
    role: "admin"
  });

  return {
    id: org.id,
    type: org.type,
    name: org.name,
    createdAt: org.created_at,
    role: "admin"
  };
};

/**
 * Get organization details with members
 * @param {string} orgId - Organization ID
 * @param {string} userId - Requesting user ID (for access check)
 * @returns {Promise<object>}
 */
const getOrganization = async (orgId, userId) => {
  if (!orgId) {
    throw new Error("orgId is required");
  }

  const org = await getOrganizationById(orgId);
  if (!org) {
    throw new Error("Organization not found");
  }

  // Check if user is a member
  const membership = await getOrganizationMember(orgId, userId);
  if (!membership) {
    throw new Error("Access denied: Not a member of this organization");
  }

  const members = await listOrganizationMembers(orgId);

  return {
    id: org.id,
    type: org.type,
    name: org.name,
    createdAt: org.created_at,
    myRole: membership.role,
    members: members.map((m) => ({
      id: m.user_id,
      email: m.email,
      fullName: m.full_name,
      role: m.role,
      joinedAt: m.created_at
    }))
  };
};

/**
 * Invite a user to an organization
 * @param {string} inviterId - Inviting user ID
 * @param {string} orgId - Organization ID
 * @param {string} email - Email of the user to invite
 * @param {string} role - Role to assign (default: member)
 * @returns {Promise<object>}
 */
const inviteToOrganization = async (inviterId, orgId, email, role = "member") => {
  if (!inviterId || !orgId || !email) {
    throw new Error("inviterId, orgId, and email are required");
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Check if inviter is a member with appropriate permissions
  const inviterMembership = await getOrganizationMember(orgId, inviterId);
  if (!inviterMembership) {
    throw new Error("Access denied: Not a member of this organization");
  }

  // Only admins can invite other admins
  if (role === "admin" && inviterMembership.role !== "admin") {
    throw new Error("Access denied: Only admins can invite other admins");
  }

  // Get organization details
  const org = await getOrganizationById(orgId);
  if (!org) {
    throw new Error("Organization not found");
  }

  // Check if user is already a member
  const existingUser = await getUserByEmail(normalizedEmail);
  if (existingUser) {
    const existingMembership = await getOrganizationMember(orgId, existingUser.id);
    if (existingMembership) {
      throw new Error("User is already a member of this organization");
    }
  }

  // Check for existing pending invitation
  const existingInvite = await getPendingInvitation(orgId, normalizedEmail);
  if (existingInvite) {
    throw new Error("An invitation has already been sent to this email");
  }

  // Store pending invitation
  await storePendingInvitation(orgId, normalizedEmail, role, inviterId);

  // Get inviter details for email
  const inviter = await getUserById(inviterId);

  // Send invitation email
  const emailSvc = getEmailService();
  await emailSvc.sendOrganizationInvite({
    email: normalizedEmail,
    orgName: org.name,
    inviterName: inviter?.full_name || "A team member",
    role
  });

  return {
    email: normalizedEmail,
    role,
    status: "invited",
    message: `Invitation sent to ${normalizedEmail}`
  };
};

/**
 * Accept a pending organization invitation
 * @param {string} userId - User ID accepting the invite
 * @param {string} orgId - Organization ID
 * @returns {Promise<object>}
 */
const acceptInvitation = async (userId, orgId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const invite = await getPendingInvitation(orgId, user.email);
  if (!invite) {
    throw new Error("No pending invitation found");
  }

  // Add user to organization
  const membership = await addOrganizationMember({
    orgId,
    userId,
    role: invite.role
  });

  // Delete the pending invitation
  await deletePendingInvitation(orgId, user.email);

  return {
    organizationId: orgId,
    role: invite.role,
    joinedAt: membership.created_at
  };
};

/**
 * Get user's role in an organization
 * @param {string} userId - User ID
 * @param {string} orgId - Organization ID
 * @returns {Promise<string|null>} - Role or null if not a member
 */
const getUserOrgRole = async (userId, orgId) => {
  const membership = await getOrganizationMember(orgId, userId);
  return membership?.role || null;
};

module.exports = {
  // Configuration
  setEmailService,
  getEmailService,

  // Auth
  registerUser,
  sendLoginMagicLink,
  loginWithMagicLink,
  validateSession,
  logout,
  getCurrentUser,

  // Organizations
  createOrganizationForUser,
  getOrganization,
  inviteToOrganization,
  acceptInvitation,
  getUserOrgRole
};
