const {
  // Guest Groups
  getProjectGuestGroups,
  createProjectGuestGroup,
  updateProjectGuestGroup,
  deleteProjectGuestGroup,

  // Guests
  getProjectGuests,
  getGuest,
  createProjectGuest,
  updateProjectGuest,
  deleteProjectGuest,
  importGuests,

  // Guest Contacts
  addGuestContact,
  updateGuestContactInfo,
  removeGuestContact,

  // Guest Tags
  getProjectGuestTags,
  createProjectGuestTag,
  deleteProjectGuestTag,
  assignGuestTag,
  removeGuestTag,

  // Invites
  getProjectInvites,
  getInvite,
  createProjectInvite,
  revokeProjectInvite,
  regenerateProjectInviteToken,
  validateInviteToken,
  getInviteLogs,

  // RSVP Forms
  getProjectRsvpForms,
  getRsvpForm,
  createProjectRsvpForm,
  updateProjectRsvpForm,
  deleteProjectRsvpForm,

  // RSVP Questions
  addRsvpQuestion,
  removeRsvpQuestion,

  // RSVP Submissions
  getFormSubmissions,
  getSubmission,
  submitRsvp
} = require("./service");

/**
 * Register guest routes on a Fastify instance
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function guestRoutes(fastify, opts) {
  // Use authenticate hook from parent if available
  const authenticate = fastify.authenticate || opts.authenticate;

  // ========== Guest Groups ==========

  fastify.get("/projects/:projectId/groups", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "List guest groups for a project",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: { projectId: { type: "string" } }
      }
    }
  }, async (request) => {
    const groups = await getProjectGuestGroups(request.params.projectId);
    return { groups };
  });

  fastify.post("/projects/:projectId/groups", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Create a guest group",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: { projectId: { type: "string" } }
      },
      body: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          householdLabel: { type: "string" }
        }
      }
    }
  }, async (request, reply) => {
    const id = await createProjectGuestGroup(request.params.projectId, request.body);
    reply.status(201);
    return { id };
  });

  fastify.put("/groups/:groupId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Update a guest group",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["groupId"],
        properties: { groupId: { type: "string" } }
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          householdLabel: { type: "string" }
        }
      }
    }
  }, async (request) => {
    await updateProjectGuestGroup(request.params.groupId, request.body);
    return { success: true };
  });

  fastify.delete("/groups/:groupId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Delete a guest group",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["groupId"],
        properties: { groupId: { type: "string" } }
      }
    }
  }, async (request) => {
    await deleteProjectGuestGroup(request.params.groupId);
    return { success: true };
  });

  // ========== Guests ==========

  fastify.get("/projects/:projectId/guests", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "List guests for a project",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: { projectId: { type: "string" } }
      },
      querystring: {
        type: "object",
        properties: {
          groupId: { type: "string" },
          role: { type: "string" },
          tagId: { type: "string" },
          search: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const guests = await getProjectGuests(request.params.projectId, request.query);
    return { guests };
  });

  fastify.post("/projects/:projectId/guests", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Create a guest",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: { projectId: { type: "string" } }
      },
      body: {
        type: "object",
        properties: {
          groupId: { type: "string" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          role: { type: "string" },
          contacts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                email: { type: "string" },
                phone: { type: "string" }
              }
            }
          },
          tagIds: { type: "array", items: { type: "string" } }
        }
      }
    }
  }, async (request, reply) => {
    const id = await createProjectGuest(request.params.projectId, request.body);
    reply.status(201);
    return { id };
  });

  fastify.post("/projects/:projectId/guests/import", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Bulk import guests",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: { projectId: { type: "string" } }
      },
      body: {
        type: "object",
        required: ["guests"],
        properties: {
          guests: { type: "array", items: { type: "object" } }
        }
      }
    }
  }, async (request) => {
    const result = await importGuests(request.params.projectId, request.body.guests);
    return result;
  });

  fastify.get("/guests/:guestId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get a guest by ID",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["guestId"],
        properties: { guestId: { type: "string" } }
      }
    }
  }, async (request) => {
    const guest = await getGuest(request.params.guestId);
    return { guest };
  });

  fastify.put("/guests/:guestId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Update a guest",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["guestId"],
        properties: { guestId: { type: "string" } }
      },
      body: {
        type: "object",
        properties: {
          groupId: { type: "string" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          role: { type: "string" },
          contacts: { type: "array", items: { type: "object" } }
        }
      }
    }
  }, async (request) => {
    await updateProjectGuest(request.params.guestId, request.body);
    return { success: true };
  });

  fastify.delete("/guests/:guestId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Delete a guest",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["guestId"],
        properties: { guestId: { type: "string" } }
      }
    }
  }, async (request) => {
    await deleteProjectGuest(request.params.guestId);
    return { success: true };
  });

  // ========== Guest Contacts ==========

  fastify.post("/guests/:guestId/contacts", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Add a contact to a guest",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["guestId"],
        properties: { guestId: { type: "string" } }
      },
      body: {
        type: "object",
        properties: {
          email: { type: "string" },
          phone: { type: "string" }
        }
      }
    }
  }, async (request, reply) => {
    const id = await addGuestContact(request.params.guestId, request.body);
    reply.status(201);
    return { id };
  });

  fastify.put("/contacts/:contactId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Update a guest contact",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["contactId"],
        properties: { contactId: { type: "string" } }
      },
      body: {
        type: "object",
        properties: {
          email: { type: "string" },
          phone: { type: "string" }
        }
      }
    }
  }, async (request) => {
    await updateGuestContactInfo(request.params.contactId, request.body);
    return { success: true };
  });

  fastify.delete("/contacts/:contactId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Remove a guest contact",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["contactId"],
        properties: { contactId: { type: "string" } }
      }
    }
  }, async (request) => {
    await removeGuestContact(request.params.contactId);
    return { success: true };
  });

  // ========== Guest Tags ==========

  fastify.get("/projects/:projectId/tags", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "List guest tags for a project",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: { projectId: { type: "string" } }
      }
    }
  }, async (request) => {
    const tags = await getProjectGuestTags(request.params.projectId);
    return { tags };
  });

  fastify.post("/projects/:projectId/tags", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Create a guest tag",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: { projectId: { type: "string" } }
      },
      body: {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string" } }
      }
    }
  }, async (request, reply) => {
    const id = await createProjectGuestTag(request.params.projectId, request.body.name);
    reply.status(201);
    return { id };
  });

  fastify.delete("/tags/:tagId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Delete a guest tag",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["tagId"],
        properties: { tagId: { type: "string" } }
      }
    }
  }, async (request) => {
    await deleteProjectGuestTag(request.params.tagId);
    return { success: true };
  });

  fastify.post("/guests/:guestId/tags", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Assign a tag to a guest",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["guestId"],
        properties: { guestId: { type: "string" } }
      },
      body: {
        type: "object",
        required: ["tagId"],
        properties: { tagId: { type: "string" } }
      }
    }
  }, async (request) => {
    await assignGuestTag(request.params.guestId, request.body.tagId);
    return { success: true };
  });

  fastify.delete("/guests/:guestId/tags/:tagId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Remove a tag from a guest",
      tags: ["Guests"],
      params: {
        type: "object",
        required: ["guestId", "tagId"],
        properties: {
          guestId: { type: "string" },
          tagId: { type: "string" }
        }
      }
    }
  }, async (request) => {
    await removeGuestTag(request.params.guestId, request.params.tagId);
    return { success: true };
  });

  // ========== Invites ==========

  fastify.get("/projects/:projectId/invites", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "List invites for a project",
      tags: ["Invites"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: { projectId: { type: "string" } }
      },
      querystring: {
        type: "object",
        properties: {
          siteId: { type: "string" },
          guestId: { type: "string" },
          groupId: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const invites = await getProjectInvites(request.params.projectId, request.query);
    return { invites };
  });

  fastify.post("/projects/:projectId/invites", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Create an invite",
      tags: ["Invites"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: { projectId: { type: "string" } }
      },
      body: {
        type: "object",
        required: ["siteId"],
        properties: {
          siteId: { type: "string" },
          guestId: { type: "string" },
          groupId: { type: "string" },
          securityMode: { type: "string" },
          passcode: { type: "string" },
          expiresAt: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const result = await createProjectInvite(request.params.projectId, request.body);
    return result;
  });

  fastify.get("/invites/:inviteId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get an invite by ID",
      tags: ["Invites"],
      params: {
        type: "object",
        required: ["inviteId"],
        properties: { inviteId: { type: "string" } }
      }
    }
  }, async (request) => {
    const invite = await getInvite(request.params.inviteId);
    return { invite };
  });

  fastify.post("/invites/:inviteId/revoke", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Revoke an invite",
      tags: ["Invites"],
      params: {
        type: "object",
        required: ["inviteId"],
        properties: { inviteId: { type: "string" } }
      }
    }
  }, async (request) => {
    await revokeProjectInvite(request.params.inviteId);
    return { success: true };
  });

  fastify.post("/invites/:inviteId/regenerate", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Regenerate invite token",
      tags: ["Invites"],
      params: {
        type: "object",
        required: ["inviteId"],
        properties: { inviteId: { type: "string" } }
      }
    }
  }, async (request) => {
    const result = await regenerateProjectInviteToken(request.params.inviteId);
    return { ...result, success: true };
  });

  fastify.get("/invites/:inviteId/logs", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get invite access logs",
      tags: ["Invites"],
      params: {
        type: "object",
        required: ["inviteId"],
        properties: { inviteId: { type: "string" } }
      }
    }
  }, async (request) => {
    const logs = await getInviteLogs(request.params.inviteId);
    return { logs };
  });

  // Public endpoint - no auth required
  fastify.post("/invites/:token/validate", {
    schema: {
      description: "Validate an invite token (public endpoint)",
      tags: ["Invites"],
      params: {
        type: "object",
        required: ["token"],
        properties: { token: { type: "string" } }
      },
      body: {
        type: "object",
        properties: {
          passcode: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const result = await validateInviteToken(request.params.token, {
      passcode: request.body?.passcode,
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"]
    });
    return result;
  });

  // ========== RSVP Forms ==========

  fastify.get("/projects/:projectId/rsvp-forms", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "List RSVP forms for a project",
      tags: ["RSVP"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: { projectId: { type: "string" } }
      }
    }
  }, async (request) => {
    const forms = await getProjectRsvpForms(request.params.projectId);
    return { forms };
  });

  fastify.post("/projects/:projectId/rsvp-forms", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Create an RSVP form",
      tags: ["RSVP"],
      params: {
        type: "object",
        required: ["projectId"],
        properties: { projectId: { type: "string" } }
      },
      body: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          questions: { type: "array", items: { type: "object" } }
        }
      }
    }
  }, async (request, reply) => {
    const id = await createProjectRsvpForm(request.params.projectId, request.body);
    reply.status(201);
    return { id };
  });

  fastify.get("/rsvp-forms/:formId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get an RSVP form by ID",
      tags: ["RSVP"],
      params: {
        type: "object",
        required: ["formId"],
        properties: { formId: { type: "string" } }
      }
    }
  }, async (request) => {
    const form = await getRsvpForm(request.params.formId);
    return { form };
  });

  fastify.put("/rsvp-forms/:formId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Update an RSVP form",
      tags: ["RSVP"],
      params: {
        type: "object",
        required: ["formId"],
        properties: { formId: { type: "string" } }
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          questions: { type: "array", items: { type: "object" } }
        }
      }
    }
  }, async (request) => {
    await updateProjectRsvpForm(request.params.formId, request.body);
    return { success: true };
  });

  fastify.delete("/rsvp-forms/:formId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Delete an RSVP form",
      tags: ["RSVP"],
      params: {
        type: "object",
        required: ["formId"],
        properties: { formId: { type: "string" } }
      }
    }
  }, async (request) => {
    await deleteProjectRsvpForm(request.params.formId);
    return { success: true };
  });

  // ========== RSVP Questions ==========

  fastify.post("/rsvp-forms/:formId/questions", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Add a question to an RSVP form",
      tags: ["RSVP"],
      params: {
        type: "object",
        required: ["formId"],
        properties: { formId: { type: "string" } }
      },
      body: {
        type: "object",
        required: ["label", "type"],
        properties: {
          eventId: { type: "string" },
          label: { type: "string" },
          helpText: { type: "string" },
          type: { type: "string" },
          required: { type: "boolean" },
          sortOrder: { type: "number" },
          options: { type: "array", items: { type: "object" } },
          logicRules: { type: "array", items: { type: "object" } }
        }
      }
    }
  }, async (request, reply) => {
    const id = await addRsvpQuestion(request.params.formId, request.body);
    reply.status(201);
    return { id };
  });

  fastify.delete("/rsvp-questions/:questionId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Remove a question from an RSVP form",
      tags: ["RSVP"],
      params: {
        type: "object",
        required: ["questionId"],
        properties: { questionId: { type: "string" } }
      }
    }
  }, async (request) => {
    await removeRsvpQuestion(request.params.questionId);
    return { success: true };
  });

  // ========== RSVP Submissions ==========

  fastify.get("/rsvp-forms/:formId/submissions", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "List submissions for an RSVP form",
      tags: ["RSVP"],
      params: {
        type: "object",
        required: ["formId"],
        properties: { formId: { type: "string" } }
      },
      querystring: {
        type: "object",
        properties: {
          inviteId: { type: "string" },
          guestId: { type: "string" }
        }
      }
    }
  }, async (request) => {
    const submissions = await getFormSubmissions(request.params.formId, request.query);
    return { submissions };
  });

  fastify.get("/rsvp-submissions/:submissionId", {
    preHandler: authenticate ? [authenticate] : [],
    schema: {
      description: "Get an RSVP submission by ID",
      tags: ["RSVP"],
      params: {
        type: "object",
        required: ["submissionId"],
        properties: { submissionId: { type: "string" } }
      }
    }
  }, async (request) => {
    const submission = await getSubmission(request.params.submissionId);
    return { submission };
  });

  // Public endpoint - no auth required
  fastify.post("/rsvp/submit", {
    schema: {
      description: "Submit an RSVP (public endpoint)",
      tags: ["RSVP"],
      body: {
        type: "object",
        required: ["formId", "answers"],
        properties: {
          formId: { type: "string" },
          inviteToken: { type: "string" },
          guestId: { type: "string" },
          answers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                questionId: { type: "string" },
                value: {}
              }
            }
          },
          channel: { type: "string" }
        }
      }
    }
  }, async (request, reply) => {
    const result = await submitRsvp(request.body);
    reply.status(201);
    return { ...result, success: true };
  });
}

// Also export the old handleGuestsRoutes for backward compatibility during migration
const { handleGuestsRoutes } = require("./legacy-routes");
module.exports.handleGuestsRoutes = handleGuestsRoutes;
module.exports.guestRoutes = guestRoutes;
