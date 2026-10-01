'use client'

import { isValidElement, useEffect, useMemo, useState } from 'react'

// Deadline timeline from a ```timeline fence, one activity per line:
//   2026-03-12 .. 2026-04-24 | Portal Registration | Complete your registration and profile.
//   2026-10-08 | Training Orientation | Attend the briefing.
// After mounting it compares every window with today's date and marks it closed, open (days left)
// or upcoming (days until it opens), with the next deadline summarised at the top.

function collect(node: React.ReactNode, out: string[]) {
  if (Array.isArray(node)) return node.forEach(n => collect(n, out))
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (props.className === 'language-timeline' && typeof props.children === 'string') {
    out.push(props.children)
    return
  }
  collect(props.children, out)
}

type Ev = { start: Date; end: Date; title: string; what: string }
const DAY = 86400000
const parse = (s: string) => {
  const [y, m, d] = s.trim().split('-').map(Number)
  return new Date(y, m - 1, d)
}
const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const days = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY)

export default function Timeline({ title, children }: { title?: string; children?: React.ReactNode }) {
  const events = useMemo(() => {
    const out: string[] = []
    collect(children, out)
    const evs: Ev[] = []
    for (const l of out.join('\n').replace(/\r/g, '').split('\n')) {
      const t = l.trim()
      if (!t) continue
      const [when, name = '', what = ''] = t.split('|').map(s => s.trim())
      const [a, b] = when.split('..').map(s => s.trim())
      evs.push({ start: parse(a), end: parse(b ?? a), title: name, what })
    }
    return evs.sort((x, y) => x.start.getTime() - y.start.getTime())
  }, [children])

  const [today, setToday] = useState<Date | null>(null)
  useEffect(() => {
    const n = new Date()
    setToday(new Date(n.getFullYear(), n.getMonth(), n.getDate()))
  }, [])

  const status = (e: Ev) => {
    if (!today) return null
    if (days(today, e.end) < 0) return { kind: 'closed' as const, text: 'Closed' }
    if (days(e.start, today) >= 0) {
      const left = days(today, e.end)
      return { kind: 'open' as const, text: left === 0 ? 'Open — last day today!' : `Open now — ${left} day${left > 1 ? 's' : ''} left` }
    }
    const until = days(today, e.start)
    return { kind: 'soon' as const, text: `Opens in ${until} day${until > 1 ? 's' : ''}` }
  }

  const open = today ? events.filter(e => status(e)?.kind === 'open') : []
  const next = today ? events.find(e => status(e)?.kind === 'soon') : undefined

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <p className="px-4 pt-3 text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🗓️ {title ?? 'Timeline'}</p>
      {today && (
        <div className="mx-3 mt-2 rounded-xl bg-brand-sky/10 px-3 py-2 text-[12.5px]">
          <b>Today: {fmt(today)}.</b>{' '}
          {open.length ? (
            <>
              Open now: {open.map((e, i) => (
                <span key={e.title}>
                  {i > 0 && ', '}
                  <b>{e.title}</b> (closes {fmt(e.end)})
                </span>
              ))}
              .{' '}
            </>
          ) : null}
          {next ? (
            <>
              Next to open: <b>{next.title}</b> on {fmt(next.start)}.
            </>
          ) : !open.length ? (
            'Every window on this schedule has closed — check your dashboard for the new session’s dates.'
          ) : null}
        </div>
      )}
      <ol className="relative m-3 ml-5 border-l-2 border-brand-navy/10 dark:border-white/15 space-y-3 py-1">
        {events.map(e => {
          const s = status(e)
          const dot = s?.kind === 'open' ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : s?.kind === 'closed' ? 'bg-brand-navy/25 dark:bg-white/25' : 'bg-brand-deep dark:bg-brand-sky'
          const chip =
            s?.kind === 'open'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
              : s?.kind === 'closed'
                ? 'bg-brand-navy/5 text-brand-navy/60 dark:bg-white/10 dark:text-white/60'
                : 'bg-brand-sky/15 text-brand-deep dark:text-brand-sky'
          const same = e.start.getTime() === e.end.getTime()
          return (
            <li key={e.title + e.start.getTime()} className="relative pl-4">
              <span className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ${dot}`} />
              <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${s?.kind === 'closed' ? 'opacity-70' : ''}`}>
                <span className="text-[13.5px] font-bold">{e.title}</span>
                {s && <span className={`rounded-full px-2 py-px text-[10.5px] font-semibold ${chip}`}>{s.text}</span>}
              </div>
              <p className="text-[12px] font-semibold text-brand-deep dark:text-brand-sky">{same ? fmt(e.start) : `${fmt(e.start)} – ${fmt(e.end)}`}</p>
              {e.what && <p className="text-[12.5px] text-brand-navy/75 dark:text-white/75">{e.what}</p>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
