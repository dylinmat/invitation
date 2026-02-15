const {
  createSite,
  getSite,
  listProjectSites,
  updateSiteDetails,
  removeSite,
  createSiteVersion,
  listSiteVersions,
  getSiteVersion,
  updateVersionSceneGraph,
  publishVersion,
  unpublishSiteVersions,
  getPublishedSceneGraphForSite,
  validateSubdomain,
  validateCustomDomain,
  updateSiteDomains,
  getPublicSiteBySubdomain
} = require("./service");

/**
 * Register sites routes on a Fastify instance
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function siteRoutes(fastify, opts) {
  // Use authenticate hook from parent if available, otherwise require it
  const authenticate = fastify.authenticate || opts.authenticate;

  // ==================== Project Sites Routes ====================

  /**
   * GET /projects/:projectId/sites
   * List all sites for a project
   */
  fastify.get("/projects/:projectId/sites", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "List all sites for a project",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: {
          projectId: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { projectId } = request.params;
    const sites = await listProjectSites(projectId);
    return {
      success: true,
      data: sites
    };
  });

  /**
   * POST /projects/:projectId/sites
   * Create a new site for a project
   */
  fastify.post("/projects/:projectId/sites", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Create a new site for a project",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: {
          projectId: { type: "string" }
        }
      },
      body: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          type: { type: "string", enum: ["PUBLIC", "INTERNAL"] },
          visibility: { type: "string", enum: ["PUBLIC", "UNLISTED", "INVITE_ONLY"] },
          subdomainSlug: { type: "string" },
          customDomain: { type: "string" }
        }
      }
    }
  }, async (request, reply) => {
    const { projectId } = request.params;
    const { name, type, visibility, subdomainSlug, customDomain } = request.body;

    const site = await createSite({
      projectId,
      name,
      type,
      visibility,
      subdomainSlug,
      customDomain
    });

    reply.status(201);
    return {
      success: true,
      data: site
    };
  });

  // ==================== Site Routes ====================

  /**
   * GET /projects/:projectId/sites/:id
   * Get a specific site by ID (nested under project - frontend expects this)
   */
  fastify.get("/projects/:projectId/sites/:id", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get a specific site by ID",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["projectId", "id"],
        properties: {
          projectId: { type: "string" },
          id: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const site = await getSite(id);
    return {
      success: true,
      site: site
    };
  });

  /**
   * GET /sites/:id
   * Get a specific site by ID (legacy route)
   */
  fastify.get("/sites/:id", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get a specific site by ID",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const site = await getSite(id);
    return {
      success: true,
      site: site
    };
  });

  /**
   * PATCH /projects/:projectId/sites/:id
   * Update site details (nested under project - frontend expects this)
   */
  fastify.patch("/projects/:projectId/sites/:id", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Update site details",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["projectId", "id"],
        properties: {
          projectId: { type: "string" },
          id: { type: "string" }
        }
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string", enum: ["PUBLIC", "INTERNAL"] },
          visibility: { type: "string", enum: ["PUBLIC", "UNLISTED", "INVITE_ONLY"] }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const updates = request.body;

    const site = await updateSiteDetails(id, updates);
    return {
      success: true,
      site: site
    };
  });

  /**
   * PATCH /sites/:id
   * Update site details (legacy route)
   */
  fastify.patch("/sites/:id", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Update site details",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string", enum: ["PUBLIC", "INTERNAL"] },
          visibility: { type: "string", enum: ["PUBLIC", "UNLISTED", "INVITE_ONLY"] }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const updates = request.body;

    const site = await updateSiteDetails(id, updates);
    return {
      success: true,
      site: site
    };
  });

  /**
   * DELETE /projects/:projectId/sites/:id
   * Delete a site (nested under project - frontend expects this)
   */
  fastify.delete("/projects/:projectId/sites/:id", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Delete a site",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["projectId", "id"],
        properties: {
          projectId: { type: "string" },
          id: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    await removeSite(id);
    return {
      success: true,
      message: "Site deleted successfully"
    };
  });

  /**
   * DELETE /sites/:id
   * Delete a site (legacy route)
   */
  fastify.delete("/sites/:id", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Delete a site",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    await removeSite(id);
    return {
      success: true,
      message: "Site deleted successfully"
    };
  });

  // ==================== Site Versions Routes ====================

  /**
   * GET /sites/:id/versions
   * List all versions for a site
   */
  fastify.get("/sites/:id/versions", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "List all versions for a site",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const versions = await listSiteVersions(id);
    return {
      success: true,
      data: versions
    };
  });

  /**
   * POST /sites/:id/versions
   * Create a new version (save draft)
   */
  fastify.post("/sites/:id/versions", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Create a new site version (save draft)",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      },
      body: {
        type: "object",
        properties: {
          sceneGraph: { type: "object" },
          baseVersionId: { type: "string" }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    const { sceneGraph, baseVersionId } = request.body;

    const version = await createSiteVersion(id, { sceneGraph, baseVersionId });
    reply.status(201);
    return {
      success: true,
      data: version
    };
  });

  /**
   * GET /sites/:id/versions/:versionId
   * Get a specific version
   */
  fastify.get("/sites/:id/versions/:versionId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get a specific site version",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["id", "versionId"],
        properties: {
          id: { type: "string" },
          versionId: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { versionId } = request.params;
    const version = await getSiteVersion(versionId);
    return {
      success: true,
      data: version
    };
  });

  /**
   * PUT /sites/:id/versions/:versionId/scene-graph
   * Update scene graph for a draft version
   */
  fastify.put("/sites/:id/versions/:versionId/scene-graph", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Update scene graph for a draft version",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["id", "versionId"],
        properties: {
          id: { type: "string" },
          versionId: { type: "string" }
        }
      },
      body: {
        type: "object",
        required: ["sceneGraph"],
        properties: {
          sceneGraph: { type: "object" }
        }
      }
    }
  }, async (request) => {
    const { versionId } = request.params;
    const { sceneGraph } = request.body;

    const version = await updateVersionSceneGraph(versionId, sceneGraph);
    return {
      success: true,
      data: version
    };
  });

  // ==================== Publishing Routes ====================

  /**
   * POST /projects/:projectId/sites/:id/publish
   * Publish a specific version (nested under project - frontend expects this)
   */
  fastify.post("/projects/:projectId/sites/:id/publish", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Publish a specific version",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["projectId", "id"],
        properties: {
          projectId: { type: "string" },
          id: { type: "string" }
        }
      },
      body: {
        type: "object",
        required: ["versionId"],
        properties: {
          versionId: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const { versionId } = request.body;

    if (!versionId) {
      throw new Error("versionId is required");
    }

    const site = await publishVersion(id, versionId);
    return {
      success: true,
      site: site,
      message: "Site published successfully"
    };
  });

  /**
   * POST /sites/:id/publish
   * Publish a specific version (legacy route)
   */
  fastify.post("/sites/:id/publish", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Publish a specific version",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      },
      body: {
        type: "object",
        required: ["versionId"],
        properties: {
          versionId: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const { versionId } = request.body;

    if (!versionId) {
      throw new Error("versionId is required");
    }

    const site = await publishVersion(id, versionId);
    return {
      success: true,
      site: site,
      message: "Site published successfully"
    };
  });

  /**
   * POST /projects/:projectId/sites/:id/unpublish
   * Unpublish a site (nested under project - frontend expects this)
   */
  fastify.post("/projects/:projectId/sites/:id/unpublish", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Unpublish a site",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["projectId", "id"],
        properties: {
          projectId: { type: "string" },
          id: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const site = await unpublishSiteVersions(id);
    return {
      success: true,
      site: site,
      message: "Site unpublished successfully"
    };
  });

  /**
   * POST /sites/:id/unpublish
   * Unpublish a site (legacy route)
   */
  fastify.post("/sites/:id/unpublish", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Unpublish a site",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const site = await unpublishSiteVersions(id);
    return {
      success: true,
      site: site,
      message: "Site unpublished successfully"
    };
  });

  // ==================== Scene Graph Routes ====================

  /**
   * PATCH /projects/:projectId/sites/:id/scene-graph
   * Update scene graph for a site (nested under project - frontend expects this)
   */
  fastify.patch("/projects/:projectId/sites/:id/scene-graph", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Update scene graph for a site",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["projectId", "id"],
        properties: {
          projectId: { type: "string" },
          id: { type: "string" }
        }
      },
      body: {
        type: "object",
        properties: {
          sceneGraph: { type: "object" }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const { sceneGraph } = request.body;
    
    // Create a new version with the updated scene graph
    const version = await createSiteVersion(id, { sceneGraph });
    
    return {
      success: true,
      site: {
        id,
        sceneGraph,
        versionId: version.id
      }
    };
  });

  /**
   * GET /sites/:id/scene-graph
   * Get scene graph for editor (latest draft or published version)
   */
  fastify.get("/sites/:id/scene-graph", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get scene graph for editor",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      },
      querystring: {
        type: "object",
        properties: {
          version: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const { version } = request.query;

    let sceneGraphData;

    if (version) {
      // Get specific version
      const siteVersion = await getSiteVersion(version);
      sceneGraphData = {
        versionId: siteVersion.id,
        version: siteVersion.version,
        status: siteVersion.status,
        sceneGraph: siteVersion.scene_graph
      };
    } else {
      // Get published version
      sceneGraphData = await getPublishedSceneGraphForSite(id);
    }

    return {
      success: true,
      data: sceneGraphData
    };
  });

  // ==================== Domain Management Routes ====================

  /**
   * POST /sites/:id/domains
   * Update domain settings for a site
   */
  fastify.post("/sites/:id/domains", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Update domain settings for a site",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      },
      body: {
        type: "object",
        properties: {
          subdomainSlug: { type: "string" },
          customDomain: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const { subdomainSlug, customDomain } = request.body;

    const site = await updateSiteDomains(id, { subdomainSlug, customDomain });
    return {
      success: true,
      data: site
    };
  });

  /**
   * POST /sites/validate-subdomain
   * Validate subdomain availability
   */
  fastify.post("/sites/validate-subdomain", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Validate subdomain availability",
      tags: ["Sites"],
      body: {
        type: "object",
        required: ["subdomain"],
        properties: {
          subdomain: { type: "string" },
          excludeSiteId: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { subdomain, excludeSiteId } = request.body;
    const result = await validateSubdomain(subdomain, excludeSiteId);
    return {
      success: true,
      data: result
    };
  });

  /**
   * POST /sites/validate-custom-domain
   * Validate custom domain (including DNS check)
   */
  fastify.post("/sites/validate-custom-domain", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Validate custom domain (including DNS check)",
      tags: ["Sites"],
      body: {
        type: "object",
        required: ["domain"],
        properties: {
          domain: { type: "string" },
          excludeSiteId: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const { domain, excludeSiteId } = request.body;
    const result = await validateCustomDomain(domain, excludeSiteId);
    return {
      success: true,
      data: result
    };
  });
}

/**
 * Register public site routes (no auth required)
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function publicSiteRoutes(fastify, opts) {
  /**
   * GET /public/sites/:subdomain
   * Public endpoint to access a published site by subdomain
   */
  fastify.get("/public/sites/:subdomain", {
    schema: {
      description: "Public endpoint to access a published site by subdomain",
      tags: ["Sites"],
      params: {
        type: "object",
        required: ["subdomain"],
        properties: {
          subdomain: { type: "string" }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { subdomain } = request.params;
      const site = await getPublicSiteBySubdomain(subdomain);
      return {
        success: true,
        data: site
      };
    } catch (error) {
      if (error.message === "Site not found") {
        return reply.status(404).send({
          success: false,
          error: "Site not found"
        });
      }
      if (error.message === "Site has no published version") {
        return reply.status(404).send({
          success: false,
          error: "Site has no published version"
        });
      }
      if (error.message === "Site requires invitation to access") {
        return reply.status(403).send({
          success: false,
          error: "Site requires invitation to access"
        });
      }
      throw error;
    }
  });
}

module.exports = {
  siteRoutes,
  publicSiteRoutes
};
