// Server-only: the activity log. logActivity never throws, so a logging problem cannot break the action being logged.
import { db } from './db'
import { clientIp } from './auth'
import { KINDS, type Action, type Kind } from './activity-types'

type Who = { id: number | null; name: string; email: string }
export type Entry = { id: number; userId: number | null; who: string; action: string; detail: string; ip: string; device: string; at: number }

const RETAIN = 90 * 86400_000 // older entries are dropped
let pruned = 0

const device = (ua: string) => {
  const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  const o = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : ''
  return o ? `${b} on ${o}` : b
}

// `quiet` (minutes): skip when the same user already logged the same action and detail that recently (page edits autosave often)
export function logActivity(req: Request, user: Who, action: Action, detail = '', quiet = 0) {
  try {
    const d = db()
    const now = Date.now()
    if (quiet && user.id !== null && d.prepare('SELECT 1 FROM activity WHERE user_id = ? AND action = ? AND detail = ? AND created_at > ?').get(user.id, action, detail, now - quiet * 60_000)) return
    d.prepare('INSERT INTO activity (user_id, who, action, detail, ip, device, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(user.id, `${user.name} <${user.email}>`.slice(0, 200), action, detail.slice(0, 300), clientIp(req).slice(0, 64), device(req.headers.get('user-agent') ?? ''), now)
    if (now - pruned > 3600_000) { pruned = now; d.prepare('DELETE FROM activity WHERE created_at < ?').run(now - RETAIN) }
  } catch (e) { console.error('activity log failed', e) }
}

export function listActivity(f: { userId?: number; kind?: Kind; limit: number; offset?: number }) {
  const where: string[] = []
  const args: (string | number)[] = []
  if (f.userId !== undefined) { where.push('user_id = ?'); args.push(f.userId) }
  if (f.kind) { where.push(`action IN (${KINDS[f.kind].map(() => '?').join(',')})`); args.push(...KINDS[f.kind]) }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const d = db()
  const total = (d.prepare(`SELECT COUNT(*) AS n FROM activity ${w}`).get(...args) as { n: number }).n
  const rows = (d.prepare(`SELECT id, user_id AS userId, who, action, detail, ip, device, created_at AS at FROM activity ${w} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args, f.limit, f.offset ?? 0) as Entry[]).map((r) => ({ ...r }))
  return { rows, total }
}
