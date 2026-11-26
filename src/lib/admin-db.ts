// Server-only: everything the admin area reads and changes. Callers must already have checked getAdmin().
import { db } from './db'
import type { Role } from './auth'
import { BLOCKS } from './blocks'
import type { Node } from './tree'

export type AdminUser = { id: number; name: string; email: string; role: Role; status: 'active' | 'suspended'; created: number; pages: number }

const USER_SQL = `SELECT u.id, u.name, u.email, u.role, u.status, u.created_at AS created, (SELECT COUNT(*) FROM pages p WHERE p.user_id = u.id) AS pages FROM users u`
// node:sqlite rows have a null prototype; copy them so they can cross into client components
export const listUsers = () => (db().prepare(`${USER_SQL} ORDER BY u.created_at DESC`).all() as AdminUser[]).map((r) => ({ ...r }))
export const getUser = (id: number) => {
  const r = db().prepare(`${USER_SQL} WHERE u.id = ?`).get(id) as AdminUser | undefined
  return r && { ...r }
}

// Would this change leave the system without an active admin? (an admin cannot lock everyone out)
export const otherActiveAdmins = (excludeId: number) =>
  (db().prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND status = 'active' AND id != ?").get(excludeId) as { n: number }).n

export type Change = { role?: Role; status?: 'active' | 'suspended' }
export function changeUser(actorId: number, id: number, ch: Change): { ok: true } | { error: string; code: number } {
  const target = getUser(id)
  if (!target) return { error: 'User not found.', code: 404 }
  if (id === actorId) return { error: 'You cannot change your own role or status.', code: 400 }
  const losesAdmin = target.role === 'admin' && target.status === 'active' && ((ch.role && ch.role !== 'admin') || ch.status === 'suspended')
  if (losesAdmin && otherActiveAdmins(id) === 0) return { error: 'There must be at least one active admin.', code: 400 }
  db().prepare('UPDATE users SET role = COALESCE(?, role), status = COALESCE(?, status) WHERE id = ?').run(ch.role ?? null, ch.status ?? null, id)
  return { ok: true }
}

export function removeUser(actorId: number, id: number): { ok: true } | { error: string; code: number } {
  const target = getUser(id)
  if (!target) return { error: 'User not found.', code: 404 }
  if (id === actorId) return { error: 'You cannot delete your own account.', code: 400 }
  if (target.role === 'admin' && target.status === 'active' && otherActiveAdmins(id) === 0) return { error: 'There must be at least one active admin.', code: 400 }
  db().prepare('DELETE FROM users WHERE id = ?').run(id) // pages and sessions go with the account (ON DELETE CASCADE)
  return { ok: true }
}

// ---------- overview numbers ----------
const DAY = 86400_000
const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10)

// counts per calendar day for the last `days` days, oldest first
function perDay(sql: string, days: number): { day: string; n: number }[] {
  const since = Date.now() - days * DAY
  const rows = db().prepare(sql).all(since) as { t: number }[]
  const out = new Map<string, number>()
  for (let i = days - 1; i >= 0; i--) out.set(dayKey(Date.now() - i * DAY), 0)
  for (const r of rows) { const k = dayKey(r.t); if (out.has(k)) out.set(k, out.get(k)! + 1) }
  return [...out].map(([day, n]) => ({ day, n }))
}

const one = (sql: string, ...a: (string | number)[]) => (db().prepare(sql).get(...a) as { n: number }).n

export function overview(days = 14) {
  const now = Date.now()
  // how often each block type is used across every page; capped so a big install stays quick
  const usage = new Map<string, number>()
  let scanned = 0
  const walk = (n: Node) => { if (n.type !== 'root' && n.type !== 'col' && n.type !== 'row') usage.set(n.type, (usage.get(n.type) ?? 0) + 1); n.c?.forEach(walk) }
  for (const r of db().prepare('SELECT root FROM pages ORDER BY updated_at DESC LIMIT 500').all() as { root: string }[]) {
    try { walk(JSON.parse(r.root)); scanned++ } catch {}
  }
  return {
    users: one('SELECT COUNT(*) AS n FROM users'),
    admins: one("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'"),
    suspended: one("SELECT COUNT(*) AS n FROM users WHERE status = 'suspended'"),
    pages: one('SELECT COUNT(*) AS n FROM pages'),
    pagesWeek: one('SELECT COUNT(*) AS n FROM pages WHERE updated_at > ?', now - 7 * DAY),
    components: one('SELECT COUNT(*) AS n FROM components'),
    published: one('SELECT COUNT(*) AS n FROM components WHERE published = 1'),
    sessions: one('SELECT COUNT(*) AS n FROM sessions WHERE expires_at > ?', now),
    signups: perDay('SELECT created_at AS t FROM users WHERE created_at > ?', days),
    edits: perDay('SELECT updated_at AS t FROM pages WHERE updated_at > ?', days),
    blocks: [...usage].map(([type, n]) => ({ type, label: BLOCKS[type]?.label ?? type, n })).sort((a, b) => b.n - a.n).slice(0, 7),
    scanned,
    recentUsers: listUsers().slice(0, 5),
  }
}
