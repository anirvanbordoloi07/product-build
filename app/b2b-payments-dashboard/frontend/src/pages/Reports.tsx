import { useState } from 'react'
import { Plus, Play, Download, Trash2, Calendar, X, FileText, BarChart2, PieChart, Shield } from 'lucide-react'
import Header from '../components/layout/Header'
import { savedReports } from '../data/mockData'
import { formatDate } from '../utils/format'

const reportTypeIcons: Record<string, typeof FileText> = {
  'Spend Overview': BarChart2,
  'Department Drill-Down': PieChart,
  'Budget Analysis': BarChart2,
  'Vendor Analysis': FileText,
  'Risk & Compliance': Shield,
  'Software Spend': FileText,
  'Policy & Compliance': Shield,
}

const formatColors: Record<string, string> = {
  PDF: 'bg-rose-50 text-rose-600 border-rose-200',
  CSV: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Excel: 'bg-green-50 text-green-700 border-green-200',
}

interface CreateReportModalProps {
  onClose: () => void
}

function CreateReportModal({ onClose }: CreateReportModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [reportName, setReportName] = useState('')
  const [reportType, setReportType] = useState('Spend Overview')
  const [dateRange, setDateRange] = useState('last-30')
  const [departments, setDepartments] = useState<string[]>([])
  const [schedule, setSchedule] = useState('None')
  const [format, setFormat] = useState('PDF')

  const deptOptions = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Executive']

  function toggleDept(dept: string) {
    setDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Create New Report</h2>
            <p className="text-xs text-gray-500 mt-0.5">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {step === 1 && (
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Report Name</label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="e.g. Monthly Engineering Spend — Q2 2026"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
              >
                {Object.keys(reportTypeIcons).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
              >
                <option value="today">Today</option>
                <option value="last-7">Last 7 days</option>
                <option value="last-30">Last 30 days</option>
                <option value="this-month">This month</option>
                <option value="last-quarter">Last quarter</option>
                <option value="ytd">Year to date</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Departments</label>
              <div className="flex flex-wrap gap-2">
                {deptOptions.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => toggleDept(dept)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      departments.includes(dept)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
              {departments.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No selection = all departments</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Schedule</label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
              >
                <option value="None">No schedule (run manually)</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-weekly">Bi-weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Export Format</label>
              <div className="flex gap-3">
                {['PDF', 'CSV', 'Excel'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      format === f
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <h3 className="text-xs font-semibold text-indigo-800 mb-2">Report Summary</h3>
              <div className="space-y-1 text-xs text-indigo-700">
                <div><span className="font-medium">Name:</span> {reportName || '(untitled)'}</div>
                <div><span className="font-medium">Type:</span> {reportType}</div>
                <div><span className="font-medium">Date range:</span> {dateRange.replace(/-/g, ' ')}</div>
                <div><span className="font-medium">Departments:</span> {departments.length ? departments.join(', ') : 'All'}</div>
                <div><span className="font-medium">Schedule:</span> {schedule}</div>
                <div><span className="font-medium">Format:</span> {format}</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <button
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          <button
            onClick={step === 1 ? () => setStep(2) : onClose}
            disabled={step === 1 && !reportName.trim()}
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step === 1 ? 'Next →' : 'Create Report'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Reports"
        subtitle={`${savedReports.length} saved reports`}
      />

      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Saved Reports</h2>
            <p className="text-xs text-gray-500">Scheduled and on-demand analytics reports</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Report
          </button>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {savedReports.map((report) => {
            const Icon = reportTypeIcons[report.type] ?? FileText
            return (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{report.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{report.type}</p>
                      </div>
                      <span className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded border ${formatColors[report.format] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {report.format}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {report.schedule}
                      </span>
                      <span>Last run: {formatDate(report.lastRun)}</span>
                      <span>By {report.owner}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                    <Play className="w-3 h-3" />
                    Run Now
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                  <button className="ml-auto p-1.5 text-gray-300 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showModal && <CreateReportModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
