/**
 * Admin Repository
 * Database queries for admin operations
 */

const { query } = require("../../db");

// ============== Users Management ==============

const listAllUsers = async ({ page = 1, limit = 20, search = null }) => {
  const offset = (page - 1) * limit;
  
  let whereClause = "";
  const params = [];
  
  if (search) {
    whereClause = "where email ilike $1 or full_name ilike $1";
    params.push(`%${search}%`);
  }
  
  // Get total count
  const countResult = await query(
    `select count(*) as total from users ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);
  
  // Get users with org count
  const result = await query(
    `select u.id, u.email, u.full_name, u.locale, u.avatar, u.created_at, u.updated_at,
            (select count(*) from organization_members where user_id = u.id) as org_count
     from users u
     ${whereClause}
     order by u.created_at desc
     limit $${params.length + 1} offset $${params.length + 2}`,
    [...params, limit, offset]
  );
  
  return { users: result.rows, total, page, limit };
};

const getUserDetails = async (userId) => {
  const userResult = await query(
    `select id, email, full_name, locale, avatar, created_at, updated_at
     from users where id = $1`,
    [userId]
  );
  
  if (!userResult.rows[0]) return null;
  
  const orgsResult = await query(
    `select o.id, o.name, o.type, om.role, om.created_at as joined_at
     from organizations o
     join organization_members om on o.id = om.org_id
     where om.user_id = $1`,
    [userId]
  );
  
  return {
    ...userResult.rows[0],
    organizations: orgsResult.rows
  };
};

// ============== Organizations Management ==============

const listAllOrganizations = async ({ page = 1, limit = 20, search = null }) => {
  const offset = (page - 1) * limit;
  
  let whereClause = "";
  const params = [];
  
  if (search) {
    whereClause = "where name ilike $1";
    params.push(`%${search}%`);
  }
  
  // Get total count
  const countResult = await query(
    `select count(*) as total from organizations ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);
  
  // Get orgs with member and project counts
  const result = await query(
    `select o.id, o.name, o.type, o.created_at,
            (select count(*) from organization_members where org_id = o.id) as member_count,
            (select count(*) from projects where owner_org_id = o.id and status != 'DELETED') as project_count
     from organizations o
     ${whereClause}
     order by o.created_at desc
     limit $${params.length + 1} offset $${params.length + 2}`,
    [...params, limit, offset]
  );
  
  return { organizations: result.rows, total, page, limit };
};

const getOrganizationDetails = async (orgId) => {
  const orgResult = await query(
    `select id, name, type, created_at from organizations where id = $1`,
    [orgId]
  );
  
  if (!orgResult.rows[0]) return null;
  
  const membersResult = await query(
    `select u.id, u.email, u.full_name, om.role, om.created_at as joined_at
     from organization_members om
     join users u on om.user_id = u.id
     where om.org_id = $1`,
    [orgId]
  );
  
  const projectsResult = await query(
    `select id, name, status, timezone, created_at
     from projects
     where owner_org_id = $1 and status != 'DELETED'`,
    [orgId]
  );
  
  return {
    ...orgResult.rows[0],
    members: membersResult.rows,
    projects: projectsResult.rows
  };
};

// ============== System Stats ==============

const getSystemStats = async () => {
  const [
    usersResult,
    orgsResult,
    projectsResult,
    guestsResult,
    invitesResult,
    sitesResult,
    campaignsResult
  ] = await Promise.all([
    query("select count(*) as count from users"),
    query("select count(*) as count from organizations"),
    query("select count(*) as count from projects where status != 'DELETED'"),
    query("select count(*) as count from guests"),
    query("select count(*) as count from invites"),
    query("select count(*) as count from sites"),
    query("select count(*) as count from campaigns")
  ]);
  
  // Get daily signups for last 30 days
  const dailySignupsResult = await query(
    `select date(created_at) as date, count(*) as count
     from users
     where created_at > now() - interval '30 days'
     group by date(created_at)
     order by date desc`
  );
  
  // Get projects by status
  const projectsByStatusResult = await query(
    `select status, count(*) as count from projects group by status`
  );
  
  return {
    totals: {
      users: parseInt(usersResult.rows[0].count, 10),
      organizations: parseInt(orgsResult.rows[0].count, 10),
      projects: parseInt(projectsResult.rows[0].count, 10),
      guests: parseInt(guestsResult.rows[0].count, 10),
      invites: parseInt(invitesResult.rows[0].count, 10),
      sites: parseInt(sitesResult.rows[0].count, 10),
      campaigns: parseInt(campaignsResult.rows[0].count, 10)
    },
    dailySignups: dailySignupsResult.rows,
    projectsByStatus: projectsByStatusResult.rows
  };
};

// ============== Revenue Stats (Placeholder) ==============

const getRevenueStats = async ({ period = "month" }) => {
  // This is a placeholder implementation
  // In production, this would query actual payment/subscription data
  
  let dateTrunc;
  switch (period) {
    case "day":
      dateTrunc = "day";
      break;
    case "week":
      dateTrunc = "week";
      break;
    case "month":
    default:
      dateTrunc = "month";
      break;
    case "year":
      dateTrunc = "year";
      break;
  }
  
  // Placeholder revenue data based on org creation
  // In production, replace with actual subscription/payment queries
  const result = await query(
    `select date_trunc($1, created_at) as period,
            count(*) as new_orgs,
            0 as revenue  -- Placeholder: replace with actual revenue calculation
     from organizations
     where created_at > now() - interval '1 year'
     group by date_trunc($1, created_at)
     order by period desc`,
    [dateTrunc]
  );
  
  return {
    period,
    data: result.rows.map(row => ({
      period: row.period,
      newOrganizations: parseInt(row.new_orgs, 10),
      revenue: parseFloat(row.revenue) || 0
    }))
  };
};

module.exports = {
  // Users
  listAllUsers,
  getUserDetails,
  
  // Organizations
  listAllOrganizations,
  getOrganizationDetails,
  
  // Stats
  getSystemStats,
  getRevenueStats
};
