'use client'

import { useState } from 'react'

// Two threads each run count++ three times on a shared counter. count++ is really three steps
// (READ, ADD, WRITE); the learner schedules the threads and sees lost updates — then turns on
// `synchronized` so a thread holds the lock for the whole read-modify-write.

const REPEAT = 3
const STEP_NAMES = ['temp = count;   // READ', 'temp = temp + 1; // ADD', 'count = temp;   // WRITE']

interface T {
  name: string
  temp: number | null
  step: number
  done: number
  readAt: number | null
}

interface State {
  count: number
  threads: T[]
  lock: number | null
  log: { text: string; bad?: boolean }[]
  lost: number
}

const fresh = (): State => ({
  count: 0,
  threads: [
    { name: 'Thread A', temp: null, step: 0, done: 0, readAt: null },
    { name: 'Thread B', temp: null, step: 0, done: 0, readAt: null },
  ],
  lock: null,
  log: [],
  lost: 0,
})

function advance(s: State, i: number, synced: boolean): State {
  const t = s.threads[i]
  if (t.done >= REPEAT) return s
  const other = s.threads[1 - i]
  const log = [...s.log]
  if (synced && s.lock !== null && s.lock !== i) {
    log.unshift({ text: `${t.name} is BLOCKED — ${other.name} holds the lock, so it must wait.` })
    return { ...s, log: log.slice(0, 8) }
  }
  const threads = s.threads.map(x => ({ ...x }))
  const me = threads[i]
  let { count, lock, lost } = s
  if (me.step === 0) {
    if (synced) lock = i
    me.temp = count
    me.readAt = count
    log.unshift({ text: `${me.name}: READ count → temp = ${count}${synced ? ' (acquired the lock)' : ''}` })
  } else if (me.step === 1) {
    me.temp = (me.temp ?? 0) + 1
    log.unshift({ text: `${me.name}: ADD → temp = ${me.temp}` })
  } else {
    const overwritten = count !== me.readAt
    count = me.temp ?? 0
    me.done++
    if (overwritten) {
      lost++
      log.unshift({ text: `${me.name}: WRITE count = ${count} — LOST UPDATE! It read ${me.readAt} before the other thread's write, so that increment is overwritten.`, bad: true })
    } else log.unshift({ text: `${me.name}: WRITE count = ${count}${synced ? ' (released the lock)' : ''}` })
    me.temp = null
    me.readAt = null
    if (synced) lock = null
  }
  me.step = (me.step + 1) % 3
  return { count, threads, lock, log: log.slice(0, 8), lost }
}

export default function RaceConditionDemo() {
  const [synced, setSynced] = useState(false)
  const [s, setS] = useState<State>(fresh)
  const finished = s.threads.every(t => t.done >= REPEAT)

  const runRandom = () => {
    let st = s
    let guard = 0
    while (!st.threads.every(t => t.done >= REPEAT) && guard++ < 200) {
      const candidates = [0, 1].filter(k => st.threads[k].done < REPEAT)
      const k = candidates[Math.floor(Math.random() * candidates.length)]
      st = advance(st, k, synced)
    }
    setS(st)
  }

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🧵 Race condition simulator</p>
        <label className="flex items-center gap-1.5 text-[11.5px] font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={synced}
            onChange={e => {
              setSynced(e.target.checked)
              setS(fresh())
            }}
          />
          <span className="font-mono">synchronized</span>
        </label>
      </div>
      <p className="px-4 pt-1 text-[11.5px] text-brand-navy/60 dark:text-white/55">
        Each thread runs <code className="font-mono">count++</code> {REPEAT} times — so the final count <b>should</b> be {REPEAT * 2}. You are the thread scheduler: choose which thread runs its next step.
      </p>

      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 p-3">
        {[0, 1].map(k => {
          const t = s.threads[k]
          const holds = s.lock === k
          const blocked = synced && s.lock !== null && s.lock !== k && t.done < REPEAT
          return (
            <div
              key={k}
              className={`rounded-lg border-2 p-2 ${k === 1 ? 'order-3' : ''} ${holds ? 'border-emerald-500' : blocked ? 'border-rose-400' : 'border-brand-navy/10 dark:border-white/10'} bg-brand-soft dark:bg-brand-bg/60`}
            >
              <p className="text-[12px] font-bold flex items-center justify-between">
                {t.name}
                {holds && <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">🔒 lock</span>}
                {blocked && <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-300">BLOCKED</span>}
              </p>
              <p className="font-mono text-[11px] mt-1">
                temp = <b>{t.temp === null ? '—' : t.temp}</b>
              </p>
              <p className="font-mono text-[11px]">
                done: {t.done}/{REPEAT}
              </p>
              <p className="font-mono text-[10px] mt-1 text-brand-navy/60 dark:text-white/55 min-h-[28px]">{t.done >= REPEAT ? 'finished' : `next: ${STEP_NAMES[t.step]}`}</p>
              <button
                onClick={() => setS(st => advance(st, k, synced))}
                disabled={t.done >= REPEAT}
                className="mt-1.5 w-full py-1 rounded-md text-[11.5px] font-bold bg-[#021037] text-white disabled:opacity-40"
              >
                Run one step
              </button>
            </div>
          )
        })}
        <div className="order-2 flex flex-col items-center justify-center px-1">
          <p className="text-[10px] uppercase font-semibold text-brand-navy/45 dark:text-white/40">shared</p>
          <p className="font-mono text-[11px]">count</p>
          <p className="font-mono text-[28px] font-bold leading-none">{s.count}</p>
        </div>
      </div>

      {finished && (
        <p
          className={`mx-3 mb-2 rounded-lg px-3 py-2 text-[12.5px] font-semibold ${s.count === REPEAT * 2 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200'}`}
        >
          Final count = {s.count} (expected {REPEAT * 2}).{' '}
          {s.count === REPEAT * 2 ? (synced ? 'The lock made each count++ indivisible — no updates lost.' : 'This schedule happened to be safe — try interleaving the steps.') : `${s.lost} update${s.lost === 1 ? ' was' : 's were'} lost to the race condition.`}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 px-3 pb-2">
        <button onClick={runRandom} disabled={finished} className="px-3 py-1.5 rounded-lg bg-brand-gradient text-white text-[12px] font-bold disabled:opacity-40">
          Let the OS schedule (random)
        </button>
        <button onClick={() => setS(fresh())} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-brand-deep dark:text-brand-sky">
          Reset
        </button>
      </div>

      <div className="bg-[#021037] px-3 py-2.5 min-h-[70px]">
        <p className="text-[10px] font-semibold uppercase text-white/40 mb-1">What happened (newest first)</p>
        {s.log.length === 0 ? (
          <p className="font-mono text-[11px] text-white/35">Tip: run A&apos;s READ, then B&apos;s READ, then finish both — watch an increment disappear.</p>
        ) : (
          s.log.map((l, i) => (
            <p key={i} className={`font-mono text-[11px] ${l.bad ? 'text-red-300' : 'text-green-200'} ${i === 0 ? '' : 'opacity-60'}`}>
              {l.text}
            </p>
          ))
        )}
      </div>
    </div>
  )
}
