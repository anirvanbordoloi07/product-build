import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { reports } from "../data/reports";
import { successResponse, errorResponse, paginatedResponse, paginate } from "../utils/response";
import type { Report } from "../types/index";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["active", "paused", "draft"]).optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "on_demand"]).optional(),
});

const createReportSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).default(""),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "on_demand"]),
  format: z.enum(["pdf", "csv", "xlsx"]),
  recipients: z.array(z.string().email()).min(1),
  filters: z
    .object({
      departments: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
      vendors: z.array(z.string()).optional(),
      dateRange: z
        .object({
          from: z.string(),
          to: z.string(),
        })
        .optional(),
      amountRange: z
        .object({
          min: z.number(),
          max: z.number(),
        })
        .optional(),
      statuses: z.array(z.string()).optional(),
    })
    .default({}),
});

export async function reportRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/v1/reports
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

      const { page, pageSize, status, frequency } = parseResult.data;

      let filtered = [...reports];
      if (status) filtered = filtered.filter((r) => r.status === status);
      if (frequency) filtered = filtered.filter((r) => r.frequency === frequency);

      const total = filtered.length;
      const paginated = paginate(filtered, page, pageSize);

      return paginatedResponse(reply, paginated, total, page, pageSize);
    }
  );

  // GET /api/v1/reports/:id
  fastify.get(
    "/:id",
    { preHandler: requireAuth },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const report = reports.find((r) => r.id === id);
      if (!report) {
        return errorResponse(reply, 404, "NOT_FOUND", `Report '${id}' not found.`);
      }
      return successResponse(reply, report);
    }
  );

  // POST /api/v1/reports
  fastify.post(
    "/",
    { preHandler: requireAuth },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = createReportSchema.safeParse(request.body);
      if (!parseResult.success) {
        return errorResponse(
          reply,
          400,
          "VALIDATION_ERROR",
          "Invalid request body",
          parseResult.error.flatten().fieldErrors
        );
      }

      const user = request.user!;
      const now = new Date().toISOString();
      const newId = `rpt_${Date.now()}`;

      // Compute nextRunAt based on frequency
      const nextRunMap: Record<string, number> = {
        daily: 1,
        weekly: 7,
        monthly: 30,
        quarterly: 90,
        on_demand: 0,
      };
      const daysUntilNext = nextRunMap[parseResult.data.frequency] || 0;
      const nextRun = daysUntilNext > 0
        ? new Date(Date.now() + daysUntilNext * 86400000).toISOString()
        : undefined;

      const newReport: Report = {
        id: newId,
        name: parseResult.data.name,
        description: parseResult.data.description,
        createdBy: user.email,
        createdAt: now,
        updatedAt: now,
        lastRunAt: undefined,
        nextRunAt: nextRun,
        frequency: parseResult.data.frequency,
        format: parseResult.data.format,
        status: "active",
        filters: parseResult.data.filters as Report["filters"],
        recipients: parseResult.data.recipients,
        runCount: 0,
      };

      reports.push(newReport);

      return successResponse(reply, newReport, {}, 201);
    }
  );

  // DELETE /api/v1/reports/:id
  fastify.delete(
    "/:id",
    { preHandler: requireAuth },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const idx = reports.findIndex((r) => r.id === id);
      if (idx === -1) {
        return errorResponse(reply, 404, "NOT_FOUND", `Report '${id}' not found.`);
      }
      reports.splice(idx, 1);
      return successResponse(reply, { deleted: true, id });
    }
  );
}
