import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { classNames } from '../../utils/format'

interface KpiCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  footer?: React.ReactNode
}

export default function KpiCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor,
  iconBg,
  footer,
}: KpiCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
        </div>
        <div className={classNames('flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0', iconBg)}>
          <Icon className={classNames('w-5 h-5', iconColor)} />
        </div>
      </div>

      {(change !== undefined || footer) && (
        <div className="flex items-center gap-1.5">
          {change !== undefined && (
            <>
              {isPositive && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
              {isNegative && <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
              {!isPositive && !isNegative && <Minus className="w-3.5 h-3.5 text-gray-400" />}
              <span
                className={classNames(
                  'text-xs font-medium',
                  isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-gray-400',
                )}
              >
                {isPositive ? '+' : ''}{change}%
              </span>
            </>
          )}
          {changeLabel && (
            <span className="text-xs text-gray-400">{changeLabel}</span>
          )}
          {footer && !changeLabel && footer}
        </div>
      )}
    </div>
  )
}
