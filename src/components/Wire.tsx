import { useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { isHex, swatchHex } from '@/lib/styles'
import type { Node } from '@/lib/tree'

// A tiny wireframe of a block tree, drawn from the nodes themselves, so every section gets a thumbnail for free.
type Ctx = { dark: boolean; center: boolean }

const fill = (src = '') => {
  const m = src.match(/%23([0-9a-f]{6})/i)
  return m ? '#' + m[1] : undefined
}
const num = (s: string | undefined, re: RegExp) => Number(s?.match(re)?.[1] ?? 0)

// grid-cols-[104px_1fr] / grid-cols-3 → a CSS template (the widest breakpoint wins)
function template(cols = ''): string | undefined {
  const arb = [...cols.matchAll(/grid-cols-\[([^\]]+)\]/g)].at(-1)?.[1]
  if (arb) {
    return arb.split('_').map((p) => {
      const v = parseFloat(p)
      return p.endsWith('px') ? `${Math.max(v / 6, 14)}px` : p.endsWith('rem') ? `${Math.max(v * 2.7, 14)}px` : p.endsWith('fr') ? `${v}fr` : '24px'
    }).join(' ')
  }
  const n = Math.max(0, ...[...cols.matchAll(/grid-cols-(\d+)/g)].map((m) => Number(m[1])))
  return n ? `repeat(${n}, minmax(0, 1fr))` : undefined
}

const bar = (w: string | number, color: string, h = 4, extra?: CSSProperties) => <span className="block shrink-0 rounded-full" style={{ width: w, height: h, background: color, ...extra }} />

function W({ n, c }: { n: Node; c: Ctx }): ReactNode {
  const kids = (cx: Ctx = c) => n.c?.map((k) => <W key={k.id} n={k} c={cx} />)
  const ink = c.dark ? 'rgba(255,255,255,.85)' : '#334155'
  const soft = c.dark ? 'rgba(255,255,255,.35)' : '#cbd5e1'
  const self: CSSProperties = n.s.align === 'center' || c.center ? { alignSelf: 'center', marginInline: 'auto' } : {}

  switch (n.type) {
    case 'container':
    case 'fullwidth':
    case 'box':
    case 'card':
    case 'col': {
      if (/(^|\s)absolute(\s|$)/.test(n.p.cls ?? '')) return null // overlays sit on a picture; the thumbnail only shows the layout
      const img = fill(n.p.bgimg)
      const bg = img ?? swatchHex('bg', n.s.bg)
      const dark = !!img || ['dark', 'indigo'].includes(n.s.bg) || (isHex(n.s.bg) && isDarkHex(n.s.bg)) || n.s.color === 'white'
      const wrap = n.type === 'fullwidth' || n.type === 'box' || n.type === 'card' || !!bg
      const flex = n.t?.['base|display'] === 'flex'
      const cls = n.p.cls ?? ''
      const rowDir = /(^|\s)(flex|flex-row)(\s|$)/.test(cls) && !/(^|\s)(flex-col|md:flex-col)(\s|$)/.test(cls)
      const pxW = [...cls.matchAll(/w-\[(\d+)px\]/g)].at(-1)?.[1]
      return (
        <div
          className={'flex min-w-0 gap-[3px] ' + (rowDir ? 'flex-row items-center' : 'flex-col')}
          style={{
            width: pxW ? Math.max(14, Number(pxW) / 5) : undefined,
            flexShrink: pxW ? 0 : undefined,
            background: bg,
            padding: wrap ? (n.type === 'fullwidth' ? '5px 6px' : 4) : undefined,
            border: n.type === 'box' || n.type === 'card' ? '1px solid #e2e8f0' : undefined,
            borderRadius: n.s.rounded && n.s.rounded !== 'none' ? 4 : undefined,
            justifyContent: flex ? 'flex-end' : undefined,
            minHeight: n.t?.['base|min-h'] ? 44 : undefined,
            overflow: n.t?.['base|overflow-x'] ? 'hidden' : undefined,
          }}
        >
          {kids({ dark: dark || (c.dark && !bg), center: c.center || n.s.align === 'center' })}
        </div>
      )
    }
    case 'row': {
      const flex = n.t?.['base|display'] === 'flex'
      return (
        <div className="grid gap-[5px]" style={flex ? { display: 'flex', overflow: 'hidden' } : { gridTemplateColumns: template(n.p.cols) ?? `repeat(${n.c?.length || 1}, minmax(0, 1fr))` }}>
          {n.c?.map((k) => {
            const cs = Number(k.p.span?.match(/col-span-(\d)/)?.[1] ?? 1)
            const rs = Number(k.p.span?.match(/row-span-(\d)/)?.[1] ?? 1)
            return (
              <div key={k.id} className="min-w-0" style={{ gridColumn: cs > 1 ? `span ${cs}` : undefined, gridRow: rs > 1 ? `span ${rs}` : undefined, ...(flex ? { width: '46%', flexShrink: 0 } : {}), display: 'flex', flexDirection: 'column' }}>
                <W n={k} c={c} />
              </div>
            )
          })}
        </div>
      )
    }
    case 'heading': {
      const big = ['5xl', '4xl'].includes(n.s.size)
      return bar(big ? '72%' : ['3xl', '2xl'].includes(n.s.size) ? '52%' : '40%', n.s.color === 'indigo' ? '#6366f1' : ink, big ? 6 : 4, self)
    }
    case 'text': {
      if (n.p.cls?.includes('rounded-full')) return bar(26, '#c7d2fe', 7)
      if ((n.p.text ?? '').length < 28 || n.s.size === 'sm') return bar('34%', soft, 3, self)
      return (
        <div className="flex flex-col gap-[2px]" style={self}>
          {bar('100%', soft, 3)}
          {bar('68%', soft, 3)}
        </div>
      )
    }
    case 'image': {
      const asp = n.t?.['base|aspect'] ?? ''
      const sq = asp === 'aspect-square'
      const size = n.t?.['base|w'] ? num(n.t['base|w'], /w-(\d+)/) * 1.6 : 0
      const ratio = asp.match(/aspect-(\d+)\/(\d+)/)?.slice(1, 3).join('/') ?? (sq ? '1/1' : '16/9')
      return <div style={{ background: fill(n.p.src) ?? '#cbd5e1', aspectRatio: ratio, width: size ? size : '100%', borderRadius: n.s.rounded === 'full' ? 99 : 3, ...(size ? { alignSelf: c.center ? 'center' : 'flex-start' } : {}) }} />
    }
    case 'button':
      return bar(26, n.p.variant === 'outline' ? 'transparent' : n.p.variant === 'light' ? '#fff' : n.p.variant === 'dark' ? '#0f172a' : '#6366f1', 8, { border: n.p.variant === 'outline' ? `1px solid ${ink}` : undefined, display: 'inline-block', marginRight: 4, ...self })
    case 'icon':
      return <span className="block size-2 rounded-full bg-indigo-500" style={self} />
    case 'list':
      return (
        <div className="flex flex-col gap-[2px]">
          {[70, 55, 62].map((w) => (
            <div key={w} className="flex items-center gap-1">{bar(3, soft, 3)}{bar(`${w}%`, soft, 3)}</div>
          ))}
        </div>
      )
    case 'quote':
      return <div className="flex flex-col gap-[2px] border-l-2 border-indigo-400 pl-1">{bar('90%', soft, 3)}{bar('55%', soft, 3)}</div>
    case 'accordion':
      return <div className="flex flex-col gap-[2px]">{[1, 2, 3].map((i) => <div key={i} className="h-2 rounded-sm border" style={{ borderColor: soft }} />)}</div>
    case 'video':
    case 'embed':
    case 'map':
    case 'table':
      return <div className="rounded-sm" style={{ aspectRatio: '16/9', background: soft }} />
    case 'html':
      return <HtmlWire code={n.p.code ?? ''} dark={c.dark} />
    case 'separator':
      return <div className="h-px w-full" style={{ background: soft }} />
    default:
      return null // spacer and anything unknown draw nothing
  }
}

// ---- raw HTML blocks: sketch the markup (headings, text, pictures, buttons, columns, background colours) ----
const HUES: Record<string, string> = { slate: '#64748b', gray: '#6b7280', zinc: '#71717a', neutral: '#737373', stone: '#78716c', red: '#ef4444', orange: '#f97316', amber: '#f59e0b', yellow: '#eab308', lime: '#84cc16', green: '#22c55e', emerald: '#10b981', teal: '#14b8a6', cyan: '#06b6d4', sky: '#0ea5e9', blue: '#3b82f6', indigo: '#6366f1', violet: '#8b5cf6', purple: '#a855f7', fuchsia: '#d946ef', pink: '#ec4899', rose: '#f43f5e' }
const mix = (hex: string, to: string, t: number) => {
  const a = hex.match(/\w\w/g)!.map((x) => parseInt(x, 16)), b = to.match(/\w\w/g)!.map((x) => parseInt(x, 16))
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('')
}
function bgOf(cls: string): string | undefined {
  const hex = cls.match(/(?:^|\s)bg-\[(#[0-9a-f]{6})\]/i)?.[1]
  if (hex) return hex
  if (/(?:^|\s)bg-white(?:\s|$)/.test(cls)) return '#ffffff'
  if (/(?:^|\s)bg-black(?:\s|$)/.test(cls)) return '#0b0b0b'
  const m = cls.match(/(?:^|\s)bg-([a-z]+)-(\d{2,3})(?:\s|$)/)
  if (!m || !HUES[m[1]]) return undefined
  const shade = Number(m[2])
  return shade <= 200 ? mix(HUES[m[1]], '#ffffff', 0.8) : shade >= 700 ? mix(HUES[m[1]], '#000000', 0.45) : HUES[m[1]]
}
const isDarkHex = (h: string) => { const [r, g, b] = h.match(/\w\w/g)!.map((x) => parseInt(x, 16)); return r * 0.3 + g * 0.59 + b * 0.11 < 140 }

function drawEl(el: Element, dark: boolean, depth: number, key: number): ReactNode {
  const tag = el.tagName.toLowerCase()
  const cls = el.getAttribute('class') ?? ''
  const ink = dark ? 'rgba(255,255,255,.85)' : '#334155'
  const soft = dark ? 'rgba(255,255,255,.35)' : '#cbd5e1'
  const text = (el.textContent ?? '').trim()
  if (/^h[1-6]$/.test(tag)) return <span key={key} className="block rounded-full" style={{ width: tag <= 'h2' ? '62%' : '42%', height: tag <= 'h2' ? 6 : 4, background: ink }} />
  if (tag === 'p' || tag === 'li' || (tag === 'span' && !el.children.length)) {
    if (!text) return null
    return text.length < 28 ? <span key={key} className="block rounded-full" style={{ width: '34%', height: 3, background: soft }} /> : <div key={key} className="flex flex-col gap-[2px]"><span className="block rounded-full" style={{ width: '100%', height: 3, background: soft }} /><span className="block rounded-full" style={{ width: '66%', height: 3, background: soft }} /></div>
  }
  if (['img', 'picture', 'svg', 'video', 'iframe', 'canvas'].includes(tag)) return <div key={key} className="rounded-[3px]" style={{ aspectRatio: '16/9', background: soft }} />
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return <span key={key} className="block rounded-[2px] border" style={{ height: 7, borderColor: soft }} />
  if (tag === 'button' || (tag === 'a' && /\b(px-|py-|bg-|rounded|border)/.test(cls))) {
    const fill = bgOf(cls)
    return <span key={key} className="inline-block rounded-full" style={{ width: 26, height: 8, background: fill ?? ink, border: fill ? undefined : `1px solid ${ink}`, marginRight: 4 }} />
  }
  if (tag === 'a' || tag === 'strong' || tag === 'em' || tag === 'small' || tag === 'label') return text ? <span key={key} className="block rounded-full" style={{ width: '30%', height: 3, background: soft }} /> : null
  if (tag === 'ul' || tag === 'ol') return <div key={key} className="flex flex-col gap-[2px]">{[70, 55, 62].map((p) => <span key={p} className="block rounded-full" style={{ width: `${p}%`, height: 3, background: soft }} />)}</div>
  if (depth > 6 || ['script', 'style', 'br', 'hr'].includes(tag)) return null

  const bg = bgOf(cls)
  const nowDark = bg ? isDarkHex(bg) : dark
  const cols = Math.max(0, ...[...cls.matchAll(/grid-cols-(\d+)/g)].map((m) => Number(m[1])))
  const grid = /(?:^|\s)(?:md:|lg:|sm:)?grid(?:\s|$)/.test(cls) || cols > 0
  const row = !grid && /(?:^|\s)(?:md:|lg:|sm:)?flex(?:\s|$)/.test(cls) && !/flex-col/.test(cls)
  const center = /text-center|items-center/.test(cls)
  const kids = [...el.children].slice(0, 12).map((k, i) => drawEl(k, nowDark, depth + 1, i)).filter(Boolean)
  if (!kids.length) return bg ? <div key={key} className="rounded-[3px]" style={{ background: bg, height: 10 }} /> : null
  return (
    <div
      key={key}
      className={'min-w-0 ' + (grid ? 'grid' : 'flex ' + (row ? 'flex-row items-center' : 'flex-col'))}
      style={{ gap: 3, background: bg, padding: bg ? 5 : undefined, borderRadius: bg ? 3 : undefined, ...(grid ? { gridTemplateColumns: `repeat(${cols || Math.min(kids.length, 4)}, minmax(0, 1fr))` } : {}), ...(center && !row ? { alignItems: 'center' } : {}) }}
    >
      {kids}
    </div>
  )
}

function HtmlWire({ code, dark }: { code: string; dark: boolean }) {
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false) // the HTML is parsed in the browser only, so the first render matches the server's
  const placeholder = (
    <div className="flex flex-col gap-[2px] rounded-sm border border-dashed p-[3px]" style={{ borderColor: '#cbd5e1' }}>
      {bar('40%', '#cbd5e1', 3)}{bar('85%', '#cbd5e1', 3)}{bar('60%', '#cbd5e1', 3)}
    </div>
  )
  if (!ready) return placeholder
  const kids = [...new DOMParser().parseFromString(code, 'text/html').body.children].slice(0, 12).map((e, i) => drawEl(e, dark, 0, i)).filter(Boolean)
  return kids.length ? <div className="flex flex-col gap-[3px]">{kids}</div> : placeholder
}

export default function Wire({ node }: { node: Node }) {
  return (
    <div className="pointer-events-none flex flex-col gap-[3px]">
      <W n={node} c={{ dark: false, center: false }} />
    </div>
  )
}

// The wireframe laid out at a fixed logical width and scaled down, so every thumbnail keeps its real proportions.
const LOGICAL = 300
export function WireThumb({ node, scale, h }: { node: Node; scale: number; h: number }) {
  return (
    <div className="relative overflow-hidden bg-slate-50" style={{ height: h }}>
      <div style={{ width: LOGICAL, transform: `scale(${scale})`, transformOrigin: '0 0' }} className="p-2">
        <Wire node={node} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-slate-50 to-transparent" />
    </div>
  )
}
