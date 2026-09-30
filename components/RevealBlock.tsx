interface RevealBlockProps {
  question: string
  children: React.ReactNode
}

// Tap-to-reveal practice question. Uses <details> so it works without JavaScript.
export default function RevealBlock({ question, children }: RevealBlockProps) {
  return (
    <details className="group my-3 rounded-xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 [&_summary::-webkit-details-marker]:hidden">
      <summary className="not-prose cursor-pointer list-none px-4 py-3 flex items-start gap-2.5">
        <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-brand-gradient text-white text-[11px] font-bold flex items-center justify-center">
          ?
        </span>
        <span className="flex-1 text-[13.5px] font-semibold text-brand-navy dark:text-white leading-snug">{question}</span>
        <span className="flex-shrink-0 text-[11px] font-semibold text-brand-royal group-open:hidden">Show</span>
        <span className="flex-shrink-0 text-[11px] font-semibold text-brand-royal hidden group-open:inline">Hide</span>
      </summary>
      <div className="px-4 pb-1 border-t border-brand-navy/[0.06] dark:border-brand-cyan/10 [&>*:first-child]:mt-3 [&>*:last-child]:mb-3">
        {children}
      </div>
    </details>
  )
}
