import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { transactions } from "../data/transactions";
import { successResponse, errorResponse, paginatedResponse, paginate } from "../utils/response";
import type { TransactionStatus, TransactionCategory } from "../types/index";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["completed", "pending", "failed", "reversed"]).optional(),
  category: z
    .enum([
      "software",
      "cloud_infrastructure",
      "travel",
      "office",
      "marketing",
      "hr_benefits",
      "legal",
      "consulting",
      "facilities",
      "finance",
      "other",
    ])
    .optional(),
  department: z.string().optional(),
  vendor: z.string().optional(),
  isAnomaly: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  amountMin: z.coerce.number().optional(),
  amountMax: z.coerce.number().optional(),
  sortBy: z.enum(["date", "amount", "vendor", "status"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function transactionRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/v1/transactions
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

      const {
        page,
        pageSize,
        search,
        status,
        category,
        department,
        vendor,
        isAnomaly,
        dateFrom,
        dateTo,
        amountMin,
        amountMax,
        sortBy,
        sortOrder,
      } = parseResult.data;

      let filtered = [...transactions];

      // Row-level scoping: dept_owner can only see their own department's transactions
      const authUser = request.user as { role?: string; department?: string } | undefined;
      if (authUser?.role === "dept_owner" && authUser.department) {
        const dept = authUser.department;
        filtered = filtered.filter((t) => t.department === dept);
      }

      // Text search across vendor, description, invoiceNumber
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.vendor.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.invoiceNumber.toLowerCase().includes(q) ||
            t.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }

      if (status) filtered = filtered.filter((t) => t.status === status);
      if (category) filtered = filtered.filter((t) => t.category === category);
      if (department) {
        filtered = filtered.filter(
          (t) =>
            t.departmentId === department ||
            t.department.toLowerCase().includes(department.toLowerCase())
        );
      }
      if (vendor) {
        filtered = filtered.filter((t) =>
          t.vendor.toLowerCase().includes(vendor.toLowerCase())
        );
      }
      if (isAnomaly !== undefined) {
        filtered = filtered.filter((t) => t.isAnomaly === isAnomaly);
      }
      if (dateFrom) {
        filtered = filtered.filter((t) => t.date >= dateFrom);
      }
      if (dateTo) {
        const to = dateTo.endsWith("Z") ? dateTo : dateTo + "T23:59:59Z";
        filtered = filtered.filter((t) => t.date <= to);
      }
      if (amountMin !== undefined) {
        filtered = filtered.filter((t) => t.amount >= amountMin);
      }
      if (amountMax !== undefined) {
        filtered = filtered.filter((t) => t.amount <= amountMax);
      }

      // Sort
      filtered.sort((a, b) => {
        let cmp = 0;
        switch (sortBy) {
          case "date":
            cmp = a.date.localeCompare(b.date);
            break;
          case "amount":
            cmp = a.amount - b.amount;
            break;
          case "vendor":
            cmp = a.vendor.localeCompare(b.vendor);
            break;
          case "status":
            cmp = a.status.localeCompare(b.status);
            break;
        }
        return sortOrder === "asc" ? cmp : -cmp;
      });

      const total = filtered.length;
      const paginated = paginate(filtered, page, pageSize);

      return paginatedResponse(reply, paginated, total, page, pageSize);
    }
  );

  // GET /api/v1/transactions/:id
  fastify.get(
    "/:id",
    { preHandler: requireAuth },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const transaction = transactions.find((t) => t.id === id);
      if (!transaction) {
        return errorResponse(reply, 404, "NOT_FOUND", `Transaction '${id}' not found.`);
      }
      return successResponse(reply, transaction);
    }
  );
}
