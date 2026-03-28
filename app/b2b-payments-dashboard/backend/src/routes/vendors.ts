import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { vendors } from "../data/vendors";
import { successResponse, errorResponse, paginatedResponse, paginate } from "../utils/response";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
  department: z.string().optional(),
  sortBy: z.enum(["totalSpend", "transactionCount", "name", "riskLevel"]).default("totalSpend"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const riskRank: Record<string, number> = { high: 3, medium: 2, low: 1 };

export async function vendorRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/v1/vendors
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

      const { page, pageSize, search, category, riskLevel, department, sortBy, sortOrder } =
        parseResult.data;

      let filtered = [...vendors];

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((v) => v.name.toLowerCase().includes(q));
      }
      if (category) {
        filtered = filtered.filter((v) => v.category === category);
      }
      if (riskLevel) {
        filtered = filtered.filter((v) => v.riskLevel === riskLevel);
      }
      if (department) {
        filtered = filtered.filter(
          (v) => v.department.toLowerCase().includes(department.toLowerCase())
        );
      }

      filtered.sort((a, b) => {
        let cmp = 0;
        switch (sortBy) {
          case "totalSpend":
            cmp = a.totalSpend - b.totalSpend;
            break;
          case "transactionCount":
            cmp = a.transactionCount - b.transactionCount;
            break;
          case "name":
            cmp = a.name.localeCompare(b.name);
            break;
          case "riskLevel":
            cmp = (riskRank[a.riskLevel] || 0) - (riskRank[b.riskLevel] || 0);
            break;
        }
        return sortOrder === "asc" ? cmp : -cmp;
      });

      const total = filtered.length;
      const paginated = paginate(filtered, page, pageSize);

      return paginatedResponse(reply, paginated, total, page, pageSize);
    }
  );

  // GET /api/v1/vendors/:id
  fastify.get(
    "/:id",
    { preHandler: requireAuth },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const vendor = vendors.find((v) => v.id === id);
      if (!vendor) {
        return errorResponse(reply, 404, "NOT_FOUND", `Vendor '${id}' not found.`);
      }
      return successResponse(reply, vendor);
    }
  );
}
