// Server-only: a user's pages in the database. Every query is scoped to the owner, so ids alone grant nothing.
import { randomUUID } from 'node:crypto'
import { BLOCKS } from './blocks'
import { db } from './db'
import type { PageFull } from './pages'
import { N, type Node } from './tree'

type Row = { id: string; name: string; root: string; updated_at: number }
const toPage = (r: Row): PageFull => ({ id: r.id, name: r.name, updated: r.updated_at, root: JSON.parse(r.root) })
const SELECT = 'SELECT id, name, root, updated_at FROM pages'

export const listPages = (uid: number) => (db().prepare(`${SELECT} WHERE user_id = ? ORDER BY updated_at DESC`).all(uid) as Row[]).map(toPage)

export const getPage = (uid: number, id: string) => {
  const r = db().prepare(`${SELECT} WHERE id = ? AND user_id = ?`).get(id, uid) as Row | undefined
  return r ? toPage(r) : null
}

export function createPage(uid: number, name: string, root: Node = N('root', {}, {}, [])) {
  const id = randomUUID()
  db().prepare('INSERT INTO pages (id, user_id, name, root, updated_at) VALUES (?, ?, ?, ?, ?)').run(id, uid, name, JSON.stringify(root), Date.now())
  return getPage(uid, id)!
}

export function updatePage(uid: number, id: string, patch: { name?: string; root?: Node }) {
  const r = db()
    .prepare('UPDATE pages SET name = COALESCE(?, name), root = COALESCE(?, root), updated_at = ? WHERE id = ? AND user_id = ?')
    .run(patch.name ?? null, patch.root ? JSON.stringify(patch.root) : null, Date.now(), id, uid)
  return r.changes > 0
}

export const removePage = (uid: number, id: string) => db().prepare('DELETE FROM pages WHERE id = ? AND user_id = ?').run(id, uid).changes > 0

export function copyPage(uid: number, id: string) {
  const src = getPage(uid, id)
  return src ? createPage(uid, `${src.name} (copy)`.slice(0, 120), src.root) : null
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
