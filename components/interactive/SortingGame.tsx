'use client'

import { isValidElement, useMemo, useState } from 'react'

// Tap-to-classify practice: tap an item, then tap the bucket it belongs to. Immediate feedback with
// an explanation, a running score, and a review of mistakes. Content comes from a ```sort fence:
//   @buckets Economics | Political Science | Sociology
//   Why do prices rise after a subsidy is removed? => Economics :: explanation shown after answering

function collect(node: React.ReactNode, out: string[]) {
  if (Array.isArray(node)) return node.forEach(n => collect(n, out))
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (props.className === 'language-sort' && typeof props.children === 'string') {
    out.push(props.children)
    return
  }
  collect(props.children, out)
}

interface Item {
  id: number
  text: string
  bucket: string
  why: string
}

function shuffle<T>(a: T[], seed: number) {
  const r = [...a]
  let s = seed
  for (let i = r.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

export default function SortingGame({ title, children }: { title?: string; children?: React.ReactNode }) {
  const spec = useMemo(() => {
    const out: string[] = []
    collect(children, out)
    let buckets: string[] = []
    const items: Item[] = []
    out
      .join('\n')
      .replace(/\r/g, '')
      .split('\n')
      .forEach(line => {
        const t = line.trim()
        if (!t) return
        const b = /^@buckets\s+(.*)$/.exec(t)
        if (b) {
          buckets = b[1].split('|').map(x => x.trim()).filter(Boolean)
          return
        }
        const m = /^(.*?)\s*=>\s*(.*?)(?:\s*::\s*(.*))?$/.exec(t)
        if (m) items.push({ id: items.length, text: m[1], bucket: m[2], why: m[3] ?? '' })
      })
    return { buckets, items }
  }, [children])

  const [seed, setSeed] = useState(7)
  const order = useMemo(() => shuffle(spec.items, seed), [spec.items, seed])
  const [placed, setPlaced] = useState<Record<number, string>>({})
  const [picked, setPicked] = useState<number | null>(null)
  const [last, setLast] = useState<{ item: Item; chosen: string } | null>(null)

  const remaining = order.filter(i => !(i.id in placed))
  const correct = spec.items.filter(i => placed[i.id] === i.bucket).length
  const done = remaining.length === 0

  const place = (bucket: string) => {
    const id = picked ?? remaining[0]?.id
    if (id === undefined) return
    const item = spec.items[id]
    setPlaced(p => ({ ...p, [id]: bucket }))
    setLast({ item, chosen: bucket })
    setPicked(null)
  }

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🧩 {title ?? 'Sort them'}</p>
        <span className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky">
          {correct} / {Object.keys(placed).length} correct · {remaining.length} left
        </span>
      </div>

      <div className="p-3 space-y-3">
        {!done ? (
          <>
            <p className="text-[12px] text-brand-navy/70 dark:text-white/70">Tap the bucket where this belongs{remaining.length > 1 ? ' (or tap another card first to choose it)' : ''}:</p>
            <div className="flex flex-wrap gap-1.5">
              {remaining.slice(0, 6).map((it, k) => {
                const active = picked === it.id || (picked === null && k === 0)
                return (
                  <button
                    key={it.id}
                    onClick={() => setPicked(it.id)}
                    className={`text-left text-[13px] px-3 py-2 rounded-xl border transition ${active ? 'border-brand-deep bg-brand-sky/15 dark:border-brand-sky font-semibold shadow-sm' : 'border-brand-navy/15 dark:border-white/20 opacity-70'}`}
                  >
                    {it.text}
                  </button>
                )
              })}
              {remaining.length > 6 && <span className="self-center text-[11px] text-brand-navy/60 dark:text-white/60">+{remaining.length - 6} more</span>}
            </div>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${spec.buckets.length > 3 ? 120 : 150}px, 1fr))` }}>
              {spec.buckets.map(b => (
                <button key={b} onClick={() => place(b)} className="px-2 py-2.5 rounded-xl border-2 border-dashed border-brand-deep/40 dark:border-brand-sky/40 text-[12.5px] font-semibold hover:bg-brand-sky/10">
                  {b}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 text-[13px]">
            Finished — {correct} of {spec.items.length} correct.{' '}
            <button
              onClick={() => {
                setPlaced({})
                setLast(null)
                setSeed(s => s + 1)
              }}
              className="underline font-semibold"
            >
              Shuffle and try again
            </button>
          </div>
        )}

        {last && (
          <div className={`px-3 py-2 rounded-xl text-[12.5px] border ${last.chosen === last.item.bucket ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100 dark:border-emerald-700' : 'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-900/20 dark:text-rose-100 dark:border-rose-700'}`}>
            <b>{last.chosen === last.item.bucket ? '✓ Correct' : `✗ Not ${last.chosen}`}</b> — “{last.item.text}” belongs to <b>{last.item.bucket}</b>.{last.item.why && <> {last.item.why}</>}
          </div>
        )}

        {Object.keys(placed).length > 0 && (
          <details className="text-[12px]">
            <summary className="cursor-pointer font-semibold">Review your answers</summary>
            <ul className="mt-1 space-y-0.5">
              {spec.items
                .filter(i => i.id in placed)
                .map(i => (
                  <li key={i.id}>
                    {placed[i.id] === i.bucket ? '✓' : '✗'} {i.text} → <b>{i.bucket}</b>
                    {placed[i.id] !== i.bucket && <span className="text-rose-700 dark:text-rose-300"> (you said {placed[i.id]})</span>}
                  </li>
                ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  )
}
