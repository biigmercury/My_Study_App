'use client'

import { useMemo, useState } from 'react'
import { APPS, type Cmd, type TabDef } from './ribbonData'

// Explore an Office 2013 ribbon: tabs → groups → commands, the FILE (Backstage) view, contextual tabs,
// and a "find the command" quiz for the exam favourite "on which tab would you find…?".

const QUIZ: Record<string, string[]> = {
  word: ['Watermark', 'Page Borders', 'Columns', 'Breaks', 'Table of Contents', 'Insert Caption', 'Insert Table of Figures', 'Bibliography', 'Insert Citation', 'Start Mail Merge', 'Track Changes', 'Word Count', 'Thesaurus', 'Show/Hide ¶', 'Change Case', 'Equation', 'Page Number', 'Orientation', 'Margins', 'Format Painter', 'Read Mode', 'View Side by Side', 'Replace', 'Sort', 'Insert Footnote', 'Cover Page', 'SmartArt', 'Spelling & Grammar', 'Merge Cells', 'Link to Previous'],
  excel: ['Merge & Center', 'Wrap Text', 'Freeze Panes', 'AutoSum', 'Insert Function', 'Show Formulas', 'Data Validation', 'Conditional Formatting', 'Format as Table', 'Print Titles', 'Print Area', 'Recommended Charts', 'Switch Row/Column', 'Move Chart', 'Sort', 'Filter', 'Remove Duplicates', 'Calculate Now', 'Percent Style', 'Comma Style', 'Protect Sheet', 'Gridlines: View / Print', 'Page Break Preview', 'Trace Precedents / Trace Dependents', 'Text to Columns'],
  powerpoint: ['New Slide', 'Layout', 'Slide Size', 'Format Background', 'Themes gallery', 'Transitions gallery', 'Apply To All', 'Animations gallery', 'Animation Pane', 'From Beginning', 'Rehearse Timings', 'Hide Slide', 'Set Up Slide Show', 'Header & Footer', 'Slide Sorter', 'Notes Page', 'Slide Master', 'Record Slide Show', 'Monitor / Use Presenter View', 'Photo Album'],
  access: ['Table Design', 'Query Wizard', 'Query Design', 'Form', 'Form Wizard', 'Report', 'Report Wizard', 'Labels', 'Relationships', 'Excel', 'Word Merge', 'Compact and Repair Database', 'Primary Key', 'Run', 'Totals', 'Ascending / Descending', 'New', 'Show Table'],
}

interface Found {
  tab: string
  ctx?: string
  group: string
  cmd: Cmd
}

export default function RibbonExplorer({ app = 'word', title }: { app?: string; title?: string }) {
  const def = APPS[app] ?? APPS.word
  const [tabIdx, setTabIdx] = useState<number | 'file'>(0)
  const [ctxOn, setCtxOn] = useState<number | null>(null)
  const [picked, setPicked] = useState<Found | null>(null)
  const [fileItem, setFileItem] = useState(0)
  const [quiz, setQuiz] = useState<{ target: Found; tries: number; hint: boolean; done: boolean } | null>(null)
  const [score, setScore] = useState({ right: 0, asked: 0 })

  const tabs: TabDef[] = useMemo(() => [...def.tabs, ...(ctxOn !== null ? def.contextual[ctxOn].tabs : [])], [def, ctxOn])
  const all: Found[] = useMemo(() => {
    const out: Found[] = []
    for (const t of def.tabs) for (const g of t.groups) for (const c of g.cmds) out.push({ tab: t.t, group: g.g, cmd: c })
    def.contextual.forEach(cx => cx.tabs.forEach(t => t.groups.forEach(g => g.cmds.forEach(c => out.push({ tab: t.t, ctx: t.ctx, group: g.g, cmd: c })))))
    return out
  }, [def])
  const pool = useMemo(() => (QUIZ[app] ?? []).map(n => all.find(f => f.cmd.n === n)).filter((f): f is Found => !!f), [all, app])

  const current = tabIdx === 'file' ? null : tabs[Math.min(tabIdx, tabs.length - 1)]
  const color = def.color

  const nextQuestion = () => {
    const choices = pool.filter(f => f.cmd.n !== quiz?.target.cmd.n)
    const target = choices[Math.floor(Math.random() * choices.length)]
    setQuiz({ target, tries: 0, hint: false, done: false })
    setScore(s => ({ ...s, asked: s.asked + 1 }))
    setPicked(null)
    setTabIdx(0)
    setCtxOn(null)
  }

  const clickCmd = (f: Found) => {
    setPicked(f)
    if (!quiz || quiz.done) return
    if (f.cmd.n === quiz.target.cmd.n) {
      setQuiz({ ...quiz, done: true })
      if (quiz.tries === 0 && !quiz.hint) setScore(s => ({ ...s, right: s.right + 1 }))
    } else setQuiz({ ...quiz, tries: quiz.tries + 1 })
  }

  const label = (n: string) => n.replace(/ dialog launcher$/, '')

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🎛️ {title ?? `${def.name} 2013 ribbon explorer`}</p>
        <button onClick={nextQuestion} className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky shrink-0">
          🎯 {quiz ? 'Next question' : 'Quiz me'}
        </button>
      </div>

      {quiz && (
        <div className={`mx-3 mt-2 px-3 py-2 rounded-lg text-[12.5px] border ${quiz.done ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'}`}>
          {quiz.done ? (
            <>
              ✓ Found it: <b>{quiz.target.cmd.n}</b> is on the <b>{quiz.target.ctx ? `${quiz.target.ctx} › ` : ''}{quiz.target.tab}</b> tab, <b>{quiz.target.group}</b> group.{' '}
              <span className="opacity-80">
                Score {score.right}/{score.asked} first-time finds.
              </span>
            </>
          ) : (
            <>
              Find <b>{quiz.target.cmd.n}</b>. {quiz.tries > 0 && <span>Not that one ({quiz.tries} {quiz.tries === 1 ? 'try' : 'tries'}). </span>}
              {quiz.hint ? (
                <span>
                  Hint: it is on the <b>{quiz.target.ctx ? `${quiz.target.ctx} › ` : ''}{quiz.target.tab}</b> tab{quiz.target.ctx ? ' (a contextual tab — switch it on below)' : ''}.
                </span>
              ) : (
                <button onClick={() => setQuiz({ ...quiz, hint: true })} className="underline font-semibold">
                  Hint
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div className="m-3 rounded-md border border-[#b8b8b8] overflow-hidden bg-white" style={{ fontFamily: '"Segoe UI", Calibri, Arial, sans-serif', color: '#222' }}>
        <div className="flex items-center gap-2 px-2 h-7 text-white text-[12px]" style={{ background: color }}>
          <span title="Quick Access Toolbar: Save, Undo, Redo" className="flex gap-1.5 opacity-90">
            <span>💾</span>
            <span>↶</span>
            <span>↷</span>
          </span>
          <span className="flex-1 text-center truncate">{def.doc}</span>
        </div>

        {/* contextual tab labels */}
        {ctxOn !== null && (
          <div className="flex justify-end px-2 pt-1 bg-white">
            <span className="text-[10px] font-bold px-2 rounded-t" style={{ color, background: `${color}22` }}>
              {def.contextual[ctxOn].label}
            </span>
          </div>
        )}
        <div className="flex overflow-x-auto border-b border-[#d4d4d4] bg-white text-[11.5px]" style={{ scrollbarWidth: 'thin' }}>
          <button onClick={() => setTabIdx('file')} className="px-3 py-1.5 font-semibold text-white shrink-0" style={{ background: color }}>
            FILE
          </button>
          {tabs.map((t, i) => (
            <button
              key={`${t.ctx ?? ''}${t.t}`}
              onClick={() => setTabIdx(i)}
              className={`px-2.5 py-1.5 shrink-0 border-x ${tabIdx === i ? 'border-[#d4d4d4] bg-[#f3f3f3] font-semibold' : 'border-transparent hover:bg-[#f0f0f0]'}`}
              style={{ color: t.ctx ? color : tabIdx === i ? color : '#444', background: t.ctx && tabIdx !== i ? `${color}14` : undefined }}
            >
              {t.t}
            </button>
          ))}
        </div>

        {tabIdx === 'file' ? (
          <div className="flex min-h-[170px] text-[12.5px]">
            <div className="w-[34%] shrink-0 text-white py-1" style={{ background: color }}>
              <button onClick={() => setTabIdx(0)} className="block w-full text-left px-3 py-1 text-[16px]" aria-label="Back to document">
                ⮌
              </button>
              {def.file.map(([n], i) => (
                <button key={n} onClick={() => setFileItem(i)} className={`block w-full text-left px-3 py-1.5 ${fileItem === i ? 'bg-black/20 font-semibold' : 'hover:bg-black/10'}`}>
                  {n}
                </button>
              ))}
            </div>
            <div className="p-3">
              <p className="text-[18px] font-light mb-1" style={{ color }}>
                {def.file[fileItem][0]}
              </p>
              <p className="text-[#333] leading-snug">{def.file[fileItem][1]}</p>
              <p className="mt-3 text-[11.5px] text-[#666]">The FILE tab opens Backstage view — commands that act on the whole file. Click ⮌ (or press Esc) to return to the document.</p>
            </div>
          </div>
        ) : (
          current && (
            <div className="flex overflow-x-auto bg-[#f3f3f3] border-b border-[#d4d4d4] py-1.5 px-1" style={{ scrollbarWidth: 'thin' }}>
              {current.groups.map(g => {
                const launcher = g.cmds.find(c => c.n.endsWith('dialog launcher'))
                return (
                  <div key={g.g} className="flex flex-col shrink-0 px-1.5 border-r border-[#dcdcdc] last:border-r-0 max-w-[260px]">
                    <div className="flex flex-wrap gap-0.5 content-start" style={{ maxHeight: 92, minWidth: 70 }}>
                      {g.cmds
                        .filter(c => c !== launcher)
                        .map(c => {
                          const on = picked?.cmd === c
                          return (
                            <button
                              key={c.n}
                              onClick={() => clickCmd({ tab: current.t, ctx: current.ctx, group: g.g, cmd: c })}
                              className={`text-left text-[11px] leading-tight px-1.5 py-1 rounded border ${on ? 'bg-white shadow-sm' : 'border-transparent hover:border-[#c6c6c6] hover:bg-white'}`}
                              style={{ borderColor: on ? color : undefined }}
                            >
                              {c.n}
                            </button>
                          )
                        })}
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-auto pt-1 text-[10px] text-[#666] whitespace-nowrap">
                      {g.g}
                      {launcher && (
                        <button onClick={() => clickCmd({ tab: current.t, ctx: current.ctx, group: g.g, cmd: launcher })} title="Dialog Box Launcher" aria-label={`${g.g} dialog box launcher`} className="text-[10px] leading-none px-0.5 border border-[#bbb] rounded-sm hover:bg-white">
                          ↘
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        <div className="px-3 py-2 min-h-[64px] text-[12.5px] bg-white">
          {picked ? (
            <>
              <p className="text-[11px] text-[#777]">
                {picked.ctx ? `${picked.ctx} › ` : ''}
                {picked.tab} › {picked.group}
              </p>
              <p className="font-semibold" style={{ color }}>
                {label(picked.cmd.n)}
                {picked.cmd.k && <span className="ml-2 font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-[#f0f0f0] text-[#333] font-normal">{picked.cmd.k}</span>}
              </p>
              <p className="text-[#333] leading-snug">{picked.cmd.d}</p>
            </>
          ) : (
            <p className="text-[#666]">Click a tab, then any command, to see what it does. Hover-tips work the same way in the real program: rest the mouse on a button and a ScreenTip explains it.</p>
          )}
        </div>
      </div>

      {def.contextual.length > 0 && (
        <div className="px-4 pb-3 -mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px]">
          <span className="text-brand-navy/70 dark:text-white/70">Contextual tabs appear only when needed —</span>
          {def.contextual.map((cx, i) => (
            <button
              key={cx.label}
              onClick={() => {
                const on = ctxOn === i ? null : i
                setCtxOn(on)
                setTabIdx(on === null ? 0 : def.tabs.length)
              }}
              className={`px-2 py-0.5 rounded-full border ${ctxOn === i ? 'bg-brand-deep text-white border-brand-deep' : 'border-brand-navy/20 dark:border-white/25 hover:border-brand-deep'}`}
            >
              {ctxOn === i ? '✓ ' : ''}
              {cx.trigger}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
