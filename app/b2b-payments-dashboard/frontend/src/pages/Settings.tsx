import { useState } from 'react'
import { User, Bell, Link2, Shield, ChevronRight, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import Header from '../components/layout/Header'
import { integrations } from '../data/mockData'
import { classNames } from '../utils/format'

type Tab = 'profile' | 'integrations' | 'notifications' | 'security'

const tabs: Array<{ id: Tab; label: string; icon: typeof User }> = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
]

const categoryColors: Record<string, string> = {
  ERP: 'bg-violet-50 text-violet-700',
  CRM: 'bg-blue-50 text-blue-700',
  Payments: 'bg-emerald-50 text-emerald-700',
  HR: 'bg-pink-50 text-pink-700',
  Accounting: 'bg-amber-50 text-amber-700',
  'Expense Management': 'bg-indigo-50 text-indigo-700',
  Notifications: 'bg-cyan-50 text-cyan-700',
  Productivity: 'bg-teal-50 text-teal-700',
}

function ProfileTab() {
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
            SC
          </div>
          <div>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Change photo</button>
            <p className="text-xs text-gray-400 mt-0.5">JPG, GIF or PNG. Max 2MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'First Name', value: 'Sarah', placeholder: 'First name' },
            { label: 'Last Name', value: 'Chen', placeholder: 'Last name' },
          ].map(({ label, value, placeholder }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                defaultValue={value}
                placeholder={placeholder}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          ))}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              defaultValue="sarah.chen@acmecorp.com"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              defaultValue="Chief Financial Officer"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
            <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
              <option>Finance</option>
              <option>Engineering</option>
              <option>Executive</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100">
          <button
            onClick={handleSave}
            className={classNames(
              'px-5 py-2 rounded-lg text-sm font-medium transition-colors',
              saved
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 text-white hover:bg-indigo-700',
            )}
          >
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
          <button className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Role & Permissions</h3>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Shield className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">Admin — Full Access</div>
            <div className="text-xs text-gray-500">View, edit, export all financial data · Manage users and integrations</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function IntegrationsTab() {
  const [connected, setConnected] = useState<Record<string, boolean>>(
    Object.fromEntries(integrations.map((i) => [i.id, i.connected]))
  )
  const [syncing, setSyncing] = useState<string | null>(null)

  function toggle(id: string) {
    setConnected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function sync(id: string) {
    setSyncing(id)
    setTimeout(() => setSyncing(null), 1500)
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-start gap-2">
        <span className="text-amber-500 mt-0.5">ℹ</span>
        <span>Connecting a new integration requires admin approval. Changes take effect within 2 minutes of toggling.</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Connected Systems</h3>
          <p className="text-xs text-gray-500 mt-0.5">Manage your ERP, payment, and productivity integrations</p>
        </div>
        <div className="divide-y divide-gray-50">
          {integrations.map((integration) => {
            const isConnected = connected[integration.id]
            const isSyncing = syncing === integration.id
            return (
              <div key={integration.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                {/* Logo */}
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                  {integration.logo}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{integration.name}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryColors[integration.category] ?? 'bg-gray-50 text-gray-600'}`}>
                      {integration.category}
                    </span>
                  </div>
                  {isConnected && integration.lastSync ? (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      Last sync: {integration.lastSync}
                    </p>
                  ) : !isConnected ? (
                    <p className="text-xs text-gray-400 mt-0.5">Not connected</p>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isConnected && (
                    <button
                      onClick={() => sync(integration.id)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                      title="Sync now"
                    >
                      <RefreshCw className={classNames('w-4 h-4', isSyncing ? 'animate-spin text-indigo-500' : '')} />
                    </button>
                  )}
                  {isConnected ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-300" />
                  )}
                  <button
                    onClick={() => toggle(integration.id)}
                    className={classNames(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                      isConnected ? 'bg-emerald-500' : 'bg-gray-200',
                    )}
                  >
                    <span
                      className={classNames(
                        'inline-block w-3.5 h-3.5 transform rounded-full bg-white shadow-sm transition-transform',
                        isConnected ? 'translate-x-4' : 'translate-x-1',
                      )}
                    />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    anomalyAlerts: true,
    budgetWarnings: true,
    budgetOverrun: true,
    weeklySummary: true,
    monthlySummary: false,
    erpSyncFailure: true,
    newVendor: false,
    largeTransaction: true,
    largeThreshold: '50000',
    emailDigest: true,
    slackAlerts: true,
    teamsAlerts: false,
  })

  function toggle(key: keyof typeof prefs) {
    if (typeof prefs[key] === 'boolean') {
      setPrefs((p) => ({ ...p, [key]: !p[key] }))
    }
  }

  function Toggle({ field }: { field: keyof typeof prefs }) {
    const val = prefs[field] as boolean
    return (
      <button
        onClick={() => toggle(field)}
        className={classNames(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0',
          val ? 'bg-indigo-600' : 'bg-gray-200',
        )}
      >
        <span
          className={classNames(
            'inline-block w-3.5 h-3.5 transform rounded-full bg-white shadow-sm transition-transform',
            val ? 'translate-x-4' : 'translate-x-1',
          )}
        />
      </button>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {[
        {
          title: 'Alert Triggers',
          items: [
            { key: 'anomalyAlerts' as const, label: 'Anomaly & fraud alerts', desc: 'Get notified when suspicious activity is detected' },
            { key: 'budgetWarnings' as const, label: 'Budget warning (80% threshold)', desc: 'Alert when department spend reaches 80% of budget' },
            { key: 'budgetOverrun' as const, label: 'Budget overrun alerts', desc: 'Immediate alert when any department exceeds budget' },
            { key: 'newVendor' as const, label: 'New vendor payments', desc: 'Alert on first-time payments to a new vendor' },
            { key: 'largeTransaction' as const, label: 'Large transaction threshold', desc: `Alert on transactions above $${Number(prefs.largeThreshold).toLocaleString()}` },
          ],
        },
        {
          title: 'Digest Reports',
          items: [
            { key: 'weeklySummary' as const, label: 'Weekly spend summary', desc: 'Sent every Monday at 8:00 AM' },
            { key: 'monthlySummary' as const, label: 'Monthly close report', desc: 'Sent on the 1st of each month' },
            { key: 'erpSyncFailure' as const, label: 'ERP sync failure alerts', desc: 'Immediate notification on sync errors' },
          ],
        },
        {
          title: 'Delivery Channels',
          items: [
            { key: 'emailDigest' as const, label: 'Email (sarah.chen@acmecorp.com)', desc: 'Receive all alerts via email' },
            { key: 'slackAlerts' as const, label: 'Slack (#finance-alerts)', desc: 'Post alerts to Slack channel' },
            { key: 'teamsAlerts' as const, label: 'Microsoft Teams', desc: 'Post alerts to Teams (not connected)' },
          ],
        },
      ].map((section) => (
        <div key={section.title} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{section.title}</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {section.items.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50">
                <div className="min-w-0 flex-1 mr-4">
                  <div className="text-sm font-medium text-gray-900">{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                </div>
                <Toggle field={key} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Authentication</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900">Password</div>
              <div className="text-xs text-gray-500 mt-0.5">Last changed 45 days ago</div>
            </div>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">Change Password</button>
          </div>
          <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100">
            <div>
              <div className="text-sm font-medium text-gray-900">Two-Factor Authentication</div>
              <div className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Enabled via Authenticator App
              </div>
            </div>
            <button className="text-sm text-gray-500 font-medium hover:text-gray-700">Manage</button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900">Single Sign-On (SSO)</div>
              <div className="text-xs text-gray-500 mt-0.5">Okta SAML 2.0</div>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded bg-emerald-100 text-emerald-700">Active</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Active Sessions</h3>
        <div className="space-y-3">
          {[
            { device: 'MacBook Pro 16"', location: 'San Francisco, CA', time: 'Now — Current session', current: true },
            { device: 'iPhone 16 Pro', location: 'San Francisco, CA', time: '2 hours ago', current: false },
            { device: 'Chrome — Windows 11', location: 'New York, NY', time: '1 day ago', current: false },
          ].map(({ device, location, time, current }) => (
            <div key={device} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">{device}</div>
                <div className="text-xs text-gray-400 mt-0.5">{location} · {time}</div>
              </div>
              {current ? (
                <span className="text-xs text-emerald-600 font-medium">This device</span>
              ) : (
                <button className="text-xs text-rose-500 font-medium hover:text-rose-700">Revoke</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Role-Based Access Control</h3>
        <p className="text-xs text-gray-500 mb-4">Manage team member roles and permissions</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-xs font-semibold text-gray-500">Member</th>
                <th className="text-left py-2 text-xs font-semibold text-gray-500">Role</th>
                <th className="text-left py-2 text-xs font-semibold text-gray-500">Department</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { name: 'Sarah Chen', role: 'Admin', dept: 'Finance' },
                { name: 'Marcus Reid', role: 'Manager', dept: 'Engineering' },
                { name: 'James Okafor', role: 'Analyst', dept: 'Finance' },
                { name: 'Priya Nair', role: 'Viewer', dept: 'Operations' },
              ].map(({ name, role, dept }) => (
                <tr key={name}>
                  <td className="py-2.5 font-medium text-gray-900">{name}</td>
                  <td className="py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      role === 'Admin' ? 'bg-indigo-50 text-indigo-700' :
                      role === 'Manager' ? 'bg-blue-50 text-blue-700' :
                      role === 'Analyst' ? 'bg-amber-50 text-amber-700' :
                      'bg-gray-50 text-gray-600'
                    }`}>{role}</span>
                  </td>
                  <td className="py-2.5 text-xs text-gray-500">{dept}</td>
                  <td className="py-2.5 text-right">
                    <button className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 ml-auto">
                      Edit <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" subtitle="Account, integrations & preferences" />

      <div className="flex-1 overflow-y-auto">
        {/* Tab Bar */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex gap-0">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={classNames(
                  'flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors',
                  activeTab === id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'integrations' && <IntegrationsTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  )
}
