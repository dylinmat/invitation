/**
 * Swagger/OpenAPI Configuration Plugin
 * Provides interactive API documentation at /docs
 */

/**
 * Register Swagger plugin on Fastify instance
 * @param {import('fastify').FastifyInstance} fastify
 */
async function registerSwagger(fastify) {
  // Register @fastify/swagger for OpenAPI spec generation
  await fastify.register(require("@fastify/swagger"), {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "Event Invitation OS API",
        description: "Enterprise-grade event invitation platform API. Manage projects, guests, invites, RSVPs, sites, messaging campaigns, and more.",
        version: "1.0.0",
        contact: {
          name: "EIOS Support",
          email: "support@eios.io"
        },
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/MIT"
        }
      },
      servers: (() => {
        const servers = [
          {
            url: "http://localhost:4000",
            description: "Local development server"
          }
        ];
        // Add production server if PUBLIC_URL is set
        if (process.env.PUBLIC_URL) {
          servers.push({
            url: process.env.PUBLIC_URL,
            description: "Production server"
          });
        }
        return servers;
      })(),
      tags: [
        { name: "Auth", description: "Authentication and user management" },
        { name: "Projects", description: "Project management and configuration" },
        { name: "Guests", description: "Guest management, groups, and tags" },
        { name: "Invites", description: "Invitation creation and management" },
        { name: "RSVP", description: "RSVP forms, questions, and submissions" },
        { name: "Sites", description: "Site builder and publishing" },
        { name: "Messaging", description: "Campaigns and communication" },
        { name: "Settings", description: "Configuration and settings management" },
        { name: "Admin", description: "Administrative endpoints" },
        { name: "Seating", description: "Floor plans, tables, and seating assignments" },
        { name: "Check-in", description: "Guest check-in and QR codes" },
        { name: "Photos", description: "Photo wall and moderation" },
        { name: "Analytics", description: "Analytics and reporting" },
        { name: "System", description: "Health checks and system endpoints" }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT session token from authentication"
          },
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "session_token",
            description: "Session cookie for browser-based authentication"
          }
        },
        schemas: {
          // User schema
          User: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid", description: "Unique user identifier" },
              email: { type: "string", format: "email", description: "User email address" },
              fullName: { type: "string", description: "User's full name" },
              locale: { type: "string", default: "en", description: "User's preferred locale" },
              avatar: { type: "string", nullable: true, description: "Avatar URL" },
              createdAt: { type: "string", format: "date-time", description: "Account creation timestamp" },
              updatedAt: { type: "string", format: "date-time", description: "Last update timestamp" }
            },
            required: ["id", "email", "fullName"]
          },

          // Organization schema
          Organization: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid", description: "Unique organization identifier" },
              type: { type: "string", enum: ["COUPLE", "PLANNER", "VENUE"], description: "Organization type" },
              name: { type: "string", description: "Organization name" },
              createdAt: { type: "string", format: "date-time", description: "Creation timestamp" },
              myRole: { type: "string", enum: ["owner", "admin", "member"], description: "Current user's role" },
              members: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    email: { type: "string", format: "email" },
                    fullName: { type: "string" },
                    role: { type: "string" },
                    joinedAt: { type: "string", format: "date-time" }
                  }
                }
              }
            },
            required: ["id", "type", "name"]
          },

          // Project schema
          Project: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid", description: "Unique project identifier" },
              name: { type: "string", description: "Project name" },
              description: { type: "string", nullable: true, description: "Project description" },
              status: { type: "string", enum: ["active", "archived", "draft"], description: "Project status" },
              eventDate: { type: "string", format: "date-time", nullable: true, description: "Event date" },
              timezone: { type: "string", default: "UTC", description: "Project timezone" },
              createdAt: { type: "string", format: "date-time", description: "Creation timestamp" },
              updatedAt: { type: "string", format: "date-time", description: "Last update timestamp" },
              orgId: { type: "string", format: "uuid", description: "Organization ID" },
              settings: {
                type: "object",
                properties: {
                  timezone: { type: "string" },
                  dateFormat: { type: "string" },
                  language: { type: "string" },
                  branding: {
                    type: "object",
                    properties: {
                      logo: { type: "string", nullable: true },
                      primaryColor: { type: "string" },
                      secondaryColor: { type: "string" }
                    }
                  }
                }
              },
              stats: {
                type: "object",
                properties: {
                  totalGuests: { type: "integer", description: "Total guest count" },
                  totalInvites: { type: "integer", description: "Total invite count" },
                  rsvpYes: { type: "integer", description: "Confirmed RSVPs" },
                  rsvpNo: { type: "integer", description: "Declined RSVPs" },
                  rsvpPending: { type: "integer", description: "Pending RSVPs" }
                }
              }
            },
            required: ["id", "name", "status", "orgId"]
          },

          // Guest schema
          Guest: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid", description: "Unique guest identifier" },
              projectId: { type: "string", format: "uuid", description: "Project ID" },
              groupId: { type: "string", format: "uuid", nullable: true, description: "Guest group ID" },
              firstName: { type: "string", description: "First name" },
              lastName: { type: "string", description: "Last name" },
              role: { type: "string", description: "Guest role (e.g., bride, groom, guest)" },
              contacts: {
                type: "array",
                description: "Contact information",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    email: { type: "string", format: "email" },
                    phone: { type: "string" },
                    type: { type: "string", enum: ["EMAIL", "PHONE"] }
                  }
                }
              },
              tags: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" }
                  }
                }
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            },
            required: ["id", "projectId"]
          },

          // GuestGroup schema
          GuestGroup: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              projectId: { type: "string", format: "uuid" },
              name: { type: "string", description: "Group name (e.g., 'Family', 'Friends')" },
              householdLabel: { type: "string", nullable: true, description: "Optional household identifier" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            },
            required: ["id", "projectId", "name"]
          },

          // GuestTag schema
          GuestTag: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              projectId: { type: "string", format: "uuid" },
              name: { type: "string", description: "Tag name" },
              color: { type: "string", nullable: true, description: "Tag color hex code" },
              createdAt: { type: "string", format: "date-time" }
            },
            required: ["id", "projectId", "name"]
          },

          // Invite schema
          Invite: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid", description: "Unique invite identifier" },
              projectId: { type: "string", format: "uuid" },
              siteId: { type: "string", format: "uuid", description: "Associated site ID" },
              guestId: { type: "string", format: "uuid", nullable: true, description: "Associated guest ID" },
              groupId: { type: "string", format: "uuid", nullable: true, description: "Associated group ID" },
              token: { type: "string", description: "Unique access token" },
              status: { type: "string", enum: ["pending", "sent", "opened", "responded", "revoked"], description: "Invite status" },
              securityMode: { type: "string", enum: ["TOKEN_ONLY", "TOKEN_PLUS_PASSCODE"], description: "Security level" },
              sentAt: { type: "string", format: "date-time", nullable: true },
              expiresAt: { type: "string", format: "date-time", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            },
            required: ["id", "projectId", "siteId", "token", "status"]
          },

          // RSVPForm schema
          RsvpForm: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              projectId: { type: "string", format: "uuid" },
              name: { type: "string", description: "Form name" },
              questions: {
                type: "array",
                description: "Form questions",
                items: { $ref: "#/components/schemas/RsvpQuestion" }
              },
              isActive: { type: "boolean", description: "Whether the form is active" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            },
            required: ["id", "projectId", "name"]
          },

          // RsvpQuestion schema
          RsvpQuestion: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              formId: { type: "string", format: "uuid" },
              eventId: { type: "string", format: "uuid", nullable: true },
              label: { type: "string", description: "Question label" },
              helpText: { type: "string", nullable: true, description: "Help text" },
              type: { type: "string", enum: ["TEXT", "TEXTAREA", "SELECT", "MULTI_SELECT", "RADIO", "CHECKBOX", "DATE", "NUMBER", "ATTENDANCE"], description: "Question type" },
              required: { type: "boolean", description: "Whether answer is required" },
              sortOrder: { type: "integer", description: "Display order" },
              options: {
                type: "array",
                nullable: true,
                description: "Options for select/radio/checkbox types",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    label: { type: "string" },
                    value: { type: "string" }
                  }
                }
              },
              logicRules: {
                type: "array",
                description: "Conditional logic rules",
                items: {
                  type: "object",
                  properties: {
                    condition: { type: "string" },
                    action: { type: "string" },
                    targetQuestionId: { type: "string" }
                  }
                }
              }
            },
            required: ["id", "formId", "label", "type"]
          },

          // RsvpSubmission schema
          RsvpSubmission: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              formId: { type: "string", format: "uuid" },
              inviteId: { type: "string", format: "uuid", nullable: true },
              guestId: { type: "string", format: "uuid", nullable: true },
              answers: {
                type: "array",
                description: "Submitted answers",
                items: {
                  type: "object",
                  properties: {
                    questionId: { type: "string" },
                    value: { description: "Answer value (type varies by question)" }
                  }
                }
              },
              submittedAt: { type: "string", format: "date-time" },
              channel: { type: "string", enum: ["WEB", "EMAIL", "SMS", "WHATSAPP"], description: "Submission channel" }
            },
            required: ["id", "formId", "answers", "submittedAt"]
          },

          // Site schema
          Site: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid", description: "Unique site identifier" },
              projectId: { type: "string", format: "uuid" },
              name: { type: "string", description: "Site name" },
              type: { type: "string", enum: ["PUBLIC", "INTERNAL"], description: "Site type" },
              visibility: { type: "string", enum: ["PUBLIC", "UNLISTED", "INVITE_ONLY"], description: "Visibility level" },
              subdomainSlug: { type: "string", nullable: true, description: "Subdomain for public access" },
              customDomain: { type: "string", nullable: true, description: "Custom domain (if configured)" },
              publishedVersionId: { type: "string", format: "uuid", nullable: true, description: "Currently published version" },
              sceneGraph: { type: "object", nullable: true, description: "Site structure/content" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            },
            required: ["id", "projectId", "name", "type", "visibility"]
          },

          // SiteVersion schema
          SiteVersion: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              siteId: { type: "string", format: "uuid" },
              version: { type: "integer", description: "Version number" },
              status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"], description: "Version status" },
              sceneGraph: { type: "object", description: "Site structure/content" },
              baseVersionId: { type: "string", format: "uuid", nullable: true, description: "Parent version (for branching)" },
              publishedAt: { type: "string", format: "date-time", nullable: true },
              publishedBy: { type: "string", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            },
            required: ["id", "siteId", "version", "status"]
          },

          // Campaign schema
          Campaign: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid", description: "Unique campaign identifier" },
              projectId: { type: "string", format: "uuid" },
              channel: { type: "string", enum: ["EMAIL", "WHATSAPP", "SMS"], description: "Communication channel" },
              status: { type: "string", enum: ["DRAFT", "SCHEDULED", "QUEUED", "SENDING", "SENT", "CANCELLED", "BLOCKED"], description: "Campaign status" },
              subject: { type: "string", description: "Message subject" },
              bodyHtml: { type: "string", nullable: true, description: "HTML content" },
              bodyText: { type: "string", nullable: true, description: "Plain text content" },
              scheduledAt: { type: "string", format: "date-time", nullable: true, description: "Scheduled send time" },
              sentAt: { type: "string", format: "date-time", nullable: true },
              recipientCount: { type: "integer", description: "Number of recipients" },
              audienceSegment: { type: "object", nullable: true, description: "Targeting criteria" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            },
            required: ["id", "projectId", "channel", "status", "subject"]
          },

          // CampaignStats schema
          CampaignStats: {
            type: "object",
            properties: {
              campaignId: { type: "string", format: "uuid" },
              total: { type: "integer", description: "Total messages" },
              sent: { type: "integer", description: "Successfully sent" },
              delivered: { type: "integer", description: "Delivered to recipient" },
              opened: { type: "integer", description: "Opened by recipient" },
              clicked: { type: "integer", description: "Links clicked" },
              bounced: { type: "integer", description: "Bounced messages" },
              complained: { type: "integer", description: "Spam complaints" },
              unsubscribed: { type: "integer", description: "Unsubscribes" },
              failed: { type: "integer", description: "Failed to send" },
              pending: { type: "integer", description: "Pending delivery" },
              openRate: { type: "number", format: "float", description: "Percentage opened" },
              clickRate: { type: "number", format: "float", description: "Percentage clicked" },
              bounceRate: { type: "number", format: "float", description: "Percentage bounced" }
            }
          },

          // FloorPlan schema
          FloorPlan: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              eventId: { type: "string", format: "uuid" },
              name: { type: "string", description: "Floor plan name" },
              width: { type: "number", description: "Width in units" },
              height: { type: "number", description: "Height in units" },
              backgroundImageUrl: { type: "string", nullable: true, description: "Background image URL" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            },
            required: ["id", "eventId", "name"]
          },

          // Table schema
          Table: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              floorPlanId: { type: "string", format: "uuid" },
              name: { type: "string", description: "Table name/number" },
              shape: { type: "string", enum: ["ROUND", "RECTANGLE", "SQUARE", "CUSTOM"], description: "Table shape" },
              positionX: { type: "number", description: "X coordinate" },
              positionY: { type: "number", description: "Y coordinate" },
              width: { type: "number", description: "Width in units" },
              height: { type: "number", description: "Height in units" },
              capacity: { type: "integer", description: "Seating capacity" },
              rotation: { type: "number", default: 0, description: "Rotation in degrees" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            },
            required: ["id", "floorPlanId", "name", "shape"]
          },

          // TableAssignment schema
          TableAssignment: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              guestId: { type: "string", format: "uuid" },
              tableId: { type: "string", format: "uuid" },
              seatNumber: { type: "integer", nullable: true, description: "Optional seat number" },
              createdAt: { type: "string", format: "date-time" }
            },
            required: ["id", "guestId", "tableId"]
          },

          // CheckIn schema
          CheckIn: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              eventId: { type: "string", format: "uuid" },
              guestId: { type: "string", format: "uuid" },
              method: { type: "string", enum: ["QR", "MANUAL", "IMPORT"], description: "Check-in method" },
              checkedInBy: { type: "string", nullable: true, description: "User who performed check-in" },
              notes: { type: "string", nullable: true },
              checkedInAt: { type: "string", format: "date-time" }
            },
            required: ["id", "eventId", "guestId", "method", "checkedInAt"]
          },

          // Photo schema
          Photo: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              projectId: { type: "string", format: "uuid" },
              guestId: { type: "string", format: "uuid", nullable: true, description: "Uploader guest ID" },
              url: { type: "string", format: "uri", description: "Photo URL" },
              thumbnailUrl: { type: "string", format: "uri", nullable: true },
              caption: { type: "string", nullable: true },
              status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "AUTO_REJECTED"], description: "Moderation status" },
              likes: { type: "integer", default: 0, description: "Number of likes" },
              uploadedAt: { type: "string", format: "date-time" },
              moderatedAt: { type: "string", format: "date-time", nullable: true },
              moderatedBy: { type: "string", nullable: true }
            },
            required: ["id", "projectId", "url", "status"]
          },

          // Error schema
          Error: {
            type: "object",
            properties: {
              statusCode: { type: "integer", description: "HTTP status code" },
              error: { type: "string", description: "Error type" },
              message: { type: "string", description: "Error message" },
              code: { type: "string", nullable: true, description: "Error code" }
            },
            required: ["statusCode", "error", "message"]
          },

          // SuccessResponse schema
          SuccessResponse: {
            type: "object",
            properties: {
              success: { type: "boolean", default: true },
              message: { type: "string", nullable: true },
              data: { type: "object", nullable: true }
            },
            required: ["success"]
          }
        }
      }
    }
  });

  // Register Swagger UI for interactive documentation
  await fastify.register(require("@fastify/swagger-ui"), {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      supportedSubmitMethods: ["get", "post", "put", "delete", "patch"]
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next();
      },
      preHandler: function (request, reply, next) {
        next();
      }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    theme: {
      title: "EIOS API Documentation"
    }
  });

  fastify.log.info("Swagger documentation registered at /docs");
}

module.exports = {
  registerSwagger
};
