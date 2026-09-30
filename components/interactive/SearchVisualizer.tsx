'use client'

import { useMemo, useState } from 'react'

// Linear vs binary search, step by step, on the same sorted array — with low/mid/high pointers
// and the eliminated half greyed out, plus a comparison counter so the difference in speed is visible.

type Algo = 'linear' | 'binary'

interface Frame {
  current: number | null
  low?: number
  high?: number
  mid?: number
  eliminated: number[]
  found: number | null
  msg: string
  comparisons: number
}

const ARRAY = [3, 8, 12, 17, 21, 26, 30, 34, 39, 45, 52, 58, 63, 71, 77, 84]

function record(algo: Algo, a: number[], target: number): Frame[] {
  const frames: Frame[] = []
  let comparisons = 0
  if (algo === 'linear') {
    frames.push({ current: null, eliminated: [], found: null, msg: `Linear search for ${target}: check each element from the left.`, comparisons })
    for (let i = 0; i < a.length; i++) {
      comparisons++
      if (a[i] === target) {
        frames.push({ current: i, eliminated: Array.from({ length: i }, (_, k) => k), found: i, msg: `a[${i}] = ${a[i]} — found ${target} at index ${i}.`, comparisons })
        return frames
      }
      frames.push({ current: i, eliminated: Array.from({ length: i }, (_, k) => k), found: null, msg: `a[${i}] = ${a[i]} ≠ ${target}. Move to the next element.`, comparisons })
    }
    frames.push({ current: null, eliminated: a.map((_, k) => k), found: null, msg: `Reached the end — ${target} is not in the array. Return -1.`, comparisons })
    return frames
  }
  let low = 0
  let high = a.length - 1
  const out = new Set<number>()
  frames.push({ current: null, low, high, eliminated: [], found: null, msg: `Binary search for ${target}. The array is sorted, so start with low = 0 and high = ${high}.`, comparisons })
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    comparisons++
    if (a[mid] === target) {
      frames.push({ current: mid, low, high, mid, eliminated: [...out], found: mid, msg: `mid = (${low} + ${high}) / 2 = ${mid}. a[${mid}] = ${a[mid]} — found ${target}!`, comparisons })
      return frames
    }
    if (a[mid] < target) {
      frames.push({ current: mid, low, high, mid, eliminated: [...out], found: null, msg: `mid = (${low} + ${high}) / 2 = ${mid}. a[${mid}] = ${a[mid]} < ${target}, so the target can only be to the RIGHT: low = ${mid + 1}.`, comparisons })
      for (let k = low; k <= mid; k++) out.add(k)
      low = mid + 1
    } else {
      frames.push({ current: mid, low, high, mid, eliminated: [...out], found: null, msg: `mid = (${low} + ${high}) / 2 = ${mid}. a[${mid}] = ${a[mid]} > ${target}, so the target can only be to the LEFT: high = ${mid - 1}.`, comparisons })
      for (let k = mid; k <= high; k++) out.add(k)
      high = mid - 1
    }
    frames.push({ current: null, low, high, eliminated: [...out], found: null, msg: low <= high ? `Half the remaining elements eliminated. Search positions ${low}–${high}.` : `low (${low}) > high (${high}): nothing left to search.`, comparisons })
  }
  frames.push({ current: null, eliminated: a.map((_, k) => k), found: null, msg: `${target} is not in the array. Return -1 after only ${comparisons} comparisons.`, comparisons })
  return frames
}

export default function SearchVisualizer() {
  const [algo, setAlgo] = useState<Algo>('binary')
  const [targetText, setTargetText] = useState('63')
  const target = parseInt(targetText, 10)
  const valid = !isNaN(target)
  const frames = useMemo(() => (valid ? record(algo, ARRAY, target) : []), [algo, target, valid])
  const [i, setI] = useState(0)
  const idx = Math.min(i, Math.max(0, frames.length - 1))
  const f = frames[idx]

  const choose = (a: Algo) => {
    setAlgo(a)
    setI(0)
  }

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🔎 Searching visualiser</p>
        {f && (
          <p className="text-[10.5px] font-mono text-brand-navy/50 dark:text-white/45">
            comparisons: <b>{f.comparisons}</b>
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2">
        {(['linear', 'binary'] as Algo[]).map(a => (
          <button
            key={a}
            onClick={() => choose(a)}
            className={`px-2.5 py-1 rounded-lg text-[11.5px] font-semibold ${algo === a ? 'bg-brand-gradient text-white' : 'bg-brand-soft dark:bg-white/5 text-brand-navy/65 dark:text-white/60'}`}
          >
            {a === 'linear' ? 'Linear search' : 'Binary search'}
          </button>
        ))}
        <label className="ml-auto text-[11.5px] flex items-center gap-1">
          target
          <input
            value={targetText}
            onChange={e => {
              setTargetText(e.target.value)
              setI(0)
            }}
            aria-label="Target value"
            className="w-14 px-2 py-1 rounded-md border border-brand-navy/15 dark:border-white/15 bg-white dark:bg-white/5 font-mono text-[12px]"
          />
        </label>
      </div>

      <div className="px-3 pt-3">
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${ARRAY.length}, minmax(0, 1fr))` }}>
          {ARRAY.map((v, k) => {
            const isFound = f?.found === k
            const isCurrent = f?.current === k
            const out = f?.eliminated.includes(k)
            return (
              <div key={k} className="flex flex-col items-center min-w-0">
                <div
                  className={`w-full text-center font-mono text-[10.5px] sm:text-[12px] py-1.5 rounded border-2 transition-all ${
                    isFound
                      ? 'bg-emerald-500 border-emerald-600 text-white'
                      : isCurrent
                        ? 'bg-amber-300 border-amber-500 text-brand-navy'
                        : out
                          ? 'bg-slate-100 dark:bg-white/5 border-transparent text-brand-navy/25 dark:text-white/20'
                          : 'bg-brand-soft dark:bg-white/10 border-brand-navy/10 dark:border-white/10'
                  }`}
                >
                  {v}
                </div>
                <span className="text-[9px] font-mono text-brand-navy/40 dark:text-white/35">{k}</span>
                <span className="text-[8px] sm:text-[9px] font-bold leading-tight text-center h-6">
                  {algo === 'binary' && f && (
                    <>
                      {f.low === k && <span className="block text-sky-600 dark:text-sky-300">low</span>}
                      {f.mid === k && <span className="block text-amber-600 dark:text-amber-300">mid</span>}
                      {f.high === k && <span className="block text-violet-600 dark:text-violet-300">high</span>}
                    </>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="px-4 pt-1 min-h-[40px] text-[12.5px] leading-snug">{valid ? f?.msg : 'Type a whole number to search for.'}</p>

      <div className="flex items-center gap-1.5 p-3">
        <button onClick={() => setI(0)} className="px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-brand-deep dark:text-brand-sky">
          ⟲
        </button>
        <button onClick={() => setI(v => Math.max(0, v - 1))} disabled={idx === 0} className="px-2.5 py-1.5 rounded-lg text-[12px] font-semibold bg-brand-soft dark:bg-white/10 disabled:opacity-40">
          ← Back
        </button>
        <button onClick={() => setI(frames.length - 1)} disabled={idx >= frames.length - 1} className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-[#021037] text-white disabled:opacity-40">
          Skip to end
        </button>
        <button onClick={() => setI(v => Math.min(frames.length - 1, v + 1))} disabled={idx >= frames.length - 1} className="ml-auto px-3 py-1.5 rounded-lg bg-brand-gradient text-white text-[12px] font-bold disabled:opacity-40">
          Step →
        </button>
      </div>
    </div>
  )
}
