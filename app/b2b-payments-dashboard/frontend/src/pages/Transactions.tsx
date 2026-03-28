import { useState, useMemo } from 'react'
import { Search, Filter, Download, ChevronUp, ChevronDown } from 'lucide-react'
import Header from '../components/layout/Header'
import StatusBadge from '../components/ui/StatusBadge'
import { transactions } from '../data/mockData'
import { formatCurrency, formatDate } from '../utils/format'
import type { Transaction, TransactionStatus, Department, TransactionCategory } from '../types'

type SortKey = keyof Pick<Transaction, 'date' | 'vendor' | 'amount' | 'category' | 'status' | 'department'>
type SortDir = 'asc' | 'desc'

const ALL = 'All'

export default function Transactions() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>(ALL)
  const [filterDept, setFilterDept] = useState<string>(ALL)
  const [filterCategory, setFilterCategory] = useState<string>(ALL)
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const statuses = useMemo(() => [ALL, ...Array.from(new Set(transactions.map((t) => t.status)))], [])
  const departments = useMemo(() => [ALL, ...Array.from(new Set(transactions.map((t) => t.department))).sort()], [])
  const categories = useMemo(() => [ALL, ...Array.from(new Set(transactions.map((t) => t.category))).sort()], [])

  const filtered = useMemo(() => {
    let data = transactions.filter((t) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        t.vendor.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      const matchesStatus = filterStatus === ALL || t.status === filterStatus
      const matchesDept = filterDept === ALL || t.department === filterDept
      const matchesCat = filterCategory === ALL || t.category === filterCategory
      return matchesSearch && matchesStatus && matchesDept && matchesCat
    })

    data = [...data].sort((a, b) => {
      let valA: string | number = a[sortKey]
      let valB: string | number = b[sortKey]
      if (typeof valA === 'string') valA = valA.toLowerCase()
      if (typeof valB === 'string') valB = valB.toLowerCase()
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return data
  }, [search, filterStatus, filterDept, filterCategory, sortKey, sortDir])

  const totalAmount = useMemo(() => filtered.reduce((sum, t) => sum + t.amount, 0), [filtered])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 text-gray-300 ml-1" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-indigo-500 ml-1" />
      : <ChevronDown className="w-3 h-3 text-indigo-500 ml-1" />
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Transactions"
        subtitle={`${filtered.length} transactions · ${formatCurrency(totalAmount)} total`}
      />

      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor, ID, description…"
                className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s === ALL ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d === ALL ? 'All Departments' : d}
                  </option>
                ))}
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === ALL ? 'All Categories' : c}
                  </option>
                ))}
              </select>
            </div>

            {/* Export */}
            <button className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {(
                    [
                      { key: 'date', label: 'Date' },
                      { key: 'vendor', label: 'Vendor' },
                      { key: 'amount', label: 'Amount', right: true },
                      { key: 'category', label: 'Category' },
                      { key: 'status', label: 'Status', center: true },
                      { key: 'department', label: 'Department' },
                    ] as Array<{ key: SortKey; label: string; right?: boolean; center?: boolean }>
                  ).map(({ key, label, right, center }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none whitespace-nowrap ${right ? 'text-right' : center ? 'text-center' : 'text-left'}`}
                    >
                      <span className={`inline-flex items-center ${right ? 'justify-end' : center ? 'justify-center' : 'justify-start'}`}>
                        {label}
                        <SortIcon col={key} />
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">Payment Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                      No transactions match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map((txn) => (
                  <tr key={txn.id} className="hover:bg-indigo-50/30 transition-colors cursor-default">
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap text-xs">{formatDate(txn.date)}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900">{txn.vendor}</div>
                      <div className="text-xs text-gray-400">{txn.id}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs whitespace-nowrap">{txn.category}</td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={txn.status as TransactionStatus} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">{txn.department}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{txn.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
              <span>{filtered.length} records</span>
              <span className="font-semibold text-gray-800">Total: {formatCurrency(totalAmount)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
