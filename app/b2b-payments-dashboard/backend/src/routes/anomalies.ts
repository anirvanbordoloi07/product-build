import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { anomalies } from "../data/anomalies";
import { auditLogs } from "../data/auditLogs";
import { successResponse, errorResponse, paginatedResponse, paginate } from "../utils/response";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
  status: z.enum(["pending", "investigating", "approved", "dismissed"]).optional(),
  type: z
    .enum([
      "duplicate_payment",
      "unusual_amount",
      "off_hours_transaction",
      "new_vendor",
      "policy_violation",
      "budget_breach",
      "velocity_spike",
    ])
    .optional(),
  department: z.string().optional(),
  sortBy: z.enum(["detectedAt", "riskScore", "amount", "severity"]).default("detectedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const patchSchema = z.object({
  status: z.enum(["pending", "investigating", "approved", "dismissed"]),
  notes: z.string().max(1000).optional(),
});

const severityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export async function anomalyRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/v1/anomalies
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

      const { page, pageSize, severity, status, type, department, sortBy, sortOrder } =
        parseResult.data;

      let filtered = [...anomalies];

      if (severity) filtered = filtered.filter((a) => a.severity === severity);
      if (status) filtered = filtered.filter((a) => a.status === status);
      if (type) filtered = filtered.filter((a) => a.type === type);
      if (department) {
        filtered = filtered.filter((a) =>
          a.department.toLowerCase().includes(department.toLowerCase())
        );
      }

      filtered.sort((a, b) => {
        let cmp = 0;
        switch (sortBy) {
          case "detectedAt":
            cmp = a.detectedAt.localeCompare(b.detectedAt);
            break;
          case "riskScore":
            cmp = a.riskScore - b.riskScore;
            break;
          case "amount":
            cmp = a.amount - b.amount;
            break;
          case "severity":
            cmp = (severityRank[a.severity] || 0) - (severityRank[b.severity] || 0);
            break;
        }
        return sortOrder === "asc" ? cmp : -cmp;
      });

      const total = filtered.length;
      const paginated = paginate(filtered, page, pageSize);

      return paginatedResponse(reply, paginated, total, page, pageSize);
    }
  );

  // GET /api/v1/anomalies/:id
  fastify.get(
    "/:id",
    { preHandler: requireAuth },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const anomaly = anomalies.find((a) => a.id === id);
      if (!anomaly) {
        return errorResponse(reply, 404, "NOT_FOUND", `Anomaly '${id}' not found.`);
      }
      return successResponse(reply, anomaly);
    }
  );

  // PATCH /api/v1/anomalies/:id
  fastify.patch(
    "/:id",
    { preHandler: requireAuth },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const anomalyIndex = anomalies.findIndex((a) => a.id === id);

      if (anomalyIndex === -1) {
        return errorResponse(reply, 404, "NOT_FOUND", `Anomaly '${id}' not found.`);
      }

      const parseResult = patchSchema.safeParse(request.body);
      if (!parseResult.success) {
        return errorResponse(
          reply,
          400,
          "VALIDATION_ERROR",
          "Invalid request body",
          parseResult.error.flatten().fieldErrors
        );
      }

      const { status, notes } = parseResult.data;
      const user = request.user!;

      // Capture old status BEFORE mutating (FAIL-14 fix)
      const oldStatus = anomalies[anomalyIndex].status;

      // Mutate in-memory
      anomalies[anomalyIndex].status = status;
      if (notes !== undefined) {
        anomalies[anomalyIndex].notes = notes;
      }
      if (status === "approved" || status === "dismissed") {
        anomalies[anomalyIndex].resolvedAt = new Date().toISOString();
        anomalies[anomalyIndex].resolvedBy = user.email;
      }

      // Append audit log entry (in-memory)
      const actionMap = {
        approved: "ANOMALY_APPROVED",
        dismissed: "ANOMALY_DISMISSED",
        investigating: "ANOMALY_STATUS_CHANGED",
        pending: "ANOMALY_REOPENED",
      };
      auditLogs.unshift({
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: user.sub,
        userName: user.name,
        userRole: user.role,
        action: actionMap[status],
        resourceType: "anomaly",
        resourceId: id,
        resourceName: anomalies[anomalyIndex].description.slice(0, 60),
        ipAddress: request.ip || "0.0.0.0",
        userAgent: request.headers["user-agent"] || "Unknown",
        changes: { status: { from: oldStatus, to: status } },
        severity: status === "approved" || status === "dismissed" ? "info" : "warning",
      });

      return successResponse(reply, anomalies[anomalyIndex]);
    }
  );
}
