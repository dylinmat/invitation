const {
  createProject,
  getProjectById,
  listProjectsByOrg,
  listProjectsByUser,
  updateProject,
  deleteProject,
  isUserProjectMember,
  getUserProjectRole,
  getProjectStats
} = require("./repository");

const { getOrganizationMember } = require("../auth/repository");

// ============== Validation ==============

const VALID_STATUSES = ["ACTIVE", "ARCHIVED", "COLD_ARCHIVED", "DELETED"];
const VALID_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney"
];

const validateProjectData = (data) => {
  const errors = [];

  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== "string" || data.name.trim().length < 1) {
      errors.push("Project name is required and must be at least 1 character");
    }
    if (data.name.length > 200) {
      errors.push("Project name must be less than 200 characters");
    }
  }

  if (data.timezone !== undefined && !VALID_TIMEZONES.includes(data.timezone)) {
    errors.push(`Invalid timezone. Must be one of: ${VALID_TIMEZONES.join(", ")}`);
  }

  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    errors.push(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  return errors;
};

// ============== Access Control ==============

const requireProjectAccess = async (userId, projectId) => {
  const isMember = await isUserProjectMember(userId, projectId);
  if (!isMember) {
    throw new Error("Access denied: You do not have access to this project");
  }
  return true;
};

const requireProjectAdmin = async (userId, projectId) => {
  const role = await getUserProjectRole(userId, projectId);
  if (role !== "admin") {
    throw new Error("Access denied: Admin role required");
  }
  return true;
};

// ============== Project Service Methods ==============

/**
 * Create a new project for an organization
 * @param {string} userId - Creator user ID
 * @param {string} orgId - Organization ID
 * @param {object} data - Project data { name, timezone }
 * @returns {Promise<object>}
 */
const createProjectForOrg = async (userId, orgId, data) => {
  // Validate user is org member
  const membership = await getOrganizationMember(orgId, userId);
  if (!membership) {
    throw new Error("Access denied: Not a member of this organization");
  }

  // Validate input
  const errors = validateProjectData(data);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join("; ")}`);
  }

  const project = await createProject({
    orgId,
    name: data.name.trim(),
    timezone: data.timezone || "UTC",
    createdBy: userId
  });

  return {
    id: project.id,
    name: project.name,
    timezone: project.timezone,
    status: project.status,
    ownerOrgId: project.owner_org_id,
    createdAt: project.created_at
  };
};

/**
 * Get project by ID with access check
 * @param {string} userId - Requesting user ID
 * @param {string} projectId - Project ID
 * @returns {Promise<object>}
 */
const getProject = async (userId, projectId) => {
  await requireProjectAccess(userId, projectId);

  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const stats = await getProjectStats(projectId);
  const role = await getUserProjectRole(userId, projectId);

  return {
    id: project.id,
    name: project.name,
    timezone: project.timezone,
    status: project.status,
    ownerOrgId: project.owner_org_id,
    managerOrgId: project.manager_org_id,
    orgName: project.org_name,
    orgType: project.org_type,
    role,
    stats: {
      guestCount: parseInt(stats.guest_count, 10),
      groupCount: parseInt(stats.group_count, 10),
      inviteCount: parseInt(stats.invite_count, 10),
      siteCount: parseInt(stats.site_count, 10),
      eventCount: parseInt(stats.event_count, 10)
    },
    createdAt: project.created_at,
    updatedAt: project.updated_at
  };
};

/**
 * List all projects accessible by user
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
const listUserProjects = async (userId) => {
  const projects = await listProjectsByUser(userId);

  return projects.map(project => ({
    id: project.id,
    name: project.name,
    timezone: project.timezone,
    status: project.status,
    ownerOrgId: project.owner_org_id,
    orgName: project.org_name,
    orgType: project.org_type,
    createdAt: project.created_at,
    updatedAt: project.updated_at
  }));
};

/**
 * List projects for a specific organization
 * @param {string} userId - Requesting user ID
 * @param {string} orgId - Organization ID
 * @returns {Promise<Array>}
 */
const listOrgProjects = async (userId, orgId) => {
  // Validate user is org member
  const membership = await getOrganizationMember(orgId, userId);
  if (!membership) {
    throw new Error("Access denied: Not a member of this organization");
  }

  const projects = await listProjectsByOrg(orgId);

  return projects.map(project => ({
    id: project.id,
    name: project.name,
    timezone: project.timezone,
    status: project.status,
    ownerOrgId: project.owner_org_id,
    managerOrgId: project.manager_org_id,
    role: membership.role,
    createdAt: project.created_at,
    updatedAt: project.updated_at
  }));
};

/**
 * Update a project
 * @param {string} userId - Requesting user ID
 * @param {string} projectId - Project ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>}
 */
const updateProjectDetails = async (userId, projectId, updates) => {
  await requireProjectAdmin(userId, projectId);

  // Validate input
  const errors = validateProjectData(updates);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join("; ")}`);
  }

  // Sanitize updates
  const sanitizedUpdates = {};
  if (updates.name !== undefined) sanitizedUpdates.name = updates.name.trim();
  if (updates.timezone !== undefined) sanitizedUpdates.timezone = updates.timezone;
  if (updates.status !== undefined) sanitizedUpdates.status = updates.status;
  if (updates.managerOrgId !== undefined) sanitizedUpdates.manager_org_id = updates.managerOrgId;

  const project = await updateProject(projectId, sanitizedUpdates);
  if (!project) {
    throw new Error("Project not found");
  }

  return {
    id: project.id,
    name: project.name,
    timezone: project.timezone,
    status: project.status,
    ownerOrgId: project.owner_org_id,
    managerOrgId: project.manager_org_id,
    updatedAt: project.updated_at
  };
};

/**
 * Delete (soft delete) a project
 * @param {string} userId - Requesting user ID
 * @param {string} projectId - Project ID
 * @returns {Promise<object>}
 */
const removeProject = async (userId, projectId) => {
  await requireProjectAdmin(userId, projectId);

  const project = await deleteProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  return { id: project.id, deleted: true };
};

/**
 * Check if user has access to a project
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @returns {Promise<boolean>}
 */
const checkProjectAccess = async (userId, projectId) => {
  try {
    await requireProjectAccess(userId, projectId);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  // Project CRUD
  createProjectForOrg,
  getProject,
  listUserProjects,
  listOrgProjects,
  updateProjectDetails,
  removeProject,

  // Access Control
  checkProjectAccess,
  requireProjectAccess,
  requireProjectAdmin
};
