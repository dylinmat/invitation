/**
 * Swagger/OpenAPI Configuration Plugin
 * Provides interactive API documentation at /docs
 */

import { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

/**
 * Register Swagger plugin on Fastify instance
 */
export async function registerSwagger(fastify: FastifyInstance): Promise<void> {
  await fastify.register(swagger, {
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
          User: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              email: { type: "string", format: "email" },
              fullName: { type: "string" },
              locale: { type: "string", default: "en" },
              avatar: { type: "string", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            },
            required: ["id", "email", "fullName"]
          },
          Organization: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              type: { type: "string", enum: ["personal", "team", "enterprise"] },
              name: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            },
            required: ["id", "type", "name"]
          },
          Project: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              status: { type: "string", enum: ["draft", "active", "archived", "suspended"] },
              timezone: { type: "string", default: "UTC" },
              ownerOrgId: { type: "string", format: "uuid" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            },
            required: ["id", "name", "status", "ownerOrgId"]
          },
          Guest: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              projectId: { type: "string", format: "uuid" },
              groupId: { type: "string", format: "uuid", nullable: true },
              firstName: { type: "string" },
              lastName: { type: "string" },
              role: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            },
            required: ["id", "projectId"]
          },
          GuestGroup: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              projectId: { type: "string", format: "uuid" },
              name: { type: "string" },
              householdLabel: { type: "string", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            },
            required: ["id", "projectId", "name"]
          },
          Invite: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              projectId: { type: "string", format: "uuid" },
              siteId: { type: "string", format: "uuid" },
              guestId: { type: "string", format: "uuid", nullable: true },
              tokenHash: { type: "string" },
              status: { type: "string", enum: ["pending", "sent", "opened", "responded", "revoked"] },
              securityMode: { type: "string", enum: ["none", "passcode", "token_only"] },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" }
            },
            required: ["id", "projectId", "siteId", "tokenHash", "status"]
          },
          Error: {
            type: "object",
            properties: {
              statusCode: { type: "integer" },
              error: { type: "string" },
              message: { type: "string" },
              code: { type: "string", nullable: true }
            },
            required: ["statusCode", "error", "message"]
          }
        }
      }
    }
  });

  await fastify.register(swaggerUi, {
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
    staticCSP: true,
    transformStaticCSP: (header) => header,
    theme: {
      title: "EIOS API Documentation"
    }
  });

  fastify.log.info("Swagger documentation registered at /docs");
}
