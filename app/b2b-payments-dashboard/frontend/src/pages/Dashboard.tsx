import {
  DollarSign,
  TrendingDown,
  ArrowLeftRight,
  ShieldAlert,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import Header from '../components/layout/Header'
import KpiCard from '../components/ui/KpiCard'
import StatusBadge from '../components/ui/StatusBadge'
import {
  kpiData,
  spendTrend,
  categorySpend,
  transactions,
} from '../data/mockData'
import { formatCurrency, formatDate } from '../utils/format'
import type { TransactionStatus } from '../types'

const RADIAN = Math.PI / 180

function CustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}) {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

function SpendTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{value: number; name: string; color: string}>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0f1e3d] rounded-lg px-4 py-3 text-sm shadow-xl border border-white/10">
      <p className="text-white/60 text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-white/80 capitalize">{p.name}:</span>
          <span className="text-white font-semibold">{formatCurrency(p.value, true)}</span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{name: string; value: number; payload: {color: string}}> }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-[#0f1e3d] rounded-lg px-4 py-3 text-sm shadow-xl border border-white/10">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.payload.color }} />
        <span className="text-white/80">{item.name}</span>
      </div>
      <span className="text-white font-semibold">{formatCurrency(item.value)}</span>
    </div>
  )
}

export default function Dashboard() {
  const recent = transactions.slice(0, 8)

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard Overview"
        subtitle="March 2026 · Fiscal Q1 close"
      />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Total Spend MTD"
            value={formatCurrency(kpiData.totalSpendMTD, true)}
            change={kpiData.totalSpendMTDChange}
            changeLabel="vs last month"
            icon={DollarSign}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
          />
          <KpiCard
            title="Budget Remaining"
            value={formatCurrency(kpiData.budgetRemaining, true)}
            change={undefined}
            changeLabel={`${kpiData.budgetRemainingPercent}% of monthly budget`}
            icon={TrendingDown}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <KpiCard
            title="Transactions Today"
            value={String(kpiData.transactionsToday)}
            change={kpiData.transactionsTodayChange}
            changeLabel="vs yesterday"
            icon={ArrowLeftRight}
            iconColor="text-cyan-600"
            iconBg="bg-cyan-50"
          />
          <KpiCard
            title="Open Alerts"
            value={String(kpiData.openAlerts)}
            change={undefined}
            changeLabel={`${kpiData.criticalAlerts} critical · requires review`}
            icon={ShieldAlert}
            iconColor="text-rose-600"
            iconBg="bg-rose-50"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Spend Trend */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Spend vs. Budget Trend</h2>
                <p className="text-xs text-gray-500 mt-0.5">Oct 2025 — Mar 2026</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded bg-indigo-500 inline-block" />
                  Actual Spend
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded bg-gray-300 inline-block" style={{ borderTop: '2px dashed #9ca3af' }} />
                  Budget
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={spendTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d1d5db" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#d1d5db" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip content={<SpendTooltip />} />
                <Area
                  type="monotone"
                  dataKey="budget"
                  stroke="#d1d5db"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  fill="url(#budgetGrad)"
                  name="budget"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#spendGrad)"
                  name="spend"
                  dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#6366f1' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Spend by Category</h2>
              <p className="text-xs text-gray-500 mt-0.5">March 2026</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categorySpend}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={CustomLabel}
                >
                  {categorySpend.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {categorySpend.slice(0, 5).map((cat) => (
                <div key={cat.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-gray-600 flex-1 truncate">{cat.name}</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(cat.value, true)}</span>
                </div>
              ))}
              {categorySpend.length > 5 && (
                <p className="text-xs text-gray-400 pl-5">+{categorySpend.length - 5} more categories</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
              <p className="text-xs text-gray-500 mt-0.5">Latest payment activity</p>
            </div>
            <a href="/transactions" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              View all →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Dept</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap text-xs">{formatDate(txn.date)}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900 truncate max-w-[180px]">{txn.vendor}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[180px]">{txn.id}</div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs hidden md:table-cell">{txn.category}</td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs hidden lg:table-cell">{txn.department}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={txn.status as TransactionStatus} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
