'use client'

import { isValidElement, useEffect, useId, useMemo, useRef, useState } from 'react'

type Lang = 'html' | 'css' | 'js'
const LABELS: Record<Lang, string> = { html: 'HTML', css: 'CSS', js: 'JavaScript' }

// The lesson passes fenced code blocks as children; they reach this client component as
// CodeBlock elements whose props (className "language-x", children = source) survive the RSC boundary.
function collect(node: React.ReactNode, out: Partial<Record<Lang, string>>) {
  if (Array.isArray(node)) {
    node.forEach(n => collect(n, out))
    return
  }
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (typeof props.className === 'string' && props.className.startsWith('language-') && typeof props.children === 'string') {
    const raw = props.className.replace('language-', '')
    const lang: Lang | null = raw === 'html' ? 'html' : raw === 'css' ? 'css' : raw === 'js' || raw === 'javascript' ? 'js' : null
    if (lang) out[lang] = props.children.replace(/\n$/, '')
    return
  }
  collect(props.children, out)
}

interface LogLine {
  kind: string
  text: string
}

const DEVICES = [
  { label: 'Mobile', width: 375 },
  { label: 'Tablet', width: 768 },
  { label: 'Laptop', width: 1024 },
  { label: 'Desktop', width: 1440 },
]
const FRAME_H = 224

export default function CodePlayground({ title, responsive, height, children }: { title?: string; responsive?: boolean; height?: string; children: React.ReactNode }) {
  // MDX props arrive as strings (blockJS), so the frame height is given as e.g. height="440".
  const frameH = parseInt(height ?? '', 10) || FRAME_H
  const initial = useMemo(() => {
    const out: Partial<Record<Lang, string>> = {}
    collect(children, out)
    return out
  }, [children])
  const langs = (['html', 'css', 'js'] as Lang[]).filter(l => initial[l] !== undefined)
  const [code, setCode] = useState<Partial<Record<Lang, string>>>(initial)
  const [tab, setTab] = useState<Lang>(langs[0] ?? 'html')
  const [doc, setDoc] = useState('')
  const [logs, setLogs] = useState<LogLine[]>([])
  const [device, setDevice] = useState(0)
  const [boxW, setBoxW] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const channel = useId()

  useEffect(() => {
    if (!responsive || !boxRef.current) return
    const el = boxRef.current
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth))
    ro.observe(el)
    setBoxW(el.clientWidth)
    return () => ro.disconnect()
  }, [responsive])

  // In responsive mode the page is laid out at the device's real width, then scaled down to fit.
  const vw = DEVICES[device].width
  const scale = responsive && boxW ? Math.min(1, boxW / vw) : 1

  const build = (c: Partial<Record<Lang, string>>) => {
    const bridge = `(function(){var id=${JSON.stringify(channel)};function s(k,a){try{parent.postMessage({pg:id,k:k,t:Array.prototype.map.call(a,function(x){try{return typeof x==='object'?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(' ')},'*')}catch(e){}}['log','info','warn','error'].forEach(function(k){var o=console[k];console[k]=function(){s(k,arguments);o&&o.apply(console,arguments)}});window.onerror=function(m){s('error',[m])}})();`
    const js = (c.js ?? '').replace(/<\/script/gi, '<\\/script')
    const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script>${bridge}</script><style>body{font-family:system-ui,sans-serif;margin:12px;color:#0f172a}${c.css ?? ''}</style>`
    const tail = js ? `<script>${js}</script>` : ''
    const html = c.html ?? ''
    // A complete document (<!DOCTYPE html><html>…) keeps its own structure; the bridge goes first in
    // <head> so it sees every console call, and the JS tab runs after the body content.
    if (/<html[\s>]/i.test(html)) {
      let full = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + head) : html.replace(/<html[^>]*>/i, m => `${m}<head>${head}</head>`)
      full = /<\/body>/i.test(full) ? full.replace(/<\/body>/i, `${tail}</body>`) : full + tail
      return full
    }
    return `<!doctype html><html><head>${head}</head><body>${html}${tail}</body></html>`
  }

  const run = (c = code) => {
    setLogs([])
    setDoc(build(c))
  }

  useEffect(() => {
    run(initial)
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { pg?: string; k?: string; t?: string }
      if (d && d.pg === channel && typeof d.t === 'string') setLogs(prev => [...prev.slice(-49), { kind: d.k ?? 'log', text: d.t as string }])
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">▶ {title ?? 'Live code playground'}</p>
        <p className="text-[10.5px] text-brand-navy/45 dark:text-white/40">Edit, then Run</p>
      </div>

      <div className="flex gap-1 px-3 pt-2">
        {langs.map(l => (
          <button
            key={l}
            onClick={() => setTab(l)}
            className={`px-3 py-1.5 rounded-t-lg text-[12px] font-semibold ${tab === l ? 'bg-[#021037] text-white' : 'text-brand-navy/55 dark:text-white/50'}`}
          >
            {LABELS[l]}
          </button>
        ))}
      </div>
      <textarea
        value={code[tab] ?? ''}
        onChange={e => setCode(prev => ({ ...prev, [tab]: e.target.value }))}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        rows={Math.min(14, Math.max(5, (code[tab] ?? '').split('\n').length + 1))}
        className="block w-full resize-y bg-[#021037] text-[#e2e8f0] font-mono text-[12.5px] leading-relaxed px-4 py-3 outline-none"
      />

      <div className="flex gap-2 px-4 py-2.5 border-b border-brand-navy/10 dark:border-brand-cyan/10">
        <button onClick={() => run()} className="px-4 py-1.5 rounded-lg bg-brand-gradient text-white text-[12px] font-bold">Run ▶</button>
        <button
          onClick={() => {
            setCode(initial)
            run(initial)
          }}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-brand-deep dark:text-brand-sky"
        >
          Reset
        </button>
      </div>

      <div className="p-3 bg-brand-soft dark:bg-brand-bg/60">
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
          <p className="text-[10px] font-semibold uppercase text-brand-navy/45 dark:text-white/40">
            Result{responsive ? ` · ${vw}px wide${scale < 1 ? ` (shown at ${Math.round(scale * 100)}%)` : ''}` : ''}
          </p>
          {responsive && (
            <div className="flex gap-1">
              {DEVICES.map((d, i) => (
                <button
                  key={d.label}
                  onClick={() => setDevice(i)}
                  className={`px-2 py-1 rounded-md text-[10.5px] font-semibold ${device === i ? 'bg-brand-gradient text-white' : 'text-brand-navy/60 dark:text-white/55 bg-white/60 dark:bg-white/5'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {responsive ? (
          <div ref={boxRef} className="w-full overflow-hidden rounded-lg border border-brand-navy/10 bg-slate-200 dark:bg-slate-700" style={{ height: Math.round(frameH * (scale < 1 ? 1.6 : 1)) }}>
            <iframe
              title={title ?? 'Code result'}
              srcDoc={doc}
              sandbox="allow-scripts allow-modals allow-forms"
              className="bg-white block"
              style={{
                width: vw,
                height: Math.round((frameH * (scale < 1 ? 1.6 : 1)) / scale),
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                margin: scale < 1 ? 0 : '0 auto',
              }}
            />
          </div>
        ) : (
          <iframe
            title={title ?? 'Code result'}
            srcDoc={doc}
            sandbox="allow-scripts allow-modals allow-forms"
            className="w-full rounded-lg bg-white border border-brand-navy/10"
            style={{ height: frameH }}
          />
        )}
        {langs.includes('js') && (
          <div className="mt-2 rounded-lg bg-[#021037] px-3 py-2 font-mono text-[11.5px] min-h-[36px]">
            <p className="text-[10px] font-sans font-semibold uppercase text-white/40 mb-1">Console</p>
            {logs.length === 0 ? (
              <p className="text-white/35">(no console output)</p>
            ) : (
              logs.map((l, i) => (
                <p key={i} className={l.kind === 'error' ? 'text-red-300' : l.kind === 'warn' ? 'text-amber-300' : 'text-green-200'}>
                  {l.kind === 'error' ? '✗ ' : '› '}
                  {l.text}
                </p>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
