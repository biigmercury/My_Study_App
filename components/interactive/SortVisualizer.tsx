'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

// Step-by-step sorting visualiser. Each algorithm is run once up front to record every comparison,
// swap and write as a frame, so the learner can play, pause and step backwards.

type Algo = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick'

interface Frame {
  arr: number[]
  compare: number[]
  swap: number[]
  sorted: number[]
  range?: [number, number]
  pivot?: number
  msg: string
  comparisons: number
  moves: number
}

const NAMES: Record<Algo, string> = { bubble: 'Bubble', selection: 'Selection', insertion: 'Insertion', merge: 'Merge', quick: 'Quick' }
const BIG_O: Record<Algo, string> = {
  bubble: 'O(n²) comparisons — repeatedly swaps neighbours that are out of order',
  selection: 'O(n²) comparisons, but at most n − 1 swaps — selects the minimum each pass',
  insertion: 'O(n²) worst case, O(n) on nearly sorted data — inserts each item into the sorted left part',
  merge: 'O(n log n) always — divide in halves, sort each, merge (needs extra memory)',
  quick: 'O(n log n) on average, O(n²) worst case — partition around a pivot, then sort each side',
}

function record(algo: Algo, input: number[]): Frame[] {
  const a = [...input]
  const n = a.length
  const frames: Frame[] = []
  const sorted = new Set<number>()
  let comparisons = 0
  let moves = 0
  const push = (msg: string, extra: Partial<Frame> = {}) =>
    frames.push({ arr: [...a], compare: [], swap: [], sorted: [...sorted], msg, comparisons, moves, ...extra })

  push(`Start: ${n} unsorted values.`)

  if (algo === 'bubble') {
    for (let i = 0; i < n - 1; i++) {
      let swapped = false
      for (let j = 0; j < n - 1 - i; j++) {
        comparisons++
        push(`Pass ${i + 1}: compare ${a[j]} and ${a[j + 1]}.`, { compare: [j, j + 1] })
        if (a[j] > a[j + 1]) {
          ;[a[j], a[j + 1]] = [a[j + 1], a[j]]
          moves++
          swapped = true
          push(`${a[j + 1]} > ${a[j]}, so swap them.`, { swap: [j, j + 1] })
        }
      }
      sorted.add(n - 1 - i)
      push(`End of pass ${i + 1}: the largest remaining value has "bubbled" to position ${n - 1 - i}.`)
      if (!swapped) {
        for (let k = 0; k < n; k++) sorted.add(k)
        push('No swaps in this pass — the array is already sorted, so stop early.')
        break
      }
    }
    for (let k = 0; k < n; k++) sorted.add(k)
  } else if (algo === 'selection') {
    for (let i = 0; i < n - 1; i++) {
      let min = i
      push(`Pass ${i + 1}: find the smallest value in positions ${i}–${n - 1}. Current minimum: ${a[min]}.`, { compare: [min] })
      for (let j = i + 1; j < n; j++) {
        comparisons++
        push(`Compare ${a[j]} with current minimum ${a[min]}.`, { compare: [j, min] })
        if (a[j] < a[min]) {
          min = j
          push(`${a[min]} is smaller — it becomes the new minimum.`, { compare: [min] })
        }
      }
      if (min !== i) {
        ;[a[i], a[min]] = [a[min], a[i]]
        moves++
        push(`Swap the minimum ${a[i]} into position ${i}.`, { swap: [i, min] })
      } else push(`${a[i]} is already in the right place — no swap needed.`)
      sorted.add(i)
    }
    for (let k = 0; k < n; k++) sorted.add(k)
  } else if (algo === 'insertion') {
    sorted.add(0)
    push('The first element on its own is a sorted part.')
    for (let i = 1; i < n; i++) {
      const key = a[i]
      let j = i - 1
      push(`Take ${key} and insert it into the sorted part on its left.`, { compare: [i] })
      while (j >= 0) {
        comparisons++
        push(`Is ${a[j]} > ${key}?`, { compare: [j, j + 1] })
        if (a[j] > key) {
          a[j + 1] = a[j]
          moves++
          push(`Yes — shift ${a[j]} one place right.`, { swap: [j, j + 1] })
          j--
        } else break
      }
      a[j + 1] = key
      moves++
      for (let k = 0; k <= i; k++) sorted.add(k)
      push(`Insert ${key} at position ${j + 1}. Positions 0–${i} are now sorted.`, { swap: [j + 1] })
    }
  } else if (algo === 'merge') {
    // Shown as: [merged so far][rest of left half][rest of right half] — always a permutation of the
    // segment, so the bars never show the temporary duplicates of an in-place write.
    const merge = (l: number, m: number, r: number) => {
      const left = a.slice(l, m + 1)
      const right = a.slice(m + 1, r + 1)
      const merged: number[] = []
      let i = 0, j = 0
      const lay = () => [...merged, ...left.slice(i), ...right.slice(j)].forEach((v, x) => (a[l + x] = v))
      const leftFront = () => l + merged.length
      const rightFront = () => l + merged.length + (left.length - i)
      push(`Merge the sorted halves [${left.join(', ')}] and [${right.join(', ')}].`, { range: [l, r] })
      while (i < left.length && j < right.length) {
        comparisons++
        push(`Compare the front of each half: ${left[i]} and ${right[j]}. Take the smaller.`, { range: [l, r], compare: [leftFront(), rightFront()] })
        merged.push(left[i] <= right[j] ? left[i++] : right[j++])
        moves++
        lay()
        push(`${merged[merged.length - 1]} goes next in the merged part.`, { range: [l, r], swap: [l + merged.length - 1] })
      }
      while (i < left.length) { merged.push(left[i++]); moves++ }
      while (j < right.length) { merged.push(right[j++]); moves++ }
      lay()
      if (l === 0 && r === n - 1) for (let x = 0; x < n; x++) sorted.add(x)
      push(`One half is used up, so the rest is copied across. Positions ${l}–${r} are now in order: [${merged.join(', ')}].`, { range: [l, r] })
    }
    const sort = (l: number, r: number) => {
      if (l >= r) return
      const m = Math.floor((l + r) / 2)
      push(`Divide positions ${l}–${r} into ${l}–${m} and ${m + 1}–${r}.`, { range: [l, r] })
      sort(l, m)
      sort(m + 1, r)
      merge(l, m, r)
    }
    sort(0, n - 1)
  } else {
    const partition = (lo: number, hi: number) => {
      const pivot = a[hi]
      let i = lo - 1
      push(`Partition positions ${lo}–${hi} around the pivot ${pivot} (the last element).`, { range: [lo, hi], pivot: hi })
      for (let j = lo; j < hi; j++) {
        comparisons++
        push(`Is ${a[j]} < pivot ${pivot}?`, { range: [lo, hi], pivot: hi, compare: [j] })
        if (a[j] < pivot) {
          i++
          if (i !== j) {
            ;[a[i], a[j]] = [a[j], a[i]]
            moves++
            push(`Yes — swap it into the "smaller" side at position ${i}.`, { range: [lo, hi], pivot: hi, swap: [i, j] })
          } else push('Yes — it is already on the "smaller" side.', { range: [lo, hi], pivot: hi })
        }
      }
      ;[a[i + 1], a[hi]] = [a[hi], a[i + 1]]
      moves++
      sorted.add(i + 1)
      push(`Place the pivot ${pivot} at position ${i + 1}: everything left is smaller, everything right is larger.`, { range: [lo, hi], swap: [i + 1, hi] })
      return i + 1
    }
    const sort = (lo: number, hi: number) => {
      if (lo > hi) return
      if (lo === hi) {
        sorted.add(lo)
        push(`A single element (${a[lo]}) is already sorted.`)
        return
      }
      const p = partition(lo, hi)
      sort(lo, p - 1)
      sort(p + 1, hi)
    }
    sort(0, n - 1)
    for (let k = 0; k < n; k++) sorted.add(k)
  }
  push(`Sorted! ${comparisons} comparisons and ${moves} ${algo === 'bubble' || algo === 'selection' || algo === 'quick' ? 'swaps' : 'writes'}.`)
  return frames
}

const PRESET = [38, 27, 43, 3, 9, 82, 10, 55]
const randomArray = () => Array.from({ length: 8 }, () => Math.floor(Math.random() * 90) + 5)

export default function SortVisualizer({ algorithm }: { algorithm?: string }) {
  const [algo, setAlgo] = useState<Algo>((algorithm as Algo) in NAMES ? (algorithm as Algo) : 'bubble')
  const [input, setInput] = useState(PRESET)
  const frames = useMemo(() => record(algo, input), [algo, input])
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setI(0)
    setPlaying(false)
  }, [frames])

  useEffect(() => {
    if (!playing) return
    timer.current = setInterval(() => setI(v => (v < frames.length - 1 ? v + 1 : v)), 650)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [playing, frames.length])
  useEffect(() => {
    if (i >= frames.length - 1) setPlaying(false)
  }, [i, frames.length])

  const f = frames[Math.min(i, frames.length - 1)]
  const max = Math.max(...input)

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">📊 Sorting visualiser</p>
        <p className="text-[10.5px] font-mono text-brand-navy/50 dark:text-white/45">
          step {i + 1}/{frames.length}
        </p>
      </div>
      <div className="flex flex-wrap gap-1 px-3 pt-2">
        {(Object.keys(NAMES) as Algo[]).map(k => (
          <button
            key={k}
            onClick={() => setAlgo(k)}
            className={`px-2.5 py-1 rounded-lg text-[11.5px] font-semibold ${algo === k ? 'bg-brand-gradient text-white' : 'bg-brand-soft dark:bg-white/5 text-brand-navy/65 dark:text-white/60'}`}
          >
            {NAMES[k]}
          </button>
        ))}
      </div>
      <p className="px-4 pt-2 text-[11px] text-brand-navy/55 dark:text-white/50">{BIG_O[algo]}</p>

      <div className="px-3 pt-3">
        <div className="relative flex items-end justify-center gap-1.5 h-44 rounded-lg bg-brand-soft dark:bg-brand-bg/60 px-2 pb-6 pt-2">
          {f.arr.map((v, k) => {
            const inRange = !f.range || (k >= f.range[0] && k <= f.range[1])
            const colour = f.swap.includes(k)
              ? 'bg-rose-500'
              : f.compare.includes(k)
                ? 'bg-amber-400'
                : f.pivot === k
                  ? 'bg-violet-500'
                  : f.sorted.includes(k)
                    ? 'bg-emerald-500'
                    : 'bg-sky-500'
            return (
              <div key={k} className={`flex flex-col items-center justify-end h-full flex-1 max-w-[42px] transition-opacity ${inRange ? 'opacity-100' : 'opacity-30'}`}>
                <span className="text-[10.5px] font-mono font-semibold mb-0.5">{v}</span>
                <div className={`w-full rounded-t-md transition-all duration-300 ${colour}`} style={{ height: `${Math.max(6, (v / max) * 100)}%` }} />
              </div>
            )
          })}
        </div>
        <div className="flex justify-center gap-1.5 px-2 mt-0.5">
          {f.arr.map((_, k) => (
            <span key={k} className="flex-1 max-w-[42px] text-center text-[9.5px] font-mono text-brand-navy/40 dark:text-white/35">
              [{k}]
            </span>
          ))}
        </div>
      </div>

      <p className="px-4 pt-2 min-h-[40px] text-[12.5px] leading-snug">{f.msg}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-4 text-[10.5px] text-brand-navy/55 dark:text-white/50">
        <span>
          Comparisons: <b className="font-mono">{f.comparisons}</b>
        </span>
        <span>
          {algo === 'insertion' || algo === 'merge' ? 'Writes' : 'Swaps'}: <b className="font-mono">{f.moves}</b>
        </span>
        <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />comparing</span>
        <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />moved</span>
        {algo === 'quick' && <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-violet-500 inline-block" />pivot</span>}
        <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />in final place</span>
      </div>

      <div className="flex items-center gap-1.5 p-3">
        <button onClick={() => setI(0)} className="px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-brand-deep dark:text-brand-sky">
          ⟲
        </button>
        <button onClick={() => setI(v => Math.max(0, v - 1))} disabled={i === 0} className="px-2.5 py-1.5 rounded-lg text-[12px] font-semibold bg-brand-soft dark:bg-white/10 disabled:opacity-40">
          ← Back
        </button>
        <button onClick={() => setPlaying(p => !p)} disabled={i >= frames.length - 1} className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-[#021037] text-white disabled:opacity-40">
          {playing ? '❚❚ Pause' : '▶ Play'}
        </button>
        <button onClick={() => setI(v => Math.min(frames.length - 1, v + 1))} disabled={i >= frames.length - 1} className="px-3 py-1.5 rounded-lg bg-brand-gradient text-white text-[12px] font-bold disabled:opacity-40">
          Step →
        </button>
        <button onClick={() => setInput(randomArray())} className="ml-auto px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold text-brand-deep dark:text-brand-sky">
          New array
        </button>
      </div>
    </div>
  )
}
