interface ProgressBarProps {
  completed: number
  total: number
  height?: string
  showLabel?: boolean
}

export default function ProgressBar({ completed, total, height = 'h-[6px]', showLabel = false }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="w-full">
      <div className={`${height} bg-brand-navy/[0.08] dark:bg-brand-cyan/[0.12] rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: '#00B4D8' }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-brand-navy/50 dark:text-white/40 mt-1">
          {completed}/{total} topics · {pct}%
        </p>
      )}
    </div>
  )
}
