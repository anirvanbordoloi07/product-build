import { classNames } from '../../utils/format'

type TrafficStatus = 'on-track' | 'warning' | 'over-budget'

interface TrafficLightProps {
  status: TrafficStatus
  size?: 'sm' | 'md'
}

const colorMap: Record<TrafficStatus, string> = {
  'on-track': 'bg-emerald-500',
  warning: 'bg-amber-400',
  'over-budget': 'bg-rose-500',
}

export default function TrafficLight({ status, size = 'md' }: TrafficLightProps) {
  return (
    <span
      className={classNames(
        'inline-block rounded-full',
        colorMap[status],
        size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5',
      )}
    />
  )
}
