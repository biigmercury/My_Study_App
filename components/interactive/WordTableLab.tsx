'use client'

import { useState } from 'react'

// Word tables in miniature: Insert Table, typing in cells, TABLE TOOLS LAYOUT (insert/delete rows and
// columns, Merge Cells, Split Cells, alignment, Formula =SUM(ABOVE)/(LEFT) with Update Field) and
// TABLE TOOLS DESIGN (table styles, shading, borders with line weight, View Gridlines).

interface Borders {
  t: number
  r: number
  b: number
  l: number
}
interface TCell {
  text: string
  shade?: string
  align: 'left' | 'center' | 'right'
  valign: 'top' | 'middle' | 'bottom'
  bold?: boolean
  color?: string
  formula?: 'ABOVE' | 'LEFT'
  br: Borders
}
interface Rect {
  r1: number
  c1: number
  r2: number
  c2: number
}
interface Table {
  cells: TCell[][]
  merges: Rect[]
}

const thin: Borders = { t: 0.5, r: 0.5, b: 0.5, l: 0.5 }
const cell = (text = '', extra: Partial<TCell> = {}): TCell => ({ text, align: 'left', valign: 'top', br: { ...thin }, ...extra })
const rect = (r1: number, c1: number, r2 = r1, c2 = c1): Rect => ({ r1: Math.min(r1, r2), c1: Math.min(c1, c2), r2: Math.max(r1, r2), c2: Math.max(c1, c2) })
const inRect = (x: Rect, r: number, c: number) => r >= x.r1 && r <= x.r2 && c >= x.c1 && c <= x.c2
const overlaps = (a: Rect, b: Rect) => a.r1 <= b.r2 && b.r1 <= a.r2 && a.c1 <= b.c2 && b.c1 <= a.c2

const PRESETS: Record<string, () => Table> = {
  coke: () => ({
    cells: [
      [cell('Monthly Sales Analysis of Cocacola', { bold: true, align: 'center' }), cell()],
      [cell('State', { bold: true }), cell('Number of Pack sold', { bold: true })],
      [cell('Oyo'), cell('20,568', { align: 'right' })],
      [cell('Lagos'), cell('42,153', { align: 'right' })],
      [cell('Ogun'), cell('10,007', { align: 'right' })],
    ],
    merges: [rect(0, 0, 0, 1)],
  }),
  food: () => ({
    cells: [
      [cell('Total amount spent on food items by month'), cell(), cell()],
      [cell('Food item'), cell('Month'), cell()],
      [cell(), cell('November'), cell('December')],
      [cell('Bean'), cell('3300'), cell('2300')],
      [cell('Rice'), cell('5000'), cell('8500')],
      [cell('Total'), cell(), cell()],
    ],
    merges: [],
  }),
  blank: () => ({ cells: Array.from({ length: 4 }, () => Array.from({ length: 3 }, () => cell())), merges: [] }),
}

const num = (s: string) => {
  const t = s.replace(/,/g, '').trim()
  return t !== '' && !isNaN(Number(t)) ? Number(t) : null
}

export default function WordTableLab() {
  const [t, setT] = useState<Table>(PRESETS.coke)
  const [hist, setHist] = useState<Table[]>([])
  const [act, setAct] = useState({ r: 2, c: 0 })
  const [ext, setExt] = useState<{ r: number; c: number } | null>(null)
  const [tab, setTab] = useState<'layout' | 'design'>('layout')
  const [weight, setWeight] = useState(0.5)
  const [gridlines, setGridlines] = useState(true)
  const [split, setSplit] = useState<{ cols: string; rows: string } | null>(null)
  const [newSize, setNewSize] = useState({ cols: '3', rows: '4' })
  const [note, setNote] = useState<string | null>(null)

  const R = t.cells.length
  const C = t.cells[0]?.length ?? 0
  const mergeAt = (r: number, c: number) => t.merges.find(m => inRect(m, r, c))
  const sel = (() => {
    let x = ext ? rect(act.r, act.c, ext.r, ext.c) : rect(act.r, act.c)
    for (let grew = true; grew; ) {
      grew = false
      for (const m of t.merges)
        if (overlaps(m, x) && !(inRect(x, m.r1, m.c1) && inRect(x, m.r2, m.c2))) {
          x = rect(Math.min(x.r1, m.r1), Math.min(x.c1, m.c1), Math.max(x.r2, m.r2), Math.max(x.c2, m.c2))
          grew = true
        }
    }
    return x
  })()

  const commit = (next: Table, msg: string | null = null) => {
    setHist(h => [...h.slice(-30), t])
    setT(next)
    setNote(msg)
  }
  const clone = (): Table => ({ cells: t.cells.map(row => row.map(c => ({ ...c, br: { ...c.br } }))), merges: t.merges.map(m => ({ ...m })) })

  const setText = (r: number, c: number, text: string) => {
    const n = clone()
    n.cells[r][c] = { ...n.cells[r][c], text, formula: undefined }
    setT(n)
  }

  // ---------- rows & columns ----------
  const insertRow = (below: boolean) => {
    const at = below ? sel.r2 + 1 : sel.r1
    const n = clone()
    const src = n.cells[below ? sel.r2 : sel.r1]
    n.cells.splice(at, 0, src.map(c => cell('', { br: { ...c.br }, align: c.align, valign: c.valign })))
    n.merges = n.merges.map(m => (at <= m.r1 ? { ...m, r1: m.r1 + 1, r2: m.r2 + 1 } : at <= m.r2 ? { ...m, r2: m.r2 + 1 } : m))
    commit(n)
    setAct({ r: at, c: act.c })
    setExt(null)
  }
  const insertCol = (right: boolean) => {
    const at = right ? sel.c2 + 1 : sel.c1
    const n = clone()
    n.cells.forEach(row => {
      const src = row[right ? sel.c2 : sel.c1]
      row.splice(at, 0, cell('', { br: { ...src.br }, valign: src.valign }))
    })
    n.merges = n.merges.map(m => (at <= m.c1 ? { ...m, c1: m.c1 + 1, c2: m.c2 + 1 } : at <= m.c2 ? { ...m, c2: m.c2 + 1 } : m))
    commit(n)
    setAct({ r: act.r, c: at })
    setExt(null)
  }
  const deleteRows = () => {
    if (sel.r2 - sel.r1 + 1 >= R) return deleteTable()
    const n = clone()
    const k = sel.r2 - sel.r1 + 1
    n.cells.splice(sel.r1, k)
    n.merges = n.merges
      .map(m => {
        if (m.r2 < sel.r1) return m
        if (m.r1 > sel.r2) return { ...m, r1: m.r1 - k, r2: m.r2 - k }
        const r1 = Math.min(m.r1, sel.r1)
        const r2 = m.r2 - Math.max(0, Math.min(m.r2, sel.r2) - Math.max(m.r1, sel.r1) + 1)
        return r2 < r1 ? null : { ...m, r1, r2 }
      })
      .filter((m): m is Rect => !!m && !(m.r1 === m.r2 && m.c1 === m.c2))
    commit(n)
    setAct({ r: Math.min(sel.r1, n.cells.length - 1), c: act.c })
    setExt(null)
  }
  const deleteCols = () => {
    if (sel.c2 - sel.c1 + 1 >= C) return deleteTable()
    const n = clone()
    const k = sel.c2 - sel.c1 + 1
    n.cells.forEach(row => row.splice(sel.c1, k))
    n.merges = n.merges
      .map(m => {
        if (m.c2 < sel.c1) return m
        if (m.c1 > sel.c2) return { ...m, c1: m.c1 - k, c2: m.c2 - k }
        const c1 = Math.min(m.c1, sel.c1)
        const c2 = m.c2 - Math.max(0, Math.min(m.c2, sel.c2) - Math.max(m.c1, sel.c1) + 1)
        return c2 < c1 ? null : { ...m, c1, c2 }
      })
      .filter((m): m is Rect => !!m && !(m.r1 === m.r2 && m.c1 === m.c2))
    commit(n)
    setAct({ r: act.r, c: Math.min(sel.c1, n.cells[0].length - 1) })
    setExt(null)
  }
  const deleteTable = () => {
    commit({ cells: [[cell()]], merges: [] }, 'Table deleted (a 1×1 table is left so you can keep experimenting — Undo brings it back).')
    setAct({ r: 0, c: 0 })
    setExt(null)
  }

  // ---------- merge & split ----------
  const merge = () => {
    if (sel.r1 === sel.r2 && sel.c1 === sel.c2) return setNote('Select two or more cells first: click one cell, then Shift+click another.')
    const n = clone()
    const texts: string[] = []
    for (let r = sel.r1; r <= sel.r2; r++)
      for (let c = sel.c1; c <= sel.c2; c++) {
        if (n.cells[r][c].text) texts.push(n.cells[r][c].text)
        if (r !== sel.r1 || c !== sel.c1) n.cells[r][c] = { ...n.cells[r][c], text: '' }
      }
    n.cells[sel.r1][sel.c1] = { ...n.cells[sel.r1][sel.c1], text: texts.join(' ') }
    n.merges = n.merges.filter(m => !overlaps(m, sel))
    n.merges.push({ ...sel })
    commit(n, texts.length > 1 ? 'Merged — Word keeps the text of every merged cell (each on its own line in real Word).' : 'Cells merged into one.')
    setAct({ r: sel.r1, c: sel.c1 })
    setExt(null)
  }
  const doSplit = (cols: number, rows: number) => {
    const m = mergeAt(act.r, act.c)
    if (m) {
      const n = clone()
      n.merges = n.merges.filter(x => x !== m && !(x.r1 === m.r1 && x.c1 === m.c1 && x.r2 === m.r2 && x.c2 === m.c2))
      commit(n, 'Split the merged cell back into its original cells.')
      return
    }
    if (cols < 1 || rows < 1 || (cols === 1 && rows === 1)) return
    const n = clone()
    const { r, c } = act
    if (cols > 1) {
      n.cells.forEach(row => {
        for (let k = 1; k < cols; k++) row.splice(c + 1, 0, cell('', { br: { ...row[c].br } }))
      })
      n.merges = n.merges.map(x => (c + 1 <= x.c1 ? { ...x, c1: x.c1 + cols - 1, c2: x.c2 + cols - 1 } : c + 1 <= x.c2 ? { ...x, c2: x.c2 + cols - 1 } : x))
      n.merges = n.merges.map(x => (x.c1 <= c && x.c2 === c && !(r >= x.r1 && r <= x.r2) ? { ...x, c2: c + cols - 1 } : x))
      for (let rr = 0; rr < n.cells.length; rr++) {
        if (rr === r) continue
        if (!n.merges.some(x => inRect(x, rr, c))) n.merges.push(rect(rr, c, rr, c + cols - 1))
      }
    }
    if (rows > 1) {
      const width = n.cells[0].length
      for (let k = 1; k < rows; k++) n.cells.splice(r + 1, 0, Array.from({ length: width }, (_, cc) => cell('', { br: { ...n.cells[r][cc].br } })))
      n.merges = n.merges.map(x => (r + 1 <= x.r1 ? { ...x, r1: x.r1 + rows - 1, r2: x.r2 + rows - 1 } : r + 1 <= x.r2 ? { ...x, r2: x.r2 + rows - 1 } : x))
      n.merges = n.merges.map(x => (x.r1 <= r && x.r2 === r && !(c >= x.c1 && c <= x.c2) ? { ...x, r2: r + rows - 1 } : x))
      for (let cc = 0; cc < width; cc++) {
        if (cc >= c && cc < c + cols) continue
        if (!n.merges.some(x => inRect(x, r, cc))) n.merges.push(rect(r, cc, r + rows - 1, cc))
      }
    }
    commit(n, `Split the cell into ${cols} column${cols > 1 ? 's' : ''} × ${rows} row${rows > 1 ? 's' : ''}; the other cells in those rows/columns stay whole.`)
  }

  // ---------- formatting ----------
  const eachSel = (fn: (c: TCell, r: number, cc: number) => TCell, msg: string | null = null) => {
    const n = clone()
    for (let r = sel.r1; r <= sel.r2; r++) for (let c = sel.c1; c <= sel.c2; c++) n.cells[r][c] = fn(n.cells[r][c], r, c)
    commit(n, msg)
  }
  const borders = (kind: 'all' | 'outside' | 'bottom' | 'none') => {
    const n = clone()
    const w = kind === 'none' ? 0 : weight
    const set = (r: number, c: number, side: keyof Borders) => {
      if (r < 0 || c < 0 || r >= n.cells.length || c >= n.cells[0].length) return
      n.cells[r][c].br[side] = w
    }
    for (let r = sel.r1; r <= sel.r2; r++)
      for (let c = sel.c1; c <= sel.c2; c++) {
        const top = r === sel.r1
        const bottom = r === sel.r2
        const left = c === sel.c1
        const right = c === sel.c2
        if (kind === 'all' || kind === 'none' || (kind === 'outside' && top)) {
          set(r, c, 't')
          set(r - 1, c, 'b')
        }
        if (kind === 'all' || kind === 'none' || ((kind === 'outside' || kind === 'bottom') && bottom)) {
          set(r, c, 'b')
          set(r + 1, c, 't')
        }
        if (kind === 'all' || kind === 'none' || (kind === 'outside' && left)) {
          set(r, c, 'l')
          set(r, c - 1, 'r')
        }
        if (kind === 'all' || kind === 'none' || (kind === 'outside' && right)) {
          set(r, c, 'r')
          set(r, c + 1, 'l')
        }
      }
    commit(n)
  }
  const style = (name: string) => {
    const n = clone()
    n.cells = n.cells.map((row, r) =>
      row.map(c => {
        if (name === 'grid') return { ...c, shade: undefined, color: undefined, bold: r === 0 ? c.bold : c.bold, br: { ...thin } }
        if (name === 'plain') return { ...c, shade: undefined, color: undefined, br: { t: 0, r: 0, b: r === 0 ? 1 : 0, l: 0 } }
        // Grid Table 4 – Accent 1
        return { ...c, shade: r === 0 ? '#4472C4' : r % 2 ? '#D9E2F3' : undefined, color: r === 0 ? '#ffffff' : undefined, bold: r === 0 ? true : c.bold, br: { t: 0.5, r: 0.5, b: 0.5, l: 0.5 } }
      })
    )
    commit(n, name === 'accent' ? 'Grid Table 4 – Accent 1: shaded header row and banded rows.' : null)
  }

  // ---------- formulas ----------
  const evalFormula = (cells: TCell[][], r: number, c: number, dir: 'ABOVE' | 'LEFT') => {
    let sum = 0
    let found = false
    if (dir === 'ABOVE')
      for (let rr = r - 1; rr >= 0; rr--) {
        const v = num(cells[rr][c].text)
        if (v === null) {
          if (found) break
          continue
        }
        sum += v
        found = true
      }
    else
      for (let cc = c - 1; cc >= 0; cc--) {
        const v = num(cells[r][cc].text)
        if (v === null) {
          if (found) break
          continue
        }
        sum += v
        found = true
      }
    return String(Math.round(sum * 100) / 100)
  }
  const insertFormula = (dir: 'ABOVE' | 'LEFT') => {
    const n = clone()
    const { r, c } = act
    n.cells[r][c] = { ...n.cells[r][c], formula: dir, text: evalFormula(n.cells, r, c, dir), align: 'right' }
    commit(n, `Inserted the field =SUM(${dir}). Fields do not recalculate by themselves — after changing a number, select the result and press F9 (Update Field).`)
  }
  const updateFields = () => {
    const n = clone()
    let k = 0
    n.cells.forEach((row, r) =>
      row.forEach((c, cc) => {
        if (c.formula) {
          n.cells[r][cc] = { ...c, text: evalFormula(n.cells, r, cc, c.formula) }
          k++
        }
      })
    )
    commit(n, k ? `Updated ${k} field${k === 1 ? '' : 's'}.` : 'There are no formula fields in the table yet.')
  }

  const newTable = () => {
    const cols = Math.max(1, Math.min(8, parseInt(newSize.cols, 10) || 0))
    const rows = Math.max(1, Math.min(12, parseInt(newSize.rows, 10) || 0))
    commit({ cells: Array.from({ length: rows }, () => Array.from({ length: cols }, () => cell())), merges: [] }, `Inserted a ${cols}-column × ${rows}-row table.`)
    setAct({ r: 0, c: 0 })
    setExt(null)
  }

  const w2px = (w: number) => (w <= 0 ? 0 : w <= 0.75 ? 1 : w <= 1.5 ? 2 : w <= 2.25 ? 3 : w <= 3 ? 4 : 6)
  const b = 'px-2 py-1 rounded border border-[#c6c6c6] bg-white text-[11.5px] text-[#222] hover:border-[#2B579A]'
  const selCls = 'border border-[#c6c6c6] rounded bg-white px-1 py-0.5 text-[11.5px] text-[#222]'
  const cur = t.cells[act.r]?.[act.c]

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex flex-wrap items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">▦ Word table lab</p>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-brand-deep dark:text-brand-sky">
          <button
            onClick={() => {
              if (!hist.length) return
              setT(hist[hist.length - 1])
              setHist(h => h.slice(0, -1))
            }}
            disabled={!hist.length}
            className="disabled:opacity-40"
          >
            ↶ Undo
          </button>
          <select
            aria-label="Load a table"
            className="bg-transparent"
            value=""
            onChange={e => {
              const k = e.target.value
              if (!k) return
              commit(PRESETS[k](), null)
              setAct({ r: 0, c: 0 })
              setExt(null)
            }}
          >
            <option value="">Load…</option>
            <option value="coke">Coca-Cola sales (notes)</option>
            <option value="food">Post-test: food by month</option>
            <option value="blank">Blank 3 × 4</option>
          </select>
        </div>
      </div>

      <div className="m-3 rounded-md border border-[#b8b8b8] overflow-hidden bg-[#f3f3f3] text-[#222]" style={{ fontFamily: '"Segoe UI", Calibri, Arial, sans-serif' }}>
        <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-[#d4d4d4] text-[11.5px]">
          <span className="font-semibold text-[#2B579A] mr-1">INSERT › Table:</span>
          <input aria-label="Number of columns" value={newSize.cols} onChange={e => setNewSize(s => ({ ...s, cols: e.target.value }))} className="w-9 border border-[#c6c6c6] rounded px-1 bg-white" />
          columns ×
          <input aria-label="Number of rows" value={newSize.rows} onChange={e => setNewSize(s => ({ ...s, rows: e.target.value }))} className="w-9 border border-[#c6c6c6] rounded px-1 bg-white" />
          rows
          <button onClick={newTable} className={b}>
            Insert Table
          </button>
        </div>
        <div className="flex text-[11px] font-semibold" style={{ background: '#2B579A' }}>
          <span className="px-2 py-1 text-white/80">TABLE TOOLS</span>
          {(['design', 'layout'] as const).map(x => (
            <button key={x} onClick={() => setTab(x)} className={`px-3 py-1 ${tab === x ? 'bg-[#f3f3f3] text-[#2B579A]' : 'text-white hover:bg-white/10'}`}>
              {x.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="px-2 py-2 border-b border-[#d4d4d4] flex flex-wrap gap-1 items-center text-[11.5px]">
          {tab === 'layout' ? (
            <>
              <button className={b} onClick={() => insertRow(false)}>
                Insert Above
              </button>
              <button className={b} onClick={() => insertRow(true)}>
                Insert Below
              </button>
              <button className={b} onClick={() => insertCol(false)}>
                Insert Left
              </button>
              <button className={b} onClick={() => insertCol(true)}>
                Insert Right
              </button>
              <select
                aria-label="Delete"
                className={selCls}
                value=""
                onChange={e => {
                  const v = e.target.value
                  if (v === 'rows') deleteRows()
                  if (v === 'cols') deleteCols()
                  if (v === 'table') deleteTable()
                }}
              >
                <option value="">Delete ▾</option>
                <option value="rows">Delete Rows</option>
                <option value="cols">Delete Columns</option>
                <option value="table">Delete Table</option>
              </select>
              <button className={b} onClick={merge}>
                Merge Cells
              </button>
              <button className={b} onClick={() => (mergeAt(act.r, act.c) ? doSplit(1, 1) : setSplit({ cols: '2', rows: '1' }))}>
                Split Cells
              </button>
              <select aria-label="Horizontal alignment" className={selCls} value={cur?.align ?? 'left'} onChange={e => eachSel(c => ({ ...c, align: e.target.value as TCell['align'] }))}>
                <option value="left">Align Left</option>
                <option value="center">Align Center</option>
                <option value="right">Align Right</option>
              </select>
              <select aria-label="Vertical alignment" className={selCls} value={cur?.valign ?? 'top'} onChange={e => eachSel(c => ({ ...c, valign: e.target.value as TCell['valign'] }))}>
                <option value="top">Top</option>
                <option value="middle">Middle</option>
                <option value="bottom">Bottom</option>
              </select>
              <select
                aria-label="Formula"
                className={selCls}
                value=""
                onChange={e => {
                  const v = e.target.value
                  if (v === 'ABOVE' || v === 'LEFT') insertFormula(v)
                  if (v === 'update') updateFields()
                }}
              >
                <option value="">fx Formula ▾</option>
                <option value="ABOVE">=SUM(ABOVE)</option>
                <option value="LEFT">=SUM(LEFT)</option>
                <option value="update">Update Field (F9)</option>
              </select>
            </>
          ) : (
            <>
              <select
                aria-label="Table Styles"
                className={selCls}
                value=""
                onChange={e => {
                  if (e.target.value) style(e.target.value)
                }}
              >
                <option value="">Table Styles ▾</option>
                <option value="grid">Table Grid</option>
                <option value="plain">Plain Table</option>
                <option value="accent">Grid Table 4 – Accent 1</option>
              </select>
              <select aria-label="Shading" className={selCls} value="" onChange={e => eachSel(c => ({ ...c, shade: e.target.value === 'none' ? undefined : e.target.value }))}>
                <option value="">Shading ▾</option>
                <option value="none">No Colour</option>
                <option value="#BFBFBF">White, Darker 25%</option>
                <option value="#F2F2F2">White, Darker 5%</option>
                <option value="#DEEBF7">Blue, Lighter 80%</option>
                <option value="#FFF2CC">Gold, Lighter 80%</option>
              </select>
              <select aria-label="Line weight" className={selCls} value={weight} onChange={e => setWeight(Number(e.target.value))}>
                {[0.25, 0.5, 0.75, 1, 1.5, 2.25, 3, 4.5].map(w => (
                  <option key={w} value={w}>
                    {w === 4.5 ? '4½' : w === 2.25 ? '2¼' : w === 1.5 ? '1½' : w === 0.75 ? '¾' : w === 0.5 ? '½' : w === 0.25 ? '¼' : w} pt
                  </option>
                ))}
              </select>
              <button className={b} onClick={() => borders('all')}>
                All Borders
              </button>
              <button className={b} onClick={() => borders('outside')}>
                Outside Borders
              </button>
              <button className={b} onClick={() => borders('bottom')}>
                Bottom Border
              </button>
              <button className={b} onClick={() => borders('none')}>
                No Border
              </button>
              <label className="flex items-center gap-1 ml-1">
                <input type="checkbox" checked={gridlines} onChange={e => setGridlines(e.target.checked)} /> View Gridlines
              </label>
              <button className={b} onClick={() => eachSel(c => ({ ...c, bold: !cur?.bold }))}>
                <b>B</b> Bold
              </button>
            </>
          )}
        </div>
        {split && (
          <div className="px-3 py-2 border-b border-[#d4d4d4] bg-white text-[12px] flex flex-wrap items-center gap-2">
            <b>Split Cells</b>
            Number of columns: <input value={split.cols} onChange={e => setSplit({ ...split, cols: e.target.value })} className="w-10 border border-[#aaa] px-1" />
            Number of rows: <input value={split.rows} onChange={e => setSplit({ ...split, rows: e.target.value })} className="w-10 border border-[#aaa] px-1" />
            <button
              className={b}
              onClick={() => {
                doSplit(Math.min(4, parseInt(split.cols, 10) || 1), Math.min(4, parseInt(split.rows, 10) || 1))
                setSplit(null)
              }}
            >
              OK
            </button>
            <button className={b} onClick={() => setSplit(null)}>
              Cancel
            </button>
          </div>
        )}

        <div className="p-3 bg-[#dfdfdf] overflow-x-auto">
          <div className="bg-white p-4 min-w-fit shadow-sm">
            <table style={{ borderCollapse: 'collapse', fontFamily: 'Calibri, Carlito, "Segoe UI", Arial, sans-serif', fontSize: 14, color: '#111' }}>
              <tbody>
                {t.cells.map((row, r) => (
                  <tr key={r}>
                    {row.map((c, cc) => {
                      const m = mergeAt(r, cc)
                      if (m && (m.r1 !== r || m.c1 !== cc)) return null
                      const r2 = m ? m.r2 : r
                      const c2 = m ? m.c2 : cc
                      const edge = (w: number) => (w > 0 ? `${w2px(w)}px solid #000` : gridlines ? '1px dashed #9ec3e6' : '1px solid transparent')
                      const bottomCell = t.cells[r2][cc]
                      const rightCell = t.cells[r][c2]
                      const selected = inRect(sel, r, cc)
                      return (
                        <td
                          key={cc}
                          rowSpan={r2 - r + 1}
                          colSpan={c2 - cc + 1}
                          onMouseDown={e => {
                            if (e.shiftKey) {
                              e.preventDefault()
                              setExt({ r, c: cc })
                            } else {
                              setAct({ r, c: cc })
                              setExt(null)
                            }
                          }}
                          style={{
                            borderTop: edge(c.br.t),
                            borderLeft: edge(c.br.l),
                            borderBottom: edge(bottomCell.br.b),
                            borderRight: edge(rightCell.br.r),
                            background: selected && (sel.r1 !== sel.r2 || sel.c1 !== sel.c2) ? 'linear-gradient(rgba(43,87,154,.18),rgba(43,87,154,.18))' + (c.shade ? `, ${c.shade}` : '') : c.shade,
                            verticalAlign: c.valign,
                            padding: 0,
                            minWidth: 80,
                            height: 26 * (r2 - r + 1),
                          }}
                        >
                          <input
                            aria-label={`Cell row ${r + 1} column ${cc + 1}`}
                            value={c.text}
                            onChange={e => setText(r, cc, e.target.value)}
                            onFocus={() => {
                              if (!ext) setAct({ r, c: cc })
                            }}
                            className="w-full bg-transparent outline-none px-1.5 py-0.5"
                            style={{ textAlign: c.align, fontWeight: c.bold ? 700 : 400, color: c.color, minWidth: 76, boxShadow: act.r === r && act.c === cc ? 'inset 0 0 0 1px #2B579A' : undefined }}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="px-2 py-1 text-[10.5px] text-white" style={{ background: '#2B579A' }}>
          Cell {act.r + 1},{act.c + 1}
          {sel.r1 !== sel.r2 || sel.c1 !== sel.c2 ? ` · selection ${sel.r2 - sel.r1 + 1} × ${sel.c2 - sel.c1 + 1} cells` : ''} · Shift+click another cell to select a block
        </div>
      </div>
      {note && <p className="mx-3 mb-3 -mt-1 px-3 py-2 rounded-lg text-[12px] bg-brand-sky/10 border border-brand-sky/30">{note}</p>}
    </div>
  )
}
