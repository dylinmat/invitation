/**
 * API-specific type definitions
 */

import { FastifyRequest, FastifyReply } from "fastify";

export interface RequestContext {
  userId?: string;
  orgId?: string;
  projectId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RouteHandler<T = unknown> {
  (request: FastifyRequest, reply: FastifyReply): Promise<T> | T;
}

export interface PaginatedRequest {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FilteredRequest extends PaginatedRequest {
  search?: string;
  status?: string;
  [key: string]: unknown;
}
