import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { requireRole } from "../middleware/auth";
import { auditLogs } from "../data/auditLogs";
import { errorResponse, paginatedResponse, paginate } from "../utils/response";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  userId: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  action: z.string().optional(),
  severity: z.enum(["info", "warning", "critical"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function auditLogRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/v1/audit/logs  — Auditor, Admin, Finance Manager only
  fastify.get(
    "/logs",
    {
      preHandler: requireRole(["admin", "finance_manager", "auditor"]),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = querySchema.safeParse(request.query);
      if (!parseResult.success) {
        return errorResponse(
          reply,
          400,
          "VALIDATION_ERROR",
          "Invalid query parameters",
          parseResult.error.flatten().fieldErrors
        );
      }

      const { page, pageSize, userId, resourceType, resourceId, action, severity, from, to, sortOrder } =
        parseResult.data;

      let filtered = [...auditLogs];

      if (userId) filtered = filtered.filter((l) => l.userId === userId);
      if (resourceType) filtered = filtered.filter((l) => l.resourceType === resourceType);
      if (resourceId) filtered = filtered.filter((l) => l.resourceId === resourceId);
      if (action) {
        filtered = filtered.filter((l) => l.action.toLowerCase().includes(action.toLowerCase()));
      }
      if (severity) filtered = filtered.filter((l) => l.severity === severity);
      if (from) filtered = filtered.filter((l) => l.timestamp >= from);
      if (to) filtered = filtered.filter((l) => l.timestamp <= to);

      filtered.sort((a, b) => {
        const cmp = a.timestamp.localeCompare(b.timestamp);
        return sortOrder === "asc" ? cmp : -cmp;
      });

      const total = filtered.length;
      const paginated = paginate(filtered, page, pageSize);

      return paginatedResponse(reply, paginated, total, page, pageSize);
    }
  );
}
