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

export default function PreviewBar({ size, onSize, onExit }: { size: Size; onSize: (s: Size) => void; onExit: () => void }) {
  const [open, setOpen] = useState(false)
  const current = GROUPS.flatMap((g) => g.items).find(([, w, h]) => (w === size.w && h === size.h) || (w === size.h && h === size.w))?.[0] ?? 'Custom'
  const landscape = size.w > size.h
  const field = (k: 'w' | 'h') => (
    <label className="flex items-center gap-1.5 text-xs text-slate-400">
      {k.toUpperCase()}
      <input
        type="number"
        min={k === 'w' ? 280 : 240}
        max={3840}
        value={size[k]}
        onChange={(e) => onSize({ ...size, [k]: Math.min(3840, Math.max(1, +e.target.value || 0)) })}
        className={num}
      />
      px
    </label>
  )
  return (
    <div className="relative z-20 flex h-11 items-center gap-4 bg-slate-900 px-4 text-white">
      <span className="text-sm font-bold tracking-[0.2em]">SHINSPACE</span>
      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">Preview</span>
      <div className="mx-auto flex items-center gap-4">
        <div className="relative">
          <button onClick={() => setOpen(!open)} className="flex w-56 items-center gap-2 whitespace-nowrap rounded px-2.5 py-1.5 text-sm hover:bg-white/10">
            <Ic n={icon(size.w)} />
            <span className="mr-auto truncate">{current}</span>
            <Ic n="down" className="size-3.5 text-slate-400" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0" onClick={() => setOpen(false)} />
              <div className="absolute left-0 top-full mt-1 w-64 overflow-hidden rounded-md bg-slate-800 py-1 shadow-2xl ring-1 ring-white/10">
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
        <div className="flex rounded-md bg-white/10 p-0.5">
          {([['portrait', false], ['landscape', true]] as const).map(([n, land]) => (
            <button
              key={n}
              title={n[0].toUpperCase() + n.slice(1)}
              onClick={() => landscape !== land && onSize({ w: size.h, h: size.w })}
              className={'rounded px-2 py-1 ' + (landscape === land ? 'bg-indigo-500' : 'text-slate-300 hover:bg-white/10')}
            >
              <Ic n={n} />
            </button>
          ))}
        </div>
      </div>
      <button onClick={onExit} className="rounded bg-indigo-500 px-4 py-1.5 text-sm font-medium hover:bg-indigo-400">Exit preview</button>
    </div>
  )
}
