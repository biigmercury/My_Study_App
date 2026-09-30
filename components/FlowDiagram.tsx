'use client'

import { Children, isValidElement, useState } from 'react'

interface FlowStepProps {
  title: string
  children: React.ReactNode
}

// Marker component: FlowDiagram reads its `title` prop and renders its children in the detail panel.
export function FlowStep({ children }: FlowStepProps) {
  return <>{children}</>
}

interface FlowDiagramProps {
  title?: string
  cycle?: boolean
  children: React.ReactNode
}

export default function FlowDiagram({ title, cycle = false, children }: FlowDiagramProps) {
  const steps = Children.toArray(children).filter(isValidElement) as React.ReactElement<FlowStepProps>[]
  const [active, setActive] = useState(0)
  if (steps.length === 0) return null

  const current = steps[active]
  const last = steps.length - 1

  return (
    <div className="my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden">
      <div className="not-prose px-4 pt-3.5 pb-1 flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">
          🔀 {title ?? 'Interactive diagram'}
        </p>
        <p className="text-[10.5px] text-brand-navy/45 dark:text-white/40">Tap a stage</p>
      </div>

      <div className="not-prose flex items-center gap-1.5 overflow-x-auto px-4 py-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setActive(i)}
              className={`px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all text-left leading-tight max-w-[150px] ${
                i === active
                  ? 'bg-brand-gradient text-white border-transparent shadow'
                  : 'bg-brand-soft dark:bg-brand-bg/60 text-brand-navy dark:text-white/85 border-brand-navy/10 dark:border-brand-cyan/15 hover:border-brand-royal'
              }`}
            >
              <span className="opacity-70 mr-1">{i + 1}.</span>
              {step.props.title}
            </button>
            {i < last && <span className="text-brand-royal font-bold" aria-hidden>→</span>}
          </div>
        ))}
        {cycle && (
          <span className="flex-shrink-0 text-[11px] font-semibold text-brand-royal whitespace-nowrap" aria-hidden>
            ↺ repeat
          </span>
        )}
      </div>

      <div className="mx-4 mb-3 rounded-xl bg-brand-mist/50 dark:bg-brand-bg/50 px-4 py-1 text-[14px]">
        <p className="not-prose pt-3 text-[13px] font-bold text-brand-navy dark:text-white">
          {active + 1}. {current.props.title}
        </p>
        <div className="[&>*:first-child]:mt-2 [&>*:last-child]:mb-3">{current.props.children}</div>
      </div>

      <div className="not-prose flex justify-between px-4 pb-3.5">
        <button
          onClick={() => setActive(a => Math.max(0, a - 1))}
          disabled={active === 0}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-brand-deep dark:text-brand-sky disabled:opacity-30"
        >
          ← Back
        </button>
        <span className="text-[11px] text-brand-navy/45 dark:text-white/40 self-center">
          {active + 1} / {steps.length}
        </span>
        <button
          onClick={() => setActive(a => (a === last ? (cycle ? 0 : a) : a + 1))}
          disabled={active === last && !cycle}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-brand-deep dark:text-brand-sky disabled:opacity-30"
        >
          {active === last && cycle ? 'Restart ↺' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
