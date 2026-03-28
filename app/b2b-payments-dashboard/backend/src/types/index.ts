// ─── Shared Response Types ────────────────────────────────────────────────────

export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
  };
}

// ─── Domain Types ─────────────────────────────────────────────────────────────

export type TransactionStatus = "completed" | "pending" | "failed" | "reversed";
export type TransactionCategory =
  | "software"
  | "cloud_infrastructure"
  | "travel"
  | "office"
  | "marketing"
  | "hr_benefits"
  | "legal"
  | "consulting"
  | "facilities"
  | "finance"
  | "other";

export interface Transaction {
  id: string;
  date: string; // ISO 8601
  vendor: string;
  vendorId: string;
  amount: number;
  currency: string;
  category: TransactionCategory;
  department: string;
  departmentId: string;
  status: TransactionStatus;
  invoiceNumber: string;
  paymentMethod: string;
  description: string;
  approvedBy?: string;
  tags: string[];
  isAnomaly: boolean;
}

export interface Budget {
  id: string;
  department: string;
  departmentId: string;
  fiscalYear: number;
  fiscalQuarter: number;
  budgetAmount: number;
  actualSpend: number;
  committedSpend: number;
  remainingBudget: number;
  utilizationRate: number; // 0–1
  lastUpdated: string;
  categories: BudgetCategory[];
}

export interface BudgetCategory {
  category: TransactionCategory;
  budgetAmount: number;
  actualSpend: number;
}

export type AnomalySeverity = "critical" | "high" | "medium" | "low";
export type AnomalyStatus = "pending" | "investigating" | "approved" | "dismissed";
export type AnomalyType =
  | "duplicate_payment"
  | "unusual_amount"
  | "off_hours_transaction"
  | "new_vendor"
  | "policy_violation"
  | "budget_breach"
  | "velocity_spike";

export interface Anomaly {
  id: string;
  transactionId: string;
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  description: string;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  department: string;
  riskScore: number; // 0–100
  notes?: string;
}

export type ReportFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "on_demand";
export type ReportFormat = "pdf" | "csv" | "xlsx";
export type ReportStatus = "active" | "paused" | "draft";

export interface Report {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
  frequency: ReportFrequency;
  format: ReportFormat;
  status: ReportStatus;
  filters: ReportFilters;
  recipients: string[];
  runCount: number;
}

export interface ReportFilters {
  departments?: string[];
  categories?: TransactionCategory[];
  vendors?: string[];
  dateRange?: { from: string; to: string };
  amountRange?: { min: number; max: number };
  statuses?: TransactionStatus[];
}

export type IntegrationStatus = "connected" | "pending" | "error" | "disconnected";
export type IntegrationType = "erp" | "accounting" | "banking" | "expense_management" | "hris";

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  status: IntegrationStatus;
  connectedAt?: string;
  lastSyncAt?: string;
  nextSyncAt?: string;
  syncFrequency: string;
  transactionCount?: number;
  errorMessage?: string;
  logoUrl: string;
  features: string[];
}

export interface Vendor {
  id: string;
  name: string;
  category: TransactionCategory;
  totalSpend: number;
  transactionCount: number;
  averageInvoice: number;
  currency: string;
  lastPayment: string;
  paymentTerms: string;
  contractValue?: number;
  contractExpiry?: string;
  spendTrend: number[]; // monthly spend last 6 months
  department: string;
  riskLevel: "low" | "medium" | "high";
  onboardedAt: string;
}

export interface CashFlowForecast {
  date: string;
  projected: number;
  actual?: number;
  lowerBound: number;
  upperBound: number;
  cumulative: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  ipAddress: string;
  userAgent: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  severity: "info" | "warning" | "critical";
}

export interface DashboardSummary {
  totalSpend: number;
  totalBudget: number;
  budgetUtilization: number;
  pendingApprovals: number;
  openAnomalies: number;
  criticalAlerts: number;
  transactionCount: number;
  topVendors: { vendorId: string; vendor: string; amount: number }[];
  spendByCategory: { category: string; amount: number; percentage: number }[];
  spendByDepartment: { departmentId: string; department: string; amount: number; budget: number }[];
  monthlyTrend: { month: string; spend: number; budget: number }[];
  erpSyncStatus: { provider: string; lastSync: string; status: IntegrationStatus };
  period: { from: string; to: string };
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export type UserRole = "admin" | "finance_manager" | "dept_owner" | "viewer" | "auditor";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  iat: number;
  exp: number;
}
