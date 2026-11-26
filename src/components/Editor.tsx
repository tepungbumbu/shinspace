'use client'
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react'
import { accepts, renderPage } from '@/lib/blocks'
import Link from 'next/link'
import { fetchPages, saveRoot, type PageFull } from '@/lib/pages'
import type { SitePage } from '@/lib/exporter'
import { starter } from '@/lib/sections'
import { clone, drag, find, insert, move, parentOf, remove, update, type Node } from '@/lib/tree'
import Canvas, { type Act, type Device } from './Canvas'
import { BlocksTab, LayersTab } from './Panels'
import SectionsTab from './SectionsTab'
import Inspector from './Inspector'
import { Ic } from './Ic'
import ExportModal from './ExportModal'
import PreviewBar, { type Size } from './PreviewBar'

const TABS = [['blocks', 'Blocks', 'tBlocks'], ['sections', 'Sections', 'tSections'], ['layers', 'Layers', 'tLayers']] as const
type Tab = (typeof TABS)[number][0]
type Hist = { past: Node[]; root: Node; future: Node[] }

const btn = 'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent'

function EditorInner({ page }: { page: PageFull }) {
  const [h, setH] = useState<Hist>(() => ({ past: [], root: page.root, future: [] }))
  const [sel, setSel] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('blocks')
  const [device, setDevice] = useState<Device>('desktop')
  const [preview, setPreview] = useState(false)
  const [pv, setPv] = useState<Size>({ w: 1280, h: 800 })
  const [code, setCode] = useState(false)
  const [site, setSite] = useState<SitePage[] | null>(null)
  const [edit, setEdit] = useState<{ id: string; n: number } | null>(null)
  const last = useRef({ key: '', t: 0 })
  const { root } = h
  // autosave: changes are sent to the server shortly after you stop, and once more when you leave
  const opened = useRef(root)
  const dirty = useRef<Node | null>(null)
  const [savedRoot, setSavedRoot] = useState(root)
  const [failed, setFailed] = useState(false)
  const flush = useEffectEvent(() => {
    const r = dirty.current
    if (!r) return
    dirty.current = null
    saveRoot(page.id, r).then(() => { setSavedRoot(r); setFailed(false) }).catch(() => setFailed(true))
  })
  useEffect(() => {
    if (root === opened.current) return
    dirty.current = root
    const t = setTimeout(flush, 700)
    return () => clearTimeout(t)
  }, [root])
  useEffect(() => () => flush(), [])
  const status = root === savedRoot ? 'Saved' : failed ? 'Not saved. Retrying on your next change' : 'Saving…'

  // `key` lets rapid edits of the same field (typing) collapse into one undo step
  const commit = (fn: (r: Node) => Node, key = '') => {
    const next = fn(root)
    if (next === root) return
    const now = Date.now()
    const merge = key !== '' && last.current.key === key && now - last.current.t < 1000
    last.current = { key, t: now }
    setH({ past: merge ? h.past : [...h.past, root].slice(-100), root: next, future: [] })
  }
  const undo = () => h.past.length && setH({ past: h.past.slice(0, -1), root: h.past.at(-1)!, future: [root, ...h.future] })
  const redo = () => h.future.length && setH({ past: [...h.past, root], root: h.future[0], future: h.future.slice(1) })

  // click-to-add: inside the selected container, else right after the selected block, else at the end
  const add = (node: Node) => {
    let pid = root.id
    let i = root.c!.length
    const s = sel ? find(root, sel) : undefined
    if (s && accepts(s, node)) { pid = s.id; i = s.c!.length }
    else if (s) {
      let cur: Node = s
      let p = parentOf(root, cur.id)
      while (p && !accepts(p, node)) { cur = p; p = parentOf(root, cur.id) }
      if (p) { pid = p.id; i = p.c!.indexOf(cur) + 1 }
    }
    commit((r) => insert(r, pid, i, node))
    setSel(node.id)
  }

  const drop = (pid: string, i: number) => {
    const d = drag.cur
    drag.cur = null
    if (!d) return
    if (d.kind === 'new') { commit((r) => insert(r, pid, i, d.node)); setSel(d.node.id) }
    else commit((r) => move(r, d.id, pid, i))
  }

  const act = (a: Act) => {
    const s = sel && find(root, sel)
    const p = s && parentOf(root, s.id)
    if (!s || !p) return
    const i = p.c!.indexOf(s)
    if (a === 'parent') setSel(p.id === root.id ? null : p.id)
    if (a === 'del') { commit((r) => remove(r, s.id)); setSel(p.id === root.id ? null : p.id) }
    if (a === 'dup') { const c = clone(s); commit((r) => insert(r, p.id, i + 1, c)); setSel(c.id) }
    if (a === 'up' && i > 0) commit((r) => move(r, s.id, p.id, i - 1))
    if (a === 'down' && i < p.c!.length - 1) commit((r) => move(r, s.id, p.id, i + 2))
  }

  const patch = (id: string, ch: { p?: Record<string, string>; s?: Record<string, string>; t?: Record<string, string> }) => {
    const n = find(root, id)
    if (!n || Object.entries(ch.p ?? {}).every(([k, v]) => (n.p[k] ?? '') === v) && Object.entries(ch.s ?? {}).every(([k, v]) => (n.s[k] ?? '') === v) && Object.entries(ch.t ?? {}).every(([k, v]) => (n.t?.[k] ?? '') === v)) return
    commit((r) => update(r, id, (x) => ({ ...x, p: { ...x.p, ...ch.p }, s: { ...x.s, ...ch.s }, t: { ...x.t, ...ch.t } })), id + Object.keys({ ...ch.p, ...ch.s, ...ch.t }).join())
  }

  const onKey = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest?.('input,textarea,select,[contenteditable]')) return
    const mod = e.metaKey || e.ctrlKey
    const k = e.key.toLowerCase()
    if (preview) { if (k === 'escape') setPreview(false) }
    else if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo() }
    else if (mod && k === 'y') { e.preventDefault(); redo() }
    else if (!sel) return
    else if (mod && k === 'd') { e.preventDefault(); act('dup') }
    else if (e.altKey && k === 'arrowup') { e.preventDefault(); act('up') }
    else if (e.altKey && k === 'arrowdown') { e.preventDefault(); act('down') }
    else if (k === 'delete' || k === 'backspace') { e.preventDefault(); act('del') }
    else if (k === 'escape') act('parent')
    else if (k === 'enter') { e.preventDefault(); setEdit({ id: sel, n: Date.now() }) }
  }
  useEffect(() => {
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const html = renderPage(root)
  const fullDoc = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Page</title>\n<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>\n</head>\n<body>\n${html}\n</body>\n</html>\n`
  const download = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([fullDoc], { type: 'text/html' }))
    a.download = 'page.html'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  // the open page becomes index.html; the user's other pages go to pages/
  const openExport = async () => {
    const rest = await fetchPages().then((all) => all.filter((p) => p.id !== page.id).map((p) => ({ name: p.name, root: p.root }))).catch(() => [])
    setSite([{ name: page.name, root }, ...rest])
  }
  const selected = sel ? (find(root, sel) ?? null) : null

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-800">
      {preview && <PreviewBar size={pv} onSize={setPv} onExit={() => setPreview(false)} />}
      <header className={'items-center gap-3 bg-slate-900 px-4 py-2.5 text-white ' + (preview ? 'hidden' : 'flex')}>
        <span className="text-sm font-bold tracking-[0.2em]">SHINSPACE</span>
        <Link href="/dashboard" className="ml-4 rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-white/10">← Dashboard</Link>
        <span className="text-sm text-slate-200">{page.name}</span>
        <span className={'text-xs ' + (failed ? 'text-rose-300' : 'text-slate-400')}>{status}</span>
        <button onClick={openExport} className="ml-auto inline-flex items-center gap-2 rounded-md bg-indigo-500 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-400">
          <Ic n="download" /> Export site
        </button>
        <span className="rounded bg-indigo-500/30 px-1.5 py-0.5 text-[10px] font-medium text-indigo-200">Next.js + Tailwind</span>
      </header>
      <div className={'items-center gap-1 border-b border-slate-200 bg-white px-3 py-1.5 ' + (preview ? 'hidden' : 'flex')}>
        <button className={btn} onClick={undo} disabled={!h.past.length} title="Undo"><Ic n="undo" /></button>
        <button className={btn} onClick={redo} disabled={!h.future.length} title="Redo"><Ic n="redo" /></button>
        <div className="mx-auto flex rounded-lg border border-slate-200 p-0.5">
          {(['desktop', 'tablet', 'mobile'] as Device[]).map((d) => (
            <button key={d} onClick={() => setDevice(d)} title={d} className={'rounded-md px-2.5 py-1 ' + (device === d ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100')}><Ic n={d} /></button>
          ))}
        </div>
        <button className={btn + (preview ? ' bg-indigo-100 text-indigo-700' : '')} onClick={() => { setPreview(!preview); setSel(null) }} title="Preview"><Ic n="eye" />Preview</button>
        <button className={btn} onClick={() => setCode(true)} title="Export HTML"><Ic n="html" />HTML</button>
        <button className={btn} onClick={() => confirm('Reset the page to the starter layout?') && commit(() => starter()) } title="Reset"><Ic n="reset" />Reset</button>
      </div>
      <div className="flex min-h-0 flex-1">
        <aside className={'shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-150 ' + (tab === 'sections' ? 'w-[360px] ' : 'w-72 ') + (preview ? 'hidden' : 'flex')}>
          <nav className="grid grid-cols-3 border-b border-slate-200">
            {TABS.map(([k, label, icon]) => (
              <button key={k} onClick={() => setTab(k)} className={'flex flex-col items-center gap-1 py-2 text-[11px] ' + (tab === k ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-800')}>
                <Ic n={icon} />{label}
              </button>
            ))}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === 'blocks' && <BlocksTab onAdd={add} />}
            {tab === 'sections' && <SectionsTab onAdd={add} />}
            {tab === 'layers' && <LayersTab root={root} sel={sel} onSelect={setSel} />}
          </div>
          <p className="border-t border-slate-200 px-3 py-2 text-[11px] leading-relaxed text-slate-400">Ctrl+Z undo · Ctrl+D duplicate · Alt+↑↓ move · Del delete · Esc parent · Enter edit text</p>
        </aside>
        <main className={'relative min-w-0 flex-1 ' + (preview ? 'overflow-auto bg-slate-50 px-10 pb-12 pt-8' : 'p-4 [background-image:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]')}>
          <Canvas
            root={root}
            sel={sel}
            device={device}
            preview={preview}
            size={preview ? pv : undefined}
            onSize={setPv}
            edit={edit}
            onSelect={setSel}
            onText={(id, text) => patch(id, { p: { text } })}
            onDrop={drop}
            onAct={act}
            onKey={onKey}
          />
        </main>
        {selected && !preview && (
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white">
            <Inspector key={selected.id} node={selected} onChange={patch} onAct={act} onClose={() => setSel(null)} />
          </aside>
        )}
      </div>
      {site && <ExportModal pages={site} onClose={() => setSite(null)} />}
      {code && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6" onClick={() => setCode(false)}>
          <div className="flex max-h-full w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-slate-200 p-3">
              <h2 className="mr-auto font-semibold">Clean HTML (Tailwind classes)</h2>
              <button className={btn} onClick={() => navigator.clipboard.writeText(html)}>Copy</button>
              <button className={btn} onClick={download}>Download .html</button>
              <button className={btn} onClick={() => setCode(false)}><Ic n="close" /></button>
            </div>
            <textarea readOnly value={html} className="min-h-0 flex-1 resize-none p-4 font-mono text-xs outline-none" rows={24} />
          </div>
        </div>
      )}
    </div>
  )
}

// localStorage only exists in the browser, so render the editor after mount to avoid a hydration mismatch.
export default function Editor({ page }: { page: PageFull }) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  return mounted ? <EditorInner key={page.id} page={page} /> : null
}
