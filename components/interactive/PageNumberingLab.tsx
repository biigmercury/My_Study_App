'use client'

import { useMemo, useState } from 'react'

// Section breaks and page numbering, the classic CSC 272 practical: insert Next Page section breaks,
// unlink headers/footers from the previous section, choose number formats (1, - 1 -, a, A, i, I, or
// typed decorations like -a-), Continue vs Start at, Different First Page — and check the result
// against past exam tasks.

type Fmt = '1' | '-1-' | 'a' | 'A' | 'i' | 'I'
interface Part {
  linked: boolean
  text: string
  number: boolean
  pre: string
  post: string
}
interface Sec {
  fmt: Fmt
  start: number | null
  diffFirst: boolean
  header: Part
  footer: Part
}

const PAGE_NAMES = ['Title page', 'List of Figures', 'List of Tables', 'Chapter 1', 'Chapter 2', 'Chapter 3', 'References', 'Appendix']
const blankPart = (): Part => ({ linked: true, text: '', number: false, pre: '', post: '' })
const firstSec = (): Sec => ({ fmt: '1', start: null, diffFirst: false, header: { ...blankPart(), linked: false }, footer: { ...blankPart(), linked: false } })

function roman(n: number) {
  const map: [number, string][] = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i'],
  ]
  let out = ''
  for (const [v, s] of map)
    while (n >= v) {
      out += s
      n -= v
    }
  return out
}
function letters(n: number) {
  // Word repeats the letter: a … z, aa … zz, aaa …
  const k = Math.floor((n - 1) / 26) + 1
  return String.fromCharCode(97 + ((n - 1) % 26)).repeat(k)
}
function format(n: number, f: Fmt) {
  if (n < 1) return String(n)
  switch (f) {
    case '-1-':
      return `- ${n} -`
    case 'a':
      return letters(n)
    case 'A':
      return letters(n).toUpperCase()
    case 'i':
      return roman(n)
    case 'I':
      return roman(n).toUpperCase()
    default:
      return String(n)
  }
}

const FMT_LABEL: Record<Fmt, string> = { '1': '1, 2, 3, …', '-1-': '- 1 -, - 2 -, …', a: 'a, b, c, …', A: 'A, B, C, …', i: 'i, ii, iii, …', I: 'I, II, III, …' }

const TASKS = [
  {
    id: 'exam1',
    title: 'Exam task: pages 1–3 numbered a, b, c in the HEADER; the rest i, ii, iii… in the FOOTER',
    pages: 6,
  },
  {
    id: 'exam2',
    title: 'Exam task: every page numbered in the format -a- (‑a‑, ‑b‑, ‑c‑ …) with header text',
    pages: 6,
  },
  {
    id: 'title',
    title: 'Report: no number on the title page; Roman i, ii on the prelims; 1, 2, 3 from Chapter 1',
    pages: 7,
  },
]

export default function PageNumberingLab() {
  const [pages, setPages] = useState(6)
  const [breaks, setBreaks] = useState<boolean[]>(() => Array(7).fill(false))
  const [secs, setSecs] = useState<Sec[]>(() => [firstSec()])
  const [cur, setCur] = useState(0)
  const [where, setWhere] = useState<'header' | 'footer'>('header')
  const [task, setTask] = useState('exam1')
  const [marks, setMarks] = useState(true)

  // section index of every page
  const pageSec = useMemo(() => {
    const out: number[] = []
    let s = 0
    for (let p = 0; p < pages; p++) {
      out.push(s)
      if (p < pages - 1 && breaks[p]) s++
    }
    return out
  }, [pages, breaks])
  const nSecs = pageSec[pages - 1] + 1

  const toggleBreak = (p: number) => {
    const s = pageSec[p]
    const next = [...breaks]
    next[p] = !next[p]
    setBreaks(next)
    setSecs(ss => {
      const copy = [...ss]
      if (next[p]) {
        const prev = copy[s] ?? firstSec()
        copy.splice(s + 1, 0, { fmt: prev.fmt, start: null, diffFirst: false, header: { ...prev.header, linked: true }, footer: { ...prev.footer, linked: true } })
      } else copy.splice(s + 1, 1)
      return copy
    })
    setCur(next[p] ? s + 1 : s)
  }

  const sec = (i: number) => secs[i] ?? firstSec()
  const resolve = (i: number, w: 'header' | 'footer'): Part => {
    const own = sec(i)[w]
    return i > 0 && own.linked ? resolve(i - 1, w) : own
  }

  const numbers = useMemo(() => {
    const out: number[] = []
    for (let p = 0; p < pages; p++) {
      const s = pageSec[p]
      const firstOfSec = p === 0 || pageSec[p - 1] !== s
      const st = sec(s).start
      out.push(firstOfSec && st !== null ? st : p === 0 ? 1 : out[p - 1] + 1)
    }
    return out
  }, [pages, pageSec, secs]) // eslint-disable-line react-hooks/exhaustive-deps

  const partText = (p: number, w: 'header' | 'footer') => {
    const s = pageSec[p]
    const firstOfSec = p === 0 || pageSec[p - 1] !== s
    if (firstOfSec && sec(s).diffFirst) return { text: '', num: '' }
    const part = resolve(s, w)
    return { text: part.text, num: part.number ? `${part.pre}${format(numbers[p], sec(s).fmt)}${part.post}` : '' }
  }

  const update = (fn: (s: Sec) => Sec) => setSecs(ss => ss.map((s, i) => (i === cur ? fn({ ...s, header: { ...s.header }, footer: { ...s.footer } }) : s)))
  const S = sec(cur)
  const P = S[where]
  const linkedAway = cur > 0 && P.linked

  // ---------- task checking ----------
  const checks = (() => {
    const hdr = (p: number) => partText(p, 'header')
    const ftr = (p: number) => partText(p, 'footer')
    const list: [boolean, string][] = []
    if (task === 'exam1') {
      list.push([[0, 1, 2].every(p => hdr(p).num === letters(p + 1)), 'Pages 1–3 show a, b, c in the header'])
      list.push([[0, 1, 2].every(p => !ftr(p).num), 'Pages 1–3 have no number in the footer'])
      list.push([Array.from({ length: pages - 3 }, (_, k) => k + 3).every((p, k) => ftr(p).num === roman(k + 1)), 'Pages 4 onward show i, ii, iii … in the footer (restarting at i)'])
      list.push([Array.from({ length: pages - 3 }, (_, k) => k + 3).every(p => !hdr(p).num), 'Pages 4 onward have no number in the header'])
    } else if (task === 'exam2') {
      list.push([Array.from({ length: pages }, (_, p) => p).every(p => hdr(p).num === `-${letters(p + 1)}-`), 'Every page shows -a-, -b-, -c- … (type the dashes around the number)'])
      list.push([Array.from({ length: pages }, (_, p) => p).every(p => hdr(p).text.trim() !== ''), 'Every page has header text (e.g. the document title)'])
    } else {
      list.push([!hdr(0).num && !ftr(0).num, 'Title page (page 1) shows no number'])
      list.push([ftr(1).num === 'ii' && ftr(2).num === 'iii', 'Pages 2–3 show ii, iii in the footer (the hidden title page counts as i)'])
      list.push([ftr(3).num === '1' && Array.from({ length: pages - 3 }, (_, k) => k + 3).every((p, k) => ftr(p).num === String(k + 1)), 'Chapter 1 (page 4) restarts at 1 and continues 2, 3 …'])
    }
    return list
  })()
  const passed = checks.filter(c => c[0]).length

  const loadTask = (id: string) => {
    setTask(id)
    const t = TASKS.find(x => x.id === id)!
    setPages(t.pages)
    setBreaks(Array(8).fill(false))
    setSecs([firstSec()])
    setCur(0)
    setWhere('header')
  }

  const sel = 'border border-[#c6c6c6] rounded bg-white px-1 py-0.5 text-[11.5px] text-[#222]'
  const btn = 'px-2 py-1 rounded border border-[#c6c6c6] bg-white text-[11.5px] text-[#222] hover:border-[#2B579A]'

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">📑 Section breaks &amp; page numbering lab</p>
        <label className="text-[11px] flex items-center gap-1">
          <input type="checkbox" checked={marks} onChange={e => setMarks(e.target.checked)} /> ¶ marks
        </label>
      </div>

      <div className="mx-3 mt-2">
        <select aria-label="Task" value={task} onChange={e => loadTask(e.target.value)} className="w-full rounded-md border border-brand-navy/15 dark:border-white/20 bg-white dark:bg-brand-surface px-2 py-1 text-[12px] text-brand-navy dark:text-white">
          {TASKS.map(t => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <ul className="mt-1.5 space-y-0.5 text-[12px]">
          {checks.map(([ok, t]) => (
            <li key={t} className={ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-brand-navy/80 dark:text-white/80'}>
              {ok ? '✓' : '○'} {t}
            </li>
          ))}
          {passed === checks.length && <li className="font-semibold text-emerald-700 dark:text-emerald-300">🎉 Task complete — exactly what the examiner wants to see.</li>}
        </ul>
      </div>

      <div className="m-3 rounded-md border border-[#b8b8b8] overflow-hidden bg-[#f3f3f3] text-[#222]" style={{ fontFamily: '"Segoe UI", Calibri, Arial, sans-serif' }}>
        <div className="flex text-[11px] font-semibold" style={{ background: '#2B579A' }}>
          <span className="px-2 py-1 text-white/85">HEADER &amp; FOOTER TOOLS · DESIGN — Section {cur + 1}</span>
        </div>
        <div className="px-2 py-2 space-y-1.5 border-b border-[#d4d4d4] text-[11.5px]">
          <div className="flex flex-wrap gap-1 items-center">
            {(['header', 'footer'] as const).map(w => (
              <button key={w} onClick={() => setWhere(w)} className={`${btn} ${where === w ? '!border-[#2B579A] !bg-[#dbe6f4]' : ''}`}>
                {w === 'header' ? 'Go to Header' : 'Go to Footer'}
              </button>
            ))}
            <label className={`flex items-center gap-1 ml-1 ${cur === 0 ? 'opacity-40' : ''}`}>
              <input type="checkbox" disabled={cur === 0} checked={cur > 0 && P.linked} onChange={e => update(s => ({ ...s, [where]: { ...s[where], linked: e.target.checked, ...(e.target.checked ? {} : { ...resolve(cur, where), linked: false }) } }))} />
              Link to Previous
            </label>
            <label className="flex items-center gap-1 ml-1">
              <input type="checkbox" checked={S.diffFirst} onChange={e => update(s => ({ ...s, diffFirst: e.target.checked }))} /> Different First Page
            </label>
          </div>
          <div className={`flex flex-wrap gap-1 items-center ${linkedAway ? 'opacity-50' : ''}`}>
            <span>{where === 'header' ? 'Header' : 'Footer'} text:</span>
            <input aria-label={`${where} text`} disabled={linkedAway} value={linkedAway ? resolve(cur, where).text : P.text} onChange={e => update(s => ({ ...s, [where]: { ...s[where], text: e.target.value } }))} className="w-32 border border-[#c6c6c6] rounded px-1 bg-white" placeholder="e.g. CSC 272 Report" />
            <label className="flex items-center gap-1">
              <input type="checkbox" disabled={linkedAway} checked={(linkedAway ? resolve(cur, where) : P).number} onChange={e => update(s => ({ ...s, [where]: { ...s[where], number: e.target.checked } }))} /> Page Number
            </label>
            <span>typed before/after:</span>
            <input aria-label="Text before number" disabled={linkedAway} value={(linkedAway ? resolve(cur, where) : P).pre} onChange={e => update(s => ({ ...s, [where]: { ...s[where], pre: e.target.value } }))} className="w-8 border border-[#c6c6c6] rounded px-1 bg-white" />
            <input aria-label="Text after number" disabled={linkedAway} value={(linkedAway ? resolve(cur, where) : P).post} onChange={e => update(s => ({ ...s, [where]: { ...s[where], post: e.target.value } }))} className="w-8 border border-[#c6c6c6] rounded px-1 bg-white" />
          </div>
          {linkedAway && <p className="text-[11px] text-[#9a3412]">“Same as Previous”: this {where} is linked to section {cur}. Untick Link to Previous to give section {cur + 1} its own {where}.</p>}
          <div className="flex flex-wrap gap-1 items-center">
            <b>Format Page Numbers:</b>
            <select aria-label="Number format" className={sel} value={S.fmt} onChange={e => update(s => ({ ...s, fmt: e.target.value as Fmt }))}>
              {(Object.keys(FMT_LABEL) as Fmt[]).map(f => (
                <option key={f} value={f}>
                  {FMT_LABEL[f]}
                </option>
              ))}
            </select>
            <select aria-label="Page numbering" className={sel} value={S.start === null ? 'continue' : 'start'} onChange={e => update(s => ({ ...s, start: e.target.value === 'continue' ? null : 1 }))}>
              <option value="continue">Continue from previous section</option>
              <option value="start">Start at:</option>
            </select>
            {S.start !== null && (
              <>
                <input aria-label="Start at" type="number" min={1} value={S.start} onChange={e => update(s => ({ ...s, start: Math.max(1, parseInt(e.target.value, 10) || 1) }))} className="w-12 border border-[#c6c6c6] rounded px-1 bg-white" />
                <span className="text-[#555]">= “{format(S.start, S.fmt)}”</span>
              </>
            )}
          </div>
        </div>

        <div className="p-2 bg-[#dfdfdf] grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Array.from({ length: pages }, (_, p) => {
            const s = pageSec[p]
            const h = partText(p, 'header')
            const f = partText(p, 'footer')
            const endOfSec = p < pages - 1 && breaks[p]
            return (
              <div key={p} className="flex flex-col">
                <div onClick={() => setCur(s)} className={`bg-white shadow-sm cursor-pointer flex flex-col text-[9.5px] ${s === cur ? 'ring-2 ring-[#2B579A]' : ''}`} style={{ aspectRatio: '0.72' }}>
                  <div className="flex justify-between gap-1 px-1.5 pt-1 min-h-[16px] border-b border-dashed border-[#c7d2e3] text-[#333]">
                    <span className="truncate">{h.text}</span>
                    <b className="text-[#2B579A]">{h.num}</b>
                  </div>
                  <div className="flex-1 px-1.5 py-1 text-[#555]">
                    <p className="font-semibold text-[#111] text-[10px] leading-tight">{PAGE_NAMES[p]}</p>
                    <div className="mt-1 space-y-1">
                      {[80, 90, 70].map((w, k) => (
                        <div key={k} className="h-[3px] bg-[#e5e7eb]" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                    {marks && endOfSec && <p className="mt-1 text-[8px] text-[#2B579A] leading-tight">::::Section Break (Next Page)::::</p>}
                  </div>
                  <div className="flex justify-center gap-1 px-1.5 pb-1 min-h-[16px] border-t border-dashed border-[#c7d2e3] text-[#333]">
                    <span className="truncate">{f.text}</span>
                    <b className="text-[#2B579A]">{f.num}</b>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#444] mt-0.5 px-0.5">
                  <span>
                    p.{p + 1} · S{s + 1}
                  </span>
                  {p < pages - 1 && (
                    <button onClick={() => toggleBreak(p)} className="text-[#2B579A] font-semibold" title={breaks[p] ? 'Delete this section break' : 'Insert a Next Page section break after this page'}>
                      {breaks[p] ? '✕ break' : '+ break'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="px-2 py-1 text-[10.5px] text-white flex justify-between gap-2" style={{ background: '#2B579A' }}>
          <span>
            {nSecs} section{nSecs > 1 ? 's' : ''} · click a page to edit its section
          </span>
          <span>PAGE LAYOUT → Breaks → Next Page</span>
        </div>
      </div>
    </div>
  )
}
