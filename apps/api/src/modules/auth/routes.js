const {
  registerUser,
  sendLoginMagicLink,
  loginWithMagicLink,
  logout,
  getCurrentUser,
  createOrganizationForUser,
  getOrganization,
  inviteToOrganization
} = require("./service");

const {
  authenticateHook,
  requireOrgRole,
  requireOrgMember,
  magicLinkRateLimiter,
  otpVerifyRateLimiter
} = require("./middleware");

/**
 * Register auth routes on a Fastify instance
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function authRoutes(fastify, opts) {
  // ============== Auth Routes ==============

  /**
   * POST /auth/register
   * Register a new user and send magic link
   * Rate limit: 5 requests per 10 minutes per IP
   */
  fastify.post("/register", {
    preHandler: [magicLinkRateLimiter],
    schema: {
      description: "Register a new user and send magic link",
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["email", "fullName"],
        properties: {
          email: { type: "string", format: "email" },
          fullName: { type: "string", minLength: 1 }
        }
      },
      response: {
        201: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            user: {
              type: "object",
              properties: {
                id: { type: "string" },
                email: { type: "string" },
                fullName: { type: "string" },
                isNewUser: { type: "boolean" }
              }
            },
            message: { type: "string" }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { email, fullName } = request.body;
    const result = await registerUser(email, fullName);
    reply.status(201);
    return {
      success: true,
      user: result.user,
      message: result.message
    };
  });

  /**
   * POST /auth/login
   * Send magic link for login
   * Rate limit: 5 requests per 10 minutes per IP
   */
  fastify.post("/login", {
    preHandler: [magicLinkRateLimiter],
    schema: {
      description: "Send magic link for login",
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" }
          }
        }
      }
    }
  }, async (request) => {
    const { email } = request.body;
    const result = await sendLoginMagicLink(email);
    return {
      success: true,
      message: result.message
    };
  });

  /**
   * POST /auth/verify
   * Verify magic link token and create session
   * Rate limit: 10 attempts per 10 minutes per IP
   */
  fastify.post("/verify", {
    preHandler: [otpVerifyRateLimiter],
    schema: {
      description: "Verify magic link token and create session",
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            user: {
              type: "object",
              properties: {
                id: { type: "string" },
                email: { type: "string" },
                fullName: { type: "string" },
                locale: { type: "string" }
              }
            },
            sessionToken: { type: "string" },
            isNewUser: { type: "boolean" }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { token } = request.body;
    const result = await loginWithMagicLink(token, {
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"]
    });

    // Set session cookie (optional - can also use bearer token)
    reply.setCookie("session_token", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return {
      success: true,
      user: result.user,
      sessionToken: result.sessionToken,
      isNewUser: result.isNewUser
    };
  });

  /**
   * POST /auth/logout
   * Logout user and invalidate session
   */
  fastify.post("/logout", {
    preHandler: [authenticateHook],
    schema: {
      description: "Logout user and invalidate session",
      tags: ["Auth"],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" }
          }
        }
      }
    }
  }, async (request, reply) => {
    await logout(request.sessionToken);

    // Clear session cookie
    reply.clearCookie("session_token");

    return {
      success: true,
      message: "Logged out successfully"
    };
  });

  /**
   * GET /auth/me
   * Get current authenticated user
   */
  fastify.get("/me", {
    preHandler: [authenticateHook],
    schema: {
      description: "Get current authenticated user",
      tags: ["Auth"],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            user: {
              type: "object",
              properties: {
                id: { type: "string" },
                email: { type: "string" },
                fullName: { type: "string" },
                locale: { type: "string" },
                createdAt: { type: "string" },
                organizations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      type: { type: "string" },
                      name: { type: "string" },
                      role: { type: "string" },
                      joinedAt: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request) => {
    const user = await getCurrentUser(request.user.id);

    if (!user) {
      throw fastify.httpErrors.notFound("User not found");
    }

    return {
      success: true,
      user
    };
  });

  /**
   * PATCH /auth/profile
   * Update user profile
   */
  fastify.patch("/profile", {
    preHandler: [authenticateHook],
    schema: {
      description: "Update user profile",
      tags: ["Auth"],
      body: {
        type: "object",
        properties: {
          fullName: { type: "string" },
          locale: { type: "string" },
          avatar: { type: "string" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            user: { type: "object" }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { fullName, locale, avatar } = request.body;
    const userId = request.user?.id;
    
    if (!userId) {
      reply.status(401);
      return { statusCode: 401, error: "Unauthorized", message: "User not authenticated" };
    }
    
    const { updateUser } = require("./repository");
    
    const updates = {};
    if (fullName !== undefined) updates.full_name = fullName;
    if (locale !== undefined) updates.locale = locale;
    if (avatar !== undefined) updates.avatar = avatar;
    
    if (Object.keys(updates).length === 0) {
      reply.status(400);
      return { statusCode: 400, error: "Bad Request", message: "No fields to update" };
    }
    
    const updatedUser = await updateUser(userId, updates);
    if (!updatedUser) {
      reply.status(404);
      return { statusCode: 404, error: "Not Found", message: "User not found" };
    }
    
    return { 
      success: true, 
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        locale: updatedUser.locale,
        avatar: updatedUser.avatar,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at
      }
    };
  });
}

/**
 * Register organization routes on a Fastify instance
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
async function orgRoutes(fastify, opts) {
  /**
   * POST /orgs
   * Create a new organization
   * Requires authentication
   */
  fastify.post("/", {
    preHandler: [authenticateHook],
    schema: {
      description: "Create a new organization",
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["type", "name"],
        properties: {
          type: { type: "string", enum: ["COUPLE", "PLANNER", "VENUE"] },
          name: { type: "string", minLength: 1 }
        }
      },
      response: {
        201: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            organization: {
              type: "object",
              properties: {
                id: { type: "string" },
                type: { type: "string" },
                name: { type: "string" },
                createdAt: { type: "string" },
                role: { type: "string" }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { type, name } = request.body;
    const org = await createOrganizationForUser(request.user.id, type, name);
    reply.status(201);
    return {
      success: true,
      organization: org
    };
  });

  /**
   * GET /orgs/:id
   * Get organization details with members
   * Requires authentication and organization membership
   */
  fastify.get("/:id", {
    preHandler: [authenticateHook, requireOrgMember],
    schema: {
      description: "Get organization details with members",
      tags: ["Auth"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            organization: {
              type: "object",
              properties: {
                id: { type: "string" },
                type: { type: "string" },
                name: { type: "string" },
                createdAt: { type: "string" },
                myRole: { type: "string" },
                members: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      email: { type: "string" },
                      fullName: { type: "string" },
                      role: { type: "string" },
                      joinedAt: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const org = await getOrganization(id, request.user.id);
    return {
      success: true,
      organization: org
    };
  });

  /**
   * GET /orgs/:id/members
   * List organization members
   * Requires authentication and organization membership
   */
  fastify.get("/:id/members", {
    preHandler: [authenticateHook, requireOrgMember],
    schema: {
      description: "List organization members",
      tags: ["Auth"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            members: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  email: { type: "string" },
                  fullName: { type: "string" },
                  role: { type: "string" },
                  joinedAt: { type: "string" }
                }
              }
            }
          }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const org = await getOrganization(id, request.user.id);
    return {
      success: true,
      members: org.members
    };
  });

  /**
   * POST /orgs/:id/invite
   * Invite a user to the organization
   * Requires authentication and admin role
   */
  fastify.post("/:id/invite", {
    preHandler: [authenticateHook, requireOrgRole("admin")],
    schema: {
      description: "Invite a user to the organization",
      tags: ["Auth"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      },
      body: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["admin", "member"], default: "member" }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            invitation: {
              type: "object",
              properties: {
                email: { type: "string" },
                role: { type: "string" },
                status: { type: "string" },
                message: { type: "string" }
              }
            }
          }
        }
      }
    }
  }, async (request) => {
    const { id } = request.params;
    const { email, role } = request.body;

    const result = await inviteToOrganization(
      request.user.id,
      id,
      email,
      role || "member"
    );

    return {
      success: true,
      invitation: result
    };
  });
}

module.exports = {
  authRoutes,
  orgRoutes
};
