'use client'

import { useState } from 'react'

// Hands-on ArrayList / Stack / Queue: each button performs the Java method and logs the call and its result,
// including the edge cases (IndexOutOfBoundsException, EmptyStackException, poll() returning null).

type Kind = 'list' | 'stack' | 'queue'
const START: Record<Kind, string[]> = { list: ['Ada', 'Musa', 'Chioma'], stack: ['10', '20', '30'], queue: ['Ada', 'Musa', 'Chioma'] }
const NAMES = ['Tunde', 'Fatima', 'Kemi', 'Emeka', 'Zainab', 'Bola', 'Ngozi', 'Sani']

interface LogLine {
  code: string
  result: string
  error?: boolean
}

export default function CollectionsDemo() {
  const [kind, setKind] = useState<Kind>('list')
  const [data, setData] = useState<Record<Kind, string[]>>(START)
  const [log, setLog] = useState<LogLine[]>([])
  const [value, setValue] = useState('')
  const [index, setIndex] = useState('0')
  const [flash, setFlash] = useState<number | null>(null)

  const items = data[kind]
  const varName = kind === 'list' ? 'list' : kind === 'stack' ? 'stack' : 'queue'
  const nextValue = () => {
    if (value.trim()) return value.trim()
    if (kind === 'stack') return String((Math.max(0, ...items.map(Number).filter(n => !isNaN(n))) || 0) + 10)
    return NAMES.find(n => !items.includes(n)) ?? `Item${items.length + 1}`
  }
  const q = (s: string) => (kind === 'stack' ? s : `"${s}"`)
  const push = (line: LogLine) => setLog(prev => [line, ...prev].slice(0, 7))
  const update = (next: string[], hl: number | null) => {
    setData(d => ({ ...d, [kind]: next }))
    setFlash(hl)
    setValue('')
  }
  const idx = () => parseInt(index, 10)

  const ops: Record<Kind, { label: string; run: () => void }[]> = {
    list: [
      { label: 'add(x)', run: () => { const v = nextValue(); update([...items, v], items.length); push({ code: `list.add(${q(v)});`, result: 'true' }) } },
      {
        label: 'add(i, x)',
        run: () => {
          const i = idx(), v = nextValue()
          if (isNaN(i) || i < 0 || i > items.length) return push({ code: `list.add(${index}, ${q(v)});`, result: `IndexOutOfBoundsException: Index: ${index}, Size: ${items.length}`, error: true })
          update([...items.slice(0, i), v, ...items.slice(i)], i)
          push({ code: `list.add(${i}, ${q(v)});`, result: `(elements from index ${i} shift right)` })
        },
      },
      {
        label: 'get(i)',
        run: () => {
          const i = idx()
          if (isNaN(i) || i < 0 || i >= items.length) return push({ code: `list.get(${index});`, result: `IndexOutOfBoundsException: Index ${index} out of bounds for length ${items.length}`, error: true })
          setFlash(i)
          push({ code: `list.get(${i});`, result: q(items[i]) })
        },
      },
      {
        label: 'set(i, x)',
        run: () => {
          const i = idx(), v = nextValue()
          if (isNaN(i) || i < 0 || i >= items.length) return push({ code: `list.set(${index}, ${q(v)});`, result: `IndexOutOfBoundsException: Index ${index} out of bounds for length ${items.length}`, error: true })
          const old = items[i]
          update(items.map((x, k) => (k === i ? v : x)), i)
          push({ code: `list.set(${i}, ${q(v)});`, result: `${q(old)} (the old value)` })
        },
      },
      {
        label: 'remove(i)',
        run: () => {
          const i = idx()
          if (isNaN(i) || i < 0 || i >= items.length) return push({ code: `list.remove(${index});`, result: `IndexOutOfBoundsException: Index ${index} out of bounds for length ${items.length}`, error: true })
          const old = items[i]
          update(items.filter((_, k) => k !== i), null)
          push({ code: `list.remove(${i});`, result: `${q(old)} (later elements shift left)` })
        },
      },
      { label: 'contains(x)', run: () => { const v = nextValue(); push({ code: `list.contains(${q(v)});`, result: String(items.includes(v)) }); setFlash(items.indexOf(v) >= 0 ? items.indexOf(v) : null) } },
      { label: 'size()', run: () => push({ code: 'list.size();', result: String(items.length) }) },
      { label: 'clear()', run: () => { update([], null); push({ code: 'list.clear();', result: '(now empty)' }) } },
    ],
    stack: [
      { label: 'push(x)', run: () => { const v = nextValue(); update([...items, v], items.length); push({ code: `stack.push(${v});`, result: v }) } },
      {
        label: 'pop()',
        run: () => {
          if (!items.length) return push({ code: 'stack.pop();', result: 'EmptyStackException', error: true })
          const top = items[items.length - 1]
          update(items.slice(0, -1), null)
          push({ code: 'stack.pop();', result: `${top} (removed from the top)` })
        },
      },
      {
        label: 'peek()',
        run: () => {
          if (!items.length) return push({ code: 'stack.peek();', result: 'EmptyStackException', error: true })
          setFlash(items.length - 1)
          push({ code: 'stack.peek();', result: `${items[items.length - 1]} (still on the stack)` })
        },
      },
      { label: 'isEmpty()', run: () => push({ code: 'stack.isEmpty();', result: String(items.length === 0) }) },
      { label: 'size()', run: () => push({ code: 'stack.size();', result: String(items.length) }) },
    ],
    queue: [
      { label: 'offer(x)', run: () => { const v = nextValue(); update([...items, v], items.length); push({ code: `queue.offer(${q(v)});`, result: 'true (joins at the rear)' }) } },
      {
        label: 'poll()',
        run: () => {
          if (!items.length) return push({ code: 'queue.poll();', result: 'null (empty queue — no exception)' })
          update(items.slice(1), null)
          push({ code: 'queue.poll();', result: `${q(items[0])} (removed from the front)` })
        },
      },
      {
        label: 'peek()',
        run: () => {
          if (!items.length) return push({ code: 'queue.peek();', result: 'null' })
          setFlash(0)
          push({ code: 'queue.peek();', result: `${q(items[0])} (still in the queue)` })
        },
      },
      {
        label: 'remove()',
        run: () => {
          if (!items.length) return push({ code: 'queue.remove();', result: 'NoSuchElementException', error: true })
          update(items.slice(1), null)
          push({ code: 'queue.remove();', result: `${q(items[0])}` })
        },
      },
      { label: 'size()', run: () => push({ code: 'queue.size();', result: String(items.length) }) },
    ],
  }

  const declarations: Record<Kind, string> = {
    list: 'ArrayList<String> list = new ArrayList<>();',
    stack: 'Stack<Integer> stack = new Stack<>();',
    queue: 'Queue<String> queue = new LinkedList<>();',
  }

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🧺 Try the collections</p>
        <button
          onClick={() => {
            setData(START)
            setLog([])
            setFlash(null)
          }}
          className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky"
        >
          Reset
        </button>
      </div>

      <div className="flex gap-1 px-3 pt-2">
        {(['list', 'stack', 'queue'] as Kind[]).map(k => (
          <button
            key={k}
            onClick={() => {
              setKind(k)
              setFlash(null)
              setValue('')
            }}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold ${kind === k ? 'bg-brand-gradient text-white' : 'text-brand-navy/60 dark:text-white/55 bg-brand-soft dark:bg-white/5'}`}
          >
            {k === 'list' ? 'ArrayList' : k === 'stack' ? 'Stack (LIFO)' : 'Queue (FIFO)'}
          </button>
        ))}
      </div>

      <p className="px-4 pt-2 font-mono text-[11px] text-brand-navy/55 dark:text-white/50">{declarations[kind]}</p>

      {/* The structure */}
      <div className="px-4 py-3 min-h-[120px] flex items-center justify-center">
        {items.length === 0 ? (
          <p className="text-[12px] text-brand-navy/40 dark:text-white/35">(empty)</p>
        ) : kind === 'stack' ? (
          <div className="flex flex-col-reverse items-center gap-1 w-40">
            {items.map((v, i) => (
              <div
                key={i}
                className={`w-full text-center font-mono text-[13px] py-1.5 rounded-md border-2 transition-colors ${flash === i ? 'bg-amber-200 dark:bg-amber-500/40 border-amber-500' : i === items.length - 1 ? 'bg-brand-sky/20 border-brand-sky' : 'bg-brand-soft dark:bg-white/5 border-brand-navy/15 dark:border-white/15'}`}
              >
                {v} {i === items.length - 1 && <span className="text-[10px] font-sans font-bold text-brand-deep dark:text-brand-sky ml-1">← top</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-end justify-center gap-1.5">
            {items.map((v, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`font-mono text-[12.5px] px-2.5 py-2 rounded-md border-2 transition-colors ${flash === i ? 'bg-amber-200 dark:bg-amber-500/40 border-amber-500' : 'bg-brand-soft dark:bg-white/5 border-brand-navy/15 dark:border-white/15'}`}
                >
                  {v}
                </div>
                <span className="text-[9.5px] font-mono text-brand-navy/45 dark:text-white/40 mt-0.5">
                  {kind === 'list' ? `[${i}]` : i === 0 && i === items.length - 1 ? 'front/rear' : i === 0 ? 'front' : i === items.length - 1 ? 'rear' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inputs and operations */}
      <div className="px-3 pb-2 flex flex-wrap items-center gap-1.5">
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={kind === 'stack' ? 'value (auto)' : 'x (auto name)'}
          aria-label="Value"
          className="w-28 px-2 py-1 rounded-md border border-brand-navy/15 dark:border-white/15 bg-white dark:bg-white/5 text-[12px] font-mono"
        />
        {kind === 'list' && (
          <input
            value={index}
            onChange={e => setIndex(e.target.value)}
            aria-label="Index"
            className="w-14 px-2 py-1 rounded-md border border-brand-navy/15 dark:border-white/15 bg-white dark:bg-white/5 text-[12px] font-mono"
            placeholder="i"
          />
        )}
        {kind === 'list' && <span className="text-[10.5px] text-brand-navy/45 dark:text-white/40">← i</span>}
      </div>
      <div className="px-3 pb-3 flex flex-wrap gap-1.5">
        {ops[kind].map(op => (
          <button key={op.label} onClick={op.run} className="px-2.5 py-1.5 rounded-lg text-[11.5px] font-mono font-semibold bg-[#021037] text-white hover:opacity-90">
            {op.label}
          </button>
        ))}
      </div>

      {/* Call log */}
      <div className="bg-[#021037] px-3 py-2.5 min-h-[70px]">
        <p className="text-[10px] font-semibold uppercase text-white/40 mb-1">Java calls (newest first)</p>
        {log.length === 0 ? (
          <p className="font-mono text-[11.5px] text-white/35">Press a method button…</p>
        ) : (
          log.map((l, i) => (
            <p key={i} className={`font-mono text-[11.5px] ${i === 0 ? 'opacity-100' : 'opacity-60'}`}>
              <span className="text-sky-200">{l.code}</span> <span className={l.error ? 'text-red-300' : 'text-green-200'}>→ {l.result}</span>
            </p>
          ))
        )}
      </div>
    </div>
  )
}
