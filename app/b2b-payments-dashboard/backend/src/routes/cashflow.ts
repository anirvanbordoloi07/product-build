import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { cashFlowForecast, getCashFlowByHorizon } from "../data/cashflow";
import { successResponse, errorResponse } from "../utils/response";

const querySchema = z.object({
  horizon: z.coerce.number().refine((v) => v === 30 || v === 60 || v === 90, {
    message: "Horizon must be 30, 60, or 90 days",
  }).default(90) as z.ZodDefault<z.ZodNumber>,
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function cashFlowRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/v1/cashflow/forecast
  fastify.get(
    "/forecast",
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

      const { horizon, from, to } = parseResult.data;
      let data = getCashFlowByHorizon(horizon as 30 | 60 | 90);

      // Optional date range override
      if (from || to) {
        data = cashFlowForecast.filter((entry) => {
          if (from && entry.date < from) return false;
          if (to && entry.date > to) return false;
          return true;
        });
      }

      const projected = data.reduce((sum, d) => sum + d.projected, 0);
      const actual = data
        .filter((d) => d.actual !== undefined)
        .reduce((sum, d) => sum + (d.actual || 0), 0);

      return successResponse(reply, {
        horizon: `${horizon}d`,
        forecastPeriod: {
          from: data[0]?.date || null,
          to: data[data.length - 1]?.date || null,
        },
        summary: {
          totalProjected: Math.round(projected * 100) / 100,
          totalActual: Math.round(actual * 100) / 100,
          variance: Math.round((actual - projected) * 100) / 100,
          currency: "USD",
        },
        dataPoints: data,
      });
    }
  );
}
