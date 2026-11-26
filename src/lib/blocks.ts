import { N, type Node } from './tree'
import { HIDE, sc } from './styles'
import { OVERRIDES, sameProp, twClasses } from './tailwind'
import { ICONS, ICON_CHOICES } from './icons'

export type Field = { k: string; label: string; t: 'text' | 'area' | 'sel' | 'seg' | 'media' | 'switch' | 'icons'; g?: 'layout'; o?: Record<string, string>; help?: string; accept?: 'image' | 'video'; on?: boolean }
export type Def = {
  label: string
  icon: string
  kids?: 'any' | 'col' // which children it accepts; undefined = leaf
  make: () => Node
  fields?: Field[]
  style?: string[] // keys of STYLE shown in Settings
  html: (n: Node, inner: string, a: string) => string // `a` = editor-only attributes, '' on export
}

// ---- escaping / URL checks: the trust boundary between author input and exported HTML ----
const E: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (s = '') => s.replace(/[&<>"']/g, (c) => E[c])
const br = (s = '') => esc(s).replace(/\n/g, '<br>')
const href = (u = '') => (/^(https?:|mailto:|tel:|\/|#)/i.test(u.trim()) ? esc(u.trim()) : '#')
const src = (u = '') => (/^(https?:\/\/|\/|data:(image|video)\/)/i.test(u.trim()) ? esc(u.trim()) : '')
const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(' ')
const M = 'mb-4 last:mb-0'
const mb = (n: Node) => (n.s.mb ? '' : M) // a margin-bottom chosen in the Inspector replaces the default rhythm instead of fighting it
const opts = (...k: string[]) => Object.fromEntries(k.map((x) => [x, x]))

export const ph = (fill = '#c7d2fe') =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 5"><rect width="8" height="5" fill="${fill}"/><g fill="#fff" fill-opacity=".5"><circle cx="3.3" cy="2" r=".28"/><path d="M2.7 3.4l.95-1.1.65.75.45-.5.95.85z"/></g></svg>`,
  )

const svg = (d: string, c: string) =>
  `<svg class="${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`

const BTN: Record<string, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500',
  light: 'bg-white text-indigo-700 hover:bg-slate-100',
  dark: 'bg-slate-900 text-white hover:bg-slate-700',
  outline: 'border-2 border-current hover:bg-black/5',
}

const lines = (s = '') => s.split('\n').map((l) => l.trim()).filter(Boolean)

const frame = (n: Node, a: string, url: string, kind: string) =>
  `<div${a} class="${cx('aspect-video overflow-hidden bg-slate-100', mb(n), sc(n.s))}">${
    url ? `<iframe class="size-full" src="${url}" title="${kind}" loading="lazy" allowfullscreen></iframe>` : ''
  }</div>`

// Player options for the embedded YouTube / Vimeo players ("&amp;" because the URL goes into an attribute).
type Play = { controls: boolean; auto: boolean; loop: boolean; muted: boolean }
const videoUrl = (u = '', o: Play) => {
  const yt = u.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/)
  if (yt) {
    const q = [`controls=${+o.controls}`, o.auto && 'autoplay=1', o.muted && 'mute=1', o.loop && `loop=1&amp;playlist=${yt[1]}`]
    return `https://www.youtube-nocookie.com/embed/${yt[1]}?${q.filter(Boolean).join('&amp;')}`
  }
  const vm = u.match(/vimeo\.com\/(\d+)/)
  if (!vm) return ''
  const q = [`controls=${+o.controls}`, o.auto && 'autoplay=1', o.muted && 'muted=1', o.loop && 'loop=1']
  return `https://player.vimeo.com/video/${vm[1]}?${q.filter(Boolean).join('&amp;')}`
}

export const BLOCKS: Record<string, Def> = {
  root: { label: 'Page', icon: 'container', kids: 'any', make: () => N('root', {}, {}, []), html: (_n, i) => i },
  container: {
    label: 'Container', icon: 'container', kids: 'any', style: ['align', 'color', 'bg', 'bgimg', 'rounded', 'shadow', 'border'],
    fields: [{ k: 'width', label: 'Width', t: 'seg', g: 'layout', o: { centered: 'Centered', full: 'Full width' } }],
    make: () => N('container', { width: 'centered' }, { py: 'md' }, []),
    html: (n, i, a) => `<div${a} class="${cx(n.p.width === 'full' ? 'w-full' : 'mx-auto w-full max-w-6xl px-4', sc(n.s))}">${i}</div>`,
  },
  fullwidth: {
    label: 'Full width', icon: 'fullwidth', kids: 'any', style: ['align', 'color', 'bg', 'bgimg', 'rounded', 'shadow', 'border'],
    make: () => N('fullwidth', {}, { py: 'md' }, []),
    html: (n, i, a) => `<section${a} class="${cx('w-full', sc(n.s))}">${i}</section>`,
  },
  row: {
    label: 'Row', icon: 'c2', kids: 'col', style: ['gap', 'items'],
    make: () => mkRow('2'),
    html: (n, i, a) => `<div${a} class="${cx('grid', n.p.cols, sc(n.s))}">${i}</div>`,
  },
  col: {
    label: 'Column', icon: 'c1', kids: 'any', style: ['align', 'color', 'bg', 'bgimg', 'rounded', 'shadow', 'border'],
    make: () => N('col', {}, {}, []),
    html: (n, i, a) => `<div${a} class="${cx('min-w-0', n.p.span, sc(n.s))}">${i}</div>`,
  },
  box: {
    label: 'Box', icon: 'box', kids: 'any', style: ['align', 'color', 'bg', 'bgimg', 'rounded', 'shadow'],
    make: () => N('box', {}, { pad: 'md', bg: 'white', rounded: 'md' }, []),
    html: (n, i, a) => `<div${a} class="${cx('border border-slate-200', sc(n.s))}">${i}</div>`,
  },
  heading: {
    label: 'Heading', icon: 'heading', style: ['size', 'color', 'align'],
    fields: [{ k: 'text', label: 'Text', t: 'text' }, { k: 'level', label: 'Level', t: 'sel', o: { '1': 'H1', '2': 'H2', '3': 'H3', '4': 'H4', '5': 'H5', '6': 'H6' } }],
    make: () => N('heading', { text: 'Heading', level: '2' }, { size: '3xl', color: 'dark' }),
    html: (n, _i, a) => `<h${n.p.level}${a} class="${cx('font-bold tracking-tight', mb(n), sc(n.s))}">${br(n.p.text)}</h${n.p.level}>`,
  },
  text: {
    label: 'Text', icon: 'text', style: ['size', 'color', 'align'],
    fields: [{ k: 'text', label: 'Text', t: 'area' }],
    make: () => N('text', { text: 'Write something here. Double-click to edit.' }, { size: 'base', color: 'slate' }),
    html: (n, _i, a) => `<p${a} class="${cx('leading-relaxed', mb(n), sc(n.s))}">${br(n.p.text)}</p>`,
  },
  quote: {
    label: 'Quote', icon: 'quote', style: ['size', 'color', 'align'],
    fields: [{ k: 'text', label: 'Quote', t: 'area' }, { k: 'cite', label: 'Author', t: 'text' }],
    make: () => N('quote', { text: 'Design is not just what it looks like. Design is how it works.', cite: 'Someone wise' }, { size: 'lg', color: 'slate' }),
    html: (n, _i, a) =>
      `<blockquote${a} class="${cx('border-l-4 border-indigo-500 pl-4 italic', mb(n), sc(n.s))}"><p>${br(n.p.text)}</p>${
        n.p.cite ? `<footer class="mt-2 text-sm not-italic opacity-70">— ${esc(n.p.cite)}</footer>` : ''
      }</blockquote>`,
  },
  list: {
    label: 'List', icon: 'list', style: ['size', 'color'],
    fields: [{ k: 'items', label: 'Items (one per line)', t: 'area' }, { k: 'kind', label: 'Type', t: 'sel', o: { ul: 'Bullets', ol: 'Numbers' } }],
    make: () => N('list', { items: 'First point\nSecond point\nThird point', kind: 'ul' }, { color: 'slate' }),
    html: (n, _i, a) =>
      `<${n.p.kind}${a} class="${cx(n.p.kind === 'ol' ? 'list-decimal' : 'list-disc', 'space-y-1 pl-6', mb(n), sc(n.s))}">${lines(n.p.items).map((l) => `<li>${esc(l)}</li>`).join('')}</${n.p.kind}>`,
  },
  button: {
    label: 'Button', icon: 'button',
    fields: [{ k: 'text', label: 'Label', t: 'text' }, { k: 'href', label: 'Link', t: 'text' }, { k: 'variant', label: 'Look', t: 'sel', o: opts('primary', 'light', 'dark', 'outline') }],
    make: () => N('button', { text: 'Click me', href: '#', variant: 'primary' }),
    html: (n, _i, a) =>
      `<a${a} href="${href(n.p.href)}" class="${cx('mb-3 mr-3 inline-block rounded-lg px-5 py-2.5 font-semibold transition', BTN[n.p.variant] ?? BTN.primary)}">${esc(n.p.text)}</a>`,
  },
  separator: { label: 'Separator', icon: 'separator', make: () => N('separator'), html: (_n, _i, a) => `<hr${a} class="my-6 border-slate-200">` },
  spacer: {
    label: 'Spacer', icon: 'spacer', style: ['h'],
    make: () => N('spacer', {}, { h: 'md' }),
    html: (n, _i, a) => `<div${a} class="${sc(n.s)}" aria-hidden="true"></div>`,
  },
  icon: {
    label: 'Icon', icon: 'icon', style: ['isize', 'color'],
    fields: [{ k: 'name', label: 'Icon', t: 'icons', o: opts(...ICON_CHOICES) }],
    make: () => N('icon', { name: 'star' }, { isize: 'md', color: 'indigo' }),
    html: (n, _i, a) => `<span${a} class="${cx('block', mb(n), sc({ color: n.s.color }))}">${svg(ICONS[n.p.name] ?? ICONS.star, sc({ isize: n.s.isize }))}</span>`,
  },
  image: {
    label: 'Image', icon: 'image', style: ['rounded', 'shadow'],
    fields: [
      { k: 'src', label: 'Image', t: 'media', accept: 'image', help: 'Upload a picture (under 1 MB) or paste its address.' },
      { k: 'alt', label: 'Alt text', t: 'text', help: 'Describes the picture for screen readers and search engines.' },
    ],
    make: () => N('image', { src: ph(), alt: 'Image' }, { rounded: 'md' }),
    html: (n, _i, a) => `<img${a} src="${src(n.p.src)}" alt="${esc(n.p.alt)}" loading="lazy" class="${cx('h-auto w-full object-cover', mb(n), sc(n.s))}">`,
  },
  video: {
    label: 'Video', icon: 'video', style: ['rounded'],
    fields: [
      { k: 'url', label: 'Video', t: 'media', accept: 'video', help: 'A YouTube or Vimeo link, or the address of an MP4 file.' },
      { k: 'controls', label: 'Show the controls', t: 'switch', on: true },
      { k: 'autoplay', label: 'Autoplay (muted)', t: 'switch' },
      { k: 'loop', label: 'Loop', t: 'switch' },
      { k: 'muted', label: 'Muted', t: 'switch' },
    ],
    make: () => N('video', { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', controls: 'on' }, { rounded: 'md' }),
    html: (n, _i, a) => {
      const p = n.p
      // in the editor (`a` set) nothing autoplays or loops, so the canvas stays quiet while you work
      const o: Play = { controls: p.controls !== 'off', auto: p.autoplay === 'on' && !a, loop: p.loop === 'on' && !a, muted: p.muted === 'on' || (p.autoplay === 'on' && !a) }
      const file = /^data:video\//i.test(p.url ?? '') || /\.(mp4|webm)(\?|$)/i.test(p.url ?? '')
      if (!(file && src(p.url))) return frame(n, a, videoUrl(p.url, o), 'Video')
      const attrs = [o.controls && 'controls', o.auto && 'autoplay', o.loop && 'loop', o.muted && 'muted', 'playsinline'].filter(Boolean).join(' ')
      return `<video${a} src="${src(p.url)}" ${attrs} class="${cx('w-full', mb(n), sc(n.s))}"></video>`
    },
  },
  embed: {
    label: 'Embed', icon: 'embed', style: ['rounded'],
    fields: [{ k: 'url', label: 'Page address', t: 'text', help: 'The page to show inside this one, starting with https://. Some sites refuse to be embedded.' }],
    make: () => N('embed', { url: 'https://example.com' }, { rounded: 'md' }),
    html: (n, _i, a) => frame(n, a, /^https?:\/\//i.test(n.p.url ?? '') ? esc(n.p.url) : '', 'Embed'),
  },
  map: {
    label: 'Map', icon: 'map', style: ['rounded'],
    fields: [
      { k: 'lat', label: 'Latitude', t: 'text', help: 'On openstreetmap.org, right-click a place and copy its coordinates.' },
      { k: 'lon', label: 'Longitude', t: 'text' },
    ],
    make: () => N('map', { lat: '-6.2088', lon: '106.8456' }, { rounded: 'md' }),
    html: (n, _i, a) => {
      const lat = parseFloat(n.p.lat), lon = parseFloat(n.p.lon), d = 0.01
      const ok = Number.isFinite(lat) && Number.isFinite(lon)
      return frame(n, a, ok ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d},${lat - d},${lon + d},${lat + d}&amp;layer=mapnik&amp;marker=${lat},${lon}` : '', 'Map')
    },
  },
  table: {
    label: 'Table', icon: 'table',
    fields: [{ k: 'data', label: 'Rows (cells split by |)', t: 'area' }, { k: 'head', label: 'First row is header', t: 'sel', o: { yes: 'Yes', no: 'No' } }],
    make: () => N('table', { data: 'Plan | Price | Seats\nStarter | $9 | 1\nTeam | $29 | 5', head: 'yes' }),
    html: (n, _i, a) => {
      const rows = lines(n.p.data).map((r) => r.split('|').map((c) => esc(c.trim())))
      const row = (r: string[], i: number) =>
        `<tr>${r.map((c) => (i === 0 && n.p.head === 'yes' ? `<th class="border-b-2 border-slate-300 px-3 py-2 font-semibold">${c}</th>` : `<td class="border-b border-slate-200 px-3 py-2">${c}</td>`)).join('')}</tr>`
      return `<div${a} class="${cx('overflow-x-auto', mb(n))}"><table class="w-full text-left text-sm">${rows.map(row).join('')}</table></div>`
    },
  },
  card: {
    label: 'Card', icon: 'card', kids: 'any', style: ['bg', 'rounded', 'shadow'],
    make: () =>
      N('card', {}, { bg: 'white', rounded: 'md', shadow: 'md' }, [
        N('image', { src: ph(), alt: 'Card image' }, {}),
        N('col', {}, { pad: 'md' }, [
          N('heading', { text: 'Card title', level: '3' }, { size: '2xl', color: 'dark' }),
          N('text', { text: 'A short description of this card.' }, { color: 'slate' }),
          N('button', { text: 'Read more', href: '#', variant: 'primary' }),
        ]),
      ]),
    html: (n, i, a) => `<div${a} class="${cx('overflow-hidden border border-slate-200', sc(n.s))}">${i}</div>`,
  },
  accordion: {
    label: 'Accordion', icon: 'accordion',
    fields: [{ k: 'items', label: 'One per line: Question :: Answer', t: 'area' }],
    make: () => N('accordion', { items: 'What is this? :: A drag and drop page builder.\nCan I export the HTML? :: Yes, clean Tailwind markup.' }),
    html: (n, _i, a) =>
      `<div${a} class="${cx('divide-y divide-slate-200 rounded-lg border border-slate-200', mb(n))}">${lines(n.p.items)
        .map((l) => {
          const [q, ...r] = l.split('::')
          return `<details class="p-4"><summary class="cursor-pointer font-semibold">${esc(q.trim())}</summary><p class="mt-2 text-slate-600">${esc(r.join('::').trim())}</p></details>`
        })
        .join('')}</div>`,
  },
  html: {
    label: 'HTML', icon: 'html',
    fields: [{ k: 'code', label: 'Raw HTML', t: 'area' }],
    make: () => N('html', { code: '<p class="text-slate-600">Custom HTML</p>' }),
    html: (n, _i, a) => `<div${a}>${n.p.code ?? ''}</div>`,
  },
}

// ---- layouts: row + columns, all stacked on mobile ----
const LAYOUTS: Record<string, { label: string; icon: string; cols: string; spans: string[] }> = {
  '1': { label: '1 column', icon: 'c1', cols: 'grid-cols-1', spans: [''] },
  '2': { label: '2 columns', icon: 'c2', cols: 'grid-cols-1 md:grid-cols-2', spans: ['', ''] },
  '3': { label: '3 columns', icon: 'c3', cols: 'grid-cols-1 md:grid-cols-3', spans: ['', '', ''] },
  '4': { label: '4 columns', icon: 'c4', cols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4', spans: ['', '', '', ''] },
  '21': { label: '2/3 + 1/3', icon: 'c21', cols: 'grid-cols-1 md:grid-cols-3', spans: ['md:col-span-2', ''] },
  '12': { label: '1/3 + 2/3', icon: 'c12', cols: 'grid-cols-1 md:grid-cols-3', spans: ['', 'md:col-span-2'] },
  '121': { label: '1/4 + 1/2 + 1/4', icon: 'c121', cols: 'grid-cols-1 md:grid-cols-4', spans: ['', 'md:col-span-2', ''] },
  '6': { label: '6 columns', icon: 'c6', cols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6', spans: ['', '', '', '', '', ''] },
}
export const mkRow = (key: string, cells: Node[][] = [], s: Record<string, string> = {}) =>
  N('row', { cols: LAYOUTS[key].cols }, { gap: 'md', ...s }, LAYOUTS[key].spans.map((span, i) => N('col', { span }, {}, cells[i] ?? [])))

// ---- palette ----
export type Item = { group: string; label: string; icon: string; make: () => Node }
const fromDef = (t: string, group: string): Item => ({ group, label: BLOCKS[t].label, icon: BLOCKS[t].icon, make: BLOCKS[t].make })
export const PALETTE: Item[] = [
  fromDef('container', 'Layout'), fromDef('fullwidth', 'Layout'),
  ...Object.entries(LAYOUTS).map(([k, l]): Item => ({ group: 'Layout', label: l.label, icon: l.icon, make: () => mkRow(k) })),
  fromDef('box', 'Layout'),
  ...['heading', 'text', 'quote', 'list', 'button', 'separator', 'spacer', 'icon'].map((t) => fromDef(t, 'Basic')),
  ...['image', 'video', 'embed', 'map'].map((t) => fromDef(t, 'Media')),
  ...['table', 'card', 'accordion'].map((t) => fromDef(t, 'Components')),
  fromDef('html', 'Advanced'),
]

export const accepts = (parent: Node, child: Node) => {
  const k = BLOCKS[parent.type]?.kids
  return k === 'any' ? child.type !== 'col' : k === 'col' ? child.type === 'col' : false
}

// ---- rendering: the canvas and the export use the same function; `edit` only adds data attributes ----
const ind = (s: string) => s.replace(/^(?=.)/gm, '  ')

// Props every block shares (Advanced / Visibility / background image) are patched into the opening tag.
const patch = (html: string, n: Node, edit: boolean) => {
  const p = n.p
  const cls = [
    ...(p.hide ?? '').split(',').filter((k) => HIDE[k]).map((k) => (edit ? 'opacity-40' : HIDE[k])),
    ...twClasses(n.t),
    ...(p.cls ?? '').replace(/["'<>`]/g, '').split(/\s+/),
  ].filter(Boolean)
  const img = (p.bgimg ?? '').trim()
  const bg = /^(https?:\/\/|\/|data:image\/)/i.test(img) ? `background-image:url('${img.replace(/[\s'"()\\]/g, (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))}')` : ''
  if (bg) cls.push('bg-cover', 'bg-center')
  const style = [bg, p.css?.trim()].filter(Boolean).join(';')
  const id = /^[A-Za-z][\w-]*$/.test(p.anchor ?? '') ? p.anchor : ''
  const ids = Object.keys(n.t ?? {}).filter((k) => n.t![k] && k.startsWith('base|')).map((k) => k.slice(5))
  const keep = (c: string) => !ids.some((i) => sameProp(i, c))
  if (!cls.length && !style && !id) return html
  return html.replace(/^<([a-z0-9]+)((?:\s[^>]*)?)>/i, (_m, tag: string, attrs: string) => {
    let a = attrs
    if (cls.length) a = /\sclass="/.test(a) ? a.replace(/\sclass="([^"]*)"/, (_c, c: string) => ` class="${[...c.split(' ').filter(keep), ...cls].filter(Boolean).join(' ')}"`) : `${a} class="${cls.join(' ')}"`
    if (style) a += ` style="${esc(style)}"`
    if (id) a += ` id="${id}"`
    return `<${tag}${a}>`
  })
}

export const render = (n: Node, edit = false): string => {
  // a Tailwind-panel value for a property replaces the matching quick control
  const hid = Object.keys(n.t ?? {}).filter((k) => n.t![k] && k.startsWith('base|')).map((k) => OVERRIDES[k.slice(5)])
  if (hid.some(Boolean)) n = { ...n, s: Object.fromEntries(Object.entries(n.s).filter(([k]) => !hid.includes(k))) }
  const inner = n.c?.length ? '\n' + ind(n.c.map((k) => render(k, edit)).join('\n')) + '\n' : ''
  const a = edit ? ` data-pf="${n.id}" data-t="${n.type}"${n.c && !n.c.length ? ' data-empty' : ''}` : ''
  return patch(BLOCKS[n.type].html(n, inner, a), n, edit)
}
export const renderPage = (root: Node, edit = false) => (root.c ?? []).map((k) => render(k, edit)).join('\n')
