import { classNames } from '../../utils/format'

type Variant = 'completed' | 'pending' | 'investigating' | 'failed' | 'processing' | 'on-track' | 'warning' | 'over-budget' | 'critical' | 'high' | 'medium' | 'low' | 'approved' | 'dismissed'

const variantStyles: Record<Variant, string> = {
  completed:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending:        'bg-amber-50 text-amber-700 border-amber-200',
  investigating:  'bg-blue-50 text-blue-700 border-blue-200',
  failed:         'bg-rose-50 text-rose-700 border-rose-200',
  processing:     'bg-blue-50 text-blue-700 border-blue-200',
  'on-track':     'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning:        'bg-amber-50 text-amber-700 border-amber-200',
  'over-budget':  'bg-rose-50 text-rose-700 border-rose-200',
  critical:       'bg-rose-50 text-rose-700 border-rose-200',
  high:           'bg-orange-50 text-orange-700 border-orange-200',
  medium:         'bg-amber-50 text-amber-700 border-amber-200',
  low:            'bg-slate-50 text-slate-600 border-slate-200',
  approved:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  dismissed:      'bg-gray-50 text-gray-500 border-gray-200',
}

const labels: Partial<Record<Variant, string>> = {
  'on-track': 'On Track',
  'over-budget': 'Over Budget',
}

interface StatusBadgeProps {
  status: Variant
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const label = labels[status] ?? status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-md border font-medium capitalize',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        variantStyles[status] ?? 'bg-gray-50 text-gray-600 border-gray-200',
      )}
    >
      {label}
    </span>
  )
}
