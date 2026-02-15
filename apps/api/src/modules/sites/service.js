const {
  createSite,
  getSiteById,
  getSitesByProjectId,
  updateSite,
  deleteSite,
  createSiteVersion: createSiteVersionRepo,
  getSiteVersionById,
  getSiteVersionsBySiteId,
  getLatestVersionNumber,
  updateSiteVersionStatus,
  updateSiteVersionSceneGraph,
  setPublishedVersion,
  unpublishSite,
  getPublishedSceneGraph,
  getSiteBySubdomain,
  getSiteByCustomDomain,
  isSubdomainAvailable,
  isCustomDomainAvailable,
  updateSiteDomain,
  projectExists
} = require("./repository");

const {
  validateSceneGraph,
  sanitizeSceneGraph,
  createMinimalSceneGraph
} = require("./scene-graph");

// ==================== Site Management ====================

/**
 * Creates a new site for a project
 */
const createSiteForProject = async ({
  projectId,
  name,
  type = "PUBLIC",
  visibility = "PUBLIC",
  subdomainSlug,
  customDomain = null
}) => {
  // Validate project exists
  const exists = await projectExists(projectId);
  if (!exists) {
    throw new Error("Project not found");
  }

  // Validate required fields
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw new Error("Site name is required");
  }

  // Validate and sanitize subdomain
  const sanitizedSubdomain = validateAndSanitizeSubdomain(subdomainSlug);
  if (!sanitizedSubdomain) {
    throw new Error("Invalid subdomain format");
  }

  // Check subdomain availability
  const available = await isSubdomainAvailable(sanitizedSubdomain);
  if (!available) {
    throw new Error(`Subdomain "${sanitizedSubdomain}" is already taken`);
  }

  // Validate custom domain if provided
  if (customDomain) {
    const domainValid = validateCustomDomainFormat(customDomain);
    if (!domainValid.valid) {
      throw new Error(domainValid.error);
    }
    const domainAvailable = await isCustomDomainAvailable(customDomain);
    if (!domainAvailable) {
      throw new Error(`Custom domain "${customDomain}" is already taken`);
    }
  }

  return createSite({
    projectId,
    name: name.trim(),
    type,
    visibility,
    subdomainSlug: sanitizedSubdomain,
    customDomain
  });
};

/**
 * Gets a site by ID with full details
 */
const getSite = async (siteId) => {
  const site = await getSiteById(siteId);
  if (!site) {
    throw new Error("Site not found");
  }
  return site;
};

/**
 * Lists all sites for a project
 */
const listProjectSites = async (projectId) => {
  return getSitesByProjectId(projectId);
};

/**
 * Updates a site
 */
const updateSiteDetails = async (siteId, updates) => {
  const site = await getSiteById(siteId);
  if (!site) {
    throw new Error("Site not found");
  }

  const allowedUpdates = {};

  // Handle name update
  if (updates.name !== undefined) {
    if (typeof updates.name !== "string" || updates.name.trim().length === 0) {
      throw new Error("Site name cannot be empty");
    }
    allowedUpdates.name = updates.name.trim();
  }

  // Handle visibility update
  if (updates.visibility !== undefined) {
    const validVisibilities = ["PUBLIC", "UNLISTED", "INVITE_ONLY"];
    if (!validVisibilities.includes(updates.visibility)) {
      throw new Error(`Invalid visibility. Must be one of: ${validVisibilities.join(", ")}`);
    }
    allowedUpdates.visibility = updates.visibility;
  }

  // Handle type update
  if (updates.type !== undefined) {
    const validTypes = ["PUBLIC", "INTERNAL"];
    if (!validTypes.includes(updates.type)) {
      throw new Error(`Invalid type. Must be one of: ${validTypes.join(", ")}`);
    }
    allowedUpdates.type = updates.type;
  }

  if (Object.keys(allowedUpdates).length === 0) {
    return site;
  }

  return updateSite(siteId, allowedUpdates);
};

/**
 * Deletes a site and all its versions
 */
const removeSite = async (siteId) => {
  const site = await getSiteById(siteId);
  if (!site) {
    throw new Error("Site not found");
  }
  return deleteSite(siteId);
};

// ==================== Site Versions ====================

/**
 * Creates a new site version (draft)
 */
const createSiteVersion = async (siteId, { sceneGraph, baseVersionId = null }) => {
  const site = await getSiteById(siteId);
  if (!site) {
    throw new Error("Site not found");
  }

  // Validate scene graph if provided
  if (sceneGraph) {
    const validation = validateSceneGraph(sceneGraph);
    if (!validation.valid) {
      throw new Error(`Invalid scene graph: ${validation.errors.join(", ")}`);
    }
  }

  // Get next version number
  const latestVersion = await getLatestVersionNumber(siteId);
  const nextVersion = latestVersion + 1;

  // Sanitize scene graph
  const sanitizedSceneGraph = sceneGraph 
    ? sanitizeSceneGraph(sceneGraph)
    : createMinimalSceneGraph();

  return createSiteVersionRepo({
    siteId,
    version: nextVersion,
    sceneGraph: sanitizedSceneGraph
  });
};

/**
 * Gets all versions for a site
 */
const listSiteVersions = async (siteId) => {
  const site = await getSiteById(siteId);
  if (!site) {
    throw new Error("Site not found");
  }
  return getSiteVersionsBySiteId(siteId);
};

/**
 * Gets a specific site version
 */
const getSiteVersion = async (versionId) => {
  const version = await getSiteVersionById(versionId);
  if (!version) {
    throw new Error("Site version not found");
  }
  return version;
};

/**
 * Updates the scene graph for a draft version
 */
const updateVersionSceneGraph = async (versionId, sceneGraph) => {
  const version = await getSiteVersionById(versionId);
  if (!version) {
    throw new Error("Site version not found");
  }

  if (version.status !== "DRAFT") {
    throw new Error("Can only edit draft versions");
  }

  // Validate scene graph
  const validation = validateSceneGraph(sceneGraph);
  if (!validation.valid) {
    throw new Error(`Invalid scene graph: ${validation.errors.join(", ")}`);
  }

  const sanitizedSceneGraph = sanitizeSceneGraph(sceneGraph);
  return updateSiteVersionSceneGraph(versionId, sanitizedSceneGraph);
};

// ==================== Publishing ====================

/**
 * Publishes a site version
 */
const publishVersion = async (siteId, versionId) => {
  const site = await getSiteById(siteId);
  if (!site) {
    throw new Error("Site not found");
  }

  const version = await getSiteVersionById(versionId);
  if (!version) {
    throw new Error("Site version not found");
  }

  if (version.site_id !== siteId) {
    throw new Error("Version does not belong to this site");
  }

  // Mark version as published
  await updateSiteVersionStatus(versionId, "PUBLISHED");

  // Update site to point to this version
  return setPublishedVersion(siteId, versionId);
};

/**
 * Unpublishes a site
 */
const unpublishSiteVersions = async (siteId) => {
  const site = await getSiteById(siteId);
  if (!site) {
    throw new Error("Site not found");
  }

  // Unpublish all versions
  const versions = await getSiteVersionsBySiteId(siteId);
  for (const version of versions) {
    if (version.status === "PUBLISHED") {
      await updateSiteVersionStatus(version.id, "DRAFT");
    }
  }

  return unpublishSite(siteId);
};

/**
 * Gets the published scene graph for a site
 */
const getPublishedSceneGraphForSite = async (siteId) => {
  const result = await getPublishedSceneGraph(siteId);
  if (!result) {
    throw new Error("No published version found for this site");
  }
  return result;
};

// ==================== Domain Management ====================

/**
 * Validates subdomain format and availability
 */
const validateSubdomain = async (subdomainSlug, excludeSiteId = null) => {
  const sanitized = validateAndSanitizeSubdomain(subdomainSlug);
  
  if (!sanitized) {
    return {
      valid: false,
      error: "Invalid subdomain format. Use lowercase letters, numbers, and hyphens only.",
      sanitized: null
    };
  }

  const available = await isSubdomainAvailable(sanitized, excludeSiteId);
  
  return {
    valid: available,
    available,
    sanitized,
    error: available ? null : `Subdomain "${sanitized}" is already taken`
  };
};

/**
 * Validates custom domain format (placeholder for DNS verification)
 */
const validateCustomDomain = async (customDomain, excludeSiteId = null) => {
  const formatValid = validateCustomDomainFormat(customDomain);
  
  if (!formatValid.valid) {
    return {
      valid: false,
      dnsVerified: false,
      error: formatValid.error
    };
  }

  const available = await isCustomDomainAvailable(customDomain, excludeSiteId);
  
  if (!available) {
    return {
      valid: false,
      dnsVerified: false,
      error: `Custom domain "${customDomain}" is already taken`
    };
  }

  // Placeholder for DNS verification
  // In production, this would verify DNS records (A, CNAME)
  const dnsVerified = await verifyDnsRecords(customDomain);

  return {
    valid: true,
    available: true,
    dnsVerified,
    error: dnsVerified ? null : "DNS records not properly configured"
  };
};

/**
 * Updates site domain settings
 */
const updateSiteDomains = async (siteId, { subdomainSlug, customDomain }) => {
  const site = await getSiteById(siteId);
  if (!site) {
    throw new Error("Site not found");
  }

  const updates = {};

  if (subdomainSlug !== undefined) {
    const validation = await validateSubdomain(subdomainSlug, siteId);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    updates.subdomain_slug = validation.sanitized;
  }

  if (customDomain !== undefined) {
    if (customDomain === null) {
      updates.custom_domain = null;
    } else {
      const validation = await validateCustomDomain(customDomain, siteId);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      updates.custom_domain = customDomain;
    }
  }

  return updateSiteDomain(siteId, updates);
};

/**
 * Gets a public site by subdomain
 */
const getPublicSiteBySubdomain = async (subdomainSlug) => {
  const site = await getSiteBySubdomain(subdomainSlug);
  
  if (!site) {
    throw new Error("Site not found");
  }

  // Check if site has a published version
  if (!site.published_version_id) {
    throw new Error("Site has no published version");
  }

  // Check visibility
  if (site.visibility === "INVITE_ONLY") {
    throw new Error("Site requires invitation to access");
  }

  return {
    id: site.id,
    name: site.name,
    subdomainSlug: site.subdomain_slug,
    customDomain: site.custom_domain,
    visibility: site.visibility,
    sceneGraph: site.published_scene_graph,
    version: site.published_version_number
  };
};

// ==================== Helper Functions ====================

/**
 * Validates and sanitizes subdomain format
 */
const validateAndSanitizeSubdomain = (subdomain) => {
  if (!subdomain || typeof subdomain !== "string") {
    return null;
  }

  // Convert to lowercase and trim
  const sanitized = subdomain.toLowerCase().trim();

  // Validate format: lowercase letters, numbers, hyphens only
  // Must start and end with alphanumeric
  const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  
  if (!subdomainRegex.test(sanitized)) {
    return null;
  }

  // Length check (3-63 characters per RFC)
  if (sanitized.length < 3 || sanitized.length > 63) {
    return null;
  }

  // Reserved subdomains
  const reservedSubdomains = [
    "www", "api", "admin", "app", "mail", "ftp", "smtp", "imap",
    "dashboard", "panel", "cp", "webmail", "blog", "shop", "store"
  ];
  
  if (reservedSubdomains.includes(sanitized)) {
    return null;
  }

  return sanitized;
};

/**
 * Validates custom domain format
 */
const validateCustomDomainFormat = (domain) => {
  if (!domain || typeof domain !== "string") {
    return { valid: false, error: "Domain is required" };
  }

  const trimmed = domain.trim().toLowerCase();

  // Basic domain validation regex
  // Allows: example.com, sub.example.com, example.co.uk
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;
  
  if (!domainRegex.test(trimmed)) {
    return { valid: false, error: "Invalid domain format" };
  }

  // Length check
  if (trimmed.length > 253) {
    return { valid: false, error: "Domain too long" };
  }

  // Must have at least one dot (TLD)
  if (!trimmed.includes(".")) {
    return { valid: false, error: "Domain must include a TLD" };
  }

  return { valid: true };
};

/**
 * Placeholder for DNS record verification
 * In production, this would check A/CNAME records
 */
const verifyDnsRecords = async (domain) => {
  // Placeholder implementation
  // In production, use a DNS library to verify records
  // Example: check if domain points to our servers
  
  // For now, always return true to allow manual verification
  return true;
};

module.exports = {
  // Site Management
  createSite: createSiteForProject,
  getSite,
  listProjectSites,
  updateSiteDetails,
  removeSite,
  
  // Site Versions
  createSiteVersion,
  listSiteVersions,
  getSiteVersion,
  updateVersionSceneGraph,
  
  // Publishing
  publishVersion,
  unpublishSiteVersions,
  getPublishedSceneGraphForSite,
  
  // Domain Management
  validateSubdomain,
  validateCustomDomain,
  updateSiteDomains,
  getPublicSiteBySubdomain
};
