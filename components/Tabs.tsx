'use client'

import { Children, isValidElement, useState } from 'react'

interface TabProps {
  label: string
  children: React.ReactNode
}

// Marker component: Tabs reads its `label` prop and renders its children when selected.
export function Tab({ children }: TabProps) {
  return <>{children}</>
}

export default function Tabs({ children }: { children: React.ReactNode }) {
  const tabs = Children.toArray(children).filter(isValidElement) as React.ReactElement<TabProps>[]
  const [active, setActive] = useState(0)
  if (tabs.length === 0) return null

  return (
    <div className="my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden">
      <div className="not-prose flex gap-1 overflow-x-auto p-1.5 bg-brand-soft dark:bg-brand-bg/60 border-b border-brand-navy/[0.06] dark:border-brand-cyan/10">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
              i === active
                ? 'bg-white dark:bg-brand-surface text-brand-deep dark:text-brand-sky shadow-sm'
                : 'text-brand-navy/55 dark:text-white/50'
            }`}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      {/* Keyed by tab so each panel mounts fresh — otherwise React reuses a stateful component
          (TruthTable, RelationGraph…) across tabs and it keeps the previous tab's state. */}
      <div key={active} className="px-4 py-1 [&>*:first-child]:mt-3 [&>*:last-child]:mb-3">
        {tabs[active].props.children}
      </div>
    </div>
  )
}
