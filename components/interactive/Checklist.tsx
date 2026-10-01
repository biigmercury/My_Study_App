'use client'

import { isValidElement, useEffect, useMemo, useState } from 'react'

// Tickable checklist from a ```check fence (one item per line; "# Heading" lines start a group).
// Ticks are remembered in this browser (localStorage), so students can come back to it.

function collect(node: React.ReactNode, out: string[]) {
  if (Array.isArray(node)) return node.forEach(n => collect(n, out))
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (props.className === 'language-check' && typeof props.children === 'string') {
    out.push(props.children)
    return
  }
  collect(props.children, out)
}

type Row = { heading?: string; item?: string; id: number }

export default function Checklist({ title, children }: { title?: string; children?: React.ReactNode }) {
  const rows = useMemo(() => {
    const out: string[] = []
    collect(children, out)
    const rs: Row[] = []
    for (const l of out.join('\n').replace(/\r/g, '').split('\n')) {
      const t = l.trim().replace(/^[-*☐□]\s*/, '')
      if (!t) continue
      if (t.startsWith('#')) rs.push({ heading: t.replace(/^#+\s*/, ''), id: rs.length })
      else rs.push({ item: t, id: rs.length })
    }
    return rs
  }, [children])
  const items = rows.filter(r => r.item)
  const key = `checklist:${title ?? items.map(i => i.item).join('|').slice(0, 80)}`

  const [done, setDone] = useState<Record<string, boolean>>({})
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key)
      if (saved) setDone(JSON.parse(saved))
    } catch {}
  }, [key])
  const toggle = (item: string) =>
    setDone(d => {
      const next = { ...d, [item]: !d[item] }
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {}
      return next
    })
  const count = items.filter(i => done[i.item!]).length
  const pct = items.length ? Math.round((count / items.length) * 100) : 0

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">✅ {title ?? 'Checklist'}</p>
        <span className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky">
          {count} / {items.length}
          {count > 0 && (
            <button
              onClick={() => {
                setDone({})
                try {
                  localStorage.removeItem(key)
                } catch {}
              }}
              className="ml-2 underline"
            >
              Reset
            </button>
          )}
        </span>
      </div>
      <div className="mx-4 mt-2 h-1.5 rounded-full bg-brand-navy/10 dark:bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-brand-deep dark:bg-brand-sky'}`} style={{ width: `${pct}%` }} />
      </div>
      <ul className="p-3 space-y-1">
        {rows.map(r =>
          r.heading ? (
            <li key={r.id} className="pt-2 px-1 text-[11.5px] font-bold uppercase tracking-wide text-brand-navy/60 dark:text-white/60">
              {r.heading}
            </li>
          ) : (
            <li key={r.id}>
              <label className={`flex cursor-pointer items-start gap-2.5 rounded-xl px-2.5 py-2 text-[13.5px] transition hover:bg-brand-sky/10 ${done[r.item!] ? 'text-brand-navy/50 dark:text-white/50 line-through' : ''}`}>
                <input type="checkbox" checked={!!done[r.item!]} onChange={() => toggle(r.item!)} className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600" />
                <span>{r.item}</span>
              </label>
            </li>
          ),
        )}
      </ul>
      {pct === 100 && <p className="px-4 pb-3 -mt-1 text-[12.5px] font-semibold text-emerald-700 dark:text-emerald-300">All done — you&apos;re ready for the next stage. 🎉</p>}
    </div>
  )
}
