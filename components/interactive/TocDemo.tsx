'use client'

import { useState } from 'react'

// Table of contents, list of figures and list of tables built the Word way: from heading styles and
// captions. The generated tables are snapshots — edit the document and they go out of date until you
// use Update Table (page numbers only, or the entire table).

type Style = 'Title' | 'Heading 1' | 'Heading 2' | 'Heading 3' | 'Normal' | 'Caption'
interface Para {
  id: number
  style: Style
  text: string
  breakBefore: boolean
}
interface Entry {
  id: number
  level: number
  text: string
  page: number
}

const START: Para[] = [
  { id: 1, style: 'Title', text: 'Information Management in Nigerian Hospitals', breakBefore: false },
  { id: 2, style: 'Normal', text: 'A CSC 272 term paper', breakBefore: false },
  { id: 3, style: 'Heading 1', text: 'Chapter One: Introduction', breakBefore: true },
  { id: 4, style: 'Heading 2', text: 'Background of the Study', breakBefore: false },
  { id: 5, style: 'Heading 2', text: 'Statement of the Problem', breakBefore: false },
  { id: 6, style: 'Caption', text: 'Figure 1: A hospital records room', breakBefore: false },
  { id: 7, style: 'Heading 1', text: 'Chapter Two: Literature Review', breakBefore: true },
  { id: 8, style: 'Normal', text: 'electronic health records', breakBefore: false },
  { id: 9, style: 'Caption', text: 'Table 1: Hospitals surveyed', breakBefore: false },
  { id: 10, style: 'Heading 1', text: 'Chapter Three: Methodology', breakBefore: true },
  { id: 11, style: 'Caption', text: 'Figure 2: Proposed system architecture', breakBefore: false },
  { id: 12, style: 'Caption', text: 'Table 2: Respondents by state', breakBefore: false },
  { id: 13, style: 'Heading 1', text: 'References', breakBefore: true },
]
const STYLES: Style[] = ['Title', 'Heading 1', 'Heading 2', 'Heading 3', 'Normal', 'Caption']
const LOOK: Record<Style, React.CSSProperties> = {
  Title: { fontSize: 20, fontWeight: 300, color: '#1f3864' },
  'Heading 1': { fontSize: 16, color: '#2E74B5' },
  'Heading 2': { fontSize: 14, color: '#2E74B5' },
  'Heading 3': { fontSize: 13, color: '#1F4D78' },
  Normal: { fontSize: 13 },
  Caption: { fontSize: 11.5, fontStyle: 'italic', color: '#44546A' },
}

export default function TocDemo() {
  const [paras, setParas] = useState<Para[]>(START)
  const [levels, setLevels] = useState(3)
  const [toc, setToc] = useState<Entry[] | null>(null)
  const [figs, setFigs] = useState<{ label: 'Figure' | 'Table'; entries: Entry[] }[]>([])
  const [nextId, setNextId] = useState(20)
  const [msg, setMsg] = useState<string | null>(null)

  // front matter: TOC on page 2 onwards is not modelled; page numbers come from the page breaks
  const pageOf = (() => {
    const m = new Map<number, number>()
    let page = 1
    paras.forEach((p, i) => {
      if (i > 0 && p.breakBefore) page++
      m.set(p.id, page)
    })
    return m
  })()
  const headings = (): Entry[] =>
    paras
      .filter(p => p.style.startsWith('Heading') && Number(p.style.slice(-1)) <= levels)
      .map(p => ({ id: p.id, level: Number(p.style.slice(-1)), text: p.text, page: pageOf.get(p.id)! }))
  const captions = (label: 'Figure' | 'Table'): Entry[] =>
    paras.filter(p => p.style === 'Caption' && p.text.trim().startsWith(label)).map(p => ({ id: p.id, level: 1, text: p.text, page: pageOf.get(p.id)! }))

  const same = (a: Entry[], b: Entry[]) => JSON.stringify(a.map(e => [e.text, e.page, e.level])) === JSON.stringify(b.map(e => [e.text, e.page, e.level]))
  const tocStale = toc && !same(toc, headings())
  const figStale = figs.some(f => !same(f.entries, captions(f.label)))

  const updateNumbersOnly = () => {
    if (!toc) return
    setToc(toc.map(e => ({ ...e, page: pageOf.get(e.id) ?? e.page })))
    setMsg('Updated page numbers only — renamed headings keep their OLD text and new headings are missing. Use "Update entire table" after changing headings.')
  }
  const updateAll = () => {
    if (toc) setToc(headings())
    setFigs(fs => fs.map(f => ({ ...f, entries: captions(f.label) })))
    setMsg('Entire table rebuilt from the current headings and captions.')
  }

  const set = (id: number, patch: Partial<Para>) => setParas(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)))
  const addPara = () => {
    setParas(ps => {
      const i = ps.length - 1
      return [...ps.slice(0, i), { id: nextId, style: 'Heading 2', text: 'Data Collection', breakBefore: false }, ...ps.slice(i)]
    })
    setNextId(n => n + 1)
  }

  const list = (entries: Entry[]) => (
    <div className="space-y-0.5">
      {entries.map(e => (
        <div key={e.id} className="flex items-baseline gap-1 text-[12.5px]" style={{ paddingLeft: (e.level - 1) * 16 }}>
          <span className={e.level === 1 ? 'font-semibold' : ''}>{e.text}</span>
          <span className="flex-1 border-b border-dotted border-[#666] translate-y-[-3px]" />
          <span>{e.page}</span>
        </div>
      ))}
      {!entries.length && <p className="text-[12px] text-[#9a3412]">No entries found. (Word would say: “No table of contents entries found.”)</p>}
    </div>
  )

  const btn = 'px-2 py-1 rounded border border-[#c6c6c6] bg-white text-[11.5px] text-[#222] hover:border-[#2B579A]'

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">📚 Table of contents &amp; lists of figures/tables</p>
        <button
          onClick={() => {
            setParas(START)
            setToc(null)
            setFigs([])
            setMsg(null)
          }}
          className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky"
        >
          Reset
        </button>
      </div>

      <div className="m-3 rounded-md border border-[#b8b8b8] overflow-hidden bg-[#f3f3f3] text-[#222]" style={{ fontFamily: '"Segoe UI", Calibri, Arial, sans-serif' }}>
        <div className="px-2 py-1 text-[11px] font-semibold text-white" style={{ background: '#2B579A' }}>
          REFERENCES tab
        </div>
        <div className="px-2 py-2 flex flex-wrap gap-1 items-center border-b border-[#d4d4d4] text-[11.5px]">
          <button
            className={btn}
            onClick={() => {
              setToc(headings())
              setMsg(null)
            }}
          >
            Table of Contents → Automatic Table
          </button>
          <label>
            Show levels{' '}
            <select value={levels} onChange={e => setLevels(Number(e.target.value))} className="border border-[#c6c6c6] rounded bg-white px-1">
              {[1, 2, 3].map(n => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <select
            aria-label="Update Table"
            className="border border-[#c6c6c6] rounded bg-white px-1 py-0.5"
            value=""
            onChange={e => {
              if (e.target.value === 'numbers') updateNumbersOnly()
              if (e.target.value === 'all') updateAll()
            }}
          >
            <option value="">Update Table…</option>
            <option value="numbers">Update page numbers only</option>
            <option value="all">Update entire table</option>
          </select>
          <select
            aria-label="Insert Table of Figures"
            className="border border-[#c6c6c6] rounded bg-white px-1 py-0.5"
            value=""
            onChange={e => {
              const label = e.target.value as 'Figure' | 'Table'
              if (!label) return
              setFigs(fs => [...fs.filter(f => f.label !== label), { label, entries: captions(label) }])
            }}
          >
            <option value="">Insert Table of Figures…</option>
            <option value="Figure">Caption label: Figure → List of Figures</option>
            <option value="Table">Caption label: Table → List of Tables</option>
          </select>
        </div>

        {(toc || figs.length > 0) && (
          <div className="p-3 bg-white border-b border-[#d4d4d4] space-y-3" style={{ fontFamily: 'Calibri, Carlito, "Segoe UI", Arial, sans-serif' }}>
            {(tocStale || figStale) && <p className="text-[11.5px] px-2 py-1 rounded bg-amber-50 border border-amber-300 text-amber-900">The document has changed — these tables are now out of date until you click Update Table.</p>}
            {toc && (
              <div>
                <p className="text-[15px] text-[#2E74B5] mb-1">Contents</p>
                {list(toc)}
              </div>
            )}
            {figs.map(f => (
              <div key={f.label}>
                <p className="text-[15px] text-[#2E74B5] mb-1">List of {f.label === 'Figure' ? 'Figures' : 'Tables'}</p>
                {list(f.entries)}
              </div>
            ))}
          </div>
        )}

        <div className="p-2 space-y-1 max-h-[340px] overflow-auto">
          {paras.map((p, i) => (
            <div key={p.id}>
              {i > 0 && p.breakBefore && <p className="text-[9.5px] text-[#2B579A] text-center">·········· Page Break ·········· page {pageOf.get(p.id)}</p>}
              <div className="flex items-center gap-1.5 bg-white px-2 py-1 border border-[#e5e5e5]">
                <select aria-label={`Style of paragraph ${i + 1}`} value={p.style} onChange={e => set(p.id, { style: e.target.value as Style })} className="text-[11px] border border-[#c6c6c6] rounded bg-white px-0.5 w-[88px] shrink-0">
                  {STYLES.map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <input aria-label={`Text of paragraph ${i + 1}`} value={p.text} onChange={e => set(p.id, { text: e.target.value })} className="flex-1 min-w-0 outline-none bg-transparent" style={{ ...LOOK[p.style], fontFamily: 'Calibri, Carlito, "Segoe UI", Arial, sans-serif' }} />
                {i > 0 && (
                  <button onClick={() => set(p.id, { breakBefore: !p.breakBefore })} title={p.breakBefore ? 'Remove the page break before this paragraph' : 'Insert a page break before this paragraph (Ctrl+Enter)'} className="text-[10px] text-[#2B579A] shrink-0">
                    {p.breakBefore ? '✕ break' : '+ break'}
                  </button>
                )}
              </div>
            </div>
          ))}
          <button className={btn} onClick={addPara}>
            + Add a Heading 2 paragraph before References
          </button>
        </div>
      </div>
      {msg && <p className="mx-3 mb-3 -mt-1 px-3 py-2 rounded-lg text-[12px] bg-brand-sky/10 border border-brand-sky/30">{msg}</p>}
    </div>
  )
}
