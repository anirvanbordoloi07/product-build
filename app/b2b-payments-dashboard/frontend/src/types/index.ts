export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'processing'
export type TransactionCategory =
  | 'SaaS & Software'
  | 'Travel & Lodging'
  | 'Office & Facilities'
  | 'Marketing'
  | 'Professional Services'
  | 'Cloud Infrastructure'
  | 'HR & Benefits'
  | 'Equipment'
  | 'Food & Entertainment'

export type Department =
  | 'Engineering'
  | 'Marketing'
  | 'Sales'
  | 'HR'
  | 'Finance'
  | 'Operations'
  | 'Executive'

export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low'
export type AnomalyStatus = 'pending' | 'investigating' | 'approved' | 'dismissed'
export type AnomalyType =
  | 'Duplicate Payment'
  | 'Amount Spike'
  | 'Off-Hours Transaction'
  | 'New Vendor'
  | 'Policy Violation'
  | 'Unusual Frequency'
  | 'Blocked Merchant Category'

export interface Transaction {
  id: string
  date: string
  vendor: string
  amount: number
  category: TransactionCategory
  status: TransactionStatus
  department: Department
  paymentMethod: string
  description: string
}

export interface BudgetItem {
  department: Department
  budgeted: number
  actual: number
  remaining: number
  percentUsed: number
  status: 'on-track' | 'warning' | 'over-budget'
}

export interface Anomaly {
  id: string
  date: string
  vendor: string
  amount: number
  type: AnomalyType
  severity: AnomalySeverity
  status: AnomalyStatus
  department: Department
  description: string
  transactionId: string
}

export interface SavedReport {
  id: string
  name: string
  type: string
  lastRun: string
  schedule: string
  owner: string
  format: string
}

export interface SpendTrendPoint {
  month: string
  spend: number
  budget: number
}

export interface CategorySpend {
  name: string
  value: number
  color: string
}

export interface Integration {
  id: string
  name: string
  category: string
  connected: boolean
  lastSync?: string
  logo: string
}
