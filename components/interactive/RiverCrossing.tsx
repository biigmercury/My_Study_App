'use client'

import { useMemo, useState } from 'react'

// River-crossing puzzle: ferry every item across; the boat holds the ferryman plus one item.
//   <RiverCrossing title="…" items="lion, goat, yam" eats="lion>goat, goat>yam" />
// "a>b" means a eats b when the two are left on a bank without the ferryman.

const ICONS: Record<string, string> = {
  lion: '🦁',
  goat: '🐐',
  yam: '🍠',
  wolf: '🐺',
  cabbage: '🥬',
  fox: '🦊',
  chicken: '🐔',
  corn: '🌽',
  leopard: '🐆',
}

type Side = 0 | 1 // 0 = start bank, 1 = far bank

export default function RiverCrossing({ title, items = 'lion, goat, yam', eats = 'lion>goat, goat>yam' }: { title?: string; items?: string; eats?: string }) {
  const names = useMemo(
    () =>
      items
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    [items],
  )
  const rules = useMemo(
    () =>
      eats
        .split(',')
        .map(s => s.split('>').map(t => t.trim()))
        .filter(([a, b]) => names.includes(a) && names.includes(b)) as [string, string][],
    [eats, names],
  )
  const start = { man: 0 as Side, at: Object.fromEntries(names.map(n => [n, 0 as Side])) as Record<string, Side> }
  const [state, setState] = useState(start)
  const [log, setLog] = useState<string[]>([])
  const [disaster, setDisaster] = useState<string | null>(null)

  const icon = (n: string) => ICONS[n.toLowerCase()] ?? '📦'
  const won = names.every(n => state.at[n] === 1) && state.man === 1
  const bankName = (s: Side) => (s === 0 ? 'the near bank' : 'the far bank')

  const cross = (cargo: string | null) => {
    if (disaster || won) return
    const from = state.man
    const to = (1 - from) as Side
    const at = { ...state.at }
    if (cargo) at[cargo] = to
    // Check the bank the ferryman just left.
    const left = names.filter(n => at[n] === from)
    const eaten = rules.find(([a, b]) => left.includes(a) && left.includes(b))
    setState({ man: to, at })
    setLog(l => [...l, cargo ? `Crossed to ${bankName(to)} with the ${cargo}` : `Crossed to ${bankName(to)} alone`])
    if (eaten) setDisaster(`Oh no! Left alone on ${bankName(from)}, the ${eaten[0]} ate the ${eaten[1]}.`)
  }

  const reset = () => {
    setState(start)
    setLog([])
    setDisaster(null)
  }

  const bank = (side: Side) => (
    <div className="flex-1 min-h-[132px] rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-2 flex flex-col items-center gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800/70 dark:text-emerald-200/70">{side === 0 ? 'Near bank' : 'Far bank'}</p>
      <div className="flex flex-wrap justify-center gap-1 text-[30px] leading-none">
        {state.man === side && <span title="Ferryman">🧑🏾‍🌾</span>}
        {names
          .filter(n => state.at[n] === side)
          .map(n => (
            <span key={n} title={n}>
              {icon(n)}
            </span>
          ))}
      </div>
    </div>
  )

  const here = names.filter(n => state.at[n] === state.man)

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🛶 {title ?? 'River crossing'}</p>
        <button onClick={reset} className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky underline">
          Start again
        </button>
      </div>
      <div className="p-3 space-y-3">
        <div className="flex items-stretch gap-2">
          {bank(0)}
          <div className="w-14 sm:w-20 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex flex-col items-center justify-center text-[22px]" aria-hidden>
            <span className={`transition-transform duration-300 ${state.man === 1 ? 'translate-x-2' : '-translate-x-2'}`}>🛶</span>
            <span className="text-[10px] text-sky-800/70 dark:text-sky-200/70 mt-1">river</span>
          </div>
          {bank(1)}
        </div>

        {won ? (
          <div className="rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-[13px] text-emerald-900 dark:text-emerald-100">
            <b>Solved in {log.length} crossings!</b> {log.length === 7 ? 'That is the shortest possible solution.' : 'It can be done in 7 — can you find the shortest route?'}
          </div>
        ) : disaster ? (
          <div className="rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 text-[13px] text-rose-900 dark:text-rose-100">
            <b>{disaster}</b> Tap “Start again” and think about which item must never be left with another.
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-[12px] text-brand-navy/70 dark:text-white/70">
              The ferryman is on <b>{bankName(state.man)}</b>. The boat carries him and at most one item.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => cross(null)} className="rounded-lg border border-brand-navy/15 dark:border-white/20 px-3 py-1.5 text-[13px] font-semibold hover:bg-brand-sky/10">
                Cross alone
              </button>
              {here.map(n => (
                <button key={n} onClick={() => cross(n)} className="rounded-lg border border-brand-deep/40 dark:border-brand-sky/40 px-3 py-1.5 text-[13px] font-semibold hover:bg-brand-sky/10">
                  Take the {n} {icon(n)}
                </button>
              ))}
            </div>
          </div>
        )}

        {log.length > 0 && (
          <ol className="list-decimal pl-5 text-[12px] text-brand-navy/70 dark:text-white/70 space-y-0.5">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
