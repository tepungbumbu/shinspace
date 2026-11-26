// Server-only: the section library. Every section in the Sections tab is a row here, including the ones that shipped
// with the app (copied in once, see seedBuiltins). Admins can edit, hide, reorder-by-add or delete any of them.
import { randomUUID } from 'node:crypto'
import { db } from './db'
import { validRoot } from './pages-db'
import { composeCode } from './code'
import { feedCfgFor } from './feeds'
import { GROUPS, SECTIONS } from './sections'
import { N, type Node } from './tree'

export type Component = {
  id: string
  name: string
  description: string
  category: string
  sub: string
  published: boolean
  html: string | null // the markup when it was written as code; null when it is a block tree
  css: string
  js: string
  builtin: string | null // the original title when it shipped with the app
  node: Node
  updated: number
  author: string | null
}

type Row = { id: string; name: string; description: string; category: string; sub: string; published: number; html: string | null; css: string; js: string; builtin_key: string | null; node: string; updated_at: number; author: string | null }
// Rows copied in before feeds had settings carry none; hand them the defaults. An empty "feed" means an admin detached it on purpose.
const withFeed = (r: Row): Node => {
  const node = JSON.parse(r.node) as Node
  const cfg = r.builtin_key && node.p?.feed === undefined ? feedCfgFor(r.builtin_key) : undefined
  return cfg ? { ...node, p: { ...node.p, feed: JSON.stringify(cfg) } } : node
}
const toComp = (r: Row): Component => ({ id: r.id, name: r.name, description: r.description, category: r.category, sub: r.sub, published: !!r.published, html: r.html, css: r.css, js: r.js, builtin: r.builtin_key, node: withFeed(r), updated: r.updated_at, author: r.author })
const SELECT = 'SELECT c.id, c.name, c.description, c.category, c.sub, c.published, c.html, c.css, c.js, c.builtin_key, c.node, c.updated_at, u.name AS author FROM components c LEFT JOIN users u ON u.id = c.created_by'
const ORDER = 'ORDER BY c.sort ASC, c.created_at ASC'

// ---- the built-in sections are copied into the database once ----
// A "seeded" flag keeps a deleted built-in from coming back, and new built-ins added to the code later are appended.
const SEED_KEY = 'builtin_sections'
let seeded = false
export function seedBuiltins() {
  if (seeded) return
  const d = db()
  const done = new Set<string>(JSON.parse((d.prepare('SELECT value FROM meta WHERE key = ?').get(SEED_KEY) as { value: string } | undefined)?.value ?? '[]'))
  const fresh = SECTIONS.filter((s) => !done.has(s.title))
  if (fresh.length) {
    const now = Date.now()
    const ins = d.prepare('INSERT INTO components (id, name, description, category, sub, builtin_key, sort, html, node, published, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, 1, NULL, ?, ?)')
    d.exec('BEGIN')
    try {
      for (const s of fresh) ins.run(randomUUID(), s.title, s.desc, s.group, s.sub ?? '', s.title, SECTIONS.indexOf(s), JSON.stringify(s.make()), now, now)
      d.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(SEED_KEY, JSON.stringify(SECTIONS.map((s) => s.title)))
      d.exec('COMMIT')
    } catch (e) { d.exec('ROLLBACK'); throw e }
  }
  seeded = true
}

export function listComponents(onlyPublished = false) {
  seedBuiltins()
  return (db().prepare(`${SELECT} ${onlyPublished ? 'WHERE c.published = 1' : ''} ${ORDER}`).all() as Row[]).map(toComp)
}
export function getComponent(id: string) {
  seedBuiltins()
  const r = db().prepare(`${SELECT} WHERE c.id = ?`).get(id) as Row | undefined
  return r ? toComp(r) : null
}

// the categories offered when filing a component: the built-in ones, Custom, and any an admin invented
export const categoryChoices = () => [...new Set<string>([...GROUPS, 'Custom', ...listComponents().map((x) => x.category)])]

// ---- input checks ----
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '')
export const checkName = (v: unknown) => clean(v, 80) || null
export const checkDescription = (v: unknown) => clean(v, 200)
export const checkCategory = (v: unknown) => clean(v, 30) || 'Custom'
export const checkSub = (v: unknown) => clean(v, 30)
export const MAX_HTML = 400_000 // each of the html, css and js parts

// markup, style and script become one HTML block inside a full-width section (which is what the editor and the export render)
export const htmlNode = (html: string, css = '', js = ''): Node => N('fullwidth', {}, {}, [N('html', { code: composeCode(html, css, js) })])

// any block except a bare column, and it must be a well-formed tree
export const checkNode = (v: unknown): Node | null => {
  if (!v || typeof v !== 'object') return null
  const n = v as Node
  if (n.type === 'root' || n.type === 'col') return null
  return validRoot({ id: 'r', type: 'root', p: {}, s: {}, c: [n] }) && JSON.stringify(n).length < 2_000_000 ? n : null
}

export type Input = { name: string; description: string; category: string; sub: string; published: boolean; html: string | null; css: string; js: string; node: Node }

export function createComponent(userId: number, i: Omit<Input, 'sub' | 'css' | 'js'> & { sub?: string; css?: string; js?: string }) {
  seedBuiltins()
  const id = randomUUID()
  const now = Date.now()
  db().prepare('INSERT INTO components (id, name, description, category, sub, sort, html, css, js, node, published, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort), 0) + 1 FROM components), ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, i.name, i.description, i.category, i.sub ?? '', i.html, i.css ?? '', i.js ?? '', JSON.stringify(i.node), i.published ? 1 : 0, userId, now, now)
  return getComponent(id)!
}

export function updateComponent(id: string, i: Partial<Input>) {
  const r = db()
    .prepare('UPDATE components SET name = COALESCE(?, name), description = COALESCE(?, description), category = COALESCE(?, category), sub = COALESCE(?, sub), html = CASE WHEN ? THEN ? ELSE html END, css = COALESCE(?, css), js = COALESCE(?, js), node = COALESCE(?, node), published = COALESCE(?, published), updated_at = ? WHERE id = ?')
    .run(i.name ?? null, i.description ?? null, i.category ?? null, i.sub ?? null, i.html !== undefined ? 1 : 0, i.html ?? null, i.css ?? null, i.js ?? null, i.node ? JSON.stringify(i.node) : null, i.published === undefined ? null : i.published ? 1 : 0, Date.now(), id)
  return r.changes > 0
}

// put a built-in back the way it shipped (name, text, category and content; the published switch stays as it is)
export function resetBuiltin(id: string): boolean {
  const c = getComponent(id)
  const orig = c?.builtin ? SECTIONS.find((s) => s.title === c.builtin) : undefined
  if (!c || !orig) return false
  // back to blocks: this also undoes a conversion to code
  return updateComponent(id, { name: orig.title, description: orig.desc, category: orig.group, sub: orig.sub ?? '', html: null, css: '', js: '', node: orig.make() })
}

export const removeComponent = (id: string) => db().prepare('DELETE FROM components WHERE id = ?').run(id).changes > 0
