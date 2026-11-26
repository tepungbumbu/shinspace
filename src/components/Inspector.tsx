'use client'
import { useState, type ReactNode } from 'react'
import { BLOCKS, type Field } from '@/lib/blocks'
import { HIDE, SPACE, STYLE } from '@/lib/styles'
import type { Node } from '@/lib/tree'
import type { Act } from './Canvas'
import { Ic } from './Ic'
import TailwindPanel from './TailwindPanel'

type Patch = { p?: Record<string, string>; s?: Record<string, string>; t?: Record<string, string> }
type Props = { node: Node; onChange: (id: string, ch: Patch) => void; onAct: (a: Act) => void; onClose: () => void }

const LAYOUT_KEYS = ['gap', 'items', 'h', 'isize']
const input = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:bg-white'

function Section({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <section className="border-b border-slate-200 px-4 py-3">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-slate-800">
        {title}
        <Ic n="down" className={'size-4 text-slate-400 transition ' + (open ? '' : '-rotate-90')} />
      </button>
      {open && <div className="space-y-4 pt-3">{children}</div>}
    </section>
  )
}

const Label = ({ children }: { children: ReactNode }) => <div className="mb-1.5 text-xs font-medium text-slate-500">{children}</div>

function Seg({ value, options, onChange }: { value: string; options: [string, ReactNode][]; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
      {options.map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={'flex flex-1 items-center justify-center rounded-md py-1.5 text-sm font-medium transition ' + (value === k ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Switch({ checked, onChange, children }: { checked: boolean; onChange: (c: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="relative h-6 w-10 shrink-0 rounded-full bg-slate-300 transition after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:bg-indigo-500 peer-checked:after:translate-x-4" />
      {children}
    </label>
  )
}

const isFile = (v: string) => v.startsWith('data:')
const okUrl = (v: string) => /^(https?:|\/|data:(image|video)\/)/i.test(v)

// One picker for every media block: preview, Upload, and an address field.
function MediaPicker({ value, accept, onChange }: { value: string; accept: 'image' | 'video'; onChange: (v: string) => void }) {
  const limit = accept === 'image' ? 1_000_000 : 2_000_000
  const upload = (file?: File) => {
    if (!file) return
    if (file.size > limit) return alert(`Please use a ${accept} under ${limit / 1_000_000} MB, or paste its address.`)
    const r = new FileReader()
    r.onload = () => onChange(String(r.result))
    r.readAsDataURL(file)
  }
  const preview = accept === 'image' && okUrl(value)
  return (
    <div className="space-y-2 rounded-lg border border-dashed border-slate-300 p-3">
      <div className="flex items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 bg-cover bg-center text-slate-400" style={preview ? { backgroundImage: `url("${value}")` } : undefined}>
          {!preview && <Ic n={accept} className="size-6" />}
        </div>
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400">
          <Ic n="upload" /> Upload
          <input type="file" accept={accept + '/*'} className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      </div>
      <input className={input} placeholder="https://" value={isFile(value) ? '(uploaded file)' : value} readOnly={isFile(value)} onChange={(e) => onChange(e.target.value)} />
      {isFile(value) && <button onClick={() => onChange('')} className="text-xs text-rose-600 hover:underline">Remove file</button>}
    </div>
  )
}

// A grid of the icons themselves instead of a list of names.
function IconPicker({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [q, setQ] = useState('')
  const shown = options.filter((n) => n.includes(q.trim().toLowerCase()))
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-2">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${options.length} icons...`} className={input + ' !py-1.5'} />
      <div role="radiogroup" aria-label="Icon" className="grid max-h-56 grid-cols-6 gap-1 overflow-y-auto">
        {shown.map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={value === n}
            aria-label={n}
            title={n}
            onClick={() => onChange(n)}
            className={'flex aspect-square items-center justify-center rounded-md transition ' + (value === n ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600')}
          >
            <Ic n={n} className="size-5" />
          </button>
        ))}
        {shown.length === 0 && <p className="col-span-6 py-3 text-center text-xs text-slate-400">No icon matches “{q}”.</p>}
      </div>
      <p className="text-center text-xs text-slate-400">Selected: <span className="font-medium text-slate-600">{value || 'star'}</span></p>
    </div>
  )
}

function Swatches({ k, value, onChange }: { k: 'bg' | 'color'; value: string; onChange: (v: string) => void }) {
  const ring = 'ring-2 ring-indigo-500 ring-offset-2'
  return (
    <div className="flex flex-wrap gap-2.5">
      <button title="Default" onClick={() => onChange('')} className={'flex size-6 items-center justify-center rounded-full border border-slate-300 bg-white text-rose-500 ' + (!value ? ring : '')}>
        <Ic n="close" className="size-3.5" />
      </button>
      {Object.entries(STYLE[k].sw!).map(([name, hex]) => (
        <button key={name} title={name} onClick={() => onChange(name)} style={{ background: hex }} className={'size-6 rounded-full border border-black/15 ' + (value === name ? ring : '')} />
      ))}
    </div>
  )
}

function Spacing({ s, onChange }: { s: Record<string, string>; onChange: (k: string, v: string) => void }) {
  const sel = (k: string) => (
    <select
      value={s[k] ?? ''}
      onChange={(e) => onChange(k, e.target.value)}
      title={STYLE[k].label}
      className="w-12 rounded-md border border-slate-200 bg-white px-1 py-1 text-xs outline-none focus:border-indigo-400"
    >
      <option value="">–</option>
      {SPACE.map((v) => <option key={v} value={v}>{v}</option>)}
    </select>
  )
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center justify-items-center gap-1.5 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-2">
      <span className="col-span-3 self-start justify-self-start text-[10px] font-bold uppercase tracking-wider text-slate-500">Margin</span>
      <span /> {sel('mt')} <span />
      {sel('ml')}
      <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center justify-items-center gap-1.5 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 p-2">
        <span className="col-span-3 self-start justify-self-start text-[10px] font-bold uppercase tracking-wider text-slate-500">Padding</span>
        <span /> {sel('pt')} <span />
        {sel('pl')}
        <div className="h-6 w-full min-w-6 rounded bg-indigo-100" />
        {sel('pr')}
        <span /> {sel('pb')} <span />
      </div>
      {sel('mr')}
      <span /> {sel('mb')} <span />
    </div>
  )
}

export default function Inspector({ node, onChange, onAct, onClose }: Props) {
  const d = BLOCKS[node.type]
  const p = (k: string, v: string) => onChange(node.id, { p: { [k]: v } })
  const s = (k: string, v: string) => onChange(node.id, { s: { [k]: v } })
  const has = (k: string) => d.style?.includes(k)
  const hidden = (node.p.hide ?? '').split(',').filter(Boolean)

  const field = (f: Field) => {
    const v = node.p[f.k] ?? ''
    if (f.t === 'switch') {
      const checked = f.on ? v !== 'off' : v === 'on'
      return <Switch key={f.k} checked={checked} onChange={(c) => p(f.k, f.on ? (c ? 'on' : 'off') : c ? 'on' : '')}>{f.label}</Switch>
    }
    return (
      <div key={f.k}>
        <Label>{f.label}</Label>
        {f.t === 'media' ? (
          <MediaPicker value={v} accept={f.accept!} onChange={(x) => p(f.k, x)} />
        ) : f.t === 'seg' ? (
          <Seg value={v || Object.keys(f.o!)[0]} options={Object.entries(f.o!)} onChange={(x) => p(f.k, x)} />
        ) : f.t === 'icons' ? (
          <IconPicker value={v || 'star'} options={Object.keys(f.o!)} onChange={(x) => p(f.k, x)} />
        ) : f.t === 'sel' ? (
          <select className={input} value={v} onChange={(e) => p(f.k, e.target.value)}>
            {Object.entries(f.o!).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        ) : f.t === 'area' ? (
          <textarea rows={5} className={input} value={v} onChange={(e) => p(f.k, e.target.value)} />
        ) : (
          <input className={input} value={v} onChange={(e) => p(f.k, e.target.value)} />
        )}
        {f.help && <p className="mt-1.5 text-xs text-slate-400">{f.help}</p>}
      </div>
    )
  }
  const pick = (k: string) => (
    <div key={k}>
      <Label>{STYLE[k].label}</Label>
      <select className={input} value={node.s[k] ?? ''} onChange={(e) => s(k, e.target.value)}>
        <option value="">Default</option>
        {Object.keys(STYLE[k].o).map((v) => <option key={v} value={v}>{STYLE[k].names?.[v] ?? v}</option>)}
      </select>
    </div>
  )

  const content = d.fields?.filter((f) => f.g !== 'layout') ?? []
  const layout = d.fields?.filter((f) => f.g === 'layout') ?? []
  const layoutKeys = d.style?.filter((k) => LAYOUT_KEYS.includes(k)) ?? []

  return (
    <div className="text-slate-800">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <Ic n={d.icon} className="size-5 text-indigo-500" />
        <h3 className="mr-auto text-base font-semibold">{d.label}</h3>
        <button title="Duplicate" onClick={() => onAct('dup')} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><Ic n="dup" /></button>
        <button title="Delete" onClick={() => onAct('del')} className="rounded p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Ic n="del" /></button>
        <button title="Close" onClick={onClose} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><Ic n="close" /></button>
      </header>

      {content.length > 0 && <Section title="Content"><>{content.map(field)}</></Section>}

      {(layout.length > 0 || layoutKeys.length > 0) && (
        <Section title="Layout"><>{layout.map(field)}{layoutKeys.map(pick)}</></Section>
      )}

      <Section title="Style">
        {has('align') && (
          <div>
            <Label>{STYLE.align.label}</Label>
            <Seg
              value={node.s.align ?? ''}
              onChange={(v) => s('align', v)}
              options={[['', <Ic key="x" n="close" />], ['left', <Ic key="l" n="alignL" />], ['center', <Ic key="c" n="alignC" />], ['right', <Ic key="r" n="alignR" />]]}
            />
          </div>
        )}
        {has('size') && pick('size')}
        <div>
          <Label>Spacing</Label>
          <Spacing s={node.s} onChange={s} />
        </div>
        {has('bg') && (
          <div>
            <Label>Background</Label>
            <Swatches k="bg" value={node.s.bg ?? ''} onChange={(v) => s('bg', v)} />
          </div>
        )}
        {has('bgimg') && (
          <div>
            <Label>Background image</Label>
            <MediaPicker value={node.p.bgimg ?? ''} accept="image" onChange={(v) => p('bgimg', v)} />
          </div>
        )}
        {has('color') && (
          <div>
            <Label>{STYLE.color.label}</Label>
            <Swatches k="color" value={node.s.color ?? ''} onChange={(v) => s('color', v)} />
          </div>
        )}
        {(has('rounded') || has('shadow')) && (
          <div className="grid grid-cols-2 gap-3">
            {has('rounded') && pick('rounded')}
            {has('shadow') && pick('shadow')}
          </div>
        )}
        {has('border') && <Switch checked={node.s.border === 'on'} onChange={(c) => s('border', c ? 'on' : '')}>Border</Switch>}
      </Section>

      <Section title="Visibility">
        <div>
          <Label>Show on</Label>
          <div className="grid grid-cols-6 gap-1.5">
            {Object.keys(HIDE).map((k) => (
              <label key={k} className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg bg-slate-100 py-2 text-[11px] font-bold uppercase">
                <input
                  type="checkbox"
                  checked={!hidden.includes(k)}
                  onChange={(e) => p('hide', Object.keys(HIDE).filter((x) => (x === k ? !e.target.checked : hidden.includes(x))).join(','))}
                  className="size-4 accent-indigo-500"
                />
                {k}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Untick a size to hide the block on those screens. XS &lt;640px, SM 640, MD 768, LG 1024, XL 1280, XXL 1536.</p>
        </div>
      </Section>

      <Section title="Tailwind">
        <TailwindPanel node={node} onChange={(t) => onChange(node.id, { t })} />
      </Section>

      <Section title="Advanced">
        <div>
          <Label>Anchor (ID)</Label>
          <input className={input} placeholder="section-name" value={node.p.anchor ?? ''} onChange={(e) => p('anchor', e.target.value.replace(/[^\w-]/g, ''))} />
          <p className="mt-1.5 text-xs text-slate-400">Lets a link point to this block: #anchor.</p>
        </div>
        <div>
          <Label>CSS classes</Label>
          <input className={input} placeholder="my-class another-class" value={node.p.cls ?? ''} onChange={(e) => p('cls', e.target.value)} />
          <p className="mt-1.5 text-xs text-slate-400">Any Tailwind class or class of your theme, separated by spaces.</p>
        </div>
        <div>
          <Label>Inline style</Label>
          <textarea rows={3} className={input + ' font-mono'} placeholder="min-height: 300px;" value={node.p.css ?? ''} onChange={(e) => p('css', e.target.value)} />
        </div>
      </Section>
    </div>
  )
}
