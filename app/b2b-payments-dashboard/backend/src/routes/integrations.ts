import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { integrations } from "../data/integrations";
import { successResponse, errorResponse, paginatedResponse, paginate } from "../utils/response";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["connected", "pending", "error", "disconnected"]).optional(),
  type: z
    .enum(["erp", "accounting", "banking", "expense_management", "hris"])
    .optional(),
});

export async function integrationRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/v1/integrations
  fastify.get(
    "/",
    { preHandler: requireAuth },
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

      const { page, pageSize, status, type } = parseResult.data;

      let filtered = [...integrations];
      if (status) filtered = filtered.filter((i) => i.status === status);
      if (type) filtered = filtered.filter((i) => i.type === type);

      const total = filtered.length;
      const paginated = paginate(filtered, page, pageSize);

      return paginatedResponse(reply, paginated, total, page, pageSize);
    }
  );

  // GET /api/v1/integrations/:id
  fastify.get(
    "/:id",
    { preHandler: requireAuth },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const integration = integrations.find((i) => i.id === id);
      if (!integration) {
        return errorResponse(reply, 404, "NOT_FOUND", `Integration '${id}' not found.`);
      }
      return successResponse(reply, integration);
    }
  );

  // POST /api/v1/integrations/:id/sync  (trigger manual sync)
  fastify.post(
    "/:id/sync",
    { preHandler: requireAuth },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const integration = integrations.find((i) => i.id === id);
      if (!integration) {
        return errorResponse(reply, 404, "NOT_FOUND", `Integration '${id}' not found.`);
      }
      if (integration.status === "error" || integration.status === "pending") {
        return errorResponse(
          reply,
          409,
          "SYNC_UNAVAILABLE",
          `Cannot sync — integration is in '${integration.status}' state. Please reconnect first.`
        );
      }
      // Simulate sync response
      integration.lastSyncAt = new Date().toISOString();
      return successResponse(reply, {
        integrationId: id,
        syncTriggered: true,
        estimatedCompletionTime: "2–5 minutes",
        lastSyncAt: integration.lastSyncAt,
      });
    }
  );
}
