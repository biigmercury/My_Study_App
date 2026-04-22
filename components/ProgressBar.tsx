interface ProgressBarProps {
  completed: number
  total: number
  height?: string
  showLabel?: boolean
}

export default function ProgressBar({ completed, total, height = 'h-2', showLabel = false }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="w-full">
      <div className={`${height} bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden`}>
        <div
          className="h-full bg-brand-gradient rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {completed}/{total} topics · {pct}%
        </p>
      )}
    </div>
  )
}
