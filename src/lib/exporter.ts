// Turns pages into a static site: html pages, compiled CSS split into files, extracted images, README.
// A folder or file is only produced when it would have content.
import { renderPage } from './blocks'
import type { Node } from './tree'

export type SitePage = { name: string; root: Node }
export type SiteFile = { path: string; data: string | Uint8Array }
export type Site = { files: SiteFile[]; pages: { path: string; name: string }[] }

const enc = new TextEncoder()
const E: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => E[c])
export const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// ---- images / videos that live inside the page as data: URIs become real files ----
const URI = /data:(?:image|video)\/[^"'&\s)]+/g
const EXT: Record<string, string> = { jpeg: 'jpg', 'svg+xml': 'svg', quicktime: 'mov', 'x-icon': 'ico' }

function decode(uri: string) {
  const m = uri.match(/^data:(image|video)\/([\w.+-]+)((?:;[\w=-]+)*),([\s\S]*)$/)
  if (!m) return null
  const [, kind, sub, params, payload] = m
  const bytes = params.includes(';base64') ? Uint8Array.from(atob(payload), (c) => c.charCodeAt(0)) : enc.encode(decodeURIComponent(payload))
  return { dir: kind === 'image' ? 'images' : 'videos', name: kind === 'image' ? 'image' : 'video', ext: EXT[sub] ?? sub, bytes }
}

// ---- compile the pages' Tailwind classes to plain CSS, using the same in-browser build as the canvas ----
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const LAYOUT = /^(display|position|inset|top|right|bottom|left|z-index|flex|grid|gap|row-gap|column-gap|columns|order|justify|align|place|width|min-width|max-width|height|min-height|max-height|inline-size|block-size|min-inline-size|max-inline-size|min-block-size|max-block-size|margin|padding|overflow|overscroll|aspect-ratio|float|clear|box-sizing|object-fit|object-position|visibility|isolation)/
const RESPONSIVE = /@media[^{]*\b(width|height)|@container/

type Css = { head: string[]; variables: string[]; reset: string[]; layout: string[]; components: string[]; responsive: string[] }

const propNames = (r: CSSRule): string[] => {
  const own = 'style' in r ? Array.from({ length: (r as CSSStyleRule).style.length }, (_, i) => (r as CSSStyleRule).style[i]) : []
  const kids = 'cssRules' in r ? Array.from((r as CSSGroupingRule).cssRules).flatMap(propNames) : []
  return [...own, ...kids]
}

async function compileCss(html: string): Promise<Css> {
  const f = document.createElement('iframe')
  f.style.cssText = 'position:fixed;left:-9999px;top:0;width:1280px;height:800px;border:0;visibility:hidden'
  f.srcdoc = '<!doctype html><html><head><script src="/tailwind-browser.js"></script><style type="text/tailwindcss">@import "tailwindcss";</style></head><body></body></html>'
  document.body.append(f)
  try {
    await new Promise((r) => f.addEventListener('load', r, { once: true }))
    const d = f.contentDocument!
    d.body.innerHTML = html
    const sheets = () => Array.from(d.styleSheets)
    let last = -1, same = 0
    for (let i = 0; i < 40 && same < 3; i++) { // wait until the compiler stops adding rules
      await sleep(150)
      const n = sheets().reduce((t, s) => t + s.cssRules.length, 0)
      same = n === last && n > 0 ? same + 1 : 0
      last = n
    }
    const out: Css = { head: [], variables: [], reset: [], layout: [], components: [], responsive: [] }
    const utilities: CSSRule[] = []
    for (const s of sheets()) {
      for (const r of Array.from(s.cssRules)) {
        const kind = r.constructor.name
        const layer = (r as CSSLayerBlockRule).name
        if (kind === 'CSSLayerStatementRule') out.head.push(r.cssText)
        else if (kind === 'CSSLayerBlockRule' && layer === 'utilities') utilities.push(...Array.from((r as CSSLayerBlockRule).cssRules))
        else if (kind === 'CSSLayerBlockRule' && (layer === 'theme' || layer === 'properties')) out.variables.push(r.cssText)
        else if (kind === 'CSSLayerBlockRule' && layer === 'base') out.reset.push(r.cssText)
        else if (kind === 'CSSPropertyRule') out.variables.push(r.cssText)
        else out.components.push(r.cssText)
      }
    }
    const wrap: Record<string, string[]> = { layout: [], components: [], responsive: [] }
    for (const r of utilities) {
      const bucket = RESPONSIVE.test(r.cssText) ? 'responsive' : propNames(r).some((p) => LAYOUT.test(p)) ? 'layout' : 'components'
      wrap[bucket].push(r.cssText)
    }
    const layer = (rules: string[]) => (rules.length ? [`@layer utilities {\n${rules.map((x) => '  ' + x).join('\n')}\n}`] : [])
    out.layout.push(...layer(wrap.layout))
    out.components.push(...layer(wrap.components))
    out.responsive.push(...layer(wrap.responsive))
    return out
  } finally {
    f.remove()
  }
}

const doc = (title: string, body: string, prefix: string, css: boolean) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${css ? `<link rel="stylesheet" href="${prefix}assets/css/style.css">` : '<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>'}
</head>
<body>
${body}
</body>
</html>
`

// pages[0] becomes index.html, the rest go to pages/<name>.html
export async function buildSite(pages: SitePage[]): Promise<Site> {
  const files: SiteFile[] = []
  const assets = new Map<string, string>()
  const count: Record<string, number> = {}
  const asset = (uri: string) => {
    let p = assets.get(uri)
    if (!p) {
      const d = decode(uri)
      if (!d) return null
      const n = (count[d.dir] = (count[d.dir] ?? 0) + 1)
      p = `assets/${d.dir}/${d.name}-${n}.${d.ext}`
      assets.set(uri, p)
      files.push({ path: p, data: d.bytes })
    }
    return p
  }

  const used = new Set<string>()
  const out = pages.map((pg, i) => {
    let path = 'index.html'
    if (i > 0) {
      let s = slug(pg.name) || 'page', k = 2
      while (used.has(s) || s === 'index') s = `${slug(pg.name) || 'page'}-${k++}`
      used.add(s)
      path = `pages/${s}.html`
    }
    const prefix = i > 0 ? '../' : ''
    const html = renderPage(pg.root).replace(URI, (u) => { const p = asset(u); return p ? prefix + p : u })
    return { path, name: pg.name, html, prefix }
  })

  const css = await compileCss(out.map((p) => `<div>${p.html}</div>`).join('\n'))
  // one stylesheet: layer order first, then theme, reset, layout, components, responsive (the order matters for the cascade)
  const rules = [...css.variables, ...css.reset, ...css.layout, ...css.components, ...css.responsive]
  const hasCss = rules.length > 0 // if the compiler produced nothing, fall back to the Tailwind browser script
  if (hasCss) files.push({ path: 'assets/css/style.css', data: [...css.head, '', rules.join('\n\n')].join('\n') + '\n' })
  for (const p of out) files.push({ path: p.path, data: doc(p.name, p.html.replace(/^/gm, '  ').replace(/^ {2}$/gm, ''), p.prefix, hasCss) })

  return { files, pages: out.map((p) => ({ path: p.path, name: p.name })) }
}

// ---- tree drawing (also used by the README) ----
const ORDER = ['index.html', 'pages', 'assets', 'README.md', 'css', 'js', 'images', 'videos', 'fonts', 'icons', 'style.css']
const rank = (n: string) => (ORDER.includes(n) ? ORDER.indexOf(n) : 99)
type Tree = { [name: string]: Tree }

export const tree = (root: string, paths: string[]) => {
  const t: Tree = {}
  for (const p of paths) p.split('/').reduce((n, part) => (n[part] ??= {}), t)
  const draw = (n: Tree, pre: string): string =>
    Object.keys(n)
      .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
      .map((k, i, all) => {
        const last = i === all.length - 1
        const kids = Object.keys(n[k]).length
        return `${pre}${last ? '└── ' : '├── '}${k}${kids ? '/' : ''}\n${kids ? draw(n[k], pre + (last ? '    ' : '│   ')) : ''}`
      })
      .join('')
  return `${root}/\n${draw(t, '')}`
}

export const readme = (name: string, root: string, site: Site) => {
  const paths = [...site.files.map((f) => f.path), 'README.md']
  return `# ${name}

Static site exported from ShinSpace on ${new Date().toISOString().slice(0, 10)}.

## Open it

Open \`index.html\` in a browser. There is no build step.

## Pages

${site.pages.map((p) => `- \`${p.path}\` — ${p.name}`).join('\n')}

## Structure

\`\`\`
${tree(root, paths)}\`\`\`

\`assets/css/style.css\` is the single stylesheet for every page.
Only files this site actually uses are exported, so folders such as fonts or icons appear only when needed.
`
}

export const bytes = (f: SiteFile) => (typeof f.data === 'string' ? enc.encode(f.data) : f.data)
