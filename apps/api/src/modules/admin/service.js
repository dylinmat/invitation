/**
 * Admin Service
 * Business logic for admin operations
 */

const {
  listAllUsers,
  getUserDetails,
  listAllOrganizations,
  getOrganizationDetails,
  getSystemStats,
  getRevenueStats
} = require("./repository");

// ============== Users ==============

const getUsersList = async (options = {}) => {
  return listAllUsers(options);
};

const getUserById = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  
  const user = await getUserDetails(userId);
  if (!user) {
    throw new Error("User not found");
  }
  
  return user;
};

// ============== Organizations ==============

const getOrganizationsList = async (options = {}) => {
  return listAllOrganizations(options);
};

const getOrganizationById = async (orgId) => {
  if (!orgId) {
    throw new Error("Organization ID is required");
  }
  
  const org = await getOrganizationDetails(orgId);
  if (!org) {
    throw new Error("Organization not found");
  }
  
  return org;
};

// ============== Statistics ==============

const getAdminStats = async () => {
  return getSystemStats();
};

const getAdminRevenue = async (options = {}) => {
  return getRevenueStats(options);
};

// ============== Access Control ==============

const requireAdmin = async (userId) => {
  // In a real implementation, check if user has admin role
  // For now, we'll allow access (should be protected by middleware)
  return true;
};

module.exports = {
  // Users
  getUsersList,
  getUserById,
  
  // Organizations
  getOrganizationsList,
  getOrganizationById,
  
  // Stats
  getAdminStats,
  getAdminRevenue,
  
  // Access Control
  requireAdmin
};
