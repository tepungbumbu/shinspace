// Feed templates rebuilt from Kompostudio's layouts/Feeds.astro (+ Card, Box, ShopCard):
// grid, overlay, list, list-compact, slider, slider-stories and shop layouts, plus the card options
// (label, kicker, tag, author, rating, share, native ad, paging) and Box header variants.
// Colours follow its theme: accent #ff3c00, ink #232323, green #84bd44, skin #efefef.
import { N, type Node, type Style } from './tree'
import { COL, G, HTML, tw, type T } from './kit'
import { ph } from './blocks'

export type Art = { sub: string; title: string; date: string; summary: string; fill: string; user: string; ufill: string; tag: string; rating: string }
const ARTS: Art[] = [
  { sub: 'Kuliner', title: 'Resep sambal matah praktis untuk makan siang akhir pekan', date: '1 jam lalu', summary: 'Cukup lima bahan dan sepuluh menit, hasilnya segar dan pedasnya pas.', fill: '#c7d2fe', user: 'Rina Putri', ufill: '#fbcfe8', tag: 'Makanan Indonesia', rating: '4.9' },
  { sub: 'Travel', title: 'Akhir pekan santai di dataran tinggi, ke mana saja yang layak dikunjungi', date: '2 jam lalu', summary: 'Panduan dua hari untuk makan, menginap, dan apa yang boleh dilewatkan.', fill: '#bbf7d0', user: 'Budi Santoso', ufill: '#fde68a', tag: 'Wisata Alam', rating: '4.8' },
  { sub: 'Teknologi', title: 'Cara tim kecil merilis lebih cepat dengan satu design system bersama', date: '3 jam lalu', summary: 'Kebiasaan yang membuat rilis terasa membosankan, dan itu kabar baik.', fill: '#fbcfe8', user: 'Citra Lestari', ufill: '#bbf7d0', tag: 'Produk Digital', rating: '4.7' },
  { sub: 'Olahraga', title: 'Gol di menit akhir yang mengubah klasemen sementara liga', date: '4 jam lalu', summary: 'Menelaah sepuluh menit terakhir dan perubahan taktik di baliknya.', fill: '#fde68a', user: 'Dimas Aji', ufill: '#c7d2fe', tag: 'Sepak Bola', rating: '4.6' },
  { sub: 'Budaya', title: 'Sanggar yang menghidupkan lagi batik tulis untuk generasi baru', date: '5 jam lalu', summary: 'Pola lama dipadukan dengan potongan modern, dan produknya ludes.', fill: '#ddd6fe', user: 'Ayu Wulandari', ufill: '#a5f3fc', tag: 'Warisan Budaya', rating: '4.9' },
  { sub: 'Kesehatan', title: 'Rutinitas lima menit yang benar-benar membantu pekerja kantoran', date: '6 jam lalu', summary: 'Fisioterapis menjelaskan peregangan yang layak dicoba dan mana yang mitos.', fill: '#a5f3fc', user: 'Eka Pratama', ufill: '#fecaca', tag: 'Gaya Hidup Sehat', rating: '4.5' },
  { sub: 'Ekonomi', title: 'Mengapa toko lokal justru menang di dunia digital tanpa modal besar', date: '8 jam lalu', summary: 'Tiga perubahan etalase online yang terbukti menaikkan penjualan.', fill: '#fecaca', user: 'Fajar Nugroho', ufill: '#d9f99d', tag: 'UMKM', rating: '4.8' },
  { sub: 'Otomotif', title: 'Mobil listrik di bawah tiga ratus juta, apa saja pilihannya sekarang', date: '9 jam lalu', summary: 'Membandingkan jarak tempuh, biaya perawatan, dan ketersediaan pengisian daya.', fill: '#d9f99d', user: 'Gita Maharani', ufill: '#ddd6fe', tag: 'Kendaraan Listrik', rating: '4.4' },
]
const SHOP = [
  ['Teko Keramik Handmade', 'Rp300.000', 'Rp500.000', 'Hemat 40%', '400 terjual', '#fde68a'],
  ['Set Cangkir Kopi Tanah Liat', 'Rp185.000', 'Rp250.000', 'Hemat 26%', '1,2 rb terjual', '#fbcfe8'],
  ['Totebag Kanvas Tebal', 'Rp89.000', 'Rp120.000', 'Hemat 25%', '860 terjual', '#bbf7d0'],
  ['Lampu Meja Rotan', 'Rp275.000', 'Rp400.000', 'Hemat 31%', '240 terjual', '#c7d2fe'],
  ['Notebook Kulit Refill', 'Rp129.000', 'Rp175.000', 'Hemat 26%', '530 terjual', '#a5f3fc'],
  ['Lilin Aromaterapi Kayu Manis', 'Rp99.000', 'Rp150.000', 'Hemat 34%', '2 rb terjual', '#fecaca'],
  ['Tumbler Stainless 500 ml', 'Rp145.000', 'Rp210.000', 'Hemat 31%', '910 terjual', '#ddd6fe'],
  ['Payung Lipat Anti UV', 'Rp79.000', 'Rp110.000', 'Hemat 28%', '1,5 rb terjual', '#d9f99d'],
] as const

// ---------- atoms ----------
// every feed text is leading-snug with no default bottom margin (the builder's rhythm margin would break card spacing)
const TX = (text: string, cls: string, s: Style = {}) => tw(N('text', { text, cls }, { size: '', color: '', mb: '0', ...s }), { 'base|leading': 'leading-snug' })
const HD = (text: string, cls: string, level = '3', t: T = {}) =>
  tw(N('heading', { text, level, cls }, { size: '', color: '', mb: '0' }), { 'base|font-weight': 'font-semibold', 'base|tracking': 'tracking-normal', 'base|leading': 'leading-snug', ...t })
const PIC = (a: Art, ratio: string) => tw(N('image', { src: ph(a.fill), alt: a.title, cls: 'transition-transform duration-700 group-hover:scale-110' }, { mb: '0' }), { 'base|aspect': ratio })
const AV = (name: string, fill: string, size = 'w-6') => tw(N('image', { src: ph(fill), alt: name }, { rounded: 'full', mb: '0' }), { 'base|w': size, 'base|h': size.replace('w-', 'h-'), 'base|aspect': 'aspect-square', 'base|shrink': 'shrink-0' })
const LINE = (cls = 'bg-[#84bd44]') => N('spacer', { cls: `block h-px w-[45px] ${cls}` }, { h: '' })

const SVG = (inner: string, size = 12) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`
const CHIP = (inner: string) => `<span class="inline-flex items-center gap-1 rounded-sm bg-black/50 px-1.5 py-1 text-xs text-white">${inner}</span>`
const TYPE: Record<string, string> = {
  foto: CHIP(`${SVG('<path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="3.5"/>')}<span>7</span>`),
  video: CHIP(`${SVG('<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z" fill="currentColor"/>')}<span class="tracking-widest">02:03</span>`),
  infografis: CHIP(SVG('<path d="M5 20V10M12 20V4M19 20v-7"/>')),
  stories: CHIP(`${SVG('<rect x="7" y="3" width="13" height="15" rx="2"/><path d="M4 7v13h13"/>', 11)}<span>9</span>`),
}
const LOGO = '<span class="inline-flex h-8 items-center rounded bg-white/90 px-2 text-[11px] font-black tracking-[0.2em] text-[#ff3c00]">LOGO</span>'
const SHARE = (cls: string) => `<div class="flex items-center gap-2 text-xs ${cls}"><span class="font-semibold tracking-wide">SHARE</span>${['f', '𝕏', 'W', 'T'].map((l) => `<span class="grid size-6 place-items-center rounded-full bg-white/20 text-[11px] font-bold">${l}</span>`).join('')}<span class="grid size-6 place-items-center rounded-full bg-white/20">${SVG('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>', 11)}</span></div>`

// ---------- card options ----------
type Opt = {
  sub?: boolean; date?: boolean
  label?: string; logo?: boolean; kicker?: string
  tag?: boolean; line?: boolean
  user?: 'text' | 'thumb'; rating?: boolean
  icon?: (i: number) => string | undefined
  summary?: boolean; share?: boolean
  radius?: string // Tailwind rounded-* class for the picture
}

// everything that sits on top of the thumbnail
const overlays = (a: Art, o: Opt, i: number): Node[] => {
  const out: Node[] = []
  const type = o.icon?.(i)
  if (type) out.push(HTML(TYPE[type], 'absolute right-1 top-1 z-10'))
  if (o.label) out.push(TX(o.label, 'absolute left-0 top-0 z-10 inline-flex items-center bg-black/50 p-1 text-base text-white'))
  if (o.logo) out.push(HTML(LOGO, 'absolute right-2 top-2 z-10'))
  if (o.user === 'thumb') {
    out.push(N('spacer', { cls: 'pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-16 bg-linear-to-t from-black/50 to-transparent' }, { h: '' }))
    out.push(COL([AV(a.user, a.ufill), TX(a.user, 'line-clamp-1 text-xs text-white')], { cls: 'absolute bottom-0 left-0 z-10 m-2 flex max-w-[70%] items-center gap-2' }))
  }
  if (o.rating) out.push(TX(`★ ${a.rating}`, `absolute ${o.user === 'thumb' ? 'right-0 top-0' : 'bottom-0 right-0'} z-10 m-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white`))
  return out
}

const fig = (a: Art, o: Opt, i: number, ratio: string, cls = '', inside: Node[] = []) =>
  COL([PIC(a, ratio), ...overlays(a, o, i), ...inside], { cls: `relative shrink-0 overflow-hidden ${o.radius ?? ''} ${cls}` })

// the text block under (or beside) the thumbnail
const text = (a: Art, o: Opt, title: string, t: T = {}): Node[] => {
  const k: Node[] = []
  if (o.kicker) k.push(TX(o.kicker, 'inline-block w-max max-w-full rounded-sm bg-[#ff3c00] px-1.5 py-0.5 text-[11px] font-medium text-white'))
  if (o.sub !== false) k.push(TX(a.sub, 'block w-max text-[11px] font-semibold text-[#ff3c00] line-clamp-1'))
  k.push(HD(a.title, `${title} text-[#232323] line-clamp-3`, '3', t))
  if (o.line) k.push(LINE())
  if (o.tag) k.push(TX(a.tag, 'mt-1.5 block text-xs uppercase text-[#999]'), LINE())
  if (o.user === 'text') k.push(COL([AV(a.user, a.ufill), TX(a.user, 'line-clamp-1 text-xs text-[#666]')], { cls: 'mt-2 flex items-center gap-2' }))
  if (o.date !== false) k.push(TX(a.date, 'mt-0.5 text-xs text-[#232323]/70'))
  if (o.summary) k.push(TX(a.summary, 'mt-1 line-clamp-4 text-sm text-[#232323]/80'))
  if (o.share) k.push(HTML(SHARE('text-[#232323]'), 'mt-1'))
  return k
}
const body = (kids: Node[]) => COL(kids, { cls: 'flex w-full flex-1 flex-col gap-1' })

// ---------- card layouts (Card presets: column, list, list-compact, overlay, overlay-story) ----------
const colCard = (a: Art, o: Opt, i: number, ratio = 'aspect-4/3', cls = ''): Node =>
  COL([fig(a, o, i, ratio, 'w-full'), body(text(a, o, 'text-base'))], { cls: `group fd-item flex h-full flex-col gap-3 ${cls}` })

// grid default: thumbnail on the left on mobile, picture on top from md up
const rowCard = (a: Art, o: Opt, i: number, ratio = 'aspect-4/3'): Node =>
  COL([fig(a, o, i, ratio, 'w-[143px] md:w-full'), body(text(a, o, 'text-base'))], { cls: 'group fd-item flex h-fit flex-row items-center gap-4 self-start md:flex-col md:items-stretch md:gap-3' })

const listCard = (a: Art, o: Opt, i: number): Node =>
  COL([fig(a, o, i, 'aspect-4/3', 'w-[143px] md:w-[240px]'), body(text(a, o, 'text-base md:text-xl'))], { cls: 'group fd-item flex w-full items-center gap-4' })

const compactCard = (a: Art, o: Opt, i: number): Node =>
  COL([fig(a, o, i, 'aspect-4/3', 'w-[120px]'), body(text(a, o, 'text-sm', { 'base|font-weight': 'font-bold' }))], { cls: 'group fd-item flex items-center gap-3' })

const GRAD = 'absolute inset-0 z-10 flex flex-col justify-end gap-1 bg-linear-to-t from-[#191c19] to-transparent px-3 pb-3'
const overlayCard = (a: Art, o: Opt, i: number, ratio = 'aspect-4/5', big = false): Node => {
  const t: Node[] = []
  if (o.sub !== false) t.push(TX(a.sub, 'block w-max text-[11px] font-semibold text-[#ff3c00] line-clamp-1'))
  t.push(HD(a.title, big ? 'text-xl font-bold text-white md:text-2xl line-clamp-3' : 'text-sm text-white md:text-base line-clamp-3', '3', big ? { 'base|font-weight': 'font-bold' } : {}))
  if (o.summary) t.push(TX(a.summary, 'line-clamp-3 text-xs text-white/90 md:text-sm'))
  if (o.date !== false) t.push(TX(a.date, 'text-xs text-white/80'))
  if (o.share) t.push(HTML(SHARE('text-white'), 'mt-1'))
  return COL([fig(a, { ...o, user: undefined }, i, ratio, 'w-full', [COL(t, { cls: big ? GRAD.replace('px-3 pb-3', 'px-4 pb-4') : GRAD })])], { cls: 'group fd-item self-start' })
}

const storyCard = (a: Art, i: number, o: { kicker?: string; title: boolean }): Node => {
  const t: Node[] = []
  if (o.kicker) t.push(TX(o.kicker, 'inline-block w-max rounded-sm bg-[#ff3c00] px-1.5 py-0.5 text-[11px] font-medium text-white'))
  if (o.title) t.push(HD(a.title, 'text-xs font-bold text-white line-clamp-3', '3', { 'base|font-weight': 'font-bold' }))
  t.push(TX(a.date, 'text-[10px] text-white'))
  return COL([fig(a, {}, i, 'aspect-9/16', 'w-[140px] md:w-[180px]', [COL(t, { cls: 'absolute inset-0 z-10 flex flex-col justify-end gap-1 bg-linear-to-t from-black from-0% via-black/0 via-55% px-3 pb-3 pt-[40%]' })])], { cls: 'group' })
}

// Copy-link button (ShopCard): click copies the link, the icon becomes a check and a "Link disalin" tooltip shows for 2 seconds.
// Plain inline handler, so it works on the exported page and in the editor canvas. Edit data-link in the HTML block to set the link.
const COPY_JS =
  "var b=this,w=b.parentNode,base=location.protocol=='about:'?top.location.href:location.href,u=new window.URL(b.dataset.link||'#',base).href," +
  "ok=function(){w.classList.add('is-copied');b.setAttribute('aria-label','Link disalin');clearTimeout(w._t);w._t=setTimeout(function(){w.classList.remove('is-copied');b.setAttribute('aria-label','Salin link produk')},2000)}," +
  "fb=function(){var a=document.createElement('textarea');a.value=u;document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(e){}a.remove();ok()};" +
  "navigator.clipboard&&window.isSecureContext?navigator.clipboard.writeText(u).then(ok,fb):fb()"
const LINK_ICON = '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'
const COPY = (link: string) =>
  `<div class="group/c flex items-center gap-1.5"><span role="status" class="pointer-events-none relative translate-x-2 rounded-md bg-white px-2.5 py-1 text-xs font-bold text-[#232323] opacity-0 shadow-md transition duration-200 group-[.is-copied]/c:translate-x-0 group-[.is-copied]/c:opacity-100">Link disalin<i class="absolute -right-1 top-1/2 size-2 -translate-y-1/2 rotate-45 bg-white"></i></span>` +
  `<button type="button" data-link="${link}" aria-label="Salin link produk" onclick="${COPY_JS}" class="grid size-8 cursor-pointer place-items-center rounded-full bg-white/75 text-[#666] backdrop-blur transition group-[.is-copied]/c:bg-[#84bd44] group-[.is-copied]/c:text-white">` +
  `${SVG(LINK_ICON, 15).replace('<svg ', '<svg class="group-[.is-copied]/c:hidden" ')}${SVG('<path d="M5 12l5 5 9-10"/>', 15).replace('<svg ', '<svg class="hidden group-[.is-copied]/c:block" ')}</button></div>`

const shopCard = (i: number): Node => {
  const [title, price, was, off, sold, fill] = SHOP[i % SHOP.length]
  const a: Art = { ...ARTS[0], title, fill }
  const copy = COPY(`#produk-${(i % SHOP.length) + 1}`)
  return COL([
    COL([PIC(a, 'aspect-4/3'), HTML(copy, 'absolute right-2 top-2 z-10')], { cls: 'relative overflow-hidden' }),
    COL([
      HD(title, 'text-sm font-bold text-[#232323] md:text-base line-clamp-2', '3', { 'base|font-weight': 'font-bold' }),
      COL([TX(price, 'text-sm font-bold text-[#ff3c00]'), TX(was, 'text-[10px] text-gray-400 line-through')], { cls: 'flex flex-wrap items-center gap-1' }),
      COL([TX(off, 'text-xs text-gray-400'), TX(sold, 'hidden text-xs text-[#232323] md:block')], { cls: 'flex items-center justify-between' }),
      TX('Beli Sekarang  ›', 'mt-auto flex items-center justify-center gap-1.5 rounded-md bg-[#ff3c00] px-2 py-1.5 text-xs font-bold text-white md:text-sm'),
    ], { cls: 'flex flex-1 flex-col gap-1.5 p-2.5 md:p-4' }),
  ], { cls: 'group fd-item flex h-full flex-col overflow-hidden rounded-xl border border-[#f0f0f0] bg-white/70 shadow-[0_1px_6px_rgba(0,0,0,.06)] md:rounded-2xl' })
}

// ---------- section frame: Box header + body + optional "Lihat Semua" button ----------
type Head = { title?: string; desc?: string; sponsor?: boolean; logo?: boolean; inline?: boolean; arrows?: boolean }
const BTN_CLS = 'flex size-8 items-center justify-center rounded-full border border-[#232323]/40 bg-[#efefef] text-[#232323] transition hover:border-[#84bd44]'
const scrollBy = (dir: number) => `onclick="var t=this.closest('.fd-slider').querySelector('.fd-track');t.scrollBy({left:${dir}*t.clientWidth*.8,behavior:'smooth'})"`
const ARROWS = HTML(`<div class="hidden items-center gap-1 md:flex"><button type="button" class="${BTN_CLS}" aria-label="Previous" ${scrollBy(-1)}>${SVG('<path d="M15 18l-6-6 6-6"/>', 16)}</button><button type="button" class="${BTN_CLS}" aria-label="Next" ${scrollBy(1)}>${SVG('<path d="M9 18l6-6-6-6"/>', 16)}</button></div>`)
const SIDE_ARROWS = HTML(['left-2', 'right-2'].map((pos, k) => `<button type="button" class="absolute ${pos} top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#232323]/40 bg-[#efefef] text-[#232323] shadow-md md:flex" aria-label="${k ? 'Next' : 'Previous'}" ${scrollBy(k ? 1 : -1)}>${SVG(k ? '<path d="M9 18l6-6-6-6"/>' : '<path d="M15 18l-6-6 6-6"/>', 16)}</button>`).join(''))
const SPONSOR = HTML('<div class="flex items-center gap-2 text-xs"><span class="text-[#999]">Didukung oleh</span><span class="rounded bg-[#efefef] px-3 py-1.5 text-sm font-black tracking-widest text-[#232323]">SPONSOR</span></div>')

const header = (h: Head): Node[] => {
  if (!h.title && !h.logo) return []
  const ttl = h.logo
    ? HTML('<span class="inline-flex h-14 items-center rounded-lg bg-[#232323] px-5 text-xl font-black tracking-[0.2em] text-white">LOGO</span>')
    : HD(h.title!, 'text-[21px] font-black tracking-[0.02em] text-[#232323]', '2', { 'base|font-weight': 'font-black' })
  const desc = h.desc ? TX(h.desc, 'text-sm text-[#232323] md:text-base') : null
  const left = h.inline && desc ? G('grid-cols-1 md:grid-cols-[auto_1fr]', [COL([ttl]), COL([desc])], { gap: 'sm', items: 'center' }) : COL(desc ? [ttl, desc] : [ttl], { cls: 'flex flex-col gap-1.5' })
  const right = h.sponsor ? SPONSOR : h.arrows ? ARROWS : null
  return [COL([right ? G('grid-cols-[1fr_auto]', [left, COL([right])], { gap: 'sm', items: 'center' }) : left], { cls: 'mb-4 md:mb-5' })]
}

const more = (label: string): Node =>
  N('container', { width: 'full', cls: 'mt-6' }, { py: 'none', align: 'center' }, [N('button', { text: `${label}  ›`, href: '#', variant: 'light', cls: 'rounded-full! bg-[#e6e6e6]! px-5! py-2! text-base font-semibold text-black!' })])

const frame = (h: Head, kids: Node[], o: { btn?: string; slider?: boolean; paged?: boolean; bg?: string } = {}): Node =>
  N('fullwidth', {}, o.bg ? { bg: o.bg } : {}, [
    N('container', { width: 'centered', cls: [o.slider && 'fd-slider', o.paged && 'fd-feed'].filter(Boolean).join(' ') }, { py: 'md' }, [...header(h), ...kids, ...(o.btn ? [more(o.btn)] : [])]),
  ])

const grid = (cols: string, cards: Node[], cls = '') => G(cols, cards, { gap: '' }, `gap-x-4 gap-y-6 md:gap-x-5 md:gap-y-8 ${cls}`)
const stack = (cards: Node[], gap = 'gap-6 md:gap-5') => COL(cards, { cls: `flex flex-col ${gap}` })
const track = (slides: Node[]) =>
  tw(N('row', { cols: '', cls: 'fd-track flex-row gap-5 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 md:mx-0 md:px-0' }, { gap: '' }, slides), { 'base|display': 'flex' })
const slide = (kid: Node, w = 'w-[152px] md:w-[257px]') => COL([kid], { cls: `${w} shrink-0 snap-start` })
const moreSlide = (w = 'w-[152px] md:w-[257px]') =>
  COL([TX('→', 'grid size-9 place-items-center rounded-full bg-[#e6e6e6] text-lg font-semibold text-black'), TX('Lihat Semua', 'text-xs font-medium text-[#ff3c00]')], {
    cls: `${w} flex min-h-40 shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-lg border border-[#ff3c00] bg-white text-center`,
  })

const n = (k: number) => ARTS.slice(0, k)

// ---------- the sections ----------
export const FEED_LAYOUTS: [string, string, () => Node][] = [
  ['Grid · 4 columns', 'Thumbnail left on mobile, picture on top from md, four across.', () => frame({ title: 'Berita Terbaru' }, [grid('grid-cols-1 md:grid-cols-4', n(8).map((a, i) => rowCard(a, {}, i)))], { btn: 'Lihat Semua' })],
  ['Grid · 3 columns', 'The same card in three columns.', () => frame({ title: 'Pilihan Redaksi' }, [grid('grid-cols-1 md:grid-cols-3', n(6).map((a, i) => rowCard(a, {}, i)))], { btn: 'Lihat Semua' })],
  ['Grid · 2 columns', 'Wide cards, two across.', () => frame({ title: 'Sedang Hangat' }, [grid('grid-cols-1 md:grid-cols-2', n(4).map((a, i) => rowCard(a, {}, i, 'aspect-video')))])],
  ['Grid · square photos', 'Square thumbnails with rounded corners, 2 → 4 columns.', () => frame({ title: 'Foto Pilihan' }, [grid('grid-cols-2 md:grid-cols-4', n(8).map((a, i) => colCard(a, { radius: 'rounded-xl', date: false }, i, 'aspect-square')))])],
  ['Overlay grid', 'Title over the picture on a dark gradient, 2 → 3 columns.', () => frame({ title: 'Sorotan' }, [grid('grid-cols-2 md:grid-cols-3', n(6).map((a, i) => overlayCard(a, {}, i)))])],
  ['Overlay grid · summary + share', 'Overlay cards with a short summary and a SHARE row.', () => frame({ title: 'Kisah Pilihan', desc: 'Bacaan mendalam untuk akhir pekan.' }, [grid('grid-cols-1 sm:grid-cols-2 md:grid-cols-3', n(3).map((a, i) => overlayCard(a, { summary: true, share: true }, i, 'aspect-4/5')))])],
  ['Hero overlay + list', 'One big 16:9 overlay story beside a compact list.', () =>
    frame({ title: 'Utama' }, [G('grid-cols-1 lg:grid-cols-[2fr_1fr]', [overlayCard(ARTS[0], { summary: true }, 0, 'aspect-video', true), stack(ARTS.slice(1, 5).map((a, i) => compactCard(a, { date: false }, i)), 'gap-4')], { gap: 'lg' })])],
  ['List', 'Wide thumbnail left, large title right.', () => frame({ title: 'Terpopuler' }, [stack(n(5).map((a, i) => listCard(a, {}, i)))], { btn: 'Lihat Semua' })],
  ['List · compact', 'Small thumbnails and short titles, two columns.', () => frame({ title: 'Baca Juga' }, [grid('grid-cols-1 md:grid-cols-2', n(6).map((a, i) => compactCard(a, {}, i)))])],
  ['Slider', 'Snap-scrolling cards with arrows beside the title.', () => frame({ title: 'Terbaru', arrows: true }, [track(n(8).map((a, i) => slide(colCard(a, {}, i))))], { slider: true })],
  ['Slider · side arrows', 'Arrows centered on the left and right edges.', () => frame({ title: 'Rekomendasi' }, [COL([track(n(8).map((a, i) => slide(colCard(a, {}, i)))), SIDE_ARROWS], { cls: 'relative' })], { slider: true })],
  ['Slider · “Lihat Semua” card', 'A last card that links to the full index.', () => frame({ title: 'Terkini', arrows: true }, [track([...n(6).map((a, i) => slide(colCard(a, {}, i))), moreSlide()])], { slider: true })],
  ['Slider · overlay', 'Tall overlay cards that scroll sideways.', () => frame({ title: 'Cerita Hari Ini', arrows: true }, [track(n(8).map((a, i) => slide(overlayCard(a, {}, i))))], { slider: true })],
  ['Stories slider', 'Portrait 9:16 story cards with a content-count chip and a logo header.', () =>
    frame({ logo: true, desc: 'Kumpulan cerita singkat pilihan untukmu, geser untuk melihat semuanya.', inline: true, arrows: true }, [track([...n(8).map((a, i) => slide(storyCard(a, i, { kicker: '10 Konten', title: true }), 'w-[140px] md:w-[180px]')), moreSlide('w-[140px] md:w-[180px]')])], { slider: true })],
  ['Shop grid', 'Product cards with price, strike-through, discount and a buy button.', () => frame({ title: 'Ide Belanja' }, [grid('grid-cols-2 md:grid-cols-4', SHOP.map((_, i) => shopCard(i)))], { btn: 'Lihat Semua' })],
  ['Shop slider', 'Product cards in a slider with a “Lihat Semua” card.', () => frame({ title: 'Ide Belanja', arrows: true }, [track([...SHOP.map((_, i) => slide(shopCard(i))), moreSlide()])], { slider: true })],
]

const PAGER = (pages: number, per: number) => {
  const b = 'flex size-9 items-center justify-center rounded-full border border-[#232323]/30 text-sm font-medium text-[#232323] transition hover:border-[#84bd44] disabled:opacity-40 aria-[current=page]:border-[#ff3c00] aria-[current=page]:bg-[#ff3c00] aria-[current=page]:text-white'
  const nums = Array.from({ length: pages }, (_, i) => `<button type="button" data-p="${i}" class="${b}"${i === 0 ? ' aria-current="page"' : ''}>${i + 1}</button>`).join('')
  // the script only runs on the exported page; in the editor every item stays visible so it can be edited
  const js = `(function(s){var nav=s.previousElementSibling,box=nav.closest('.fd-feed').querySelector('.fd-paged'),per=${per},items=[].slice.call(box.children),btns=[].slice.call(nav.querySelectorAll('[data-p]')),pv=nav.querySelector('[data-prev]'),nx=nav.querySelector('[data-next]'),cur=0;function show(k){cur=Math.max(0,Math.min(btns.length-1,k));items.forEach(function(e,i){e.style.display=Math.floor(i/per)===cur?'':'none'});btns.forEach(function(x,i){i===cur?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current')});pv.disabled=cur===0;nx.disabled=cur===btns.length-1}nav.addEventListener('click',function(e){var x=e.target.closest('button');if(!x||x.disabled)return;if(x.hasAttribute('data-prev'))show(cur-1);else if(x.hasAttribute('data-next'))show(cur+1);else show(+x.dataset.p)});show(0)})(document.currentScript)`
  return HTML(`<nav class="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Halaman"><button type="button" data-prev class="${b}" aria-label="Sebelumnya">${SVG('<path d="M15 18l-6-6 6-6"/>', 16)}</button>${nums}<button type="button" data-next class="${b}" aria-label="Berikutnya">${SVG('<path d="M9 18l6-6-6-6"/>', 16)}</button></nav><script>${js}</script>`)
}

export const FEED_OPTIONS: [string, string, () => Node][] = [
  ['Image label + type icons', 'A corner label plus photo, video, infographic and stories badges.', () =>
    frame({ title: 'Foto & Video' }, [grid('grid-cols-1 md:grid-cols-4', n(8).map((a, i) => rowCard(a, { label: 'Foto', icon: (k) => (['foto', 'video', 'infografis', 'stories'] as const)[k % 4] }, i)))])],
  ['Logo label + kicker chip', 'A logo in the thumbnail corner and a content-count chip above the title.', () =>
    frame({ title: 'Pilihan Mitra' }, [grid('grid-cols-1 md:grid-cols-3', n(6).map((a, i) => rowCard(a, { logo: true, kicker: `${(i + 2) * 3} Konten`, sub: false }, i)))])],
  ['Tag + title line', 'An uppercase tag with an accent rule under each title.', () =>
    frame({ title: 'Jelajah Nusantara' }, [grid('grid-cols-1 md:grid-cols-4', n(4).map((a, i) => colCard(a, { tag: true, date: false }, i)))])],
  ['Author under title', 'A round avatar and the writer’s name below the headline.', () =>
    frame({ title: 'Tulisan Kontributor' }, [grid('grid-cols-1 md:grid-cols-3', n(6).map((a, i) => rowCard(a, { user: 'text' }, i)))])],
  ['Author on thumbnail + rating', 'Author chip over the picture with a star rating.', () =>
    frame({ title: 'Ulasan Pilihan' }, [grid('grid-cols-2 md:grid-cols-4', n(4).map((a, i) => colCard(a, { user: 'thumb', rating: true, radius: 'rounded-xl', date: false }, i)))])],
  ['Native ad in the feed', 'A sponsored card slotted in as the second item.', () => {
    const items = n(4).map((a, i) => rowCard(a, {}, i))
    const ad = COL([colCard({ ...ARTS[6], sub: 'Promoted', title: 'Promo akhir tahun: diskon hingga 50% untuk semua peralatan dapur' }, {}, 1), TX('IKLAN', 'absolute left-1.5 top-1.5 z-20 rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-[#666]')], { cls: 'relative' })
    return frame({ title: 'Untuk Kamu' }, [grid('grid-cols-1 md:grid-cols-4', [items[0], ad, items[1], items[2]])])
  }],
  ['Numbered paging', 'Twelve cards, six per page, with page buttons (works on the exported page).', () =>
    frame({ title: 'Arsip Berita' }, [grid('grid-cols-1 md:grid-cols-3', [...n(8), ...n(4)].map((a, i) => rowCard(a, {}, i)), 'fd-paged'), PAGER(2, 6)], { paged: true })],
  ['Header · description + sponsor', 'A section header with a short description and a sponsor on the right.', () =>
    frame({ title: "d'Foodspot Review", desc: 'Ulasan lengkap rekomendasi tempat makan untukmu.', sponsor: true }, [grid('grid-cols-1 md:grid-cols-3', n(3).map((a, i) => rowCard(a, { logo: true }, i)))])],
  ['Header · logo + button', 'A logo header with the description beside it and a button below.', () =>
    frame({ logo: true, desc: 'Masih bingung cari inspirasi masakan hari ini? Yuk pilih resep kesukaanmu di sini.', inline: true }, [grid('grid-cols-2 md:grid-cols-4', n(4).map((a, i) => colCard(a, { kicker: '10 Konten', sub: false, radius: 'rounded-xl' }, i, 'aspect-square')))], { btn: 'Lihat Semua' })],
]
