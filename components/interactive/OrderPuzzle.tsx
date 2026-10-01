'use client'

import { isValidElement, useMemo, useState } from 'react'

// Put-them-in-order practice from an ```order fence: one step per line, written in the CORRECT
// order, with an optional note after "::" shown when the answer is checked:
//   Writer's address :: top right
//   Date :: under the address
// The component shuffles the steps; learners tap them in sequence, then check.

function collect(node: React.ReactNode, out: string[]) {
  if (Array.isArray(node)) return node.forEach(n => collect(n, out))
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (props.className === 'language-order' && typeof props.children === 'string') {
    out.push(props.children)
    return
  }
  collect(props.children, out)
}

type Step = { id: number; text: string; note: string }

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

export default function OrderPuzzle({ title, children }: { title?: string; children?: React.ReactNode }) {
  const steps = useMemo(() => {
    const out: string[] = []
    collect(children, out)
    return out
      .join('\n')
      .replace(/\r/g, '')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map((l, id): Step => {
        const [text, note = ''] = l.split('::').map(s => s.trim())
        return { id, text, note }
      })
  }, [children])

  const [seed, setSeed] = useState(11)
  const pool = useMemo(() => {
    const s = shuffle(steps, seed)
    // Never start already solved.
    return s.length > 1 && s.every((x, i) => x.id === i) ? [...s.slice(1), s[0]] : s
  }, [steps, seed])
  const [chosen, setChosen] = useState<number[]>([])
  const [checked, setChecked] = useState(false)

  const left = pool.filter(s => !chosen.includes(s.id))
  const right = chosen.filter((id, i) => id === i).length
  const reset = (reshuffle: boolean) => {
    setChosen([])
    setChecked(false)
    if (reshuffle) setSeed(s => s + 1)
  }

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🔢 {title ?? 'Put them in order'}</p>
        <button onClick={() => reset(true)} className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky underline">
          Shuffle
        </button>
      </div>
      <div className="p-3 space-y-3">
        <p className="text-[12px] text-brand-navy/65 dark:text-white/65">
          {checked ? `${right} of ${steps.length} in the right place.` : 'Tap the items in the correct order. Tap a numbered item to send it back.'}
        </p>

        <ol className="space-y-1.5">
          {chosen.map((id, i) => {
            const s = steps[id]
            const ok = id === i
            return (
              <li key={id}>
                <button
                  disabled={checked}
                  onClick={() => setChosen(c => c.filter(x => x !== id))}
                  className={`flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left text-[13px] ${
                    !checked
                      ? 'border-brand-deep/40 bg-brand-sky/10 dark:border-brand-sky/40'
                      : ok
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-100'
                        : 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-100'
                  }`}
                >
                  <span className="mt-px inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-deep text-[11px] font-bold text-white dark:bg-brand-sky dark:text-brand-navy">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="font-semibold">{s.text}</span>
                    {checked && !ok && <span className="block text-[11.5px]">✗ This belongs in position {id + 1}.</span>}
                    {checked && s.note && <span className="block text-[11.5px] opacity-80">{s.note}</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        {left.length > 0 && (
          <div className="flex flex-wrap gap-1.5 rounded-xl border-2 border-dashed border-brand-navy/15 dark:border-white/20 p-2">
            {left.map(s => (
              <button key={s.id} onClick={() => setChosen(c => [...c, s.id])} className="rounded-xl border border-brand-navy/15 dark:border-white/20 px-3 py-1.5 text-left text-[13px] hover:bg-brand-sky/10">
                {s.text}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!checked && left.length === 0 && (
            <button onClick={() => setChecked(true)} className="rounded-xl bg-brand-deep px-3 py-1.5 text-[12.5px] font-semibold text-white dark:bg-brand-sky dark:text-brand-navy">
              Check my order
            </button>
          )}
          {checked && right < steps.length && (
            <button
              onClick={() => {
                setChosen(steps.map(s => s.id))
              }}
              className="rounded-xl border border-brand-deep px-3 py-1.5 text-[12.5px] font-semibold text-brand-deep dark:border-brand-sky dark:text-brand-sky"
            >
              Show correct order
            </button>
          )}
          {checked && (
            <button onClick={() => reset(true)} className="rounded-xl border border-brand-navy/20 px-3 py-1.5 text-[12.5px] font-semibold dark:border-white/25">
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
