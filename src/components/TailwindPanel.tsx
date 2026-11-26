'use client'
import { useState } from 'react'
import { GROUPS, PALETTES, SHADES, SPECIAL, VARIANTS, type Prop } from '@/lib/tailwind'
import type { Node } from '@/lib/tree'
import { CustomColorButton } from './ColorPicker'
import { Ic } from './Ic'

const field = 'w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-indigo-400 focus:bg-white'

function Control({ prop, value, onChange }: { prop: Prop; value: string; onChange: (v: string) => void }) {
  if (prop.k === 'free') {
    return <input className={field + ' font-mono'} placeholder={prop.hint} value={value} onChange={(e) => onChange(e.target.value.replace(/["<>`\s]/g, ''))} />
  }
  if (prop.k === 'opt') {
    return (
      <select className={field} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">–</option>
        {value && !prop.o!.includes(value) && <option value={value}>{value}</option>}
        {prop.o!.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  return <ColorControl prop={prop} value={value} onChange={onChange} />
}

// a palette colour ("<prefix>-<palette>-<shade>", "<prefix>-black"...) or a custom one ("<prefix>-[#rrggbb]")
function ColorControl({ prop, value, onChange }: { prop: Prop; value: string; onChange: (v: string) => void }) {
  const rest = value ? value.slice(prop.pre!.length + 1) : ''
  const custom = /^\[(#[0-9a-f]{6}(?:[0-9a-f]{2})?)\]$/i.exec(rest)?.[1]
  const m = rest.match(/^([a-z]+)-(\d+)$/)
  const [pal, shade] = custom ? ['', ''] : m ? [m[1], m[2]] : [rest, '']
  const set = (p: string, s: string) => onChange(!p ? '' : PALETTES.includes(p) ? `${prop.pre}-${p}-${s || '500'}` : `${prop.pre}-${p}`)
  const checker = 'repeating-conic-gradient(#e2e8f0 0 25%, #fff 0 50%) 0 0/8px 8px'
  const dot = custom ? `linear-gradient(${custom}, ${custom}), ${checker}` : value ? `var(--color-${pal}${shade ? '-' + shade : ''}, ${pal})` : checker
  return (
    <div className="flex items-center gap-2">
      <span className="size-5 shrink-0 rounded-full border border-black/15" style={{ background: dot }} />
      <select className={field} value={pal} onChange={(e) => set(e.target.value, shade)}>
        <option value="">{custom ? 'Custom' : '–'}</option>
        {[...SPECIAL, ...PALETTES].map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <select className={field + ' w-20'} value={shade} disabled={!PALETTES.includes(pal)} onChange={(e) => set(pal, e.target.value)}>
        {SHADES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <CustomColorButton value={custom ?? '#4f46e5'} onChange={(hex) => onChange(`${prop.pre}-[${hex}]`)} size="size-5" active={!!custom} offset="ring-offset-1" />
    </div>
  )
}

export default function TailwindPanel({ node, onChange }: { node: Node; onChange: (t: Record<string, string>) => void }) {
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]>('base')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const t = node.t ?? {}
  const needle = q.trim().toLowerCase()
  const used = (ids: Prop[]) => ids.filter((p) => Object.keys(t).some((k) => t[k] && k.endsWith('|' + p.id))).length

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">Any Tailwind utility, on every block. Pick a screen size or state, then a value.</p>
      <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
        {VARIANTS.map((v) => (
          <button key={v} onClick={() => setVariant(v)} className={'flex-1 rounded-md px-1.5 py-1 text-[11px] font-medium ' + (variant === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>
            {v === 'base' ? 'All' : v}
          </button>
        ))}
      </div>
      <input className={field} placeholder="Search properties (e.g. flex, shadow, blur)" value={q} onChange={(e) => setQ(e.target.value)} />
      {GROUPS.map((g) => {
        const props = needle ? g.props.filter((p) => (p.label + ' ' + p.id).toLowerCase().includes(needle)) : g.props
        if (!props.length) return null
        const isOpen = !!needle || open === g.title
        const n = used(g.props)
        return (
          <div key={g.title} className="rounded-lg border border-slate-200">
            <button onClick={() => setOpen(open === g.title ? null : g.title)} className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-slate-700">
              <span>{g.title}{n > 0 && <span className="ml-2 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] text-indigo-600">{n}</span>}</span>
              <Ic n="down" className={'size-3.5 text-slate-400 transition ' + (isOpen ? '' : '-rotate-90')} />
            </button>
            {isOpen && (
              <div className="space-y-3 border-t border-slate-200 p-3">
                {props.map((p) => (
                  <div key={p.id}>
                    <div className="mb-1 text-[11px] font-medium text-slate-500">{p.label}</div>
                    <Control prop={p} value={t[`${variant}|${p.id}`] ?? ''} onChange={(v) => onChange({ [`${variant}|${p.id}`]: v })} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
