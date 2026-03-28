import type { FastifyReply } from "fastify";
import type { ApiMeta, ApiResponse, ApiError } from "../types/index";

export function successResponse<T>(
  reply: FastifyReply,
  data: T,
  meta: Partial<ApiMeta> = {},
  statusCode = 200
): void {
  const response: ApiResponse<T> = {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  reply.status(statusCode).send(response);
}

export function errorResponse(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): void {
  const response: ApiError = {
    error: { code, message, ...(details !== undefined && { details }) },
    meta: { timestamp: new Date().toISOString() },
  };
  reply.status(statusCode).send(response);
}

export function paginatedResponse<T>(
  reply: FastifyReply,
  data: T[],
  total: number,
  page: number,
  pageSize: number
): void {
  successResponse(reply, data, {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
