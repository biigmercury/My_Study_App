'use client'

import { isValidElement, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Label } from 'recharts'

// Excel-style chart builder for the CSC 272 charts lesson: edit the data, pick a chart type, switch
// row/column, and toggle chart elements (title, axis titles, legend, data labels, gridlines).
// Data comes from a ```chart fence: first row = headings, first column = categories, cells split by |.
// Optional lines: @type column|bar|line|pie, @title …, @x …, @y …

function collect(node: React.ReactNode, out: string[]) {
  if (Array.isArray(node)) return node.forEach(n => collect(n, out))
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (props.className === 'language-chart' && typeof props.children === 'string') {
    out.push(props.children)
    return
  }
  collect(props.children, out)
}

type ChartType = 'column' | 'bar' | 'line' | 'pie'
const PALETTES: [string, string[]][] = [
  ['Office', ['#5B9BD5', '#ED7D31', '#A5A5A5', '#FFC000', '#4472C4', '#70AD47']],
  ['Monochrome blue', ['#1F4E79', '#2E75B6', '#5B9BD5', '#9DC3E6', '#BDD7EE', '#DEEBF7']],
  ['Colourful', ['#70AD47', '#FFC000', '#C00000', '#7030A0', '#00B0F0', '#ED7D31']],
]
const USE: Record<ChartType, string> = {
  column: 'Column charts compare values across categories — e.g. sales of each product, number of students in each score range.',
  bar: 'Bar charts are column charts turned sideways — good when category names are long or for rankings.',
  line: 'Line charts show a trend over time (months, years) — the categories should be in time order.',
  pie: 'Pie charts show the parts of one whole. They can show only ONE data series; slices are each value’s % of the total.',
}

export default function ChartBuilder({ title, children }: { title?: string; children?: React.ReactNode }) {
  const initial = useMemo(() => {
    const out: string[] = []
    collect(children, out)
    const meta: Record<string, string> = {}
    const rows: string[][] = []
    for (const line of out.join('\n').replace(/\r/g, '').split('\n')) {
      const m = /^@(\w+)\s+(.*)$/.exec(line.trim())
      if (m) meta[m[1]] = m[2].trim()
      else if (line.trim()) rows.push(line.split('|').map(s => s.trim()))
    }
    return { rows, meta }
  }, [children])

  const [grid, setGrid] = useState(initial.rows)
  const [type, setType] = useState<ChartType>((initial.meta.type as ChartType) || 'column')
  const [switched, setSwitched] = useState(false)
  const [showTitle, setShowTitle] = useState(true)
  const [chartTitle, setChartTitle] = useState(initial.meta.title ?? 'Chart Title')
  const [axisTitles, setAxisTitles] = useState(!!(initial.meta.x || initial.meta.y))
  const [xTitle, setXTitle] = useState(initial.meta.x ?? 'Axis Title')
  const [yTitle, setYTitle] = useState(initial.meta.y ?? 'Axis Title')
  const [legend, setLegend] = useState<'right' | 'bottom' | 'top' | 'none'>('bottom')
  const [labels, setLabels] = useState(false)
  const [gridlines, setGridlines] = useState(true)
  const [palette, setPalette] = useState(0)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const header = grid[0] ?? []
  const body = grid.slice(1)
  const num = (s: string) => {
    const n = parseFloat((s ?? '').replace(/[,₦%]/g, ''))
    return Number.isFinite(n) ? n : 0
  }
  const categories = switched ? header.slice(1) : body.map(r => r[0])
  const seriesNames = switched ? body.map(r => r[0]) : header.slice(1)
  const value = (cat: number, ser: number) => (switched ? num(body[ser]?.[cat + 1]) : num(body[cat]?.[ser + 1]))
  const data = categories.map((c, i) => {
    const row: Record<string, string | number> = { name: c || `(${i + 1})` }
    seriesNames.forEach((s, j) => (row[s || `Series${j + 1}`] = value(i, j)))
    return row
  })
  const keys = seriesNames.map((s, j) => s || `Series${j + 1}`)
  const colors = PALETTES[palette][1]
  const total = data.reduce((s, d) => s + Number(d[keys[0]] ?? 0), 0)

  const setCell = (r: number, c: number, v: string) => setGrid(g => g.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)))
  const addRow = () => setGrid(g => [...g, g[0].map((_, j) => (j === 0 ? `Item ${g.length}` : '0'))])
  const addCol = () => setGrid(g => g.map((row, i) => [...row, i === 0 ? `Series ${row.length}` : '0']))
  const removeRow = (r: number) => setGrid(g => (g.length > 2 ? g.filter((_, i) => i !== r) : g))

  const axisTick = { fontSize: 11, fill: '#595959' }
  const legendEl =
    legend !== 'none' && type !== 'pie' ? (
      <Legend verticalAlign={legend === 'right' ? 'middle' : legend} align={legend === 'right' ? 'right' : 'center'} layout={legend === 'right' ? 'vertical' : 'horizontal'} wrapperStyle={{ fontSize: 11, paddingTop: legend === 'bottom' && axisTitles ? 16 : 0 }} />
    ) : null
  const margin = { top: 8, right: 16, bottom: axisTitles ? 18 : 4, left: axisTitles ? 12 : 0 }

  const chart = () => {
    if (type === 'pie')
      return (
        <PieChart>
          <Pie data={data} dataKey={keys[0]} nameKey="name" cx="50%" cy="50%" outerRadius="75%" isAnimationActive={false} label={labels ? (p: { percent?: number; name?: string }) => `${p.name}: ${Math.round((p.percent ?? 0) * 100)}%` : false} labelLine={labels}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [`${v} (${total ? Math.round((v / total) * 1000) / 10 : 0}%)`, keys[0]]} />
          {legend !== 'none' && <Legend verticalAlign={legend === 'right' ? 'middle' : legend} align={legend === 'right' ? 'right' : 'center'} layout={legend === 'right' ? 'vertical' : 'horizontal'} wrapperStyle={{ fontSize: 11 }} />}
        </PieChart>
      )
    if (type === 'line')
      return (
        <LineChart data={data} margin={margin}>
          {gridlines && <CartesianGrid stroke="#d9d9d9" vertical={false} />}
          <XAxis dataKey="name" tick={axisTick} stroke="#bfbfbf">
            {axisTitles && <Label value={xTitle} position="bottom" offset={2} style={{ fontSize: 11, fill: '#595959' }} />}
          </XAxis>
          <YAxis tick={axisTick} stroke="#bfbfbf" width={48}>
            {axisTitles && <Label value={yTitle} angle={-90} position="insideLeft" style={{ fontSize: 11, fill: '#595959', textAnchor: 'middle' }} offset={0} />}
          </YAxis>
          <Tooltip />
          {legendEl}
          {keys.map((k, j) => (
            <Line key={k} dataKey={k} stroke={colors[j % colors.length]} strokeWidth={2.25} dot={{ r: 3 }} isAnimationActive={false}>
              {labels && <LabelList dataKey={k} position="top" style={{ fontSize: 10, fill: '#404040' }} />}
            </Line>
          ))}
        </LineChart>
      )
    const horizontal = type === 'bar'
    return (
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={margin} barCategoryGap="20%">
        {gridlines && <CartesianGrid stroke="#d9d9d9" vertical={horizontal} horizontal={!horizontal} />}
        {horizontal ? (
          <>
            <XAxis type="number" tick={axisTick} stroke="#bfbfbf">
              {axisTitles && <Label value={yTitle} position="bottom" offset={2} style={{ fontSize: 11, fill: '#595959' }} />}
            </XAxis>
            <YAxis type="category" dataKey="name" tick={axisTick} stroke="#bfbfbf" width={70} reversed>
              {axisTitles && <Label value={xTitle} angle={-90} position="insideLeft" style={{ fontSize: 11, fill: '#595959', textAnchor: 'middle' }} offset={-8} />}
            </YAxis>
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={axisTick} stroke="#bfbfbf">
              {axisTitles && <Label value={xTitle} position="bottom" offset={2} style={{ fontSize: 11, fill: '#595959' }} />}
            </XAxis>
            <YAxis tick={axisTick} stroke="#bfbfbf" width={48}>
              {axisTitles && <Label value={yTitle} angle={-90} position="insideLeft" style={{ fontSize: 11, fill: '#595959', textAnchor: 'middle' }} offset={0} />}
            </YAxis>
          </>
        )}
        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
        {legendEl}
        {keys.map((k, j) => (
          <Bar key={k} dataKey={k} fill={colors[j % colors.length]} isAnimationActive={false}>
            {labels && <LabelList dataKey={k} position={horizontal ? 'right' : 'top'} style={{ fontSize: 10, fill: '#404040' }} />}
          </Bar>
        ))}
      </BarChart>
    )
  }

  const chip = (on: boolean) => `px-2 py-1 rounded border text-[11.5px] ${on ? 'bg-[#217346] text-white border-[#217346]' : 'bg-white text-[#333] border-[#c6c6c6] hover:border-[#217346]'}`

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">📈 {title ?? 'Chart builder'}</p>
        <button
          onClick={() => {
            setGrid(initial.rows)
            setSwitched(false)
          }}
          className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky"
        >
          Reset data
        </button>
      </div>

      <div className="m-3 rounded-md border border-[#b8b8b8] overflow-hidden bg-white text-[#222]" style={{ fontFamily: 'Calibri, Carlito, "Segoe UI", Arial, sans-serif' }}>
        {/* data grid */}
        <div className="overflow-x-auto border-b border-[#d4d4d4]">
          <table className="border-collapse text-[12.5px]">
            <tbody>
              {grid.map((row, r) => (
                <tr key={r}>
                  {row.map((v, c) => (
                    <td key={c} className="border border-[#d4d4d4] p-0" style={{ background: r === 0 || c === 0 ? '#f2f2f2' : '#fff' }}>
                      <input
                        aria-label={`Row ${r + 1} column ${c + 1}`}
                        value={v}
                        onChange={e => setCell(r, c, e.target.value)}
                        className={`w-[76px] px-1.5 py-0.5 bg-transparent outline-none focus:bg-[#e8f2ea] ${r === 0 || c === 0 ? 'font-semibold' : 'text-right'} ${r > 0 && c > 0 && v.trim() !== '' && !Number.isFinite(parseFloat(v.replace(/[,₦%]/g, ''))) ? 'text-red-600' : ''}`}
                      />
                    </td>
                  ))}
                  {r > 0 && (
                    <td className="px-1">
                      <button onClick={() => removeRow(r)} aria-label={`Remove row ${r + 1}`} className="text-[11px] text-red-600">
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-2 px-2 py-1 text-[11px]">
            <button onClick={addRow} className="text-[#217346] font-semibold">
              + row
            </button>
            <button onClick={addCol} className="text-[#217346] font-semibold">
              + series column
            </button>
          </div>
        </div>

        {/* chart tools */}
        <div className="px-2 py-2 bg-[#f3f3f3] border-b border-[#d4d4d4] space-y-1.5">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10.5px] font-semibold text-[#555] w-full sm:w-auto">Insert › Charts:</span>
            {(['column', 'bar', 'line', 'pie'] as ChartType[]).map(t => (
              <button key={t} onClick={() => setType(t)} className={chip(type === t)}>
                {t === 'column' ? '▮▮ Column' : t === 'bar' ? '▬ Bar' : t === 'line' ? '📈 Line' : '◔ Pie'}
              </button>
            ))}
            <button onClick={() => setSwitched(s => !s)} className={chip(switched)} title="CHART TOOLS › DESIGN › Switch Row/Column">
              ⇄ Switch Row/Column
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#333]">
            <span className="text-[10.5px] font-semibold text-[#555] w-full sm:w-auto">Chart Elements (+):</span>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={showTitle} onChange={e => setShowTitle(e.target.checked)} /> Chart Title
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={axisTitles} disabled={type === 'pie'} onChange={e => setAxisTitles(e.target.checked)} /> Axis Titles
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={labels} onChange={e => setLabels(e.target.checked)} /> Data Labels
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={gridlines} disabled={type === 'pie'} onChange={e => setGridlines(e.target.checked)} /> Gridlines
            </label>
            <label className="flex items-center gap-1">
              Legend
              <select value={legend} onChange={e => setLegend(e.target.value as typeof legend)} className="border border-[#c6c6c6] rounded px-0.5 py-0 bg-white">
                <option value="right">Right</option>
                <option value="bottom">Bottom</option>
                <option value="top">Top</option>
                <option value="none">None</option>
              </select>
            </label>
            <label className="flex items-center gap-1">
              Style
              <select value={palette} onChange={e => setPalette(Number(e.target.value))} className="border border-[#c6c6c6] rounded px-0.5 py-0 bg-white">
                {PALETTES.map(([n], i) => (
                  <option key={n} value={i}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {(showTitle || axisTitles) && (
            <div className="flex flex-wrap gap-1.5 text-[11.5px]">
              {showTitle && <input aria-label="Chart title" value={chartTitle} onChange={e => setChartTitle(e.target.value)} className="flex-1 min-w-[140px] border border-[#c6c6c6] rounded px-1.5 py-0.5 bg-white" />}
              {axisTitles && type !== 'pie' && (
                <>
                  <input aria-label="Horizontal axis title" value={xTitle} onChange={e => setXTitle(e.target.value)} className="w-[46%] min-w-[110px] border border-[#c6c6c6] rounded px-1.5 py-0.5 bg-white" placeholder="Category axis title" />
                  <input aria-label="Vertical axis title" value={yTitle} onChange={e => setYTitle(e.target.value)} className="w-[46%] min-w-[110px] border border-[#c6c6c6] rounded px-1.5 py-0.5 bg-white" placeholder="Value axis title" />
                </>
              )}
            </div>
          )}
        </div>

        {/* chart */}
        <div className="px-2 pt-2 pb-1 bg-white">
          {showTitle && <p className="text-center text-[15px] text-[#595959] mb-1">{chartTitle}</p>}
          <div style={{ height: 270 }}>{mounted && <ResponsiveContainer width="100%" height="100%">{chart()}</ResponsiveContainer>}</div>
        </div>
        <p className="px-3 py-2 text-[11.5px] bg-[#f9f9f9] border-t border-[#e5e5e5] text-[#444]">
          {USE[type]}
          {type === 'pie' && keys.length > 1 && <b> Only the first series ({keys[0]}) is plotted — Switch Row/Column to plot another.</b>}
          {switched && type !== 'pie' && ' Switched: the column headings are now the categories on the horizontal axis and each row became a series.'}
        </p>
      </div>
    </div>
  )
}
