import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";

import { authRoutes } from "./routes/auth";
import { dashboardRoutes } from "./routes/dashboard";
import { transactionRoutes } from "./routes/transactions";
import { budgetRoutes } from "./routes/budgets";
import { anomalyRoutes } from "./routes/anomalies";
import { reportRoutes } from "./routes/reports";
import { integrationRoutes } from "./routes/integrations";
import { vendorRoutes } from "./routes/vendors";
import { cashFlowRoutes } from "./routes/cashflow";
import { auditLogRoutes } from "./routes/auditLogs";

const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "0.0.0.0";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = process.env.JWT_SECRET;

async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
      transport:
        process.env.NODE_ENV !== "production"
          ? {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
              },
            }
          : undefined,
    },
  });

  // ─── Plugins ────────────────────────────────────────────────────────────────

  await fastify.register(cors, {
    origin: true, // allow all origins in dev
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  await fastify.register(jwt, {
    secret: JWT_SECRET,
  });

  await fastify.register(rateLimit, {
    max: 200,
    timeWindow: "1 minute",
    errorResponseBuilder: (_request, context) => ({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: `Too many requests. Retry after ${context.after}.`,
      },
      meta: { timestamp: new Date().toISOString() },
    }),
  });

  // ─── Health check (no auth) ─────────────────────────────────────────────────

  fastify.get("/health", async (_request, reply) => {
    return reply.send({
      status: "ok",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  fastify.get("/", async (_request, reply) => {
    return reply.send({
      service: "B2B Payments Analytics Dashboard API",
      version: "1.0.0",
      docs: "/health",
      endpoints: [
        "POST /api/v1/auth/login",
        "GET  /api/v1/auth/me",
        "GET  /api/v1/dashboard/summary",
        "GET  /api/v1/transactions",
        "GET  /api/v1/transactions/:id",
        "GET  /api/v1/budgets",
        "GET  /api/v1/budgets/:id",
        "GET  /api/v1/anomalies",
        "GET  /api/v1/anomalies/:id",
        "PATCH /api/v1/anomalies/:id",
        "GET  /api/v1/reports",
        "GET  /api/v1/reports/:id",
        "POST /api/v1/reports",
        "DELETE /api/v1/reports/:id",
        "GET  /api/v1/integrations",
        "GET  /api/v1/integrations/:id",
        "POST /api/v1/integrations/:id/sync",
        "GET  /api/v1/vendors",
        "GET  /api/v1/vendors/:id",
        "GET  /api/v1/cashflow/forecast",
        "GET  /api/v1/audit/logs",
      ],
    });
  });

  // ─── Routes ─────────────────────────────────────────────────────────────────

  fastify.register(authRoutes, { prefix: "/api/v1/auth" });
  fastify.register(dashboardRoutes, { prefix: "/api/v1/dashboard" });
  fastify.register(transactionRoutes, { prefix: "/api/v1/transactions" });
  fastify.register(budgetRoutes, { prefix: "/api/v1/budgets" });
  fastify.register(anomalyRoutes, { prefix: "/api/v1/anomalies" });
  fastify.register(reportRoutes, { prefix: "/api/v1/reports" });
  fastify.register(integrationRoutes, { prefix: "/api/v1/integrations" });
  fastify.register(vendorRoutes, { prefix: "/api/v1/vendors" });
  fastify.register(cashFlowRoutes, { prefix: "/api/v1/cashflow" });
  fastify.register(auditLogRoutes, { prefix: "/api/v1/audit" });

  // ─── Global error handler ────────────────────────────────────────────────────

  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);

    if (error.statusCode === 429) {
      return reply.status(429).send(error);
    }

    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      error: {
        code: error.code || "INTERNAL_SERVER_ERROR",
        message:
          statusCode === 500
            ? "An unexpected error occurred. Please try again."
            : error.message,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  });

  // ─── 404 handler ────────────────────────────────────────────────────────────

  fastify.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      error: {
        code: "NOT_FOUND",
        message: `Route ${_request.method} ${_request.url} not found.`,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  });

  return fastify;
}

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`\n  B2B Payments Dashboard API`);
    console.log(`  ─────────────────────────────────────`);
    console.log(`  Listening on: http://localhost:${PORT}`);
    console.log(`  Health:       http://localhost:${PORT}/health`);
    console.log(`  Endpoints:    http://localhost:${PORT}/`);
    console.log(`\n  Demo login:`);
    console.log(`    POST http://localhost:${PORT}/api/v1/auth/login`);
    console.log(`    { "email": "cfo@acme.com", "password": "password123" }`);
    console.log(`  ─────────────────────────────────────\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
