'use client'

import { useMemo, useState } from 'react'

// Word's Find and Replace dialog (Find, Replace, Go To tabs) on a three-page document about Nigerian
// teaching hospitals: highlights every match, Find Next, Replace, Replace All with Word's messages,
// and the More >> options Match case and Find whole words only.

const PAGES = [
  {
    heading: 'Teaching Hospitals in Nigeria',
    text: 'A teaching hospital combines patient care with the training of doctors, nurses and other health workers. The oldest is UCH, which opened in 1957. Much of the country’s medical research still comes from UCH and similar hospitals, such as UNTH in Enugu.',
  },
  {
    heading: 'University College Hospital',
    text: 'UCH is linked to the University of Ibadan College of Medicine. Such hospitals receive patients referred from general hospitals. At UCH, students rotate through medicine, surgery, paediatrics and obstetrics. The hospital elections for the medical students’ association hold every year.',
  },
  {
    heading: 'Challenges',
    text: 'Teaching hospitals face heavy workloads, ageing equipment and the loss of staff abroad. Even so, uch facilities remain the backbone of specialist care, and UCH continues to train doctors for the whole country.',
  },
]

interface Hit {
  page: number
  start: number
  end: number
}

function findAll(pages: string[], what: string, matchCase: boolean, whole: boolean): Hit[] {
  if (!what) return []
  const esc = what.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(whole ? `(?<![\\p{L}\\p{N}_])${esc}(?![\\p{L}\\p{N}_])` : esc, matchCase ? 'gu' : 'giu')
  const out: Hit[] = []
  pages.forEach((t, page) => {
    for (const m of t.matchAll(re)) out.push({ page, start: m.index!, end: m.index! + m[0].length })
  })
  return out
}

export default function FindReplaceDemo() {
  const [texts, setTexts] = useState(PAGES.map(p => p.text))
  const [tab, setTab] = useState<'find' | 'replace' | 'goto'>('replace')
  const [what, setWhat] = useState('UCH')
  const [withText, setWithText] = useState('University College Hospital, Ibadan')
  const [more, setMore] = useState(true)
  const [matchCase, setMatchCase] = useState(false)
  const [whole, setWhole] = useState(false)
  const [cur, setCur] = useState<Hit | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [gotoPage, setGotoPage] = useState('2')
  const [flash, setFlash] = useState<number | null>(null)

  const hits = useMemo(() => findAll(texts, what, matchCase, whole), [texts, what, matchCase, whole])

  const after = (h: Hit | null) => {
    if (!hits.length) return null
    if (!h) return hits[0]
    return hits.find(x => x.page > h.page || (x.page === h.page && x.start >= h.end)) ?? null
  }

  const findNext = () => {
    setMsg(null)
    if (!hits.length) return setMsg('The search item was not found.')
    const n = after(cur)
    if (!n) {
      setCur(null)
      return setMsg('Word has finished searching the document.')
    }
    setCur(n)
  }

  const replaceOne = () => {
    setMsg(null)
    const isCur = cur && hits.some(h => h.page === cur.page && h.start === cur.start)
    if (!isCur) return findNext()
    const t = texts[cur!.page]
    const next = [...texts]
    next[cur!.page] = t.slice(0, cur!.start) + withText + t.slice(cur!.end)
    setTexts(next)
    const moved = { page: cur!.page, start: cur!.start, end: cur!.start + withText.length }
    const again = findAll(next, what, matchCase, whole).find(x => x.page > moved.page || (x.page === moved.page && x.start >= moved.end)) ?? null
    setCur(again)
    if (!again) setMsg('Word has finished searching the document.')
  }

  const replaceAll = () => {
    if (!hits.length) return setMsg('The search item was not found.')
    const next = texts.map((t, page) => {
      const mine = hits.filter(h => h.page === page)
      let out = ''
      let pos = 0
      for (const h of mine) {
        out += t.slice(pos, h.start) + withText
        pos = h.end
      }
      return out + t.slice(pos)
    })
    setTexts(next)
    setCur(null)
    setMsg(`Word has completed its search of the document and has made ${hits.length} replacement${hits.length === 1 ? '' : 's'}.`)
  }

  const goTo = () => {
    const n = parseInt(gotoPage, 10)
    if (!(n >= 1 && n <= PAGES.length)) return setMsg(`Enter a page number between 1 and ${PAGES.length}.`)
    setFlash(n - 1)
    setMsg(null)
    setTimeout(() => setFlash(null), 1400)
    document.getElementById(`fr-page-${n - 1}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  const render = (t: string, page: number) => {
    const mine = hits.filter(h => h.page === page)
    const out: React.ReactNode[] = []
    let pos = 0
    mine.forEach((h, i) => {
      out.push(t.slice(pos, h.start))
      const isCur = cur && cur.page === h.page && cur.start === h.start
      out.push(
        <mark key={i} style={{ background: isCur ? '#3390ff' : '#ffec80', color: isCur ? '#fff' : 'inherit', borderRadius: 2 }}>
          {t.slice(h.start, h.end)}
        </mark>
      )
      pos = h.end
    })
    out.push(t.slice(pos))
    return out
  }

  const btn = 'px-3 py-1 rounded-sm border border-[#adadad] bg-[#e1e1e1] hover:bg-[#e5f1fb] hover:border-[#0078d7] text-[12px] text-[#111] min-w-[84px]'

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🔎 Find and Replace</p>
        <button
          onClick={() => {
            setTexts(PAGES.map(p => p.text))
            setCur(null)
            setMsg(null)
          }}
          className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky"
        >
          Reset document
        </button>
      </div>

      <div className="m-3 grid gap-3 md:grid-cols-[1fr_330px]">
        {/* document */}
        <div className="rounded-md bg-[#dfdfdf] p-2 space-y-2 max-h-[360px] overflow-auto text-[#111]" style={{ fontFamily: 'Calibri, Carlito, "Segoe UI", Arial, sans-serif' }}>
          {PAGES.map((pg, i) => (
            <div key={i} id={`fr-page-${i}`} className="bg-white shadow-sm px-4 py-3 transition-shadow" style={{ boxShadow: flash === i ? '0 0 0 3px #2B579A' : undefined }}>
              <p className="text-[10px] text-[#888] text-right">Page {i + 1}</p>
              <p className="text-[15px] font-semibold text-[#2B579A] mb-1">{pg.heading}</p>
              <p className="text-[13.5px] leading-relaxed">{render(texts[i], i)}</p>
            </div>
          ))}
        </div>

        {/* dialog */}
        <div className="rounded-md border border-[#999] bg-[#f0f0f0] text-[12.5px] text-[#111] self-start shadow" style={{ fontFamily: '"Segoe UI", Arial, sans-serif' }}>
          <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b border-[#ddd]">
            <span>Find and Replace</span>
            <span className="text-[#777]">✕</span>
          </div>
          <div className="flex gap-0.5 px-2 pt-2">
            {(['find', 'replace', 'goto'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 border border-b-0 rounded-t ${tab === t ? 'bg-white border-[#adadad]' : 'border-transparent text-[#444]'}`}>
                {t === 'find' ? 'Find' : t === 'replace' ? 'Replace' : 'Go To'}
              </button>
            ))}
          </div>
          <div className="bg-white border-t border-[#adadad] mx-2 mb-2 p-3 space-y-2">
            {tab !== 'goto' ? (
              <>
                <label className="flex items-center gap-2">
                  <span className="w-[84px] shrink-0">Find what:</span>
                  <input
                    value={what}
                    onChange={e => {
                      setWhat(e.target.value)
                      setCur(null)
                      setMsg(null)
                    }}
                    className="flex-1 min-w-0 border border-[#7a7a7a] px-1.5 py-0.5"
                  />
                </label>
                {tab === 'replace' && (
                  <label className="flex items-center gap-2">
                    <span className="w-[84px] shrink-0">Replace with:</span>
                    <input value={withText} onChange={e => setWithText(e.target.value)} className="flex-1 min-w-0 border border-[#7a7a7a] px-1.5 py-0.5" />
                  </label>
                )}
                <p className="text-[11.5px] text-[#555]">
                  {hits.length} match{hits.length === 1 ? '' : 'es'} highlighted in the document (as in the Navigation pane).
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setMore(m => !m)} className={btn}>
                    {more ? '<< Less' : 'More >>'}
                  </button>
                  {tab === 'replace' && (
                    <>
                      <button onClick={replaceOne} className={btn}>
                        Replace
                      </button>
                      <button onClick={replaceAll} className={btn}>
                        Replace All
                      </button>
                    </>
                  )}
                  <button onClick={findNext} className={btn}>
                    Find Next
                  </button>
                </div>
                {more && (
                  <div className="pt-1 border-t border-[#e5e5e5] space-y-1">
                    <p className="text-[11px] text-[#555]">Search Options</p>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={matchCase}
                        onChange={e => {
                          setMatchCase(e.target.checked)
                          setCur(null)
                        }}
                      />
                      Match case
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={whole}
                        onChange={e => {
                          setWhole(e.target.checked)
                          setCur(null)
                        }}
                      />
                      Find whole words only
                    </label>
                  </div>
                )}
              </>
            ) : (
              <>
                <label className="flex items-center gap-2">
                  <span className="w-[84px] shrink-0">Go to what:</span>
                  <select className="flex-1 border border-[#7a7a7a] px-1 py-0.5" defaultValue="Page">
                    <option>Page</option>
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-[84px] shrink-0">Enter page number:</span>
                  <input value={gotoPage} onChange={e => setGotoPage(e.target.value)} className="flex-1 min-w-0 border border-[#7a7a7a] px-1.5 py-0.5" />
                </label>
                <div className="flex gap-1.5">
                  <button onClick={goTo} className={btn}>
                    Go To
                  </button>
                  <button onClick={() => setGotoPage(String(Math.max(1, (parseInt(gotoPage, 10) || 1) - 1)))} className={btn}>
                    Previous
                  </button>
                </div>
              </>
            )}
            {msg && (
              <div className="mt-1 px-2 py-1.5 border border-[#999] bg-[#fafafa] text-[12px]">
                <b>Microsoft Word</b>
                <br />
                {msg}
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="px-4 pb-3 -mt-1 text-[11.5px] text-brand-navy/70 dark:text-white/70">
        Try: search <b>UCH</b> with and without <b>Match case</b> (it also finds “uch” in <i>much</i> and <i>such</i>), then tick <b>Find whole words only</b>. Use Find Next + Replace to check each one, or Replace All once the options are right.
      </p>
    </div>
  )
}
