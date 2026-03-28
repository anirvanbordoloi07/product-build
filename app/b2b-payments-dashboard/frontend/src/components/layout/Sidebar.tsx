import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  FileText,
  AlertTriangle,
  Settings,
  Zap,
  LogOut,
} from 'lucide-react'
import { classNames } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/budget', icon: PieChart, label: 'Budget vs Actuals' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/anomalies', icon: AlertTriangle, label: 'Anomalies', badge: 5 },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col bg-[#0f1e3d] z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-white font-semibold text-sm tracking-wide">PayLens</div>
          <div className="text-white/40 text-xs">Analytics Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="px-3 pb-2">
          <span className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">
            Main Menu
          </span>
        </div>
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                  : 'text-white/60 hover:text-white hover:bg-white/8',
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {badge !== undefined && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ERP Sync Status */}
      <div className="mx-3 mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/80 text-xs font-medium">ERP Sync Active</span>
        </div>
        <div className="text-white/40 text-[10px]">NetSuite · Last sync 6:14 AM</div>
      </div>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          SC
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-white/90 text-xs font-medium truncate">Sarah Chen</div>
          <div className="text-white/40 text-[10px]">CFO</div>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}
