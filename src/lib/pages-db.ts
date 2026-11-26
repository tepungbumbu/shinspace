// Server-only: a user's pages in the database. Every query is scoped to the owner, so ids alone grant nothing.
import { randomUUID } from 'node:crypto'
import { BLOCKS } from './blocks'
import { db } from './db'
import type { PageFull } from './pages'
import { N, type Node } from './tree'

type Row = { id: string; name: string; root: string; updated_at: number; parent_id: string | null; extra: number }
const toPage = (r: Row): PageFull => ({ id: r.id, name: r.name, updated: r.updated_at, root: JSON.parse(r.root), parent: r.parent_id, extra: r.extra })
const SELECT = 'SELECT id, name, root, updated_at, parent_id, (SELECT COUNT(*) FROM pages c WHERE c.parent_id = pages.id) AS extra FROM pages'
export const MAX_SITE_PAGES = 50

// the dashboard lists sites: pages that are not a subpage of another
export const listPages = (uid: number) => (db().prepare(`${SELECT} WHERE user_id = ? AND parent_id IS NULL ORDER BY updated_at DESC`).all(uid) as Row[]).map(toPage)

export const getPage = (uid: number, id: string) => {
  const r = db().prepare(`${SELECT} WHERE id = ? AND user_id = ?`).get(id, uid) as Row | undefined
  return r ? toPage(r) : null
}

// the site this page belongs to: its home page first, then the others in the order they were added
export function getSite(uid: number, id: string): PageFull[] {
  const page = getPage(uid, id)
  if (!page) return []
  const home = page.parent ?? page.id
  return (db().prepare(`${SELECT} WHERE user_id = ? AND (id = ? OR parent_id = ?) ORDER BY (id = ?) DESC, sort, rowid`).all(uid, home, home, home) as Row[]).map(toPage)
}

export function createPage(uid: number, name: string, root: Node = N('root', {}, {}, [])) {
  const id = randomUUID()
  db().prepare('INSERT INTO pages (id, user_id, name, root, updated_at) VALUES (?, ?, ?, ?, ?)').run(id, uid, name, JSON.stringify(root), Date.now())
  return getPage(uid, id)!
}

// one more page inside a site (null: no such site, or it is full)
export function addSubpage(uid: number, home: string, name: string, root: Node = N('root', {}, {}, [])) {
  const d = db()
  if (!d.prepare('SELECT 1 FROM pages WHERE id = ? AND user_id = ? AND parent_id IS NULL').get(home, uid)) return null
  if ((d.prepare('SELECT COUNT(*) AS n FROM pages WHERE parent_id = ?').get(home) as { n: number }).n + 1 >= MAX_SITE_PAGES) return null
  const id = randomUUID()
  d.prepare('INSERT INTO pages (id, user_id, name, root, updated_at, parent_id, sort) VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort), 0) + 1 FROM pages WHERE parent_id = ?))').run(id, uid, name, JSON.stringify(root), Date.now(), home, home)
  return getPage(uid, id)!
}

export function updatePage(uid: number, id: string, patch: { name?: string; root?: Node }) {
  const r = db()
    .prepare('UPDATE pages SET name = COALESCE(?, name), root = COALESCE(?, root), updated_at = ? WHERE id = ? AND user_id = ?')
    .run(patch.name ?? null, patch.root ? JSON.stringify(patch.root) : null, Date.now(), id, uid)
  if (r.changes > 0 && patch.root) db().prepare('UPDATE pages SET updated_at = ? WHERE id = (SELECT parent_id FROM pages WHERE id = ?)').run(Date.now(), id) // the site counts as edited too
  return r.changes > 0
}

// deleting a site's home page deletes the whole site (its subpages cascade)
export const removePage = (uid: number, id: string) => db().prepare('DELETE FROM pages WHERE id = ? AND user_id = ?').run(id, uid).changes > 0

// copy a whole site (the dashboard's Duplicate)
export function copyPage(uid: number, id: string) {
  const src = getPage(uid, id)
  if (!src || src.parent) return null
  const [home, ...rest] = getSite(uid, id)
  const d = db()
  d.exec('BEGIN')
  try {
    const copy = createPage(uid, `${home.name} (copy)`.slice(0, 120), home.root)
    for (const p of rest) addSubpage(uid, copy.id, p.name, p.root)
    d.exec('COMMIT')
    return getPage(uid, copy.id)!
  } catch (e) { d.exec('ROLLBACK'); throw e }
}

export const checkTitle = (v: unknown) => {
  const s = typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
  return s.length >= 1 && s.length <= 120 ? s : null
}

// The page tree comes from the browser, so check its shape before storing it: known block types and
// string values only (the renderer would otherwise throw), bounded depth and size.
export function validRoot(x: unknown): x is Node {
  let count = 0
  const strings = (o: unknown) => !!o && typeof o === 'object' && Object.values(o).every((v) => typeof v === 'string')
  const ok = (n: unknown, depth: number): boolean => {
    if (!n || typeof n !== 'object' || depth > 40 || ++count > 5000) return false
    const o = n as Record<string, unknown>
    if (typeof o.id !== 'string' || typeof o.type !== 'string' || !(o.type in BLOCKS)) return false
    if (!strings(o.p) || !strings(o.s) || (o.t !== undefined && !strings(o.t))) return false
    return o.c === undefined || (Array.isArray(o.c) && o.c.every((k) => ok(k, depth + 1)))
  }
  return ok(x, 0) && (x as Node).type === 'root'
}
