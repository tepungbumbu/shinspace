import { N, type Node } from './tree'
import { B, BOX, COL, CON, DIV, FW, G, H, I, IMG, AVATAR, META, P, SP, head, intro, mkRow, tw } from './kit'
import { FEED_LAYOUTS, FEED_OPTIONS } from './feeds'

// ---------- social & activity feeds ----------
const narrow = (n: Node): Node => tw(n, { 'base|max-w': 'max-w-2xl' })

const socialPosts = (): Node => {
  const post = (name: string, time: string, text: string, fill: string, image?: string, stats = '128 likes · 14 comments · Share') =>
    BOX([
      G('grid-cols-[2.5rem_1fr]', [AVATAR(name, fill), COL([H(name, { size: 'base', mb: '0' }, '4'), META(time)])], { gap: 'sm' }),
      SP(),
      P(text, { size: 'base', color: 'dark' }),
      ...(image ? [IMG('Post image', image, 'aspect-video')] : []),
      P(stats, { size: 'sm', mb: '0' }, { cls: 'border-t border-slate-100 pt-3' }),
    ], { pad: 'md', bg: 'white' })
  return FW([
    narrow(CON([
      head('Community'),
      SP(),
      post('Rina Putri', '12 minutes ago', 'Just launched our new landing page. Thanks to everyone who gave feedback on the first draft!', '#c7d2fe', '#a5b4fc'),
      post('Budi Santoso', '1 hour ago', 'Quick tip: keep headlines under eight words. Your readers will thank you.', '#fbcfe8', undefined, '56 likes · 3 comments · Share'),
      post('Citra Lestari', '3 hours ago', 'Golden hour at the highlands this morning. Worth the early alarm.', '#bbf7d0', '#fde68a', '341 likes · 27 comments · Share'),
    ], { py: 'lg' })),
  ], { bg: 'soft' })
}

const photoGrid = (): Node => {
  const fills = ['#c7d2fe', '#fbcfe8', '#bbf7d0', '#fde68a', '#ddd6fe', '#a5f3fc', '#fecaca', '#d9f99d', '#e9d5ff']
  return FW([CON([head('@shinspace', 'Follow along on social.', [B('Follow', 'dark')]), SP(), G('grid-cols-3 md:grid-cols-4 lg:grid-cols-6', fills.concat(fills.slice(0, 3)).map((f, i) => COL([IMG(`Photo ${i + 1}`, f, 'aspect-square', { rounded: 'md' })])), { gap: 'sm' })], { py: 'lg' })])
}

const stories = (): Node => {
  const names = ['Rina', 'Budi', 'Citra', 'Dimas', 'Ayu', 'Eka', 'Fajar', 'Gita']
  const fills = ['#c7d2fe', '#fbcfe8', '#bbf7d0', '#fde68a', '#ddd6fe', '#a5f3fc', '#fecaca', '#d9f99d']
  return FW([CON([
    tw(G('', names.map((n, i) => tw(COL([AVATAR(n, fills[i], 'w-16'), P(n, { size: 'sm', align: 'center', color: 'dark', mb: '0' })]), { 'base|shrink': 'shrink-0', 'base|w': 'w-20' })), { gap: 'md' }), { 'base|display': 'flex', 'base|overflow-x': 'overflow-x-auto', 'base|pad-pb': 'pb-2' }),
  ], { py: 'md' })], { bg: 'soft' })
}

const timeline = (): Node => {
  const dot = 'relative before:absolute before:-left-[30px] before:top-1.5 before:size-2.5 before:rounded-full before:bg-indigo-500'
  const entry = (when: string, title: string, text: string) => [P(when, { size: 'sm', mb: '1' }, { cls: dot }), H(title, { size: 'lg', mb: '1' }, '4'), P(text, { size: 'base', mb: '6' })]
  return FW([
    narrow(CON([
      head('Activity'),
      SP(),
      COL([
        ...entry('Today · 09:41', 'Rina published “Landing v2”', 'The page is live and visible to everyone with the link.'),
        ...entry('Today · 08:15', 'Budi left a comment', '“Can we move the pricing table above the fold?”'),
        ...entry('Yesterday · 17:02', 'Citra added 3 images', 'Uploaded to the homepage hero gallery.'),
        ...entry('Mon · 11:30', 'Dimas created a new page', 'Started a blank page called “Press kit”.'),
      ], { cls: 'border-l-2 border-indigo-100 pl-6' }),
    ], { py: 'lg' })),
  ])
}

const comments = (): Node => {
  const c = (name: string, time: string, text: string, fill: string, reply = false) =>
    G('grid-cols-[2.5rem_1fr]', [AVATAR(name, fill), COL([H(name, { size: 'base', mb: '0' }, '4'), META(time), P(text, { size: 'base', color: 'dark', mb: '1' }), P('Reply · Like', { size: 'sm', mb: '0' })])], { gap: 'sm' }, reply ? 'ml-12' : '')
  return FW([
    narrow(CON([
      H('12 comments', { size: '2xl' }),
      SP(),
      c('Rina Putri', '2 hours ago', 'Great write-up. The part about shared tokens saved us a lot of back and forth.', '#c7d2fe'),
      c('Budi Santoso', '1 hour ago', 'Agreed. We started with colours only and expanded from there.', '#fbcfe8', true),
      c('Citra Lestari', '45 minutes ago', 'Would love a follow-up on how you handle versioning.', '#bbf7d0'),
    ], { py: 'lg' })),
  ])
}

const changelog = (): Node => {
  const rel = (v: string, date: string, items: string) => G('grid-cols-1 md:grid-cols-[8rem_1fr]', [COL([H(v, { size: 'xl', color: 'indigo', mb: '0' }, '3'), META(date)]), COL([N('list', { items, kind: 'ul' }, { color: 'slate' })])], { gap: 'md' }, DIV)
  return FW([CON([
    head('What’s new', 'Release notes and product updates.'),
    SP(),
    rel('v2.4', 'Nov 24, 2026', 'New feeds sections with 17 variants\nExport your site as a .zip\nFaster autosave'),
    rel('v2.3', 'Nov 12, 2026', 'Per-account pages in the database\nRegister and login\nPortrait and landscape preview'),
    rel('v2.2', 'Oct 30, 2026', 'Tailwind panel for every block\nVideo options: autoplay, loop, muted'),
  ], { py: 'lg' })], { bg: 'soft' })
}

// ---------- the rest of the library ----------
const heroImage = (): Node =>
  FW([CON([G('grid-cols-1 md:grid-cols-2', [COL([
    P('LUMEN STUDIO · WEB DESIGN', { size: 'sm', color: 'soft' }),
    H('Websites that feel effortless', { size: '5xl', color: 'white' }, '1'),
    P('We design and build fast, beautiful websites for brands that want to grow.', { color: 'soft' }),
    B('See our work', 'light'), B('Get a quote', 'outline'),
  ]), COL([IMG('Hero image', '#818cf8', 'aspect-4/3', { rounded: 'lg', shadow: 'md' })])], { items: 'center' })], { py: 'xl' })], { bg: 'dark', color: 'white' })

const heroCentered = (): Node =>
  FW([CON([H('Build pages people remember', { size: '5xl', align: 'center' }, '1'), P('Drag blocks, edit text in place and export clean HTML.', { align: 'center', size: 'xl' }), B('Get started'), B('Learn more', 'outline')], { py: 'xl', align: 'center' })], { bg: 'tint' })

const features = (): Node =>
  FW([CON([...intro('Why teams pick us', 'Everything you need, nothing you do not.'), mkRow('3', [
    [I('bolt'), H('Fast', { size: 'xl' }, '3'), P('Pages load in a blink.', { size: 'base' })],
    [I('shield'), H('Reliable', { size: 'xl' }, '3'), P('Built to last and easy to maintain.', { size: 'base' })],
    [I('heart'), H('Friendly', { size: 'xl' }, '3'), P('Anyone on the team can use it.', { size: 'base' })],
  ])])])

const imageText = (): Node =>
  FW([CON([mkRow('2', [[IMG('Photo', '#a5b4fc', 'aspect-4/3', { rounded: 'lg', shadow: 'md' })], [
    H('Made with care', { size: '4xl' }),
    P('We obsess over the details so you can focus on your work.', { size: 'base' }),
    N('list', { items: 'Responsive by default\nClean semantic markup\nEasy to customize', kind: 'ul' }, { color: 'slate' }),
    B('Read the story'),
  ]], { items: 'center' })])])

const faq = (): Node =>
  FW([CON([H('Frequently asked questions', { size: '4xl', align: 'center' }), SP(), N('accordion', { items: 'How does it work? :: Drop blocks on the page and edit them in place.\nCan I change the design later? :: Yes, every block can be restyled.\nWhat do I get at the end? :: Clean, responsive HTML styled with Tailwind.' })], { py: 'lg' })])

const stats = (): Node =>
  FW([CON([mkRow('4', [['125+', 'websites launched'], ['98%', 'happy clients'], ['1.2s', 'average load time'], ['24/7', 'support']].map(([n, l]) => [H(n, { size: '4xl', color: 'indigo', align: 'center' }, '3'), P(l, { align: 'center', size: 'base' })]))], { py: 'md' })])

const testimonials = (): Node =>
  FW([CON([...intro('Loved by clients', 'Do not take our word for it.'), mkRow('3', ['Ayu', 'Budi', 'Citra'].map((who) => [
    BOX([N('quote', { text: 'They turned our idea into a site we are proud of.', cite: who }, { size: 'base', color: 'slate' })], { pad: 'md' }),
  ]))])], { bg: 'soft' })

const pricing = (): Node =>
  FW([CON([...intro('Simple pricing', 'Pick a plan, change it any time.'), mkRow('3', [['Starter', '$9'], ['Pro', '$29'], ['Team', '$79']].map(([plan, price]) => [
    BOX([H(plan, { size: '2xl', align: 'center' }, '3'), H(price, { size: '4xl', color: 'indigo', align: 'center' }, '3'), N('list', { items: 'Unlimited pages\nFree updates\nEmail support', kind: 'ul' }, { color: 'slate' }), SP(), B('Choose ' + plan)], { align: 'center' }),
  ]))])])

const cta = (): Node =>
  FW([CON([H('Ready to start?', { size: '4xl', color: 'white', align: 'center' }), P('Join thousands of happy customers today.', { color: 'soft', align: 'center' }), B('Create your page', 'light')], { py: 'lg', align: 'center' })], { bg: 'indigo' })

// ---------- the list shown in the Sections tab ----------
export type Section = { title: string; desc: string; group: string; sub?: string; make: () => Node }
export const GROUPS = ['Hero', 'Content', 'Feeds', 'Feed options', 'Social feeds', 'Trust', 'Conversion'] as const

// what each category holds, shown on the category list
export const GROUP_INFO: Record<(typeof GROUPS)[number], string> = {
  Hero: 'Page openers with a big message',
  Content: 'Features, image + text, FAQ',
  Feeds: 'Grid, overlay, list, slider, shop',
  'Feed options': 'Labels, authors, ads, paging, headers',
  'Social feeds': 'Posts, photos, timeline, comments',
  Trust: 'Stats and testimonials',
  Conversion: 'Pricing and calls to action',
}
// optional sub-heading inside a category
const SUB: Record<string, string> = {
  'Grid · 4 columns': 'Grid', 'Grid · 3 columns': 'Grid', 'Grid · 2 columns': 'Grid', 'Grid · square photos': 'Grid',
  'Overlay grid': 'Overlay', 'Overlay grid · summary + share': 'Overlay', 'Hero overlay + list': 'Overlay',
  List: 'List', 'List · compact': 'List',
  Slider: 'Slider', 'Slider · side arrows': 'Slider', 'Slider · “Lihat Semua” card': 'Slider', 'Slider · overlay': 'Slider', 'Stories slider': 'Slider',
  'Shop grid': 'Shop', 'Shop slider': 'Shop',
  'Image label + type icons': 'Thumbnail', 'Logo label + kicker chip': 'Thumbnail',
  'Tag + title line': 'Text & author', 'Author under title': 'Text & author', 'Author on thumbnail + rating': 'Text & author',
  'Native ad in the feed': 'Behaviour', 'Numbered paging': 'Behaviour',
  'Header · description + sponsor': 'Header', 'Header · logo + button': 'Header',
  'Post feed': 'Posts', 'Photo grid': 'Posts', 'Stories row': 'Posts',
  'Activity timeline': 'Activity', 'Comment thread': 'Activity', Changelog: 'Activity',
}

const S = (group: (typeof GROUPS)[number], title: string, desc: string, make: () => Node): Section => ({ group, title, desc, sub: SUB[title], make })

export const SECTIONS: Section[] = [
  S('Hero', 'Hero with image', 'Title, text and buttons next to a picture.', heroImage),
  S('Hero', 'Centered hero', 'A big centered message on a light band.', heroCentered),
  S('Content', 'Features', 'Three strong points with icons.', features),
  S('Content', 'Image and text', 'A picture beside a text and a list.', imageText),
  S('Content', 'FAQ', 'Questions and answers that open on click.', faq),
  ...FEED_LAYOUTS.map(([title, desc, make]) => S('Feeds', title, desc, make)),
  ...FEED_OPTIONS.map(([title, desc, make]) => S('Feed options', title, desc, make)),
  S('Social feeds', 'Post feed', 'Avatar, text, image and reactions per post.', socialPosts),
  S('Social feeds', 'Photo grid', 'A tidy grid of square pictures.', photoGrid),
  S('Social feeds', 'Stories row', 'Round avatars that scroll sideways.', stories),
  S('Social feeds', 'Activity timeline', 'A vertical line with dated updates.', timeline),
  S('Social feeds', 'Comment thread', 'Comments with an indented reply.', comments),
  S('Social feeds', 'Changelog', 'Release notes with a version on the left.', changelog),
  S('Trust', 'Stats', 'Four numbers that build trust.', stats),
  S('Trust', 'Testimonials', 'What your clients say about you.', testimonials),
  S('Conversion', 'Pricing', 'Three plans side by side.', pricing),
  S('Conversion', 'Call to action', 'A colored band with one clear button.', cta),
]

const byTitle = (t: string) => SECTIONS.find((s) => s.title === t)!.make()
export const starter = (): Node => N('root', {}, {}, [byTitle('Hero with image'), byTitle('Features'), byTitle('Stats'), byTitle('Call to action')])
