import { useState, useMemo } from 'react'
import { ShieldAlert, CheckCircle, XCircle, Clock, Filter } from 'lucide-react'
import Header from '../components/layout/Header'
import StatusBadge from '../components/ui/StatusBadge'
import { anomalies as initialAnomalies } from '../data/mockData'
import { formatCurrency, formatDate, classNames } from '../utils/format'
import type { Anomaly, AnomalySeverity, AnomalyStatus } from '../types'

const ALL = 'All'

const severityOrder: Record<AnomalySeverity, number> = {
  critical: 0, high: 1, medium: 2, low: 3,
}

const severityDot: Record<AnomalySeverity, string> = {
  critical: 'bg-rose-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-400',
}

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState(initialAnomalies)
  const [filterStatus, setFilterStatus] = useState<string>(ALL)
  const [filterSeverity, setFilterSeverity] = useState<string>(ALL)

  const filtered = useMemo(() => {
    return anomalies
      .filter((a) => {
        const matchesStatus = filterStatus === ALL || a.status === filterStatus
        const matchesSeverity = filterSeverity === ALL || a.severity === filterSeverity
        return matchesStatus && matchesSeverity
      })
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  }, [anomalies, filterStatus, filterSeverity])

  const counts = useMemo(() => ({
    pending: anomalies.filter((a) => a.status === 'pending' || a.status === 'investigating').length,
    approved: anomalies.filter((a) => a.status === 'approved').length,
    dismissed: anomalies.filter((a) => a.status === 'dismissed').length,
    critical: anomalies.filter((a) => a.severity === 'critical').length,
  }), [anomalies])

  function updateStatus(id: string, status: AnomalyStatus) {
    setAnomalies((prev) => prev.map((a) => a.id === id ? { ...a, status } : a))
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Anomaly Detection"
        subtitle={`${counts.pending} pending review · ${counts.critical} critical`}
      />

      <div className="flex-1 p-6 space-y-5 overflow-y-auto">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pending Review', value: counts.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Critical Alerts', value: counts.critical, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50' },
            { label: 'Approved', value: counts.approved, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Dismissed', value: counts.dismissed, icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
              <div className={classNames('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', bg)}>
                <Icon className={classNames('w-5 h-5', color)} />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-500">Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value={ALL}>All Statuses</option>
            <option value="pending">Pending</option>
            <option value="investigating">Investigating</option>
            <option value="approved">Approved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value={ALL}>All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <span className="ml-auto text-xs text-gray-400">{filtered.length} of {anomalies.length} alerts</span>
        </div>

        {/* Anomaly Cards */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm shadow-sm">
              No alerts match your filters.
            </div>
          )}
          {filtered.map((anomaly: Anomaly) => (
            <div
              key={anomaly.id}
              className={classNames(
                'bg-white rounded-xl border shadow-sm overflow-hidden transition-all',
                (anomaly.status === 'pending' || anomaly.status === 'investigating') && anomaly.severity === 'critical'
                  ? 'border-rose-200'
                  : (anomaly.status === 'pending' || anomaly.status === 'investigating') && anomaly.severity === 'high'
                  ? 'border-orange-200'
                  : 'border-gray-200',
              )}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className={classNames('w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0', severityDot[anomaly.severity])} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{anomaly.vendor}</span>
                        <span className="text-xs text-gray-400">{anomaly.id}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-400">{anomaly.transactionId}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(anomaly.amount)}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                          {anomaly.type}
                        </span>
                        <span className="text-xs text-gray-400">{anomaly.department}</span>
                        <span className="text-xs text-gray-400">{formatDate(anomaly.date)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{anomaly.description}</p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={anomaly.severity} size="sm" />
                      <StatusBadge status={anomaly.status} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {(anomaly.status === 'pending' || anomaly.status === 'investigating') && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => updateStatus(anomaly.id, 'approved')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    {anomaly.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(anomaly.id, 'investigating')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Investigate
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(anomaly.id, 'dismissed')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Dismiss
                    </button>
                    <span className="ml-auto text-xs text-gray-400">Requires review by Finance</span>
                  </div>
                )}

                {(anomaly.status === 'approved' || anomaly.status === 'dismissed') && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => updateStatus(anomaly.id, 'pending')}
                      className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                    >
                      Reopen
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
