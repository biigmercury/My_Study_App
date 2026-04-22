interface StepBlockProps {
  step: number
  title: string
  children: React.ReactNode
}

export default function StepBlock({ step, title, children }: StepBlockProps) {
  return (
    <div className="flex gap-4 my-5">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-sm shadow">
        {step}
      </div>
      <div className="flex-1 pt-0.5">
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{title}</h4>
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
