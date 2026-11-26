'use client'
// A live code editor for one library component, in the spirit of CodePen: index.html, style.css and script.js on one side,
// a live preview on the other, and the layout (split / editors / preview, left / top / right) is yours to choose.
// The left column also holds the component's details (name, description, category, sub-heading, published).
// It edits an existing component, or creates a new one (id === null).
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Fragment, useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { css as cssLang } from '@codemirror/lang-css'
import { html as htmlLang } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { call } from '@/lib/admin-api'
import { composeCode } from '@/lib/code'
import { compileClasses } from '@/lib/exporter'
import { Ic } from '../Ic'
import { DeviceControls, type Size } from '../PreviewBar'
import { isMobileNow, useMobile } from '@/lib/use-mobile'

type Lang = 'html' | 'css' | 'js'
type Parts = Record<Lang, string>
type Meta = { name: string; description: string; category: string; sub: string; published: boolean }
type View = 'split' | 'editors' | 'preview'
type Pos = 'left' | 'top' | 'right'

const FILES: { k: Lang; name: string; color: string }[] = [
  { k: 'html', name: 'index.html', color: '#e34c26' },
  { k: 'css', name: 'style.css', color: '#2965f1' },
  { k: 'js', name: 'script.js', color: '#f7df1e' },
]
const PREFS = 'shinspace:code-editor'
const input = 'w-full rounded-md border border-slate-600 bg-[#1b1d23] px-2.5 py-1.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-[#f26522]'

function Code({ lang, initial, onChange }: { lang: Lang; initial: string; onChange: (v: string) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const emit = useEffectEvent(onChange)
  useEffect(() => {
    const view = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: initial, // read once: the editor owns the text while it is open
        extensions: [
          basicSetup,
          oneDark,
          EditorView.lineWrapping,
          lang === 'html' ? htmlLang() : lang === 'css' ? cssLang() : javascript(),
          EditorView.updateListener.of((u) => { if (u.docChanged) emit(u.state.doc.toString()) }),
          EditorView.theme({ '&': { height: '100%' }, '.cm-scroller': { overflow: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: '13px', lineHeight: '1.6' } }),
        ],
      }),
    })
    return () => view.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])
  return <div ref={host} className="min-h-0 flex-1 overflow-hidden" />
}

// The preview iframe. With a device size it keeps that exact width and height (so media queries react) and is scaled down to fit the panel.
function Frame({ doc, size, run }: { doc: string; size: Size | null; run: number }) {
  const box = useRef<HTMLDivElement>(null)
  const [avail, setAvail] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setAvail({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(box.current!)
    return () => ro.disconnect()
  }, [])
  const scale = size && avail.w ? Math.max(0.1, Math.min(1, (avail.w - 32) / size.w, (avail.h - 56) / size.h)) : 1
  return (
    <div ref={box} className={'relative flex min-h-0 flex-1 items-center justify-center overflow-hidden ' + (size ? 'bg-slate-800' : '')}>
      {size ? (
        <div className="flex flex-col items-center gap-2">
          <div style={{ width: size.w * scale, height: size.h * scale }} className="overflow-hidden rounded-sm shadow-2xl ring-1 ring-white/10">
            <iframe key={run} title="Preview" sandbox="allow-scripts" srcDoc={doc} style={{ width: size.w, height: size.h, transform: `scale(${scale})`, transformOrigin: '0 0' }} className="block max-w-none bg-white" />
          </div>
          <span className="text-[11px] text-slate-400">{size.w} × {size.h} · {Math.round(scale * 100)}%</span>
        </div>
      ) : (
        <iframe key={run} title="Preview" sandbox="allow-scripts" srcDoc={doc} className="size-full bg-white" />
      )}
    </div>
  )
}

// Panes side by side (row) or stacked (col), each sized by a weight, with a draggable bar between neighbours.
// Drag (or use the arrow keys) to resize two neighbours against each other; double-click makes them equal again.
type Weights = Record<string, number>
function Panes({ dir, keys, weights, onWeights, children }: { dir: 'row' | 'col'; keys: string[]; weights: Weights; onWeights: (w: Weights) => void; children: Record<string, React.ReactNode> }) {
  const box = useRef<HTMLDivElement>(null)
  const start = useRef<{ at: number; a: number; b: number; per: number } | null>(null)
  const row = dir === 'row'
  const w = (k: string) => weights[k] ?? 1
  const total = keys.reduce((n, k) => n + w(k), 0)
  const min = 0.15 * (total / keys.length)
  const set = (i: number, a: number, b: number) => onWeights({ ...weights, [keys[i]]: a, [keys[i + 1]]: b })
  const move = (i: number, d: number, a: number, b: number) => { const na = Math.min(a + b - min, Math.max(min, a + d)); set(i, na, a + b - na) }
  return (
    <div ref={box} className={'flex min-h-0 min-w-0 flex-1 bg-[#0b0c10] ' + (row ? 'flex-row' : 'flex-col')}>
      {keys.map((k, i) => (
        <Fragment key={k}>
          <div style={{ flex: `${w(k)} 1 0%` }} className="flex min-h-0 min-w-0">{children[k]}</div>
          {i < keys.length - 1 && (
            <div
              role="separator"
              aria-orientation={row ? 'vertical' : 'horizontal'}
              aria-label="Resize"
              tabIndex={0}
              title="Drag to resize, double-click to reset"
              onPointerDown={(e) => {
                e.preventDefault()
                e.currentTarget.setPointerCapture(e.pointerId)
                const r = box.current!.getBoundingClientRect()
                start.current = { at: row ? e.clientX : e.clientY, a: w(k), b: w(keys[i + 1]), per: (row ? r.width : r.height) / total }
              }}
              onPointerMove={(e) => { const s = start.current; if (s && e.currentTarget.hasPointerCapture(e.pointerId)) move(i, ((row ? e.clientX : e.clientY) - s.at) / s.per, s.a, s.b) }}
              onPointerUp={() => { start.current = null }}
              onPointerCancel={() => { start.current = null }}
              onDoubleClick={() => { const m = (w(k) + w(keys[i + 1])) / 2; set(i, m, m) }}
              onKeyDown={(e) => {
                const d = (row ? { ArrowLeft: -0.1, ArrowRight: 0.1 } : { ArrowUp: -0.1, ArrowDown: 0.1 })[e.key as 'ArrowLeft']
                if (d) { e.preventDefault(); move(i, d, w(k), w(keys[i + 1])) }
              }}
              className={'relative z-10 shrink-0 touch-none bg-[#0b0c10] outline-none transition-colors hover:bg-[#f26522] focus-visible:bg-[#f26522] active:bg-[#f26522] ' + (row ? 'w-1.5 cursor-col-resize' : 'h-1.5 cursor-row-resize')}
            />
          )}
        </Fragment>
      ))}
    </div>
  )
}

const seg = (on: boolean) => 'flex items-center gap-1.5 px-3 py-2.5 text-sm transition md:py-1.5 ' + (on ? 'bg-slate-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200')
const Label = ({ children }: { children: React.ReactNode }) => <span className="mb-1 block text-xs font-medium text-slate-400">{children}</span>

type Props = { id: string | null; initial: Parts; meta: Meta; categories: string[]; converting: boolean }

function Inner({ id: idIn, initial, meta: metaIn, categories, converting: convertingIn }: Props) {
  const router = useRouter()
  const [vals, setVals] = useState<Parts>(initial)
  const [saved, setSaved] = useState<Parts>(initial)
  const [meta, setMeta] = useState<Meta>(metaIn)
  const [savedMeta, setSavedMeta] = useState<Meta>(metaIn)
  const [fresh, setFresh] = useState('') // a category typed in, instead of one of the chips
  const [converting, setConverting] = useState(convertingIn)
  const [note, setNote] = useState(convertingIn)
  const [open, setOpen] = useState<Record<Lang, boolean>>({ html: true, css: true, js: true })
  const prefs = useMemo<{ view?: View; pos?: Pos; side?: boolean; sizes?: { files: Weights; split: Weights } }>(() => { try { return JSON.parse(localStorage.getItem(PREFS) ?? '{}') } catch { return {} } }, [])
  const mobile = useMobile() // on a phone: editors and preview stack, and the details panel is a drawer
  const [view, setView] = useState<View>(prefs.view ?? (isMobileNow() ? 'editors' : 'split'))
  const [pos, setPos] = useState<Pos>(prefs.pos ?? 'left')
  const [side, setSide] = useState(isMobileNow() ? false : (prefs.side ?? true))
  const [sizes, setSizes] = useState(prefs.sizes ?? { files: {}, split: {} }) // pane weights: the three editors, and editors against preview
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [error, setError] = useState('')
  const [doc, setDoc] = useState('')
  const [device, setDevice] = useState<Size | null>(null) // null = the preview fills its panel
  const [run, setRun] = useState(0) // bumped by the refresh button so the preview (and its script) starts over
  const nameRef = useRef<HTMLInputElement>(null)

  const category = fresh.trim() || meta.category
  const metaDirty = meta.name !== savedMeta.name || meta.description !== savedMeta.description || meta.category !== savedMeta.category || meta.sub !== savedMeta.sub || meta.published !== savedMeta.published || !!fresh.trim()
  const dirty = vals.html !== saved.html || vals.css !== saved.css || vals.js !== saved.js || metaDirty || converting || idIn === null
  useEffect(() => { try { localStorage.setItem(PREFS, JSON.stringify({ view, pos, side, sizes })) } catch {} }, [view, pos, side, sizes])

  const save = async () => {
    if (status === 'saving') return
    if (!meta.name.trim()) { setError('Enter a name for the component.'); setStatus('error'); setSide(true); nameRef.current?.focus(); return }
    setStatus('saving'); setError('')
    const body = { ...vals, name: meta.name, description: meta.description, category, sub: meta.sub, published: meta.published }
    try {
      if (idIn) {
        await call(`/api/admin/components/${idIn}`, 'PATCH', { ...body, convert: converting })
      } else {
        const c = await call<{ id: string }>('/api/admin/components', 'POST', body)
        setSaved(vals); setSavedMeta({ ...meta, category }); setFresh('')
        router.replace(`/component-code/${c.id}`) // from here on it is an existing component
        return
      }
      setSaved(vals); setSavedMeta({ ...meta, category }); setMeta((m) => ({ ...m, category })); setFresh(''); setConverting(false); setNote(false); setStatus('idle')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save.'); setStatus('error') }
  }
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save() }
  })
  useEffect(() => {
    const k = (e: KeyboardEvent) => onKey(e)
    const leave = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault() }
    window.addEventListener('keydown', k)
    window.addEventListener('beforeunload', leave)
    return () => { window.removeEventListener('keydown', k); window.removeEventListener('beforeunload', leave) }
  }, [dirty])

  // The preview is a locked iframe. Tailwind is compiled out here from the class names only, and handed over as a stylesheet;
  // a change that adds no new class does not compile again.
  const compiled = useRef({ key: '', css: '' })
  useEffect(() => {
    let live = true
    const t = setTimeout(async () => {
      const classes = [...new Set([...new DOMParser().parseFromString(vals.html, 'text/html').querySelectorAll('[class]')].flatMap((e) => (e.getAttribute('class') ?? '').split(/\s+/)))].filter(Boolean).sort().join(' ')
      if (classes !== compiled.current.key) compiled.current = { key: classes, css: await compileClasses([classes]).catch(() => '') }
      if (live) setDoc(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${compiled.current.css}</style></head><body>${composeCode(vals.html, vals.css, vals.js)}</body></html>`)
    }, 450)
    return () => { live = false; clearTimeout(t) }
  }, [vals])

  const shown = FILES.filter((f) => open[f.k])
  const stacked = pos === 'top' && !mobile // editors side by side when they sit above the preview
  const editors = shown.length ? (
    <Panes dir={stacked ? 'row' : 'col'} keys={shown.map((f) => f.k)} weights={sizes.files} onWeights={(files) => setSizes((z) => ({ ...z, files }))}>
      {Object.fromEntries(shown.map((f) => [f.k, (
        <section key={f.k} className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#282c34]">
          <div className="flex items-center justify-between border-b border-black/40 bg-[#1b1d23]">
            <span className="flex items-center gap-2 border-t-2 px-3 py-2 text-sm text-slate-200" style={{ borderColor: f.color }}>
              <i className="size-2.5 rounded-sm" style={{ background: f.color }} />
              {f.name}
              <button onClick={() => setOpen({ ...open, [f.k]: false })} aria-label={`Close ${f.name}`} className="rounded p-0.5 text-slate-500 hover:bg-white/10 hover:text-white"><Ic n="close" className="size-3" /></button>
            </span>
          </div>
          <Code lang={f.k} initial={vals[f.k]} onChange={(v) => setVals((s) => ({ ...s, [f.k]: v }))} />
        </section>
      )]))}
    </Panes>
  ) : <div className="flex min-w-0 flex-1 items-center justify-center bg-[#282c34] text-sm text-slate-500">Open a file from the list on the left.</div>
  const preview = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#1b1d23]">
      <div className="flex items-center gap-2 border-b border-black/40 px-3 py-1.5">
        <button onClick={() => setRun((n) => n + 1)} title="Reload the preview" aria-label="Reload the preview" className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><Ic n="reset" className="size-4" /></button>
        <DeviceControls size={device} onSize={setDevice} fit compact />
      </div>
      <Frame doc={doc} size={device} run={run} />
    </div>
  )
  const chips = [...new Set([...categories, meta.category])]

  return (
    <div className="flex h-screen flex-col bg-[#1e1f26] text-slate-200">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-black/40 bg-[#14151a] px-3 py-2 md:px-4">
        <button onClick={() => setSide(!side)} aria-pressed={side} title={side ? 'Hide the side panel' : 'Show the side panel'} aria-label="Toggle the side panel" className={'rounded-md p-2 md:p-1.5 ' + (side ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/10')}><Ic n="c12" className="size-4" /></button>
        <span className="hidden text-sm font-bold tracking-[0.2em] sm:inline">SHINSPACE</span>
        <Link href="/admin/components" className="rounded-md px-2 py-2 text-xs text-slate-300 hover:bg-white/10 md:py-1">← Components</Link>
        <span className="min-w-0 max-w-[40vw] truncate text-sm sm:max-w-none">{meta.name.trim() || 'New component'}</span>
        <span className="rounded bg-[#f26522]/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-200">{idIn ? 'Code' : 'New'}</span>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="Editor layout" className="flex overflow-hidden rounded-md border border-slate-600">
            {([['split', 'Split', 'c2'], ['editors', 'Editors', 'text'], ['preview', 'Preview', 'image']] as [View, string, string][]).map(([k, label, icon]) => (
              <button key={k} role="radio" aria-checked={view === k} onClick={() => setView(k)} className={seg(view === k)}><Ic n={icon} className="size-4" /><span className="hidden sm:inline">{label}</span></button>
            ))}
          </div>
          <div role="radiogroup" aria-label="Editors position" className={'hidden overflow-hidden md:flex rounded-md border border-slate-600 ' + (view === 'split' ? '' : 'opacity-40')}>
            {([['left', 'Left', 'c12'], ['top', 'Top', 'accordion'], ['right', 'Right', 'c21']] as [Pos, string, string][]).map(([k, label, icon]) => (
              <button key={k} role="radio" aria-checked={pos === k} disabled={view !== 'split'} onClick={() => setPos(k)} className={seg(pos === k)}><Ic n={icon} className="size-4" />{label}</button>
            ))}
          </div>
          <span role="status" className={'max-w-60 truncate text-xs ' + (status === 'error' ? 'text-rose-300' : 'text-slate-400')}>{status === 'saving' ? 'Saving…' : status === 'error' ? error : dirty ? (idIn ? 'Unsaved changes' : 'Not created yet') : 'Saved'}</span>
          <button onClick={save} disabled={(!dirty && !!idIn) || status === 'saving'} className="rounded-md bg-[#f26522] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#d9561a] disabled:opacity-40">{idIn ? 'Save' : 'Create'}</button>
        </div>
      </header>
      {note && (
        <div className="flex items-start gap-3 bg-amber-500/15 px-4 py-2 text-sm text-amber-100">
          <p className="flex-1">This component is made of blocks. Saving it here turns it into code: the visual editor and the feed settings stop working for it. “Reset to original” in the library brings the blocks back.</p>
          <button onClick={() => setNote(false)} aria-label="Dismiss" className="rounded p-1 hover:bg-white/10"><Ic n="close" className="size-4" /></button>
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        {side && (
          <>
            {mobile && <div className="fixed inset-0 z-30 bg-black/50" onClick={() => setSide(false)} aria-hidden />}
          <aside className="fixed inset-y-0 left-0 z-40 flex w-[88vw] max-w-xs flex-col overflow-y-auto border-r border-black/40 bg-[#14151a] shadow-2xl md:static md:z-auto md:w-72 md:max-w-none md:shrink-0 md:shadow-none">
            <div className="flex items-center justify-between px-4 pb-2 pt-3 text-sm font-bold">Files{mobile && <button onClick={() => setSide(false)} aria-label="Close" className="rounded p-1.5 text-slate-400 hover:bg-white/10"><Ic n="close" className="size-4" /></button>}</div>
            <ul className="space-y-0.5 px-2">
              {FILES.map((f) => (
                <li key={f.k}>
                  <button onClick={() => setOpen({ ...open, [f.k]: !open[f.k] })} aria-pressed={open[f.k]} className={'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition ' + (open[f.k] ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300')}>
                    <i className="size-3 rounded-sm" style={{ background: f.color, opacity: open[f.k] ? 1 : 0.4 }} />{f.name}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-black/40 px-4 pb-2 pt-3 text-sm font-bold">Details</div>
            <div className="space-y-3.5 px-4 pb-4">
              <label className="block"><Label>Name</Label><input ref={nameRef} value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} placeholder="Promo banner" maxLength={80} className={input} /></label>
              <label className="block"><Label>Short description (shown in the Sections list)</Label><input value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} placeholder="A bold strip with one call to action" maxLength={200} className={input} /></label>
              <div>
                <Label>Category</Label>
                <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-1.5">
                  {chips.map((c) => (
                    <button type="button" key={c} role="radio" aria-checked={!fresh.trim() && meta.category === c} onClick={() => { setMeta({ ...meta, category: c }); setFresh('') }} className={'rounded-full px-2.5 py-1 text-xs transition ' + (!fresh.trim() && meta.category === c ? 'bg-[#f26522] text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600')}>{c}</button>
                  ))}
                </div>
                <input value={fresh} onChange={(e) => setFresh(e.target.value)} placeholder="…or type a new category" maxLength={30} className={input + ' mt-2'} />
              </div>
              <label className="block"><Label>Sub-heading inside the category (optional)</Label><input value={meta.sub} onChange={(e) => setMeta({ ...meta, sub: e.target.value })} placeholder="e.g. Slider" maxLength={30} className={input} /></label>
              <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                <span>Published <span className="block text-xs text-slate-500">Visible to everyone in the Sections tab</span></span>
                <input type="checkbox" role="switch" checked={meta.published} onChange={(e) => setMeta({ ...meta, published: e.target.checked })} className="peer sr-only" />
                <span className="relative h-6 w-10 shrink-0 rounded-full bg-slate-600 transition after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:bg-[#f26522] peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-[#f26522]" />
              </label>
            </div>
            <p className="mt-auto border-t border-black/40 p-4 text-xs leading-relaxed text-slate-500">Tailwind classes work in the HTML. <kbd className="rounded bg-white/10 px-1">Ctrl/⌘ S</kbd> {idIn ? 'saves' : 'creates it'}.</p>
          </aside>
          </>
        )}
        <main className="flex min-h-0 min-w-0 flex-1 bg-[#0b0c10]">
          {view === 'split' ? (
            <Panes dir={pos === 'top' || mobile ? 'col' : 'row'} keys={pos === 'right' && !mobile ? ['preview', 'editors'] : ['editors', 'preview']} weights={sizes.split} onWeights={(split) => setSizes((z) => ({ ...z, split }))}>
              {{ editors, preview }}
            </Panes>
          ) : view === 'editors' ? editors : preview}
        </main>
      </div>
    </div>
  )
}

// localStorage and the editor widgets only exist in the browser, so the editor mounts after the page has loaded.
export default function CodeEditor(props: Props) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  return mounted ? <Inner {...props} /> : null
}
