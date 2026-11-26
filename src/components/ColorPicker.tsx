'use client'
// A custom colour picker, shown inline: saturation/brightness square, hue and opacity sliders, hex and % fields, an eyedropper
// (where the browser has one) and the colours you picked recently. It reports #rrggbb, or #rrggbbaa when it is not fully opaque.
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'

type HSVA = { h: number; s: number; v: number; a: number }
const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n))

function fromHex(hex: string): HSVA | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex.trim())
  if (!m) return null
  let x = m[1]
  if (x.length === 3) x = [...x].map((c) => c + c).join('')
  const r = parseInt(x.slice(0, 2), 16) / 255, g = parseInt(x.slice(2, 4), 16) / 255, b = parseInt(x.slice(4, 6), 16) / 255
  const a = x.length === 8 ? parseInt(x.slice(6, 8), 16) / 255 : 1
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b)
  const h = d === 0 ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: h * 60, s: max === 0 ? 0 : d / max, v: max, a }
}
function toHex({ h, s, v, a }: HSVA) {
  const f = (n: number) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)) }
  const hx = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
  return `#${hx(f(5))}${hx(f(3))}${hx(f(1))}${a < 1 ? hx(a) : ''}`
}

const RECENT = 'shinspace:recent-colors'
const loadRecent = (): string[] => { try { const r = JSON.parse(localStorage.getItem(RECENT) ?? '[]'); return Array.isArray(r) ? r.filter((x) => typeof x === 'string').slice(0, 10) : [] } catch { return [] } }
const CHECK = 'repeating-conic-gradient(#d4d4d8 0 25%, #fff 0 50%) 0 0/10px 10px'

// a draggable surface: reports the pointer position as 0..1 on both axes
function Pad({ onMove, onEnd, className, style, label, children }: { onMove: (x: number, y: number) => void; onEnd: () => void; className: string; style?: React.CSSProperties; label: string; children: React.ReactNode }) {
  const at = (e: PointerEvent<HTMLDivElement>) => { const r = e.currentTarget.getBoundingClientRect(); onMove(clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height)) }
  return (
    <div
      role="presentation" aria-label={label} className={'touch-none select-none ' + className} style={style}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); at(e) }}
      onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) at(e) }}
      onPointerUp={onEnd}
    >{children}</div>
  )
}

export default function ColorPicker({ value, onChange, className = 'mt-3' }: { value: string; onChange: (hex: string) => void; className?: string }) {
  const [d, setD] = useState<HSVA>(() => fromHex(value) ?? { h: 220, s: 0.7, v: 0.9, a: 1 })
  const [last, setLast] = useState(value) // what this picker last reported; a different value from outside (undo) replaces the draft
  const [text, setText] = useState<string | null>(null) // the hex field while it is being typed
  const [recent, setRecent] = useState(loadRecent)
  if (value !== last) { setLast(value); const n = fromHex(value); if (n) setD(n) }

  const hex = toHex(d)
  const emit = (n: HSVA) => { setD(n); const h = toHex(n); setLast(h); onChange(h) }
  const remember = () => {
    const next = [hex, ...recent.filter((c) => c !== hex)].slice(0, 10)
    setRecent(next)
    try { localStorage.setItem(RECENT, JSON.stringify(next)) } catch {}
  }
  const solid = toHex({ ...d, a: 1 })
  const dropper = typeof window !== 'undefined' && 'EyeDropper' in window
  const pick = async () => {
    try {
      const r = await new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper().open()
      const n = fromHex(r.sRGBHex)
      if (n) { emit({ ...n, a: d.a }); remember() }
    } catch {} // cancelled
  }
  const commitText = (t: string) => {
    const n = fromHex(t.startsWith('#') ? t : '#' + t)
    if (n) emit({ ...n, a: /^#?[0-9a-f]{8}$/i.test(t) ? n.a : d.a })
  }
  const field = 'w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-indigo-400 focus:bg-white'
  const thumb = 'pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.35)]'

  return (
    <div className={'space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm ' + className}>
      <Pad label="Saturation and brightness" onMove={(x, y) => emit({ ...d, s: x, v: 1 - y })} onEnd={remember} className="relative h-36 cursor-crosshair rounded-lg" style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${d.h} 100% 50%)` }}>
        <span className={thumb} style={{ left: `${d.s * 100}%`, top: `${(1 - d.v) * 100}%`, background: solid }} />
      </Pad>

      <div className="flex items-center gap-3">
        {dropper && (
          <button type="button" onClick={pick} title="Pick a colour from the screen" aria-label="Pick a colour from the screen" className="grid size-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m2 22 1-1h3l9-9M3 21v-3l9-9" /><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3z" /></svg>
          </button>
        )}
        <div className="min-w-0 flex-1 space-y-2.5">
          <Pad label="Hue" onMove={(x) => emit({ ...d, h: x * 360 })} onEnd={remember} className="relative h-3.5 cursor-pointer rounded-full" style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}>
            <span className={thumb + ' top-1/2'} style={{ left: `${(d.h / 360) * 100}%`, background: `hsl(${d.h} 100% 50%)` }} />
          </Pad>
          <Pad label="Opacity" onMove={(x) => emit({ ...d, a: Math.round(x * 100) / 100 })} onEnd={remember} className="relative h-3.5 cursor-pointer rounded-full" style={{ background: `linear-gradient(to right, transparent, ${solid}), ${CHECK}` }}>
            <span className={thumb + ' top-1/2'} style={{ left: `${d.a * 100}%`, background: hex }} />
          </Pad>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="size-8 shrink-0 rounded-md border border-black/10" style={{ background: `linear-gradient(${hex}, ${hex}), ${CHECK}` }} aria-hidden />
        <label className="flex-1">
          <span className="sr-only">Hex colour</span>
          <input value={text ?? solid.toUpperCase()} onChange={(e) => { setText(e.target.value); commitText(e.target.value) }} onBlur={() => { setText(null); remember() }} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} maxLength={9} spellCheck={false} className={field + ' font-mono uppercase'} />
        </label>
        <label className="flex w-20 items-center gap-1">
          <span className="sr-only">Opacity</span>
          <input type="number" min={0} max={100} value={Math.round(d.a * 100)} onChange={(e) => emit({ ...d, a: clamp(Number(e.target.value) / 100) })} onBlur={remember} className={field + ' text-right'} />
          <span className="text-xs text-slate-400">%</span>
        </label>
      </div>

      {recent.length > 0 && (
        <div>
          <div className="mb-1.5 text-[11px] font-medium text-slate-500">Recent</div>
          <div className="flex flex-wrap gap-1.5">
            {recent.map((c) => (
              <button key={c} type="button" title={c} aria-label={c} onClick={() => { const n = fromHex(c); if (n) emit(n) }} className="size-6 rounded-md border border-black/10 hover:scale-110" style={{ background: `linear-gradient(${c}, ${c}), ${CHECK}` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// The "+" swatch: a rainbow dot that opens the picker as a pop-up beside the panel (the preset colours stay where they are).
// `size` is the dot's Tailwind size class; `active` rings it (a custom colour is in use).
export function CustomColorButton({ value, onChange, size = 'size-6', active = false, offset = 'ring-offset-2' }: { value: string; onChange: (hex: string) => void; size?: string; active?: boolean; offset?: string }) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const pop = useRef<HTMLDivElement>(null)
  const close = () => setPos(null)

  useEffect(() => {
    if (!pos) return
    const out = (e: globalThis.PointerEvent) => { const t = e.target as Node; if (!pop.current?.contains(t) && !btn.current?.contains(t)) close() }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close() } } // captured first, so the editor's own Esc shortcut stays out of it
    const scroll = (e: Event) => { if (!pop.current?.contains(e.target as Node)) close() } // the pop-up is fixed, so it would drift away from its dot
    document.addEventListener('pointerdown', out)
    window.addEventListener('keydown', key, true)
    window.addEventListener('scroll', scroll, true)
    return () => { document.removeEventListener('pointerdown', out); window.removeEventListener('keydown', key, true); window.removeEventListener('scroll', scroll, true) }
  }, [pos])

  const toggle = () => {
    if (pos) return close()
    const r = btn.current!.getBoundingClientRect()
    const w = 268, h = 400, gap = 12
    // left of the settings panel when there is room (so the panel stays visible), else near the dot; always inside the window
    const edge = btn.current!.closest('aside')?.getBoundingClientRect().left ?? r.left // the settings panel's own edge
    const left = edge - w - gap >= 8 ? edge - w - gap : Math.min(Math.max(8, r.left), window.innerWidth - w - 8)
    const top = Math.min(Math.max(8, r.top - 60), Math.max(8, window.innerHeight - h - 8))
    setPos({ left, top })
  }

  return (
    <>
      <button ref={btn} type="button" title="Custom colour" aria-label="Custom colour" aria-haspopup="dialog" aria-expanded={!!pos} onClick={toggle} style={{ background: 'conic-gradient(#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }} className={`relative ${size} shrink-0 rounded-full border border-black/15 ` + (pos || active ? `ring-2 ring-indigo-400 ${offset}` : '')}>
        <span className="absolute inset-[22%] grid place-items-center rounded-full bg-white text-[10px] font-bold leading-none text-slate-600">+</span>
      </button>
      {pos && createPortal(
        <div ref={pop} role="dialog" aria-label="Custom colour" style={{ left: pos.left, top: pos.top }} className="fixed z-[80] max-h-[calc(100vh-16px)] w-[268px] overflow-y-auto rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-slate-200 bg-white px-3 pt-2.5 text-xs font-semibold text-slate-700">
            Custom colour
            <button type="button" onClick={close} aria-label="Close" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
          </div>
          <ColorPicker value={value} onChange={onChange} className="!mt-0 rounded-t-none border-t-0 shadow-none" />
        </div>,
        document.body,
      )}
    </>
  )
}
