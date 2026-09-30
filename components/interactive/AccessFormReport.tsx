'use client'

import { useState } from 'react'
import { STAFF, STAFF_FIELDS, coerce, display, field, type Field, type Row } from './access/model'

// Access forms and reports built on the Staff table: CREATE → Form / Form Wizard (Columnar, Tabular,
// Datasheet, Justified), Form View with the record navigation bar, new records, search; CREATE →
// Report / Report Wizard (grouping, sorting, Sum/Avg summaries, layout, orientation) with Report View
// and Print Preview. Every object works on the same table data — edit in the form, see it in the
// table and the report. Adding a field to the table later does not add it to an existing form.

type Layout = 'Columnar' | 'Tabular' | 'Datasheet' | 'Justified'
interface FormDef {
  title: string
  fields: string[]
  layout: Layout
}
interface ReportDef {
  title: string
  fields: string[]
  group: string
  sort: string
  sum: boolean
  avg: boolean
  layout: 'Stepped' | 'Block' | 'Outline'
  landscape: boolean
}
type Obj = 'table' | 'form' | 'report' | 'formWizard' | 'reportWizard'

export default function AccessFormReport() {
  const [fields, setFields] = useState<Field[]>(STAFF_FIELDS.map(f => ({ ...f })))
  const [rows, setRows] = useState<Row[]>(STAFF.map(r => ({ ...r })))
  const [form, setForm] = useState<FormDef | null>(null)
  const [report, setReport] = useState<ReportDef | null>(null)
  const [open, setOpen] = useState<Obj>('table')
  const [formView, setFormView] = useState<'form' | 'layout' | 'design'>('form')
  const [reportView, setReportView] = useState<'report' | 'preview' | 'design'>('report')
  const [pos, setPos] = useState(0)
  const [draftNew, setDraftNew] = useState<Row | null>(null)
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [wiz, setWiz] = useState({ fields: STAFF_FIELDS.map(f => f.name), layout: 'Columnar' as Layout, title: 'Staff', group: 'Department', sort: 'Surname', sum: true, avg: false, rlayout: 'Stepped' as ReportDef['layout'], landscape: false, step: 1 })

  const F = (n: string) => fields.find(f => f.name === n)
  const RED = '#A4373A'
  const btn = 'px-2 py-1 rounded border border-[#c6c6c6] bg-white text-[11.5px] text-[#222] hover:border-[#A4373A] disabled:opacity-40'

  // ---------- data edits (shared by every object) ----------
  const setValue = (rowIdx: number, name: string, text: string): boolean => {
    const f = F(name)
    if (!f) return false
    const c = coerce(text, { ...f, required: false }, 'Staff')
    if ('error' in c) {
      setMsg(`Microsoft Access: ${c.error}`)
      return false
    }
    setRows(rs => rs.map((r, i) => (i === rowIdx ? { ...r, [name]: c.value } : r)))
    setMsg(null)
    return true
  }
  const startNew = () => {
    const r: Row = {}
    fields.forEach(f => (r[f.name] = f.type === 'AutoNumber' ? Math.max(0, ...rows.map(x => Number(x.StaffID))) + 1 : null))
    setDraftNew(r)
    setPos(rows.length)
  }
  const saveNew = () => {
    if (!draftNew) return
    if (!Object.entries(draftNew).some(([k, v]) => k !== 'StaffID' && v !== null && v !== '')) {
      setDraftNew(null)
      setPos(Math.max(0, rows.length - 1))
      return
    }
    setRows(rs => [...rs, draftNew])
    setDraftNew(null)
    setMsg(`Record ${rows.length + 1} saved to the Staff table — open the table to see it.`)
  }
  const go = (p: number) => {
    if (draftNew) saveNew()
    setPos(Math.max(0, Math.min(rows.length - 1, p)))
  }

  // ---------- creating objects ----------
  const quickForm = () => {
    setForm({ title: 'Staff', fields: fields.map(f => f.name), layout: 'Columnar' })
    setOpen('form')
    setFormView('layout')
    setPos(0)
    setMsg('CREATE → Form built a form from every field of the selected table and opened it in Layout View. Switch to Form View to enter data.')
  }
  const quickReport = () => {
    setReport({ title: 'Staff', fields: fields.map(f => f.name).filter(n => n !== 'Address'), group: '', sort: '', sum: false, avg: false, layout: 'Stepped', landscape: true })
    setOpen('report')
    setReportView('report')
    setMsg('CREATE → Report built a tabular report of the table (a real one-click report includes every field — Address is left out here to fit the screen).')
  }
  const addPhone = () => {
    if (F('Phone')) return
    setFields(fs => [...fs, field('Phone', 'Short Text', { size: 15 })])
    setMsg('Added a Phone field to the Staff TABLE (in Design View). Open the form: Phone is not there — a form keeps the fields the table had when the form was made. Use Add Existing Fields in Layout View.')
  }

  // ---------- views ----------
  const record = draftNew && pos === rows.length ? draftNew : rows[pos]
  const recIdx = draftNew && pos === rows.length ? -1 : pos

  const formBody = () => {
    if (!form) return null
    const fl = form.fields.map(F).filter((x): x is Field => !!x)
    const inputFor = (f: Field, r: Row, idx: number, w = 190) => (
      <input
        key={`${idx}-${f.name}-${String(r[f.name])}`}
        aria-label={`${f.name}${idx >= 0 ? ` record ${idx + 1}` : ' new'}`}
        defaultValue={f.type === 'Date/Time' ? display(r[f.name] ?? null, f) : r[f.name] === null || r[f.name] === undefined ? '' : String(r[f.name])}
        readOnly={f.type === 'AutoNumber' || formView !== 'form'}
        onBlur={e => {
          if (f.type === 'AutoNumber' || formView !== 'form') return
          if (idx === -1) {
            const c = coerce(e.target.value, { ...f, required: false }, 'Staff')
            if ('error' in c) return setMsg(`Microsoft Access: ${c.error}`)
            setDraftNew(d => ({ ...(d ?? {}), [f.name]: c.value }))
          } else if (!setValue(idx, f.name, e.target.value)) e.target.focus()
        }}
        className="border border-[#c3c3c3] px-1.5 py-0.5 bg-white outline-none focus:border-[#A4373A]"
        style={{ width: w, background: f.type === 'AutoNumber' ? '#f7f7f7' : undefined }}
      />
    )
    if (form.layout === 'Tabular' || form.layout === 'Datasheet') {
      return (
        <div className="overflow-x-auto">
          <table className="text-[12px] border-collapse">
            <thead>
              <tr>
                {fl.map(f => (
                  <th key={f.name} className={`px-1.5 py-1 text-left font-semibold ${form.layout === 'Datasheet' ? 'border border-[#d4d4d4] bg-[#eef0f3]' : 'text-[#555]'}`}>
                    {f.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ background: i === pos ? '#fbeeee' : undefined }} onClick={() => setPos(i)}>
                  {fl.map(f => (
                    <td key={f.name} className={`p-0.5 ${form.layout === 'Datasheet' ? 'border border-[#e5e5e5]' : ''}`}>
                      {inputFor(f, r, i, f.name === 'Address' ? 170 : 100)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    if (!record) return <p className="text-[12px]">No records.</p>
    if (form.layout === 'Justified')
      return (
        <div className="flex flex-wrap gap-2">
          {fl.map(f => (
            <label key={f.name} className="flex flex-col text-[11px] text-[#555]">
              {f.name}
              {inputFor(f, record, recIdx, f.name === 'Address' ? 200 : 110)}
            </label>
          ))}
        </div>
      )
    return (
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 items-center text-[12.5px]">
        {fl.map(f => (
          <div key={f.name} className="contents">
            <label className="text-[#444] whitespace-nowrap">{f.name}</label>
            {inputFor(f, record, recIdx, f.name === 'Address' ? 230 : 190)}
          </div>
        ))}
      </div>
    )
  }

  const reportRows = () => {
    if (!report) return []
    let list = [...rows]
    const key = report.sort || 'StaffID'
    list.sort((a, b) => (typeof a[key] === 'number' ? Number(a[key]) - Number(b[key]) : String(a[key] ?? '').localeCompare(String(b[key] ?? ''))))
    if (report.group) list = list.sort((a, b) => String(a[report.group] ?? '~').localeCompare(String(b[report.group] ?? '~')))
    return list
  }
  const money = (n: number) => '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const reportBody = () => {
    if (!report) return null
    const fl = report.fields.filter(n => n !== report.group).map(F).filter((x): x is Field => !!x)
    const list = reportRows()
    const groups: [string, Row[]][] = []
    if (report.group) list.forEach(r => {
      const raw = r[report.group]
      const g = raw === null || raw === undefined || raw === '' ? '(blank)' : String(raw)
      const last = groups[groups.length - 1]
      if (last && last[0] === g) last[1].push(r)
      else groups.push([g, [r]])
    })
    else groups.push(['', list])
    const summary = (rs: Row[], label: string) =>
      (report.sum || report.avg) && F('Salary') ? (
        <tr className="text-[11.5px]">
          <td colSpan={fl.length + (report.group ? 1 : 0)} className="pt-1 pb-2 text-right font-semibold">
            {label} {report.sum && `Sum of Salary: ${money(rs.reduce((s, r) => s + Number(r.Salary ?? 0), 0))}`} {report.avg && ` Avg: ${money(rs.reduce((s, r) => s + Number(r.Salary ?? 0), 0) / Math.max(1, rs.length))}`}
          </td>
        </tr>
      ) : null
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    return (
      <div className={reportView === 'preview' ? 'bg-white shadow mx-auto p-4' : 'p-1'} style={reportView === 'preview' ? { maxWidth: report.landscape ? 620 : 440 } : undefined}>
        <div className="flex justify-between items-start mb-2">
          <p className="text-[20px] font-semibold" style={{ color: RED }}>
            {report.title}
          </p>
          <p className="text-[10.5px] text-[#555] text-right">{today}</p>
        </div>
        <table className="text-[11.5px] w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-[#A4373A]">
              {report.group && <th className="text-left py-0.5 pr-2">{report.group}</th>}
              {fl.map(f => (
                <th key={f.name} className="text-left py-0.5 pr-2 whitespace-nowrap">
                  {f.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(([g, rs]) => (
              <GroupRows key={g || 'all'} g={g} rs={rs} fl={fl} grouped={!!report.group} layout={report.layout} summary={summary(rs, report.group ? `Summary for '${report.group}' = ${g} (${rs.length} detail records)` : '')} />
            ))}
            {report.group && summary(list, 'Grand Total')}
          </tbody>
        </table>
        <p className="text-[10px] text-[#666] text-right mt-3">Page 1 of 1</p>
      </div>
    )
  }

  const navBar = (
    <div className="flex flex-wrap items-center gap-1 px-2 py-1 text-[11px] border-t border-[#d4d4d4] bg-[#f3f3f3]">
      <span>Record:</span>
      <button className={btn} onClick={() => go(0)} aria-label="First record">
        |◀
      </button>
      <button className={btn} onClick={() => go(pos - 1)} aria-label="Previous record">
        ◀
      </button>
      <span className="px-1">
        {pos + 1} of {rows.length}
        {draftNew ? ' (new)' : ''}
      </span>
      <button className={btn} onClick={() => go(pos + 1)} aria-label="Next record">
        ▶
      </button>
      <button className={btn} onClick={() => go(rows.length - 1)} aria-label="Last record">
        ▶|
      </button>
      <button className={btn} onClick={startNew} aria-label="New (blank) record">
        ▶✱
      </button>
      <input
        aria-label="Search"
        placeholder="Search"
        value={search}
        onChange={e => {
          setSearch(e.target.value)
          const q = e.target.value.toLowerCase()
          if (!q) return
          const i = rows.findIndex(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q)))
          if (i >= 0) setPos(i)
        }}
        className="w-24 border border-[#c6c6c6] px-1 py-0.5 bg-white"
      />
    </div>
  )

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🧾 Access forms &amp; reports — Staff</p>
        <button
          onClick={() => {
            setFields(STAFF_FIELDS.map(f => ({ ...f })))
            setRows(STAFF.map(r => ({ ...r })))
            setForm(null)
            setReport(null)
            setOpen('table')
            setMsg(null)
            setDraftNew(null)
            setPos(0)
          }}
          className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky"
        >
          Reset
        </button>
      </div>

      <div className="m-3 rounded-md border border-[#b8b8b8] overflow-hidden bg-[#f3f3f3] text-[#222]" style={{ fontFamily: '"Segoe UI", Calibri, Arial, sans-serif' }}>
        <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 text-[11.5px] border-b border-[#d4d4d4]">
          <span className="font-semibold mr-1" style={{ color: RED }}>
            CREATE:
          </span>
          <button className={btn} onClick={quickForm}>
            Form
          </button>
          <button
            className={btn}
            onClick={() => {
              setWiz(w => ({ ...w, step: 1 }))
              setOpen('formWizard')
            }}
          >
            Form Wizard
          </button>
          <button className={btn} onClick={quickReport}>
            Report
          </button>
          <button
            className={btn}
            onClick={() => {
              setWiz(w => ({ ...w, step: 1 }))
              setOpen('reportWizard')
            }}
          >
            Report Wizard
          </button>
        </div>

        <div className="flex min-h-[300px]">
          {/* navigation pane */}
          <div className="w-[108px] shrink-0 border-r border-[#d4d4d4] bg-white text-[11.5px]">
            <p className="px-2 py-1 text-white text-[10.5px] font-semibold" style={{ background: RED }}>
              All Access Objects
            </p>
            <p className="px-2 pt-1 text-[10px] text-[#777] uppercase">Tables</p>
            <button onClick={() => setOpen('table')} className={`block w-full text-left px-2 py-0.5 ${open === 'table' ? 'bg-[#f6e3e3]' : ''}`}>
              ▦ Staff
            </button>
            <p className="px-2 pt-1 text-[10px] text-[#777] uppercase">Forms</p>
            {form ? (
              <button onClick={() => setOpen('form')} className={`block w-full text-left px-2 py-0.5 ${open === 'form' ? 'bg-[#f6e3e3]' : ''}`}>
                📋 {form.title}
              </button>
            ) : (
              <p className="px-2 text-[10.5px] text-[#999]">(none yet)</p>
            )}
            <p className="px-2 pt-1 text-[10px] text-[#777] uppercase">Reports</p>
            {report ? (
              <button onClick={() => setOpen('report')} className={`block w-full text-left px-2 py-0.5 ${open === 'report' ? 'bg-[#f6e3e3]' : ''}`}>
                🧾 {report.title}
              </button>
            ) : (
              <p className="px-2 text-[10.5px] text-[#999]">(none yet)</p>
            )}
          </div>

          {/* document area */}
          <div className="flex-1 min-w-0 bg-white flex flex-col">
            {open === 'table' && (
              <>
                <div className="flex items-center gap-2 px-2 py-1 border-b border-[#e5e5e5] text-[11px]">
                  <b>Staff</b> — Datasheet View
                  <button className={btn} onClick={addPhone} disabled={!!F('Phone')}>
                    Design View: add a Phone field
                  </button>
                </div>
                <div className="overflow-auto flex-1">
                  <table className="text-[11.5px] border-collapse">
                    <thead>
                      <tr className="bg-[#eef0f3]">
                        {fields.map(f => (
                          <th key={f.name} className="px-1.5 py-0.5 border border-[#d4d4d4] text-left whitespace-nowrap">
                            {f.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i}>
                          {fields.map(f => (
                            <td key={f.name} className="px-1.5 py-0.5 border border-[#e5e5e5] whitespace-nowrap">
                              {display(r[f.name] ?? null, f)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {open === 'form' && form && (
              <>
                <div className="flex flex-wrap items-center gap-1 px-2 py-1 border-b border-[#e5e5e5] text-[11px]">
                  {(['form', 'layout', 'design'] as const).map(v => (
                    <button key={v} className={`${btn} ${formView === v ? '!border-[#A4373A] !bg-[#f6e3e3]' : ''}`} onClick={() => setFormView(v)}>
                      {v === 'form' ? 'Form View' : v === 'layout' ? 'Layout View' : 'Design View'}
                    </button>
                  ))}
                  {formView === 'layout' && fields.some(f => !form.fields.includes(f.name)) && (
                    <button className={btn} onClick={() => setForm({ ...form, fields: [...form.fields, ...fields.filter(f => !form.fields.includes(f.name)).map(f => f.name)] })}>
                      Add Existing Fields
                    </button>
                  )}
                </div>
                <div className="p-3 flex-1 overflow-auto" style={{ outline: formView === 'layout' ? '1px dashed #e0a3a3' : undefined, outlineOffset: -6 }}>
                  {formView === 'design' ? (
                    <div className="text-[11px] space-y-1">
                      {['Form Header', 'Detail', 'Form Footer'].map(sec => (
                        <div key={sec} className="border border-[#ccc]">
                          <p className="px-1.5 py-0.5 bg-[#e8e8e8]">▼ {sec}</p>
                          <div className="p-2 min-h-[26px] bg-[repeating-linear-gradient(90deg,#fff_0,#fff_11px,#f0f0f0_12px)]">
                            {sec === 'Form Header' && <span className="text-[16px]" style={{ color: RED }}>{form.title}</span>}
                            {sec === 'Detail' &&
                              form.fields.map(n => (
                                <p key={n} className="flex gap-2">
                                  <span className="w-24">{n}</span>
                                  <span className="border border-[#999] px-1 bg-white">{n}</span>
                                </p>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <p className="text-[18px] mb-2" style={{ color: RED }}>
                        📋 {form.title}
                      </p>
                      {formBody()}
                    </>
                  )}
                </div>
                {formView === 'form' && navBar}
              </>
            )}

            {open === 'report' && report && (
              <>
                <div className="flex flex-wrap items-center gap-1 px-2 py-1 border-b border-[#e5e5e5] text-[11px]">
                  {(['report', 'preview', 'design'] as const).map(v => (
                    <button key={v} className={`${btn} ${reportView === v ? '!border-[#A4373A] !bg-[#f6e3e3]' : ''}`} onClick={() => setReportView(v)}>
                      {v === 'report' ? 'Report View' : v === 'preview' ? 'Print Preview' : 'Design View'}
                    </button>
                  ))}
                </div>
                <div className={`flex-1 overflow-auto p-2 ${reportView === 'preview' ? 'bg-[#8c8c8c]' : ''}`}>
                  {reportView === 'design' ? (
                    <div className="text-[11px] space-y-1">
                      {['Report Header', 'Page Header', ...(report.group ? [`${report.group} Header`] : []), 'Detail', ...(report.group && (report.sum || report.avg) ? [`${report.group} Footer`] : []), 'Page Footer', 'Report Footer'].map(sec => (
                        <div key={sec} className="border border-[#ccc]">
                          <p className="px-1.5 py-0.5 bg-[#e8e8e8]">▼ {sec}</p>
                          <p className="px-2 py-1 text-[#666]">
                            {sec === 'Report Header' ? `Title: ${report.title}; date` : sec === 'Page Header' ? 'Column headings' : sec === 'Detail' ? 'One line per record' : sec === 'Page Footer' ? '="Page " & [Page] & " of " & [Pages]' : sec.endsWith('Footer') && sec !== 'Report Footer' ? 'Group totals: =Sum([Salary])' : sec === 'Report Footer' ? 'Grand totals' : 'Group value'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    reportBody()
                  )}
                </div>
              </>
            )}

            {open === 'formWizard' && (
              <div className="p-3 text-[12px] space-y-2">
                <p className="font-semibold" style={{ color: RED }}>
                  Form Wizard — step {wiz.step} of 3
                </p>
                {wiz.step === 1 && (
                  <>
                    <p>Which fields do you want on your form? (Table: Staff)</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {fields.map(f => (
                        <label key={f.name} className="flex items-center gap-1">
                          <input type="checkbox" checked={wiz.fields.includes(f.name)} onChange={e => setWiz(w => ({ ...w, fields: e.target.checked ? [...w.fields, f.name] : w.fields.filter(x => x !== f.name) }))} /> {f.name}
                        </label>
                      ))}
                    </div>
                  </>
                )}
                {wiz.step === 2 && (
                  <>
                    <p>What layout would you like for your form?</p>
                    {(['Columnar', 'Tabular', 'Datasheet', 'Justified'] as Layout[]).map(l => (
                      <label key={l} className="flex items-center gap-1.5">
                        <input type="radio" checked={wiz.layout === l} onChange={() => setWiz(w => ({ ...w, layout: l }))} /> {l}
                        <span className="text-[#777]">— {l === 'Columnar' ? 'one record at a time, labels on the left' : l === 'Tabular' ? 'many records, one per row' : l === 'Datasheet' ? 'looks like the table' : 'fields side by side, labels above'}</span>
                      </label>
                    ))}
                  </>
                )}
                {wiz.step === 3 && (
                  <label className="flex items-center gap-2">
                    What title do you want for your form? <input aria-label="Form title" value={wiz.title} onChange={e => setWiz(w => ({ ...w, title: e.target.value }))} className="border border-[#c6c6c6] px-1" />
                  </label>
                )}
                <div className="flex gap-2">
                  <button className={btn} disabled={wiz.step === 1} onClick={() => setWiz(w => ({ ...w, step: w.step - 1 }))}>
                    &lt; Back
                  </button>
                  {wiz.step < 3 ? (
                    <button className={btn} disabled={!wiz.fields.length} onClick={() => setWiz(w => ({ ...w, step: w.step + 1 }))}>
                      Next &gt;
                    </button>
                  ) : (
                    <button
                      className={btn}
                      onClick={() => {
                        setForm({ title: wiz.title || 'Staff', fields: fields.map(f => f.name).filter(n => wiz.fields.includes(n)), layout: wiz.layout })
                        setOpen('form')
                        setFormView('form')
                        setPos(0)
                        setMsg(`Form '${wiz.title}' created (${wiz.layout}) and opened in Form View.`)
                      }}
                    >
                      Finish
                    </button>
                  )}
                </div>
              </div>
            )}

            {open === 'reportWizard' && (
              <div className="p-3 text-[12px] space-y-2">
                <p className="font-semibold" style={{ color: RED }}>
                  Report Wizard — step {wiz.step} of 4
                </p>
                {wiz.step === 1 && (
                  <>
                    <p>Which fields do you want on your report?</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {fields.map(f => (
                        <label key={f.name} className="flex items-center gap-1">
                          <input type="checkbox" checked={wiz.fields.includes(f.name)} onChange={e => setWiz(w => ({ ...w, fields: e.target.checked ? [...w.fields, f.name] : w.fields.filter(x => x !== f.name) }))} /> {f.name}
                        </label>
                      ))}
                    </div>
                  </>
                )}
                {wiz.step === 2 && (
                  <label className="flex items-center gap-2">
                    Do you want to add any grouping levels?
                    <select value={wiz.group} onChange={e => setWiz(w => ({ ...w, group: e.target.value }))} className="border border-[#c6c6c6] px-1">
                      <option value="">(no grouping)</option>
                      {wiz.fields.filter(n => ['Department', 'Gender'].includes(n)).map(n => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                )}
                {wiz.step === 3 && (
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2">
                      Sort detail records by
                      <select value={wiz.sort} onChange={e => setWiz(w => ({ ...w, sort: e.target.value }))} className="border border-[#c6c6c6] px-1">
                        <option value="">(none)</option>
                        {wiz.fields.map(n => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                      Ascending
                    </label>
                    <p>Summary Options (Salary):</p>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={wiz.sum} onChange={e => setWiz(w => ({ ...w, sum: e.target.checked }))} /> Sum
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={wiz.avg} onChange={e => setWiz(w => ({ ...w, avg: e.target.checked }))} /> Avg
                    </label>
                  </div>
                )}
                {wiz.step === 4 && (
                  <div className="space-y-1.5">
                    <p>How would you like to lay out your report?</p>
                    {(['Stepped', 'Block', 'Outline'] as const).map(l => (
                      <label key={l} className="flex items-center gap-1.5">
                        <input type="radio" checked={wiz.rlayout === l} onChange={() => setWiz(w => ({ ...w, rlayout: l }))} /> {l}
                      </label>
                    ))}
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" checked={wiz.landscape} onChange={e => setWiz(w => ({ ...w, landscape: e.target.checked }))} /> Landscape orientation
                    </label>
                    <label className="flex items-center gap-2">
                      Title: <input aria-label="Report title" value={wiz.title} onChange={e => setWiz(w => ({ ...w, title: e.target.value }))} className="border border-[#c6c6c6] px-1" />
                    </label>
                  </div>
                )}
                <div className="flex gap-2">
                  <button className={btn} disabled={wiz.step === 1} onClick={() => setWiz(w => ({ ...w, step: w.step - 1 }))}>
                    &lt; Back
                  </button>
                  {wiz.step < 4 ? (
                    <button className={btn} disabled={!wiz.fields.length} onClick={() => setWiz(w => ({ ...w, step: w.step + 1 }))}>
                      Next &gt;
                    </button>
                  ) : (
                    <button
                      className={btn}
                      onClick={() => {
                        setReport({ title: wiz.title || 'Staff', fields: fields.map(f => f.name).filter(n => wiz.fields.includes(n) && n !== 'Address'), group: wiz.fields.includes(wiz.group) ? wiz.group : '', sort: wiz.sort, sum: wiz.sum, avg: wiz.avg, layout: wiz.rlayout, landscape: wiz.landscape })
                        setOpen('report')
                        setReportView('preview')
                        setMsg('The Report Wizard opens the finished report in Print Preview.')
                      }}
                    >
                      Finish
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {msg && <p className="mx-3 mb-3 -mt-1 px-3 py-2 rounded-lg text-[12px] bg-brand-sky/10 border border-brand-sky/30">{msg}</p>}
    </div>
  )
}

function GroupRows({ g, rs, fl, grouped, layout, summary }: { g: string; rs: Row[]; fl: Field[]; grouped: boolean; layout: string; summary: React.ReactNode }) {
  return (
    <>
      {grouped && layout !== 'Block' && (
        <tr>
          <td className="pt-2 pb-0.5 font-semibold text-[12px]" colSpan={fl.length + 1} style={{ color: '#A4373A' }}>
            {g}
          </td>
        </tr>
      )}
      {rs.map((r, i) => (
        <tr key={i} className="border-b border-[#f0f0f0]">
          {grouped && <td className="pr-2 py-0.5">{layout === 'Block' && i === 0 ? g : ''}</td>}
          {fl.map(f => (
            <td key={f.name} className="pr-2 py-0.5 whitespace-nowrap" style={{ textAlign: f.type === 'Currency' || f.type === 'AutoNumber' ? 'right' : 'left' }}>
              {display(r[f.name] ?? null, f)}
            </td>
          ))}
        </tr>
      ))}
      {summary}
    </>
  )
}
