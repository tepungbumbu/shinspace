// Small builders shared by every section template. Each call returns fresh nodes, so ids are never shared.
import { N, type Node, type Style } from './tree'
import { mkRow, ph } from './blocks'

export type T = Record<string, string> // Tailwind-panel utilities, see lib/tailwind.ts
export const tw = (n: Node, t: T): Node => ((n.t = t), n)

export const H = (text: string, s: Style = {}, level = '2') => N('heading', { text, level }, { size: '3xl', color: 'dark', ...s })
export const P = (text: string, s: Style = {}, p: Record<string, string> = {}) => N('text', { text, ...p }, { size: 'lg', color: 'slate', ...s })
export const B = (text: string, variant = 'primary') => N('button', { text, href: '#', variant })
export const I = (name: string) => N('icon', { name }, { isize: 'md', color: 'indigo' })
export const SP = () => N('spacer', {}, { h: 'md' })
export const CON = (c: Node[], s: Style = { py: 'lg' }) => N('container', { width: 'centered' }, s, c)
export const FW = (c: Node[], s: Style = {}) => N('fullwidth', {}, s, c)
export const BOX = (c: Node[], s: Style = {}) => N('box', {}, { pad: 'lg', bg: 'white', rounded: 'lg', ...s }, c)
export const COL = (c: Node[], p: Record<string, string> = {}, s: Style = {}, t?: T) => { const n = N('col', { span: '', ...p }, s, c); return t ? tw(n, t) : n }
// a grid row with any column template; `cols` is a Tailwind grid-cols class string
export const G = (cols: string, kids: Node[], s: Style = {}, cls = '') => N('row', { cols, ...(cls ? { cls } : {}) }, { gap: 'md', ...s }, kids)
export const IMG = (alt: string, fill: string, aspect = 'aspect-video', s: Style = { rounded: 'md' }) => tw(N('image', { src: ph(fill), alt }, s), { 'base|aspect': aspect })
export const AVATAR = (alt: string, fill: string, size = 'w-10') => tw(N('image', { src: ph(fill), alt }, { rounded: 'full', mb: '0' }), { 'base|w': size, 'base|h': size.replace('w-', 'h-'), 'base|aspect': 'aspect-square', 'base|shrink': 'shrink-0' })
export const HTML = (code: string, cls = '') => N('html', { code, ...(cls ? { cls } : {}) })

export const intro = (title: string, sub: string) => [H(title, { align: 'center', size: '4xl' }), P(sub, { align: 'center' }), SP()]
export const head = (title: string, sub?: string, right?: Node[], dark = false) => {
  const left = COL([H(title, { size: '3xl', mb: '1', ...(dark ? { color: 'white' } : {}) }), ...(sub ? [P(sub, { size: 'base', ...(dark ? { color: 'soft' } : {}) })] : [])])
  return right ? G('grid-cols-1 md:grid-cols-[1fr_auto]', [left, COL(right)], { items: 'end' }) : left
}
export const META = (txt: string, dark = false) => P(txt, { size: 'sm', mb: '1', ...(dark ? { color: 'soft' } : {}) })
export const DIV = 'border-b border-slate-200 pb-6 last:border-0 last:pb-0'

export { mkRow }
