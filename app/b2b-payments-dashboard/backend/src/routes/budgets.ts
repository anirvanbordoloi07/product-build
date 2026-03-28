import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { budgets } from "../data/budgets";
import { successResponse, errorResponse, paginatedResponse, paginate } from "../utils/response";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  department: z.string().optional(),
  fiscalYear: z.coerce.number().optional(),
  fiscalQuarter: z.coerce.number().min(1).max(4).optional(),
  overBudget: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});

export async function budgetRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/v1/budgets
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

      const { page, pageSize, department, fiscalYear, fiscalQuarter, overBudget } =
        parseResult.data;

      let filtered = [...budgets];

      // Row-level scoping: dept_owner can only see their own department's budgets
      const authUser = request.user as { role?: string; department?: string } | undefined;
      if (authUser?.role === "dept_owner" && authUser.department) {
        const dept = authUser.department;
        filtered = filtered.filter((b) => b.department === dept);
      }

      if (department) {
        filtered = filtered.filter(
          (b) =>
            b.departmentId === department ||
            b.department.toLowerCase().includes(department.toLowerCase())
        );
      }
      if (fiscalYear !== undefined) {
        filtered = filtered.filter((b) => b.fiscalYear === fiscalYear);
      }
      if (fiscalQuarter !== undefined) {
        filtered = filtered.filter((b) => b.fiscalQuarter === fiscalQuarter);
      }
      if (overBudget !== undefined) {
        filtered = filtered.filter((b) =>
          overBudget ? b.utilizationRate > 1 : b.utilizationRate <= 1
        );
      }

      const total = filtered.length;
      const paginated = paginate(filtered, page, pageSize);

      return paginatedResponse(reply, paginated, total, page, pageSize);
    }
  );

  // GET /api/v1/budgets/:id
  fastify.get(
    "/:id",
    { preHandler: requireAuth },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const budget = budgets.find((b) => b.id === id || b.departmentId === id);
      if (!budget) {
        return errorResponse(reply, 404, "NOT_FOUND", `Budget '${id}' not found.`);
      }
      return successResponse(reply, budget);
    }
  );
}
