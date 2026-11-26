'use client'
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react'
import { accepts, BLOCKS, renderPage } from '@/lib/blocks'
import Link from 'next/link'
import { fetchSite, saveRoot, type PageFull } from '@/lib/pages'
import type { SitePage } from '@/lib/exporter'
import { starter } from '@/lib/sections'
import { clone, drag, find, insert, move, N, parentOf, remove, update, type Node } from '@/lib/tree'
import Canvas, { type Act, type Device } from './Canvas'
import { BlocksTab, LayersTab } from './Panels'
import SectionsTab from './SectionsTab'
import { call } from '@/lib/admin-api'
import { parseFeed, rebuildFeed, type FeedCfg } from '@/lib/feeds'
import type { CustomComp } from '@/lib/sections'
import Inspector from './Inspector'
import { Ic } from './Ic'
import ExportModal from './ExportModal'
import SitePages, { type SiteEntry } from './SitePages'
import PreviewBar, { type Size } from './PreviewBar'
import { isMobileNow, useMobile } from '@/lib/use-mobile'

const TABS = [['blocks', 'Blocks', 'tBlocks'], ['sections', 'Sections', 'tSections'], ['layers', 'Layers', 'tLayers']] as const
type Tab = (typeof TABS)[number][0]
type Hist = { past: Node[]; root: Node; future: Node[] }

const LEFT_KEY = 'shinspace:editor-left'
const btn = 'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-2 text-sm md:py-1.5 text-slate-600 transition hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent'

// `component` = an admin is editing one section of the library (page.id is the component id) instead of a user's page.
function EditorInner({ page, site: pagesOfSite, isAdmin, component }: { page: PageFull; site: SiteEntry[]; isAdmin: boolean; component: boolean }) {
  const [h, setH] = useState<Hist>(() => ({ past: [], root: page.root, future: [] }))
  const [sel, setSel] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('blocks')
  const [device, setDevice] = useState<Device>('desktop')
  const [preview, setPreview] = useState(false)
  const [pv, setPv] = useState<Size>({ w: 1280, h: 800 })
  const [code, setCode] = useState(false)
  const [site, setSite] = useState<SitePage[] | null>(null) // the pages handed to the export dialog
  const [edit, setEdit] = useState<{ id: string; n: number } | null>(null)
  // the section library comes from the database; it loads once, after the editor is on screen
  const [library, setLibrary] = useState<CustomComp[] | null>(null)
  const [libFailed, setLibFailed] = useState(false)
  const fetchLibrary = () => fetch('/api/components').then((r) => (r.ok ? (r.json() as Promise<CustomComp[]>) : Promise.reject()))
  const retryLibrary = () => { setLibFailed(false); fetchLibrary().then(setLibrary).catch(() => setLibFailed(true)) }
  useEffect(() => {
    let live = true
    fetchLibrary().then((l) => live && setLibrary(l)).catch(() => live && setLibFailed(true))
    return () => { live = false }
  }, [])
  const [toast, setToast] = useState('')
  // side panels: the left one stays folded or open between visits; the right one folds for the block it is showing, and opens again when another block is selected
  // On a phone the panels are a drawer (left) and a sheet (right) over the canvas: closed to start with, and not remembered.
  const mobile = useMobile()
  const [leftOpen, setLeftOpen] = useState(() => { if (isMobileNow()) return false; try { return localStorage.getItem(LEFT_KEY) !== '0' } catch { return true } })
  const showLeft = (open: boolean) => { setLeftOpen(open); if (!mobile) try { localStorage.setItem(LEFT_KEY, open ? '1' : '0') } catch {} }
  const [rightShut, setRightShut] = useState<string | null>(null)
  const [sheetFor, setSheetFor] = useState<string | null>(null) // phone: the block whose settings sheet is open
  const [name, setName] = useState(page.name) // the page's name; the header menu can rename it
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
    if (component) {
      // a component is one section: extra top-level blocks are grouped into a full-width section
      if (!r.c?.length) return // nothing to save yet
      const node = r.c.length === 1 ? r.c[0] : N('fullwidth', {}, {}, r.c)
      call(`/api/admin/components/${page.id}`, 'PATCH', { node }).then(() => { setSavedRoot(r); setFailed(false) }).catch(() => setFailed(true))
      return
    }
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
  // the site's home page becomes index.html and its other pages go to pages/; the open page is taken as it is on screen
  const openExport = async () => {
    const all = await fetchSite(page.id).catch(() => [page])
    setSite(all.map((p) => (p.id === page.id ? { name, root } : { name: p.name, root: p.root })))
  }
  const say = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500) }
  // admins can turn the selected block into a template that appears in everyone's Sections tab
  const saveComponent = async () => {
    const n = sel ? find(root, sel) : null
    if (!n) return
    if (n.type === 'col') return say('A column cannot be saved on its own. Select its row or section instead.')
    const name = prompt('Name this component', n.p.text?.slice(0, 40) || BLOCKS[n.type].label)?.trim()
    if (!name) return
    try {
      const c = await call<{ id: string; name: string; description: string; category: string }>('/api/admin/components', 'POST', { name, category: 'Custom', node: n })
      setLibrary((all) => [...(all ?? []), { id: c.id, name: c.name, description: c.description, category: c.category, sub: '', node: n }])
      say(`Saved “${c.name}”. It is now in Sections → Custom for everyone.`)
    } catch (x) { say(x instanceof Error ? x.message : 'Could not save the component.') }
  }
  const selected = sel ? (find(root, sel) ?? null) : null
  const rightOpen = !!selected && (mobile ? sheetFor === selected.id : rightShut !== selected.id)
  const closeDrawer = () => { if (mobile) setLeftOpen(false) }
  const addBlock = (n: Node) => { add(n); closeDrawer() } // the new block is what you want to see, so the drawer gets out of the way
  // is the selection a feed, or inside one? (so the Inspector can show or point to the feed settings)
  const feedOwner = (() => {
    for (let cur: Node | undefined = selected ?? undefined; cur; cur = parentOf(root, cur.id)) if (parseFeed(cur)) return cur.id
    return null
  })()
  const feedPatch = (id: string, patch: Partial<FeedCfg>) => commit((r) => update(r, id, (n) => rebuildFeed(n, patch)), `feed:${id}`)

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-800">
      {preview && <PreviewBar size={pv} onSize={setPv} onExit={() => setPreview(false)} />}
      <header className={'flex-wrap items-center gap-x-3 gap-y-2 bg-slate-900 px-3 py-2 text-white md:flex-nowrap md:gap-x-4 md:px-4 ' + (preview ? 'hidden' : 'flex')}>
        <span className="hidden text-sm font-bold tracking-[0.2em] sm:inline">SHINSPACE</span>
        <span className="hidden h-5 w-px bg-white/15 sm:block" aria-hidden />
        <Link href={component ? '/admin/components' : '/dashboard'} className="rounded-md px-2 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">{component ? '← Components' : '← Dashboard'}</Link>
        <span className="hidden h-5 w-px bg-white/15 md:block" aria-hidden />
        {component ? <span className="min-w-0 truncate text-sm text-slate-100">{page.name}</span> : <SitePages current={page.id} name={name} pages={pagesOfSite} root={root} onRename={setName} className="order-last w-full md:order-none md:w-auto" />}
        {component && <span className="rounded bg-[#f26522]/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-200">Component</span>}
        <span role="status" title={status} className={'flex items-center gap-1.5 text-xs ' + (failed ? 'text-rose-300' : 'text-slate-400')}>
          <i className={'size-1.5 rounded-full ' + (failed ? 'bg-rose-400' : root === savedRoot ? 'bg-emerald-400' : 'bg-amber-400')} aria-hidden /><span className="hidden sm:inline">{status}</span>
        </span>
        {component ? (
          <span className="ml-auto hidden text-xs text-slate-400 md:inline">Changes are saved to the library automatically</span>
        ) : (
          <button onClick={openExport} aria-label="Export site" className="ml-auto inline-flex items-center gap-2 rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 md:px-3.5 md:py-1.5">
            <Ic n="download" /> <span className="hidden sm:inline">Export site</span>
          </button>
        )}
        <span className="hidden rounded bg-indigo-500/30 px-1.5 py-0.5 text-[10px] font-medium text-indigo-200 xl:inline">Next.js + Tailwind</span>
      </header>
      <div className={'items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-1 md:px-3 md:py-1.5 ' + (preview ? 'hidden' : 'flex')}>
        <button className={btn + (leftOpen ? ' bg-slate-100' : '')} onClick={() => showLeft(!leftOpen)} aria-pressed={leftOpen} title={leftOpen ? 'Hide the left panel' : 'Show the left panel'} aria-label="Toggle the left panel"><Ic n="c12" /></button>
        <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
        <button className={btn} onClick={undo} disabled={!h.past.length} title="Undo"><Ic n="undo" /></button>
        <button className={btn} onClick={redo} disabled={!h.future.length} title="Redo"><Ic n="redo" /></button>
        <div className="mx-auto flex shrink-0 rounded-lg border border-slate-200 p-0.5">
          {(['desktop', 'tablet', 'mobile'] as Device[]).map((d) => (
            <button key={d} onClick={() => setDevice(d)} title={d} className={'rounded-md px-3 py-2 md:px-2.5 md:py-1 ' + (device === d ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100')}><Ic n={d} /></button>
          ))}
        </div>
        <button className={btn + (preview ? ' bg-indigo-100 text-indigo-700' : '')} onClick={() => { setPreview(!preview); setSel(null) }} title="Preview"><Ic n="eye" /><span className="hidden sm:inline">Preview</span></button>
        <button className={btn} onClick={() => setCode(true)} title="Export HTML"><Ic n="html" /><span className="hidden sm:inline">HTML</span></button>
        <button className={btn} onClick={() => confirm('Reset the page to the starter layout?') && commit(() => starter()) } title="Reset"><Ic n="reset" /><span className="hidden sm:inline">Reset</span></button>
        <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
        <button className={btn + (rightOpen ? ' bg-slate-100' : '')} onClick={() => (mobile ? setSheetFor(rightOpen ? null : selected!.id) : setRightShut(rightOpen ? selected!.id : null))} disabled={!selected} aria-pressed={rightOpen} title={!selected ? 'Select a block to see its settings' : rightOpen ? 'Hide the settings panel' : 'Show the settings panel'} aria-label="Toggle the settings panel"><Ic n="c21" /></button>
      </div>
      <div className="flex min-h-0 flex-1">
        {mobile && leftOpen && !preview && <div className="fixed inset-0 z-30 bg-slate-900/40" onClick={() => setLeftOpen(false)} aria-hidden />}
        <aside className={'fixed inset-y-0 left-0 z-40 w-[88vw] max-w-sm flex-col border-r border-slate-200 bg-white shadow-2xl md:static md:z-auto md:max-w-none md:shrink-0 md:shadow-none md:transition-[width] md:duration-150 ' + (tab === 'sections' ? 'md:w-[360px] ' : 'md:w-72 ') + (preview || !leftOpen ? 'hidden' : 'flex')}>
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 md:hidden">
            <span className="text-sm font-semibold">Add to the page</span>
            <button onClick={() => setLeftOpen(false)} aria-label="Close" className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><Ic n="close" /></button>
          </div>
          <nav className="grid grid-cols-3 border-b border-slate-200">
            {TABS.map(([k, label, icon]) => (
              <button key={k} onClick={() => setTab(k)} className={'flex flex-col items-center gap-1 py-2 text-[11px] ' + (tab === k ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-800')}>
                <Ic n={icon} />{label}
              </button>
            ))}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === 'blocks' && <BlocksTab onAdd={addBlock} />}
            {tab === 'sections' && <SectionsTab onAdd={addBlock} components={library} failed={libFailed} onRetry={retryLibrary} />}
            {tab === 'layers' && <LayersTab root={root} sel={sel} onSelect={(id) => { setSel(id); closeDrawer() }} />}
          </div>
          <p className="border-t border-slate-200 px-3 py-2 text-[11px] leading-relaxed text-slate-400">Ctrl+Z undo · Ctrl+D duplicate · Alt+↑↓ move · Del delete · Esc parent · Enter edit text</p>
        </aside>
        {!preview && !leftOpen && (
          <aside className="hidden w-12 shrink-0 flex-col items-center gap-1 border-r border-slate-200 bg-white py-2 md:flex">
            <button onClick={() => showLeft(true)} title="Show the left panel" aria-label="Show the left panel" className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Ic n="down" className="size-4 -rotate-90" /></button>
            {TABS.map(([k, label, icon]) => (
              <button key={k} onClick={() => { setTab(k); showLeft(true) }} title={label} aria-label={label} className="rounded-md p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"><Ic n={icon} /></button>
            ))}
          </aside>
        )}
        <main className={'relative min-w-0 flex-1 ' + (preview ? 'overflow-auto bg-slate-50 px-10 pb-12 pt-8' : 'p-2 md:p-4 [background-image:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]')}>
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
        {selected && !preview && !rightOpen && (
          <aside className="hidden w-12 shrink-0 flex-col items-center gap-1 border-l border-slate-200 bg-white py-2 md:flex">
            <button onClick={() => setRightShut(null)} title="Show the settings panel" aria-label="Show the settings panel" className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Ic n="down" className="size-4 rotate-90" /></button>
            <span className="rounded-md p-2 text-indigo-500" title={BLOCKS[selected.type]?.label}><Ic n="sliders" /></span>
          </aside>
        )}
        {selected && !preview && rightOpen && (
          <aside className="fixed inset-x-0 bottom-0 z-40 h-[62vh] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white shadow-[0_-8px_30px_rgba(0,0,0,.18)] md:static md:z-auto md:h-auto md:w-80 md:shrink-0 md:rounded-none md:border-l md:border-t-0 md:shadow-none">
            <Inspector key={selected.id} node={selected} onChange={patch} onAct={act} onClose={() => setSel(null)} onCollapse={() => (mobile ? setSheetFor(null) : setRightShut(selected.id))} onSaveComponent={isAdmin && !component ? saveComponent : undefined} onFeed={(patch) => feedPatch(selected.id, patch)} feedJump={feedOwner && feedOwner !== selected.id ? () => setSel(feedOwner) : undefined} />
          </aside>
        )}
      </div>
      {toast && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-xl">{toast}</div>}
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
export default function Editor({ page, site = [], isAdmin, component = false }: { page: PageFull; site?: SiteEntry[]; isAdmin: boolean; component?: boolean }) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  return mounted ? <EditorInner key={page.id} page={page} site={site.length ? site : [{ id: page.id, name: page.name }]} isAdmin={isAdmin} component={component} /> : null
}
