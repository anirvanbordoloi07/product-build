import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth } from "../middleware/auth";
import { transactions } from "../data/transactions";
import { budgets } from "../data/budgets";
import { anomalies } from "../data/anomalies";
import { integrations } from "../data/integrations";
import { successResponse } from "../utils/response";
import type { DashboardSummary } from "../types/index";

export async function dashboardRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/v1/dashboard/summary
  fastify.get(
    "/summary",
    { preHandler: requireAuth },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const totalSpend = transactions
        .filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);

      const openAnomalies = anomalies.filter(
        (a) => a.status === "pending" || a.status === "investigating"
      ).length;

      const criticalAlerts = anomalies.filter(
        (a) => a.severity === "critical" && (a.status === "pending" || a.status === "investigating")
      ).length;

      const pendingTransactions = transactions.filter((t) => t.status === "pending").length;

      // Top vendors by spend
      const vendorSpend: Record<string, { vendorId: string; vendor: string; amount: number }> = {};
      for (const t of transactions.filter((t) => t.status === "completed")) {
        if (!vendorSpend[t.vendorId]) {
          vendorSpend[t.vendorId] = { vendorId: t.vendorId, vendor: t.vendor, amount: 0 };
        }
        vendorSpend[t.vendorId].amount += t.amount;
      }
      const topVendors = Object.values(vendorSpend)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map((v) => ({ ...v, amount: Math.round(v.amount * 100) / 100 }));

      // Spend by category
      const categorySpend: Record<string, number> = {};
      for (const t of transactions.filter((t) => t.status === "completed")) {
        categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount;
      }
      const spendByCategory = Object.entries(categorySpend)
        .map(([category, amount]) => ({
          category,
          amount: Math.round(amount * 100) / 100,
          percentage: Math.round((amount / totalSpend) * 10000) / 100,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Spend by department
      const deptSpend: Record<string, { departmentId: string; department: string; amount: number }> = {};
      for (const t of transactions.filter((t) => t.status === "completed")) {
        if (!deptSpend[t.departmentId]) {
          deptSpend[t.departmentId] = {
            departmentId: t.departmentId,
            department: t.department,
            amount: 0,
          };
        }
        deptSpend[t.departmentId].amount += t.amount;
      }
      const spendByDepartment = budgets.map((b) => ({
        departmentId: b.departmentId,
        department: b.department,
        amount: Math.round((deptSpend[b.departmentId]?.amount || 0) * 100) / 100,
        budget: b.budgetAmount,
      }));

      // Monthly trend (last 3 months)
      const monthlyTrend = [
        { month: "2026-01", spend: 568200, budget: 620000 },
        { month: "2026-02", spend: 612400, budget: 620000 },
        { month: "2026-03", spend: 588410, budget: 620000 },
      ];

      // ERP sync status (primary integration — find by type to avoid hardcoded ID dependency)
      const erpIntegration = integrations.find((i) => i.type === "erp" && i.status === "connected")
        ?? integrations.find((i) => i.type === "erp");
      const erpSyncStatus = {
        provider: erpIntegration?.name ?? "N/A",
        lastSync: erpIntegration?.lastSyncAt ?? new Date().toISOString(),
        status: erpIntegration?.status ?? "disconnected",
      };

      const summary: DashboardSummary = {
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalBudget,
        budgetUtilization: Math.round((totalSpend / totalBudget) * 10000) / 100,
        pendingApprovals: pendingTransactions,
        openAnomalies,
        criticalAlerts,
        transactionCount: transactions.length,
        topVendors,
        spendByCategory,
        spendByDepartment,
        monthlyTrend,
        erpSyncStatus,
        period: { from: "2026-01-01", to: "2026-03-31" },
      };

      return successResponse(reply, summary);
    }
  );
}
