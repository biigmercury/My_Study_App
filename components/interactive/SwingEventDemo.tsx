'use client'

import { useState } from 'react'

// A Swing-styled temperature converter that shows event-driven programming in action: every user action
// produces an event object, the matching listener method runs, and the log shows the Java that executes.

interface Entry {
  event: string
  code: string
  note: string
  error?: boolean
}

const UNITS = ['Fahrenheit', 'Kelvin'] as const

export default function SwingEventDemo() {
  const [text, setText] = useState('37')
  const [unit, setUnit] = useState<(typeof UNITS)[number]>('Fahrenheit')
  const [result, setResult] = useState('Result: ')
  const [dialog, setDialog] = useState<string | null>(null)
  const [log, setLog] = useState<Entry[]>([])
  const [closed, setClosed] = useState(false)

  const add = (e: Entry) => setLog(prev => [e, ...prev].slice(0, 6))

  const convert = (source: 'button' | 'enter') => {
    const eventLine =
      source === 'button'
        ? 'ActionEvent[source=JButton "Convert", actionCommand="Convert"]'
        : 'ActionEvent[source=JTextField, actionCommand="' + text + '"] (Enter key)'
    const c = Number(text.trim())
    if (text.trim() === '' || !/^-?\d+(\.\d+)?$/.test(text.trim())) {
      setDialog(`Please enter a number. "${text}" is not a valid temperature.`)
      add({
        event: eventLine,
        code: 'actionPerformed(e): Double.parseDouble(field.getText()) → throws NumberFormatException → catch → JOptionPane.showMessageDialog(...)',
        note: 'The listener ran, the conversion failed, and the catch block showed a dialog instead of crashing.',
        error: true,
      })
      return
    }
    const out = unit === 'Fahrenheit' ? c * 9 / 5 + 32 : c + 273.15
    const shown = `Result: ${Number(out.toFixed(2))} ${unit === 'Fahrenheit' ? '°F' : 'K'}`
    setResult(shown)
    add({
      event: eventLine,
      code: `actionPerformed(e): double c = Double.parseDouble("${text.trim()}"); resultLabel.setText("${shown}");`,
      note: 'The event dispatch thread called our listener; setText() updated the label on screen.',
    })
  }

  if (closed) {
    return (
      <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 p-4 text-brand-navy dark:text-white">
        <p className="text-[12.5px] mb-2">
          The window closed: <code className="font-mono text-[12px]">WindowEvent WINDOW_CLOSING</code> → <code className="font-mono text-[12px]">setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE)</code> ended the program.
        </p>
        <button
          onClick={() => {
            setClosed(false)
            setLog([])
          }}
          className="px-3 py-1.5 rounded-lg bg-brand-gradient text-white text-[12px] font-bold"
        >
          Run the program again
        </button>
      </div>
    )
  }

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <p className="px-4 pt-3 text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🖱 Event-driven Swing app — interact with the window</p>

      {/* The mock JFrame (Metal look and feel) */}
      <div className="m-3 rounded-md border border-[#7a8a99] shadow-md overflow-hidden relative" style={{ background: '#eeeeee', fontFamily: 'Dialog, Arial, sans-serif', color: '#333' }}>
        <div className="flex items-center justify-between px-2 py-1" style={{ background: 'linear-gradient(#dde8f3, #b8cfe5)', borderBottom: '1px solid #7a8a99' }}>
          <span className="text-[12px] font-bold">☕ Temperature Converter</span>
          <button
            onClick={() => {
              add({ event: 'WindowEvent[WINDOW_CLOSING]', code: 'windowClosing(e) → EXIT_ON_CLOSE → System.exit(0)', note: 'Closing the window is an event too.' })
              setTimeout(() => setClosed(true), 350)
            }}
            aria-label="Close window"
            className="w-5 h-5 text-[11px] leading-none rounded-sm border border-[#7a8a99] bg-[#e8eef4] hover:bg-red-500 hover:text-white"
          >
            ×
          </button>
        </div>
        <div className="p-3 grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 items-center text-[12.5px]">
          <label htmlFor="celsius">Celsius:</label>
          <input
            id="celsius"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') convert('enter')
            }}
            className="px-1.5 py-0.5 border border-[#7a8a99] bg-white text-[#111] outline-none focus:border-[#3a6ea5] w-full"
          />
          <label htmlFor="unit">Convert to:</label>
          <select
            id="unit"
            value={unit}
            onChange={e => {
              const v = e.target.value as (typeof UNITS)[number]
              setUnit(v)
              add({ event: `ItemEvent[source=JComboBox, item=${v}, SELECTED]`, code: `itemStateChanged(e): unit = (String) e.getItem(); // "${v}"`, note: 'Choosing an item fires an ItemEvent (and an ActionEvent).' })
            }}
            className="px-1 py-0.5 border border-[#7a8a99] bg-gradient-to-b from-white to-[#dde6ee] text-[#111]"
          >
            {UNITS.map(u => (
              <option key={u}>{u}</option>
            ))}
          </select>
          <span />
          <div className="flex gap-2">
            <button
              onClick={() => convert('button')}
              onMouseEnter={() => add({ event: 'MouseEvent[MOUSE_ENTERED, source=JButton "Convert"]', code: 'mouseEntered(e) — no listener registered, so nothing runs', note: 'Events happen constantly; only the ones with listeners trigger your code.' })}
              className="px-3 py-1 rounded-sm border border-[#7a8a99] text-[12.5px] text-[#111] hover:border-[#3a6ea5]"
              style={{ background: 'linear-gradient(#ffffff, #d6e0ea)' }}
            >
              Convert
            </button>
            <button
              onClick={() => {
                setText('')
                setResult('Result: ')
                add({ event: 'ActionEvent[source=JButton "Clear"]', code: 'actionPerformed(e): field.setText(""); resultLabel.setText("Result: ");', note: 'A second button with its own listener.' })
              }}
              className="px-3 py-1 rounded-sm border border-[#7a8a99] text-[12.5px] text-[#111]"
              style={{ background: 'linear-gradient(#ffffff, #d6e0ea)' }}
            >
              Clear
            </button>
          </div>
          <span />
          <span className="font-bold">{result}</span>
        </div>

        {dialog && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-[85%] rounded-md border border-[#7a8a99] shadow-lg" style={{ background: '#eeeeee' }}>
              <div className="px-2 py-1 text-[12px] font-bold" style={{ background: 'linear-gradient(#dde8f3, #b8cfe5)' }}>
                Invalid input
              </div>
              <div className="p-3 flex gap-2 items-start text-[12.5px] text-[#222]">
                <span className="text-xl leading-none">⚠️</span>
                <span>{dialog}</span>
              </div>
              <div className="flex justify-center pb-2">
                <button
                  onClick={() => {
                    setDialog(null)
                    add({ event: 'ActionEvent[source=JOptionPane "OK"]', code: 'the modal dialog returns; the program waits for the next event', note: 'JOptionPane dialogs are modal: the window is blocked until you click OK.' })
                  }}
                  className="px-4 py-0.5 rounded-sm border border-[#7a8a99] text-[12px] text-[#111]"
                  style={{ background: 'linear-gradient(#ffffff, #d6e0ea)' }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="px-4 text-[11px] text-brand-navy/55 dark:text-white/50">
        Try: click Convert, press Enter in the field, pick Kelvin, type letters and convert, hover the button, close the window.
      </p>
      <div className="bg-[#021037] mt-2 px-3 py-2.5 min-h-[90px]">
        <p className="text-[10px] font-semibold uppercase text-white/40 mb-1">Event queue → listener (newest first)</p>
        {log.length === 0 ? (
          <p className="font-mono text-[11.5px] text-white/35">The program is idle, waiting for an event…</p>
        ) : (
          log.map((l, i) => (
            <div key={i} className={`mb-1.5 ${i === 0 ? '' : 'opacity-55'}`}>
              <p className="font-mono text-[11px] text-sky-200">{l.event}</p>
              <p className={`font-mono text-[11px] ${l.error ? 'text-red-300' : 'text-green-200'}`}>↳ {l.code}</p>
              {i === 0 && <p className="text-[11px] text-white/60">{l.note}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
