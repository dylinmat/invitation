const { query } = require("../../db");

// ==================== Site CRUD ====================

const createSite = async ({ projectId, name, type, visibility, subdomainSlug, customDomain }) => {
  const result = await query(
    `insert into sites (project_id, name, type, visibility, subdomain_slug, custom_domain)
     values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [projectId, name, type, visibility, subdomainSlug, customDomain]
  );
  return result.rows[0];
};

const getSiteById = async (id) => {
  const result = await query(
    `select s.*, sv.version as published_version_number
     from sites s
     left join site_versions sv on s.published_version_id = sv.id
     where s.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const getSitesByProjectId = async (projectId) => {
  const result = await query(
    `select s.*, sv.version as published_version_number
     from sites s
     left join site_versions sv on s.published_version_id = sv.id
     where s.project_id = $1
     order by s.created_at desc`,
    [projectId]
  );
  return result.rows;
};

const updateSite = async (id, updates) => {
  const allowedFields = ["name", "type", "visibility", "subdomain_slug", "custom_domain"];
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return getSiteById(id);
  }

  values.push(id);
  const result = await query(
    `update sites
     set ${setClauses.join(", ")}, updated_at = now()
     where id = $${paramIndex}
     returning *`,
    values
  );
  return result.rows[0] || null;
};

const deleteSite = async (id) => {
  await query("delete from sites where id = $1", [id]);
  return { deleted: true };
};

// ==================== Site Versions ====================

const createSiteVersion = async ({ siteId, version, sceneGraph }) => {
  const result = await query(
    `insert into site_versions (site_id, version, status, scene_graph)
     values ($1, $2, 'DRAFT', $3)
     returning *`,
    [siteId, version, JSON.stringify(sceneGraph)]
  );
  return result.rows[0];
};

const getSiteVersionById = async (id) => {
  const result = await query(
    "select * from site_versions where id = $1",
    [id]
  );
  return result.rows[0] || null;
};

const getSiteVersionsBySiteId = async (siteId) => {
  const result = await query(
    `select * from site_versions
     where site_id = $1
     order by version desc`,
    [siteId]
  );
  return result.rows;
};

const getLatestVersionNumber = async (siteId) => {
  const result = await query(
    `select max(version) as max_version
     from site_versions
     where site_id = $1`,
    [siteId]
  );
  return result.rows[0]?.max_version || 0;
};

const updateSiteVersionStatus = async (id, status) => {
  const result = await query(
    `update site_versions
     set status = $2
     where id = $1
     returning *`,
    [id, status]
  );
  return result.rows[0] || null;
};

const updateSiteVersionSceneGraph = async (id, sceneGraph) => {
  const result = await query(
    `update site_versions
     set scene_graph = $2
     where id = $1
     returning *`,
    [id, JSON.stringify(sceneGraph)]
  );
  return result.rows[0] || null;
};

// ==================== Publishing ====================

const setPublishedVersion = async (siteId, versionId) => {
  // Start a transaction to unpublish other versions and set the new published version
  const client = await query.client || query;
  
  // Update the site to point to the new published version
  const result = await query(
    `update sites
     set published_version_id = $2, updated_at = now()
     where id = $1
     returning *`,
    [siteId, versionId]
  );
  
  return result.rows[0];
};

const unpublishSite = async (siteId) => {
  const result = await query(
    `update sites
     set published_version_id = null, updated_at = now()
     where id = $1
     returning *`,
    [siteId]
  );
  return result.rows[0];
};

const getPublishedSceneGraph = async (siteId) => {
  const result = await query(
    `select sv.scene_graph, sv.id as version_id, sv.version
     from sites s
     join site_versions sv on s.published_version_id = sv.id
     where s.id = $1`,
    [siteId]
  );
  return result.rows[0] || null;
};

// ==================== Domain Management ====================

const getSiteBySubdomain = async (subdomainSlug) => {
  const result = await query(
    `select s.*, sv.scene_graph as published_scene_graph, sv.version as published_version_number
     from sites s
     left join site_versions sv on s.published_version_id = sv.id
     where s.subdomain_slug = $1`,
    [subdomainSlug]
  );
  return result.rows[0] || null;
};

const getSiteByCustomDomain = async (customDomain) => {
  const result = await query(
    `select s.*, sv.scene_graph as published_scene_graph, sv.version as published_version_number
     from sites s
     left join site_versions sv on s.published_version_id = sv.id
     where s.custom_domain = $1`,
    [customDomain]
  );
  return result.rows[0] || null;
};

const isSubdomainAvailable = async (subdomainSlug, excludeSiteId = null) => {
  const sql = excludeSiteId
    ? "select id from sites where subdomain_slug = $1 and id != $2"
    : "select id from sites where subdomain_slug = $1";
  const params = excludeSiteId ? [subdomainSlug, excludeSiteId] : [subdomainSlug];
  const result = await query(sql, params);
  return result.rows.length === 0;
};

const isCustomDomainAvailable = async (customDomain, excludeSiteId = null) => {
  const sql = excludeSiteId
    ? "select id from sites where custom_domain = $1 and id != $2"
    : "select id from sites where custom_domain = $1";
  const params = excludeSiteId ? [customDomain, excludeSiteId] : [customDomain];
  const result = await query(sql, params);
  return result.rows.length === 0;
};

const updateSiteDomain = async (siteId, { subdomainSlug, customDomain }) => {
  const updates = {};
  if (subdomainSlug !== undefined) updates.subdomain_slug = subdomainSlug;
  if (customDomain !== undefined) updates.custom_domain = customDomain;
  
  return updateSite(siteId, updates);
};

// ==================== Project Validation ====================

const projectExists = async (projectId) => {
  const result = await query(
    "select id from projects where id = $1",
    [projectId]
  );
  return result.rows.length > 0;
};

module.exports = {
  // Site CRUD
  createSite,
  getSiteById,
  getSitesByProjectId,
  updateSite,
  deleteSite,
  
  // Site Versions
  createSiteVersion,
  getSiteVersionById,
  getSiteVersionsBySiteId,
  getLatestVersionNumber,
  updateSiteVersionStatus,
  updateSiteVersionSceneGraph,
  
  // Publishing
  setPublishedVersion,
  unpublishSite,
  getPublishedSceneGraph,
  
  // Domain Management
  getSiteBySubdomain,
  getSiteByCustomDomain,
  isSubdomainAvailable,
  isCustomDomainAvailable,
  updateSiteDomain,
  
  // Validation
  projectExists
};
