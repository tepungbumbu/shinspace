'use client'
import { useState } from 'react'
import { Ic } from './Ic'

export type Size = { w: number; h: number }
const GROUPS: { title: string; items: [string, number, number][] }[] = [
  { title: 'Page Breakpoints', items: [['Mobile', 390, 844], ['Tablet', 768, 1024], ['Desktop', 1280, 800]] },
  {
    title: 'Common Devices',
    items: [['Galaxy S24/Pixel 8', 412, 915], ['iPhone 12-15/Pro', 393, 852], ['iPhone 16-17/Pro', 402, 874], ['iPhone Plus/Pro Max', 430, 932], ['iPad', 820, 1180], ['Laptop', 1440, 900], ['Wide screen', 1920, 1080]],
  },
]
const icon = (w: number) => (w < 600 ? 'mobile' : w < 1000 ? 'tablet' : 'desktop')
const num = 'w-16 rounded border border-white/20 bg-transparent px-2 py-1 text-center text-sm text-white outline-none focus:border-indigo-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none'

// Device picker + W/H + portrait/landscape. With `fit` the size may be null, meaning "fill the panel" (responsive).
export function DeviceControls({ size, onSize, fit = false, compact = false }: { size: Size | null; onSize: (s: Size | null) => void; fit?: boolean; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const current = !size ? 'Fit to panel' : GROUPS.flatMap((g) => g.items).find(([, w, h]) => (w === size.w && h === size.h) || (w === size.h && h === size.w))?.[0] ?? 'Custom'
  const landscape = !!size && size.w > size.h
  const field = (k: 'w' | 'h') => size && (
    <label className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
      {k.toUpperCase()}
      <input
        type="number"
        min={k === 'w' ? 280 : 240}
        max={3840}
        value={size[k]}
        onChange={(e) => onSize({ ...size, [k]: Math.min(3840, Math.max(1, +e.target.value || 0)) })}
        className={num}
      />
      {!compact && 'px'}
    </label>
  )
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <div className="relative">
        <button onClick={() => setOpen(!open)} aria-haspopup="listbox" aria-expanded={open} className={'flex items-center gap-2 whitespace-nowrap rounded px-2.5 py-1.5 text-sm hover:bg-white/10 ' + (compact ? 'w-44 sm:w-48' : 'w-48 sm:w-56')}>
          <Ic n={size ? icon(size.w) : 'desktop'} />
          <span className="mr-auto truncate">{current}</span>
          <Ic n="down" className="size-3.5 text-slate-400" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-md bg-slate-800 py-1 shadow-2xl ring-1 ring-white/10">
              {fit && (
                <button onClick={() => { onSize(null); setOpen(false) }} className={'flex w-full items-center gap-3 px-3 py-2 text-left text-sm ' + (!size ? 'bg-indigo-500' : 'hover:bg-white/10')}>
                  <Ic n="desktop" className="size-4 shrink-0" />
                  <span className="mr-auto whitespace-nowrap">Fit to panel</span>
                  <span className="text-[11px] text-slate-400">responsive</span>
                </button>
              )}
              {GROUPS.map((g) => (
                <div key={g.title}>
                  <div className="bg-slate-700/60 px-3 py-1.5 text-xs text-slate-300">{g.title}</div>
                  {g.items.map(([name, w, h]) => (
                    <button
                      key={name}
                      onClick={() => { onSize({ w, h }); setOpen(false) }}
                      className={'flex w-full items-center gap-3 px-3 py-2 text-left text-sm ' + (name === current ? 'bg-indigo-500' : 'hover:bg-white/10')}
                    >
                      <Ic n={icon(w)} className="size-4 shrink-0" />
                      <span className="mr-auto whitespace-nowrap">{name}</span>
                      <span className="text-[11px] text-slate-400">{w}×{h}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {field('w')}
      {field('h')}
      {size && (
        <div className="flex rounded-md bg-white/10 p-0.5">
          {([['portrait', false], ['landscape', true]] as const).map(([n, land]) => (
            <button
              key={n}
              title={n[0].toUpperCase() + n.slice(1)}
              aria-label={n[0].toUpperCase() + n.slice(1)}
              onClick={() => landscape !== land && onSize({ w: size.h, h: size.w })}
              className={'rounded px-2 py-1 ' + (landscape === land ? 'bg-indigo-500' : 'text-slate-300 hover:bg-white/10')}
            >
              <Ic n={n} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PreviewBar({ size, onSize, onExit }: { size: Size; onSize: (s: Size) => void; onExit: () => void }) {
  return (
    <div className="relative z-20 flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 bg-slate-900 px-3 py-1.5 text-white md:gap-x-4 md:px-4">
      <span className="hidden text-sm font-bold tracking-[0.2em] sm:inline">SHINSPACE</span>
      <span className="hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 sm:inline">Preview</span>
      <div className="mr-auto sm:mx-auto">
        <DeviceControls size={size} onSize={(s) => s && onSize(s)} />
      </div>
      <button onClick={onExit} className="rounded bg-indigo-500 px-4 py-1.5 text-sm font-medium hover:bg-indigo-400">Exit preview</button>
    </div>
  )
}
