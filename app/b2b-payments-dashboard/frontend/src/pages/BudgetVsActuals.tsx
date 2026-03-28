import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import Header from '../components/layout/Header'
import TrafficLight from '../components/ui/TrafficLight'
import StatusBadge from '../components/ui/StatusBadge'
import { budgetItems } from '../data/mockData'
import { formatCurrency, formatPercent, classNames } from '../utils/format'
import type { BudgetItem } from '../types'

function BudgetTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{value: number; name: string; color: string}>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0f1e3d] rounded-lg px-4 py-3 text-sm shadow-xl border border-white/10">
      <p className="text-white/60 text-xs mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-white/70 capitalize">{p.name}:</span>
          <span className="text-white font-semibold">{formatCurrency(p.value, true)}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="mt-1.5 pt-1.5 border-t border-white/10 text-xs text-white/50">
          Utilization: {formatPercent((payload[1].value / payload[0].value) * 100)}
        </div>
      )}
    </div>
  )
}

function ProgressBar({ item }: { item: BudgetItem }) {
  const pct = Math.min(item.percentUsed, 110)
  const barColor =
    item.status === 'on-track'
      ? 'bg-emerald-500'
      : item.status === 'warning'
      ? 'bg-amber-400'
      : 'bg-rose-500'

  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={classNames('h-full rounded-full transition-all duration-500', barColor)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: typeof CheckCircle
  label: string
  count: number
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
      <Icon className={classNames('w-8 h-8 flex-shrink-0', color)} />
      <div>
        <div className="text-xl font-bold text-gray-900">{count}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}

export default function BudgetVsActuals() {
  const chartData = budgetItems.map((b) => ({
    name: b.department,
    Budget: b.budgeted,
    Actual: b.actual,
  }))

  const totalBudget = budgetItems.reduce((s, b) => s + b.budgeted, 0)
  const totalActual = budgetItems.reduce((s, b) => s + b.actual, 0)
  const onTrack = budgetItems.filter((b) => b.status === 'on-track').length
  const warning = budgetItems.filter((b) => b.status === 'warning').length
  const over = budgetItems.filter((b) => b.status === 'over-budget').length

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Budget vs. Actuals"
        subtitle="March 2026 · All departments"
      />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Budget</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalBudget, true)}</div>
            <div className="text-xs text-gray-400 mt-0.5">Monthly allocation</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Actual</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalActual, true)}</div>
            <div className="text-xs text-gray-400 mt-0.5">{formatPercent((totalActual / totalBudget) * 100)} of budget used</div>
          </div>
          <SummaryCard icon={CheckCircle} label="On Track" count={onTrack} color="text-emerald-500" />
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 flex-shrink-0 text-amber-400" />
            <div>
              <div className="text-xl font-bold text-gray-900">{warning}</div>
              <div className="text-xs text-gray-500">Warning</div>
            </div>
            <XCircle className="w-7 h-7 flex-shrink-0 text-rose-500 ml-2" />
            <div>
              <div className="text-xl font-bold text-gray-900">{over}</div>
              <div className="text-xs text-gray-500">Over Budget</div>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Budget vs. Actual by Department</h2>
            <p className="text-xs text-gray-500 mt-0.5">March 2026</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<BudgetTooltip />} />
              <Legend
                iconType="square"
                iconSize={10}
                formatter={(value) => <span className="text-xs text-gray-500">{value}</span>}
              />
              <Bar dataKey="Budget" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Detail Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Department Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Budget</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actual</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Remaining</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Progress</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {budgetItems.map((item) => (
                  <tr key={item.department} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <TrafficLight status={item.status} />
                        <span className="font-medium text-gray-900">{item.department}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-gray-600">{formatCurrency(item.budgeted)}</td>
                    <td className="px-5 py-4 text-right font-medium text-gray-900">{formatCurrency(item.actual)}</td>
                    <td className={classNames(
                      'px-5 py-4 text-right font-semibold',
                      item.remaining < 0 ? 'text-rose-600' : item.remaining < item.budgeted * 0.1 ? 'text-amber-600' : 'text-emerald-600',
                    )}>
                      {item.remaining < 0 ? '-' : ''}{formatCurrency(Math.abs(item.remaining))}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <ProgressBar item={item} />
                        </div>
                        <span className="text-xs text-gray-500 w-10 text-right">{item.percentUsed}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={item.status} size="sm" />
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
