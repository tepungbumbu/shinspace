'use client'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { BLOCKS, accepts, renderPage } from '@/lib/blocks'
import { contains, drag, find, parentOf, type Node } from '@/lib/tree'
import { Ic } from './Ic'

export type Device = 'desktop' | 'tablet' | 'mobile'
export type Act = 'up' | 'down' | 'dup' | 'del' | 'parent'
type Rect = { x: number; y: number; w: number; h: number }
type Loc = { pid: string; i: number; ind: { r: Rect; line: boolean } }

const WIDTH: Record<Device, string> = { desktop: '100%', tablet: '768px', mobile: '375px' }
const EDITABLE = ['heading', 'text', 'button']
// The iframe compiles Tailwind in the browser, so any class a block carries works on the canvas.
const SRC = '<!doctype html><html><head><base target="_blank"><script src="/tailwind-browser.js"></script><style type="text/tailwindcss">@import "tailwindcss";</style></head><body><div id="pf"></div></body></html>'
const EDIT_CSS = `
#pf{min-height:100vh}
[data-t=row],[data-t=col],[data-t=container],[data-t=box],[data-t=card]{outline:1px dashed rgb(129 140 248/.4);outline-offset:-1px}
[data-empty]{min-height:3.5rem;position:relative}
[data-empty]::after{content:"Drop blocks here";display:flex;align-items:center;justify-content:center;min-height:3.5rem;color:#818cf8;font:500 12px system-ui}
[data-t=spacer]{background:repeating-linear-gradient(45deg,#eef2ff,#eef2ff 6px,transparent 6px,transparent 12px)}
iframe{pointer-events:none}
[contenteditable]{outline:2px solid #6366f1!important;outline-offset:2px;cursor:text}`

const rect = (el: Element): Rect => {
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}

// Where would the dragged node land if released at height `y` over element `el`?
function locate(doc: Document, root: Node, node: Node, el: HTMLElement | null, y: number): Loc | null {
  const q = (id: string) => doc.querySelector(`[data-pf="${id}"]`) ?? doc.body
  const t = find(root, el?.dataset.pf ?? root.id) ?? root
  if (contains(node, t.id)) return null
  const r = rect(q(t.id))
  const edge = Math.min(12, r.h / 4)
  if (accepts(t, node) && (t.id === root.id || (y > r.y + edge && y < r.y + r.h - edge))) {
    const kids = t.c ?? []
    if (!kids.length) return { pid: t.id, i: 0, ind: { r, line: false } }
    let i = kids.length
    for (let k = 0; k < kids.length; k++) {
      const kr = rect(q(kids[k].id))
      if (y < kr.y + kr.h / 2) { i = k; break }
    }
    const kr = rect(q(kids[Math.min(i, kids.length - 1)].id))
    return { pid: t.id, i, ind: { r: { ...kr, y: i < kids.length ? kr.y : kr.y + kr.h }, line: true } }
  }
  // otherwise land beside t (or beside the closest ancestor whose parent accepts the node)
  let cur = t
  let p = parentOf(root, cur.id)
  while (p && !accepts(p, node)) { cur = p; p = parentOf(root, cur.id) }
  if (!p) return null
  const cr = rect(q(cur.id))
  const after = y > cr.y + cr.h / 2
  return { pid: p.id, i: p.c!.indexOf(cur) + (after ? 1 : 0), ind: { r: { ...cr, y: after ? cr.y + cr.h : cr.y }, line: true } }
}

function startEdit(doc: Document, id: string, commit: (id: string, text: string) => void) {
  const el = doc.querySelector<HTMLElement>(`[data-pf="${id}"]`)
  if (!el || !EDITABLE.includes(el.dataset.t ?? '')) return
  const before = el.innerHTML
  const ac = new AbortController()
  let cancel = false
  el.contentEditable = 'plaintext-only'
  el.style.whiteSpace = 'pre-wrap'
  el.focus()
  doc.getSelection()?.selectAllChildren(el)
  el.addEventListener('keydown', (e) => {
    e.stopPropagation()
    if (e.key === 'Escape') { cancel = true; el.blur() }
    else if (e.key === 'Enter' && el.dataset.t !== 'text') { e.preventDefault(); el.blur() }
  }, { signal: ac.signal })
  el.addEventListener('blur', () => {
    ac.abort()
    el.removeAttribute('contenteditable')
    el.style.whiteSpace = ''
    if (cancel) el.innerHTML = before
    else commit(id, el.innerText.replace(/\n+$/, ''))
  }, { once: true })
}

type Props = {
  root: Node
  sel: string | null
  device: Device
  preview: boolean
  size?: { w: number; h: number } // preview frame, resizable by its handles
  onSize?: (s: { w: number; h: number }) => void
  edit: { id: string; n: number } | null
  onSelect: (id: string | null) => void
  onText: (id: string, text: string) => void
  onDrop: (pid: string, i: number) => void
  onAct: (a: Act) => void
  onKey: (e: KeyboardEvent) => void
}

export default function Canvas({ root, sel, device, preview, size, onSize, edit, onSelect, onText, onDrop, onAct, onKey }: Props) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [doc, setDoc] = useState<Document | null>(null)
  const [box, setBox] = useState<Rect | null>(null)
  const [ind, setInd] = useState<Loc['ind'] | null>(null)
  const loc = useRef<Loc | null>(null)

  const onLoad = () => {
    const d = frame.current!.contentDocument!
    const st = d.createElement('style')
    st.textContent = EDIT_CSS
    d.head.appendChild(st)
    setDoc(d)
  }

  // 1. paint the page into the iframe
  useEffect(() => {
    if (!doc) return
    const pf = doc.getElementById('pf')!
    pf.innerHTML = renderPage(root, !preview)
    if (preview) { pf.removeAttribute('data-pf'); pf.removeAttribute('data-empty') }
    else { pf.dataset.pf = root.id; pf.dataset.t = 'root'; pf.toggleAttribute('data-empty', !root.c?.length) }
  }, [doc, root, preview])

  // 2. keep the selection outline glued to its element
  useEffect(() => {
    if (!doc) return
    const m = () => {
      const el = sel && !preview ? doc.querySelector(`[data-pf="${sel}"]`) : null
      setBox(el ? rect(el) : null)
    }
    const raf = requestAnimationFrame(m)
    const ro = new ResizeObserver(m)
    ro.observe(doc.body)
    doc.defaultView!.addEventListener('scroll', m)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); doc.defaultView?.removeEventListener('scroll', m) }
  }, [doc, root, sel, device, preview])

  // 3. pointer, keyboard and drag-drop on the page inside the iframe
  const onEvt = useEffectEvent((e: Event) => {
    const el = (e.target as Element).closest?.('[data-pf]') as HTMLElement | null
    switch (e.type) {
      case 'click':
        e.preventDefault()
        onSelect(el && el.dataset.t !== 'root' ? el.dataset.pf! : null)
        break
      case 'dblclick':
        if (el && doc) startEdit(doc, el.dataset.pf!, onText)
        break
      case 'keydown':
        onKey(e as KeyboardEvent)
        break
      case 'dragover': {
        const d = drag.cur
        if (!d || !doc) return
        const node = d.kind === 'new' ? d.node : find(root, d.id)
        const l = node && locate(doc, root, node, el, (e as DragEvent).clientY)
        loc.current = l || null
        setInd(l ? l.ind : null)
        if (l) { e.preventDefault(); (e as DragEvent).dataTransfer!.dropEffect = d.kind === 'new' ? 'copy' : 'move' }
        break
      }
      case 'dragleave':
        if (!(e as DragEvent).relatedTarget) { loc.current = null; setInd(null) }
        break
      case 'drop': {
        e.preventDefault()
        const l = loc.current
        loc.current = null
        setInd(null)
        if (l && drag.cur) onDrop(l.pid, l.i)
        break
      }
    }
  })
  useEffect(() => {
    if (!doc || preview) return
    const types = ['click', 'dblclick', 'keydown', 'dragover', 'dragleave', 'drop']
    types.forEach((t) => doc.addEventListener(t, onEvt))
    return () => types.forEach((t) => doc.removeEventListener(t, onEvt))
  }, [doc, preview])

  // Enter key (from the editor) asks for inline editing
  const go = useEffectEvent((id: string) => doc && startEdit(doc, id, onText))
  useEffect(() => { if (edit) go(edit.id) }, [edit])

  const grab = (side: 'l' | 'r' | 'b') => (e: React.PointerEvent<HTMLElement>) => {
    if (!size || !onSize) return
    const [x0, y0, { w, h }] = [e.clientX, e.clientY, size]
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const move = (m: PointerEvent) => {
      const clamp = (v: number, lo: number) => Math.round(Math.min(3840, Math.max(lo, v)))
      if (side === 'b') onSize({ w, h: clamp(h + m.clientY - y0, 240) })
      else onSize({ w: clamp(w + (side === 'r' ? 2 : -2) * (m.clientX - x0), 280), h })
    }
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up) }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }
  const handle = 'absolute flex items-center justify-center'
  const grip = 'rounded-full bg-slate-400 transition group-hover:bg-indigo-500'

  return (
    <div
      className={'relative mx-auto max-w-full ' + (size ? 'shrink-0' : 'h-full transition-[width] duration-200')}
      style={size ? { width: size.w, height: size.h } : { width: WIDTH[device] }}
    >
      <iframe
        ref={frame}
        srcDoc={SRC}
        onLoad={onLoad}
        title="Page"
        className={'h-full w-full bg-white ' + (size ? 'shadow-xl ring-1 ring-slate-300' : device === 'desktop' ? '' : 'rounded-xl shadow-2xl ring-1 ring-slate-300')}
      />
      {size && (
        <>
          {(['l', 'r'] as const).map((side) => (
            <div key={side} onPointerDown={grab(side)} title="Drag to resize" className={`${handle} group top-0 h-full w-5 cursor-ew-resize touch-none ${side === 'l' ? '-left-6' : '-right-6'}`}>
              <span className={`${grip} h-10 w-1`} />
            </div>
          ))}
          <div onPointerDown={grab('b')} title="Drag to resize" className={`${handle} group -bottom-6 left-0 h-5 w-full cursor-ns-resize touch-none`}>
            <span className={`${grip} h-1 w-10`} />
          </div>
        </>
      )}
      {!preview && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {ind && (
            <div
              className={ind.line ? 'absolute rounded bg-indigo-500' : 'absolute rounded border-2 border-indigo-500 bg-indigo-500/10'}
              style={ind.line ? { left: ind.r.x, top: ind.r.y - 1.5, width: ind.r.w, height: 3 } : { left: ind.r.x, top: ind.r.y, width: ind.r.w, height: ind.r.h }}
            />
          )}
          {box && sel && (
            <div className="absolute border-2 border-indigo-500" style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
              <div className="pointer-events-auto absolute right-0 flex items-center gap-px rounded-md bg-indigo-600 p-0.5 text-white shadow-lg" style={{ top: box.y < 34 ? 4 : -32 }}>
                <span className="px-1.5 text-[11px] font-medium">{BLOCKS[find(root, sel)?.type ?? 'root']?.label}</span>
                <span
                  draggable
                  title="Drag to move"
                  onDragStart={(e) => { drag.cur = { kind: 'move', id: sel }; e.dataTransfer.setData('text/plain', 'pf'); e.dataTransfer.effectAllowed = 'move' }}
                  onDragEnd={() => { drag.cur = null; loc.current = null; setInd(null) }}
                  className="cursor-grab rounded p-1 hover:bg-indigo-500"
                ><Ic n="grip" className="size-3.5" /></span>
                {([['parent', 'Select parent'], ['up', 'Move up'], ['down', 'Move down'], ['dup', 'Duplicate'], ['del', 'Delete']] as [Act, string][]).map(([a, t]) => (
                  <button key={a} title={t} onClick={() => onAct(a)} className="rounded p-1 hover:bg-indigo-500"><Ic n={a} className="size-3.5" /></button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
