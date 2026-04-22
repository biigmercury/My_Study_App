interface TakeawayBlockProps {
  children: React.ReactNode
}

export default function TakeawayBlock({ children }: TakeawayBlockProps) {
  return (
    <div className="my-8 rounded-2xl p-px bg-brand-gradient">
      <div className="rounded-2xl bg-white dark:bg-brand-slate p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">⭐</span>
          <h4 className="font-bold text-brand-royal dark:text-brand-sky text-base">Key Takeaway</h4>
        </div>
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
