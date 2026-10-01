'use client'

import { useMemo, useState } from 'react'

// Draw a binary relation between a few individuals and see its logical attributes.
//   <RelationGraph title="…" label="is older than" nodes="Ade, Bola, Sola" arrows="Ade>Bola, Bola>Sola, Ade>Sola" />
// Tap a cell of the grid (row = from, column = to) to add or remove an arrow; the diagonal holds self-loops.
// The verdicts describe the arrows actually drawn — one situation — not every possible use of the relation word.

type Pair = [number, number]

const key = (a: number, b: number) => `${a}>${b}`

function parseArrows(arrows: string, names: string[]): Set<string> {
  const out = new Set<string>()
  for (const part of arrows.split(',')) {
    const [a, b] = part.split('>').map(s => s.trim())
    const i = names.indexOf(a)
    const j = names.indexOf(b)
    if (i >= 0 && j >= 0) out.add(key(i, j))
  }
  return out
}

export default function RelationGraph({
  title,
  label = 'R',
  nodes = 'A, B, C',
  arrows = '',
}: {
  title?: string
  label?: string
  nodes?: string
  arrows?: string
}) {
  const names = useMemo(
    () =>
      nodes
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 5),
    [nodes],
  )
  const initial = useMemo(() => parseArrows(arrows, names), [arrows, names])
  const [edges, setEdges] = useState<Set<string>>(initial)
  const has = (a: number, b: number) => edges.has(key(a, b))
  const toggle = (a: number, b: number) =>
    setEdges(prev => {
      const next = new Set(prev)
      if (next.has(key(a, b))) next.delete(key(a, b))
      else next.add(key(a, b))
      return next
    })

  const pairs: Pair[] = useMemo(
    () => [...edges].map(k => k.split('>').map(Number) as Pair).sort((p, q) => p[0] - q[0] || p[1] - q[1]),
    [edges],
  )
  const n = names.length
  const arrow = (a: number, b: number) => `${names[a]} ${label} ${names[b]}`

  const verdicts = (() => {
    const e = (a: number, b: number) => edges.has(key(a, b))
    // Symmetry
    let symmetry: { name: string; why: string }
    if (!pairs.length) symmetry = { name: 'No arrows yet', why: 'Tap the grid to draw some.' }
    else {
      const oneWay = pairs.find(([a, b]) => !e(b, a))
      // Prefer a genuine two-way pair as evidence; a self-loop is its own reverse.
      const twoWay = pairs.find(([a, b]) => a !== b && e(b, a)) ?? pairs.find(([a, b]) => a === b)
      if (!oneWay) symmetry = { name: 'Symmetrical', why: 'Every arrow has a partner running back the other way.' }
      else if (!twoWay) symmetry = { name: 'Asymmetrical', why: 'No arrow ever runs back the other way.' }
      else
        symmetry = {
          name: 'Non-symmetrical',
          why: `${
            twoWay[0] === twoWay[1]
              ? `${arrow(twoWay[0], twoWay[0])} (a self-loop is its own reverse)`
              : `${arrow(twoWay[0], twoWay[1])} and the reverse also holds`
          }, but ${arrow(oneWay[0], oneWay[1])} while the reverse does not.`,
        }
    }
    // Reflexivity
    const loops = names.map((_, i) => e(i, i))
    const reflexivity = loops.every(Boolean)
      ? { name: 'Reflexive', why: `Everyone here bears the relation to themselves (all ${n} self-loops are drawn).` }
      : !loops.some(Boolean)
        ? { name: 'Irreflexive', why: 'Nobody bears the relation to themselves (no self-loops).' }
        : {
            name: 'Non-reflexive',
            why: `${names.filter((_, i) => loops[i]).join(', ')} ${loops.filter(Boolean).length === 1 ? 'has' : 'have'} a self-loop, but ${names.filter((_, i) => !loops[i]).join(', ')} ${loops.filter(Boolean).length === n - 1 ? 'does' : 'do'} not.`,
          }
    // Transitivity
    const chains: [number, number, number][] = []
    for (const [a, b] of pairs) for (const [b2, c] of pairs) if (b === b2) chains.push([a, b, c])
    let transitivity: { name: string; why: string }
    if (!chains.length) transitivity = { name: 'No chains yet', why: 'Draw two arrows that link up (x → y → z) to test transitivity.' }
    else {
      // Prefer evidence chains through three different individuals — they read most naturally.
      const rank = ([a, b, c]: [number, number, number]) => (a !== b && b !== c && a !== c ? 0 : a !== b && b !== c ? 1 : 2)
      const byRank = [...chains].sort((p, q) => rank(p) - rank(q))
      const closed = byRank.find(([a, , c]) => e(a, c))
      const open = byRank.find(([a, , c]) => !e(a, c))
      const chain = ([a, b, c]: [number, number, number]) => `${arrow(a, b)} and ${arrow(b, c)}`
      if (!open) transitivity = { name: 'Transitive', why: 'Whenever x → y and y → z, the shortcut x → z is also there.' }
      else if (!closed) transitivity = { name: 'Intransitive', why: 'Whenever x → y and y → z, the shortcut x → z is never there.' }
      else
        transitivity = {
          name: 'Non-transitive',
          why: `${chain(closed)}, and ${arrow(closed[0], closed[2])} too — but although ${chain(open)}, it is not true that ${arrow(open[0], open[2])}.`,
        }
    }
    return { symmetry, reflexivity, transitivity }
  })()

  // Layout: nodes on a circle.
  const W = 320
  const H = 230
  const R = 18
  const pos = names.map((_, i) => {
    const t = -Math.PI / 2 + (2 * Math.PI * i) / n
    const rx = n === 2 ? 100 : 105
    const ry = n === 2 ? 0 : 78
    return { x: W / 2 + rx * Math.cos(t), y: H / 2 + 8 + ry * Math.sin(t) }
  })

  const edgePath = (a: number, b: number) => {
    const p = pos[a]
    const q = pos[b]
    const dx = q.x - p.x
    const dy = q.y - p.y
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    const bend = has(b, a) ? 14 : 0 // curve pairs apart so both directions show
    const sx = p.x + ux * R
    const sy = p.y + uy * R
    const ex = q.x - ux * (R + 4)
    const ey = q.y - uy * (R + 4)
    const mx = (sx + ex) / 2 - uy * bend
    const my = (sy + ey) / 2 + ux * bend
    return `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`
  }

  const card = (heading: string, v: { name: string; why: string }) => (
    <div className="rounded-xl border border-brand-navy/10 dark:border-white/10 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-navy/50 dark:text-white/50">{heading}</p>
      <p className="font-bold text-brand-deep dark:text-brand-sky text-[14px]">{v.name}</p>
      <p className="text-[12.5px] leading-snug text-brand-navy/80 dark:text-white/80">{v.why}</p>
    </div>
  )

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🔗 {title ?? 'Relation explorer'}</p>
        <div className="flex gap-3">
          <button onClick={() => setEdges(new Set())} className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky underline">
            Clear
          </button>
          <button onClick={() => setEdges(new Set(initial))} className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky underline">
            Reset
          </button>
        </div>
      </div>
      <div className="p-3 space-y-3">
        <p className="text-[13px]">
          An arrow from x to y means <b>“x {label} y”</b>. Tap the grid to add or remove arrows.
        </p>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[360px] mx-auto block text-brand-deep dark:text-brand-sky" role="img" aria-label={`Arrow diagram of the relation ${label}`}>
          <defs>
            <marker id={`rg-head-${label.replace(/\W/g, '')}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>
          {pairs
            .filter(([a, b]) => a !== b)
            .map(([a, b]) => (
              <path
                key={key(a, b)}
                d={edgePath(a, b)}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                markerEnd={`url(#rg-head-${label.replace(/\W/g, '')})`}
              />
            ))}
          {names.map((_, i) =>
            has(i, i) ? (
              <circle key={`loop${i}`} cx={pos[i].x} cy={pos[i].y - R - 9} r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            ) : null,
          )}
          {names.map((nm, i) => (
            <g key={nm}>
              <circle cx={pos[i].x} cy={pos[i].y} r={R} className="fill-white dark:fill-brand-surface" stroke="currentColor" strokeWidth="2" />
              <text x={pos[i].x} y={pos[i].y + 4} textAnchor="middle" fontSize="11" fontWeight="700" className="fill-brand-navy dark:fill-white">
                {nm.length > 6 ? nm.slice(0, 5) + '…' : nm}
              </text>
            </g>
          ))}
        </svg>
        <div className="overflow-x-auto">
          <table className="mx-auto border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="px-1.5 py-1 text-left text-[10px] font-semibold text-brand-navy/50 dark:text-white/50">from ↓ to →</th>
                {names.map(nm => (
                  <th key={nm} className="px-1.5 py-1 font-semibold">
                    {nm}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {names.map((from, a) => (
                <tr key={from}>
                  <th className="px-1.5 py-1 text-left font-semibold">{from}</th>
                  {names.map((to, b) => (
                    <td key={to} className="p-0.5">
                      <button
                        onClick={() => toggle(a, b)}
                        aria-pressed={has(a, b)}
                        aria-label={`${from} ${label} ${to}`}
                        title={`${from} ${label} ${to}`}
                        className={`h-9 w-11 rounded-lg border text-[15px] font-bold transition ${
                          has(a, b)
                            ? 'border-brand-deep bg-brand-deep text-white dark:border-brand-sky dark:bg-brand-sky dark:text-brand-navy'
                            : `border-brand-navy/15 dark:border-white/15 ${a === b ? 'bg-brand-navy/5 dark:bg-white/5' : ''}`
                        }`}
                      >
                        {has(a, b) ? '✓' : ''}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-center text-[10.5px] text-brand-navy/50 dark:text-white/50">Shaded diagonal cells are self-loops (x {label} x).</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {card('Symmetry', verdicts.symmetry)}
          {card('Reflexivity', verdicts.reflexivity)}
          {card('Transitivity', verdicts.transitivity)}
        </div>
        <p className="text-[11.5px] text-brand-navy/60 dark:text-white/60">
          These verdicts describe only the arrows drawn here — one situation. A relation word is classified by what <i>must</i> or <i>can</i> happen in every
          situation: “loves” is non-symmetrical because love is sometimes returned and sometimes not.
        </p>
      </div>
    </div>
  )
}
