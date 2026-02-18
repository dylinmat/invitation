/**
 * Fastify type declarations
 */

import { FastifyRequest, FastifyInstance } from "fastify";
import { User, Session } from "@eios/types";

declare module "fastify" {
  interface FastifyRequest {
    user?: User;
    session?: Session;
    orgId?: string;
    projectId?: string;
    audit: (data: {
      action: string;
      targetType: string;
      targetId: string;
      metadata?: Record<string, unknown>;
    }) => void;
  }

  interface FastifyInstance {
    ApiError: {
      notFound: (message?: string) => Error;
      badRequest: (message?: string) => Error;
      unauthorized: (message?: string) => Error;
      forbidden: (message?: string) => Error;
      conflict: (message?: string) => Error;
    };
  }
}
