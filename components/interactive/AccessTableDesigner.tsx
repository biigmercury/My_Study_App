'use client'

import { useRef, useState } from 'react'
import { DATA_TYPES, NO_PK, PK_DUPLICATE, PK_NULL, STAFF, STAFF_FIELDS, TYPE_HELP, coerce, display, field, type DataType, type Field, type Row } from './access/model'

// An Access table in Design View and Datasheet View: field names, data types, descriptions, field
// properties and the primary key; then records typed into the datasheet and checked the way Access
// checks them (data type mismatch, required fields, duplicate/Null primary key, AutoNumber). Also the
// structure changes from the queries lesson: moving, inserting and deleting fields, saving the design.

interface Design {
  name: string
  fields: Field[]
  pk: string | null
  rows: Row[]
}

const PRESETS: Record<string, () => Design> = {
  students: () => ({
    name: 'Students',
    fields: ['StudentID', 'StudentSurname', 'StudentFirstName', 'StudentGender', 'StudentDateofBirth', 'StudentStateofOrigin'].map(n => field(n, 'Short Text')),
    pk: null,
    rows: [],
  }),
  staff: () => ({ name: 'Staff', fields: STAFF_FIELDS.map(f => ({ ...f })), pk: 'StaffID', rows: STAFF.slice(0, 6).map(r => ({ ...r })) }),
}

interface Dialog {
  text: string
  buttons: [string, () => void][]
}

export default function AccessTableDesigner({ preset = 'students' }: { preset?: string }) {
  const start = PRESETS[preset] ?? PRESETS.students
  const [saved, setSaved] = useState<Design>(start)
  const [draft, setDraft] = useState<Design>(start)
  const [view, setView] = useState<'design' | 'datasheet'>(preset === 'staff' ? 'datasheet' : 'design')
  const [selField, setSelField] = useState(0)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [edit, setEditState] = useState<{ row: number; field: string; text: string } | null>(null)
  const editRef = useRef<{ row: number; field: string; text: string } | null>(null)
  const setEdit = (e: { row: number; field: string; text: string } | null) => {
    editRef.current = e
    setEditState(e)
  }
  const [newRow, setNewRow] = useState<Row | null>(null)
  const [curRow, setCurRow] = useState<number | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const designDirty = JSON.stringify({ ...draft, rows: [] }) !== JSON.stringify({ ...saved, rows: [] })
  const t = view === 'design' ? draft : saved
  const fields = t.fields
  const f = draft.fields[selField]

  // ---------- design view ----------
  const setField = (i: number, patch: Partial<Field>) => setDraft(d => ({ ...d, fields: d.fields.map((x, k) => (k === i ? { ...x, ...patch, ...(patch.type ? { format: patch.type === 'Date/Time' ? 'Short Date' : '', size: patch.type === 'Short Text' ? 255 : x.size } : {}) } : x)) }))
  const renameField = (i: number, name: string) =>
    setDraft(d => {
      const old = d.fields[i].name
      return { ...d, fields: d.fields.map((x, k) => (k === i ? { ...x, name } : x)), pk: d.pk === old ? name : d.pk }
    })
  const togglePk = () => {
    if (!f?.name) return setNote('Type a field name first, then click Primary Key.')
    setDraft(d => ({ ...d, pk: d.pk === f.name ? null : f.name }))
    setNote(draft.pk === f.name ? `${f.name} is no longer the primary key.` : `${f.name} is now the primary key — see the key symbol. Access will not allow duplicate or blank values in it.`)
  }
  const insertRow = () => {
    setDraft(d => {
      const fs = [...d.fields]
      fs.splice(selField, 0, field('', 'Short Text'))
      return { ...d, fields: fs }
    })
    setNote('A new blank field row was inserted ABOVE the selected field (TABLE TOOLS DESIGN → Insert Rows).')
  }
  const deleteRow = () => {
    if (!f) return
    const run = () => {
      setDraft(d => ({ ...d, fields: d.fields.filter((_, k) => k !== selField), pk: d.pk === f.name ? null : d.pk }))
      setSelField(Math.max(0, selField - 1))
    }
    if (saved.rows.some(r => r[f.name] !== null && r[f.name] !== undefined && r[f.name] !== ''))
      setDialog({
        text: `Do you want to permanently delete the selected field(s) and all the data in the field(s)? To permanently delete the field(s), click Yes.`,
        buttons: [
          ['Yes', run],
          ['No', () => {}],
        ],
      })
    else run()
  }
  const move = (dir: -1 | 1) => {
    const j = selField + dir
    if (j < 0 || j >= draft.fields.length) return
    setDraft(d => {
      const fs = [...d.fields]
      ;[fs[selField], fs[j]] = [fs[j], fs[selField]]
      return { ...d, fields: fs }
    })
    setSelField(j)
  }

  // Save the design: convert existing data to new types, report failures like Access.
  const saveDesign = (after?: () => void) => {
    const named = draft.fields.filter(x => x.name.trim())
    const doSave = (withPk: string | null, extra: Field[]) => {
      const fieldsNow = [...extra, ...named]
      let lost = 0
      const rows = saved.rows.map((r, idx) => {
        const out: Row = {}
        let bad = false
        for (const fl of fieldsNow) {
          const oldField = saved.fields.find(x => x.name === fl.name)
          if (fl.type === 'AutoNumber') {
            out[fl.name] = typeof r[fl.name] === 'number' ? r[fl.name] : idx + 1
            continue
          }
          const v = r[fl.name] ?? null
          if (v === null || !oldField || oldField.type === fl.type) {
            out[fl.name] = v
            continue
          }
          const c = coerce(oldField.type === 'Date/Time' ? display(v, oldField) : String(v), { ...fl, required: false }, draft.name)
          if ('error' in c) {
            bad = true
            out[fl.name] = null
          } else out[fl.name] = c.value
        }
        if (bad) lost++
        return out
      })
      const commit = () => {
        const next = { ...draft, fields: fieldsNow, pk: withPk, rows }
        setSaved(next)
        setDraft(next)
        setNote(`Table '${draft.name}' saved.`)
        after?.()
      }
      if (lost)
        setDialog({
          text: `Microsoft Access encountered errors while converting the data. The contents of fields in ${lost} record(s) were deleted. Do you want to proceed anyway?`,
          buttons: [
            ['Yes', commit],
            ['No', () => {}],
          ],
        })
      else commit()
    }
    if (!draft.pk || !named.some(x => x.name === draft.pk))
      setDialog({
        text: NO_PK,
        buttons: [
          ['Yes', () => doSave('ID', named.some(x => x.name === 'ID') ? [] : [field('ID', 'AutoNumber')])],
          ['No', () => doSave(null, [])],
          ['Cancel', () => {}],
        ],
      })
    else doSave(draft.pk, [])
  }

  const switchView = (to: 'design' | 'datasheet') => {
    if (to === view) return
    if (to === 'datasheet' && designDirty)
      return setDialog({
        text: 'You must save the table first. Do you want to save the table now?',
        buttons: [
          ['Yes', () => saveDesign(() => setView('datasheet'))],
          ['No', () => {}],
        ],
      })
    if (to === 'design' && !recordOk()) return
    setView(to)
    setEdit(null)
    setNote(null)
  }

  // ---------- datasheet ----------
  const pkField = saved.fields.find(x => x.name === saved.pk)
  const auto = saved.fields.find(x => x.type === 'AutoNumber')
  const nextAuto = () => Math.max(0, ...saved.rows.map(r => Number(auto ? r[auto.name] ?? 0 : 0))) + 1

  // the record being edited, including a value still being typed in a cell
  const currentRecord = (): { r: Row | null; error?: string } => {
    if (curRow === null) return { r: null }
    let r = curRow === -1 ? newRow : saved.rows[curRow]
    if (!r) return { r: null }
    const e = editRef.current
    if (e && e.row === curRow) {
      const fl = saved.fields.find(x => x.name === e.field)
      if (fl && fl.type !== 'AutoNumber') {
        const c = coerce(e.text, { ...fl, required: false }, saved.name)
        if ('error' in c) return { r, error: c.error }
        r = { ...r, [fl.name]: c.value }
      }
    }
    return { r }
  }

  const recordOk = (): boolean => {
    if (curRow === null) return true
    const { r, error } = currentRecord()
    if (error) {
      setDialog({ text: error, buttons: [['OK', () => {}]] })
      return false
    }
    if (!r) return true
    for (const fl of saved.fields) {
      if (fl.required && (r[fl.name] === null || r[fl.name] === undefined || r[fl.name] === '')) {
        setDialog({ text: `You must enter a value in the '${saved.name}.${fl.name}' field.`, buttons: [['OK', () => {}]] })
        return false
      }
    }
    if (pkField) {
      const v = r[pkField.name]
      if (v === null || v === undefined || v === '') {
        setDialog({ text: PK_NULL, buttons: [['OK', () => {}]] })
        return false
      }
      const dup = saved.rows.some((o, k) => k !== curRow && String(o[pkField.name]).toLowerCase() === String(v).toLowerCase())
      if (dup) {
        setDialog({ text: PK_DUPLICATE, buttons: [['OK', () => {}]] })
        return false
      }
    }
    if (curRow === -1) {
      setSaved(s => ({ ...s, rows: [...s.rows, r] }))
      setDraft(d => ({ ...d, rows: [...d.rows, r] }))
      setNewRow(null)
      setEdit(null)
      setNote('Record saved. (Access saves a record automatically as soon as you leave it — there is no need to press Save.)')
    }
    return true
  }

  const focusRow = (row: number) => {
    if (curRow !== null && curRow !== row) {
      if (!recordOk()) return false
    }
    setCurRow(row)
    if (row === -1 && !newRow) {
      const r: Row = {}
      saved.fields.forEach(x => (r[x.name] = x.type === 'AutoNumber' ? nextAuto() : x.type === 'Yes/No' ? false : null))
      setNewRow(r)
    }
    return true
  }

  const commitCell = (row: number, fl: Field, text: string): boolean => {
    const c = coerce(text, { ...fl, required: false }, saved.name)
    if ('error' in c) {
      if (fl.type === 'AutoNumber') setEdit(null)
      setDialog({ text: c.error, buttons: [['OK', () => {}]] })
      return false
    }
    if (fl.type === 'Short Text' && text.trim().length > (fl.size || 255)) setNote(`Only ${fl.size} characters fit: the Field Size of ${fl.name} is ${fl.size}.`)
    if (row === -1) setNewRow(r => ({ ...(r ?? {}), [fl.name]: c.value }))
    else {
      const upd = (d: Design) => ({ ...d, rows: d.rows.map((r, k) => (k === row ? { ...r, [fl.name]: c.value } : r)) })
      setSaved(upd)
      setDraft(upd)
    }
    setEdit(null)
    return true
  }

  const deleteRecord = () => {
    if (curRow === null || curRow === -1) return setNote('Click a record (its row) first.')
    setDialog({
      text: "You are about to delete 1 record(s). If you click Yes, you won't be able to undo this Delete operation. Are you sure you want to delete these records?",
      buttons: [
        [
          'Yes',
          () => {
            const upd = (d: Design) => ({ ...d, rows: d.rows.filter((_, k) => k !== curRow) })
            setSaved(upd)
            setDraft(upd)
            setCurRow(null)
          },
        ],
        ['No', () => {}],
      ],
    })
  }

  // ---------- tasks (Students preset) ----------
  const sf = (n: string) => saved.fields.find(x => x.name === n)
  const tasks: [boolean, string][] =
    preset === 'students'
      ? [
          [saved.pk === 'StudentID', 'StudentID is the primary key (key symbol)'],
          [sf('StudentDateofBirth')?.type === 'Date/Time', 'StudentDateofBirth has the Date/Time data type'],
          [['Lookup Wizard…', 'Short Text'].includes(sf('StudentGender')?.type ?? '') && (sf('StudentGender')?.type === 'Lookup Wizard…' || (sf('StudentGender')?.size ?? 255) <= 10), 'StudentGender is a Lookup (Female;Male) or a short Short Text field'],
          [saved.rows.length >= 3, `At least 3 student records entered in Datasheet View (${saved.rows.length} so far)`],
          [!designDirty && !!saved.pk && saved.fields.length >= 6, 'Design saved with a primary key'],
        ]
      : [
          [saved.fields[1]?.name === 'Surname' && saved.fields[2]?.name === 'FirstName', 'Surname moved above FirstName'],
          [(() => {
            const i = saved.fields.findIndex(x => /birth/i.test(x.name))
            return i >= 0 && saved.fields[i + 1]?.name === 'Address' && saved.fields[i].type === 'Date/Time'
          })(), 'A Date/Time field for the staff birth date inserted directly above Address'],
          [saved.rows.some(r => Object.entries(r).some(([k, v]) => /birth/i.test(k) && v)), 'At least one birth date entered in Datasheet View'],
        ]

  const btn = 'px-2 py-1 rounded border border-[#c6c6c6] bg-white text-[11.5px] text-[#222] hover:border-[#A4373A] disabled:opacity-40'
  const RED = '#A4373A'

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🗃️ Access table — {saved.name}</p>
        <button
          onClick={() => {
            setSaved(start())
            setDraft(start())
            setView(preset === 'staff' ? 'datasheet' : 'design')
            setEdit(null)
            setNewRow(null)
            setCurRow(null)
            setNote(null)
          }}
          className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky"
        >
          Reset
        </button>
      </div>

      <div className="relative m-3 rounded-md border border-[#b8b8b8] overflow-hidden bg-[#f3f3f3] text-[#222]" style={{ fontFamily: '"Segoe UI", Calibri, Arial, sans-serif' }}>
        <div className="flex items-center px-2 h-7 text-white text-[12px]" style={{ background: RED }}>
          <span className="flex-1 text-center truncate">SchoolDB : Database - Access</span>
        </div>
        <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-[#d4d4d4] text-[11.5px]">
          <span className="font-semibold mr-1" style={{ color: RED }}>
            View:
          </span>
          <button className={`${btn} ${view === 'design' ? '!border-[#A4373A] !bg-[#f6e3e3]' : ''}`} onClick={() => switchView('design')}>
            📐 Design View
          </button>
          <button className={`${btn} ${view === 'datasheet' ? '!border-[#A4373A] !bg-[#f6e3e3]' : ''}`} onClick={() => switchView('datasheet')}>
            ▦ Datasheet View
          </button>
          {view === 'design' ? (
            <>
              <span className="w-px h-5 bg-[#ccc] mx-1" />
              <button className={btn} onClick={togglePk} title="TABLE TOOLS DESIGN → Primary Key">
                🔑 Primary Key
              </button>
              <button className={btn} onClick={insertRow}>
                Insert Rows
              </button>
              <button className={btn} onClick={deleteRow}>
                Delete Rows
              </button>
              <button className={btn} onClick={() => move(-1)} title="Drag the row selector up">
                ▲
              </button>
              <button className={btn} onClick={() => move(1)} title="Drag the row selector down">
                ▼
              </button>
              <button className={btn} disabled={!designDirty} onClick={() => saveDesign()}>
                💾 Save
              </button>
            </>
          ) : (
            <>
              <span className="w-px h-5 bg-[#ccc] mx-1" />
              <button className={btn} onClick={() => focusRow(-1)}>
                ✱ New record
              </button>
              <button className={btn} onClick={deleteRecord}>
                ✕ Delete record
              </button>
              <button className={btn} onClick={() => recordOk() && setCurRow(null)} title="Shift+Enter">
                💾 Save record
              </button>
            </>
          )}
        </div>

        {view === 'design' ? (
          <div className="bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px] border-collapse">
                <thead>
                  <tr className="bg-[#eef0f3] text-left">
                    <th className="w-7 border border-[#d4d4d4]" />
                    <th className="px-1.5 py-1 border border-[#d4d4d4] font-semibold">Field Name</th>
                    <th className="px-1.5 py-1 border border-[#d4d4d4] font-semibold">Data Type</th>
                    <th className="px-1.5 py-1 border border-[#d4d4d4] font-semibold">Description (Optional)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...draft.fields, field('', 'Short Text')].map((x, i) => {
                    const ghost = i === draft.fields.length
                    return (
                      <tr key={i} onClick={() => !ghost && setSelField(i)} style={{ background: i === selField && !ghost ? '#fbe9e9' : undefined }}>
                        <td className="border border-[#d4d4d4] text-center text-[12px]" style={{ background: i === selField && !ghost ? '#e8c9c9' : '#f4f4f4' }}>
                          {x.name && x.name === draft.pk ? '🔑' : i === selField && !ghost ? '▶' : ''}
                        </td>
                        <td className="border border-[#d4d4d4] p-0">
                          <input
                            aria-label={`Field name ${i + 1}`}
                            value={x.name}
                            onFocus={() => !ghost && setSelField(i)}
                            onChange={e => {
                              if (ghost) {
                                setDraft(d => ({ ...d, fields: [...d.fields, field(e.target.value, 'Short Text')] }))
                                setSelField(draft.fields.length)
                              } else renameField(i, e.target.value)
                            }}
                            className="w-full min-w-[130px] px-1.5 py-1 outline-none bg-transparent"
                          />
                        </td>
                        <td className="border border-[#d4d4d4] p-0">
                          {!ghost && (
                            <select aria-label={`Data type ${i + 1}`} value={x.type} onChange={e => setField(i, { type: e.target.value as DataType })} className="w-full min-w-[110px] px-1 py-1 bg-transparent outline-none">
                              {DATA_TYPES.map(d => (
                                <option key={d}>{d}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="border border-[#d4d4d4] p-0">
                          {!ghost && <input aria-label={`Description ${i + 1}`} value={x.description} onChange={e => setField(i, { description: e.target.value })} className="w-full min-w-[140px] px-1.5 py-1 outline-none bg-transparent" />}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {f && (
              <div className="border-t-2 border-[#d4d4d4] p-2 text-[12px] grid gap-2 sm:grid-cols-[1fr_1fr]">
                <div className="space-y-1.5">
                  <p className="font-semibold" style={{ color: RED }}>
                    Field Properties — {f.name || '(unnamed)'} · General
                  </p>
                  {(f.type === 'Short Text' || f.type === 'Number') && (
                    <label className="flex items-center gap-2">
                      <span className="w-24">Field Size</span>
                      {f.type === 'Short Text' ? (
                        <input aria-label="Field Size" type="number" min={1} max={255} value={f.size} onChange={e => setField(selField, { size: Math.max(1, Math.min(255, Number(e.target.value) || 1)) })} className="w-20 border border-[#c6c6c6] px-1" />
                      ) : (
                        <select className="border border-[#c6c6c6] px-1" defaultValue="Long Integer">
                          <option>Byte</option>
                          <option>Integer</option>
                          <option>Long Integer</option>
                          <option>Single</option>
                          <option>Double</option>
                          <option>Decimal</option>
                        </select>
                      )}
                    </label>
                  )}
                  {f.type === 'Date/Time' && (
                    <label className="flex items-center gap-2">
                      <span className="w-24">Format</span>
                      <select aria-label="Format" value={f.format} onChange={e => setField(selField, { format: e.target.value })} className="border border-[#c6c6c6] px-1">
                        <option>Short Date</option>
                        <option>Medium Date</option>
                        <option>Long Date</option>
                      </select>
                    </label>
                  )}
                  {f.type === 'Lookup Wizard…' && (
                    <label className="flex items-center gap-2">
                      <span className="w-24">Row Source</span>
                      <input aria-label="Row Source" value={f.list ?? ''} placeholder="Female;Male" onChange={e => setField(selField, { list: e.target.value })} className="flex-1 border border-[#c6c6c6] px-1" />
                    </label>
                  )}
                  {f.type !== 'AutoNumber' && f.type !== 'Yes/No' && (
                    <label className="flex items-center gap-2">
                      <span className="w-24">Required</span>
                      <select aria-label="Required" value={f.required ? 'Yes' : 'No'} onChange={e => setField(selField, { required: e.target.value === 'Yes' })} className="border border-[#c6c6c6] px-1">
                        <option>No</option>
                        <option>Yes</option>
                      </select>
                    </label>
                  )}
                </div>
                <p className="text-[11.5px] text-[#555] leading-snug bg-[#fafafa] border border-[#e5e5e5] p-2">
                  <b>{f.type}:</b> {TYPE_HELP[f.type]}
                  {f.description && (
                    <>
                      <br />
                      The description appears in the status bar when this field is used in a form.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white overflow-x-auto">
            <table className="text-[12.5px] border-collapse">
              <thead>
                <tr className="bg-[#eef0f3]">
                  <th className="w-6 border border-[#d4d4d4]" />
                  {fields.map(x => (
                    <th key={x.name} className="px-1.5 py-1 border border-[#d4d4d4] font-semibold text-left whitespace-nowrap">
                      {x.name} <span className="text-[#999] font-normal text-[10px]">▾</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...saved.rows.map((r, i) => ({ r, i })), { r: newRow, i: -1 }].map(({ r, i }) => (
                  <tr key={i} style={{ background: curRow === i ? '#fdf3f3' : undefined }}>
                    <td className="border border-[#d4d4d4] text-center text-[11px] bg-[#f4f4f4] cursor-pointer" onClick={() => focusRow(i)}>
                      {curRow === i ? (i === -1 || edit ? '✎' : '▶') : i === -1 ? '✱' : ''}
                    </td>
                    {fields.map(x => {
                      const editing = edit && edit.row === i && edit.field === x.name
                      const v = r ? r[x.name] : null
                      const shown = i === -1 && !r ? (x.type === 'AutoNumber' ? '(New)' : '') : display(v ?? null, x)
                      return (
                        <td key={x.name} className="border border-[#d4d4d4] p-0" onMouseDown={e => {
                          if (curRow !== i && !focusRow(i)) e.preventDefault()
                        }}>
                          {x.type === 'Yes/No' ? (
                            <input type="checkbox" aria-label={`${x.name} ${i}`} checked={!!v} onChange={e => (focusRow(i) ? commitCell(i, x, e.target.checked ? 'Yes' : 'No') : null)} className="mx-2" />
                          ) : (
                            <input
                              aria-label={`${x.name} row ${i === -1 ? 'new' : i + 1}`}
                              value={editing ? edit!.text : shown}
                              readOnly={x.type === 'AutoNumber'}
                              onFocus={() => {
                                if (x.type === 'AutoNumber') return
                                setEdit({ row: i, field: x.name, text: v === null || v === undefined ? '' : x.type === 'Date/Time' ? display(v, x) : String(v) })
                              }}
                              onChange={e => setEdit({ row: i, field: x.name, text: e.target.value })}
                              onBlur={() => {
                                const e = editRef.current
                                if (e && e.row === i && e.field === x.name) commitCell(i, x, e.text)
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && edit) {
                                  e.preventDefault()
                                  commitCell(i, x, edit.text)
                                  if (e.shiftKey) recordOk()
                                }
                                if (e.key === 'Escape') setEdit(null)
                              }}
                              list={x.type === 'Lookup Wizard…' ? `lk-${x.name}` : undefined}
                              className="px-1.5 py-1 outline-none bg-transparent"
                              style={{ width: Math.max(80, Math.min(220, x.name.length * 9 + 24)), textAlign: x.type === 'Number' || x.type === 'Currency' || x.type === 'AutoNumber' ? 'right' : 'left', color: i === -1 && !r ? '#999' : undefined }}
                            />
                          )}
                          {x.type === 'Lookup Wizard…' && (
                            <datalist id={`lk-${x.name}`}>
                              {(x.list ?? '')
                                .split(/[;,]/)
                                .map(o => o.trim())
                                .filter(Boolean)
                                .map(o => (
                                  <option key={o} value={o} />
                                ))}
                            </datalist>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-2 py-1 text-[10.5px] text-white flex justify-between gap-2" style={{ background: RED }}>
          <span>{view === 'design' ? 'Design View. F6 = Switch panes. F1 = Help.' : `Record: ${curRow === null ? '—' : curRow === -1 ? saved.rows.length + 1 : curRow + 1} of ${saved.rows.length}`}</span>
          <span className="truncate">{view === 'design' ? (designDirty ? 'Unsaved design changes' : 'Design saved') : saved.pk ? `Primary key: ${saved.pk}` : 'No primary key'}</span>
        </div>

        {dialog && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 p-3">
            <div className="w-full max-w-[380px] bg-white border border-[#8a8a8a] shadow-xl text-[12.5px] text-[#222]">
              <div className="px-3 py-1.5 border-b border-[#ddd] text-[12px]">Microsoft Access</div>
              <div className="p-3 flex gap-2">
                <span className="text-[18px] leading-none">{dialog.buttons.length > 1 ? '⚠️' : 'ℹ️'}</span>
                <p>{dialog.text}</p>
              </div>
              <div className="flex justify-end gap-2 px-3 pb-3">
                {dialog.buttons.map(([label, fn]) => (
                  <button
                    key={label}
                    onClick={() => {
                      setDialog(null)
                      fn()
                    }}
                    className="min-w-[64px] px-3 py-1 border border-[#A4373A] bg-[#fbeeee] hover:bg-[#f6e0e0]"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {note && <p className="mx-3 -mt-1 mb-2 px-3 py-2 rounded-lg text-[12px] bg-brand-sky/10 border border-brand-sky/30">{note}</p>}
      <div className="px-4 pb-4">
        <p className="text-[12px] font-bold mb-1">
          Tasks: {tasks.filter(x => x[0]).length} / {tasks.length}
        </p>
        <ul className="space-y-0.5 text-[12px]">
          {tasks.map(([ok, txt]) => (
            <li key={txt} className={ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-brand-navy/80 dark:text-white/80'}>
              {ok ? '✓' : '○'} {txt}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
