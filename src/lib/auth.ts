// Server-only auth: password hashing, sessions in an httpOnly cookie, input checks, a small rate limiter.
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { db } from './db'

export type SessionUser = { id: number; name: string; email: string }

const COOKIE = 'detik_session'
const DAY = 86400

// ---- passwords: scrypt with a random salt per user ----
const derive = (pw: string, salt: Buffer) =>
  new Promise<Buffer>((res, rej) => scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? rej(e) : res(k))))

export async function hashPassword(pw: string) {
  const salt = randomBytes(16)
  return `scrypt$${salt.toString('base64')}$${(await derive(pw, salt)).toString('base64')}`
}
export async function verifyPassword(pw: string, stored: string) {
  const [alg, salt, key] = stored.split('$')
  if (alg !== 'scrypt' || !salt || !key) return false
  const got = await derive(pw, Buffer.from(salt, 'base64'))
  const want = Buffer.from(key, 'base64')
  return got.length === want.length && timingSafeEqual(got, want)
}

// ---- sessions: the cookie holds a random token, the database only its hash ----
const sha = (t: string) => createHash('sha256').update(t).digest('hex')

export async function createSession(userId: number, remember: boolean) {
  const token = randomBytes(32).toString('base64url')
  const ttl = (remember ? 30 : 1) * DAY
  const d = db()
  d.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now()) // sweep expired sessions
  d.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha(token), userId, Date.now() + ttl * 1000)
  ;(await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(remember ? { maxAge: ttl } : {}), // without "remember me" it is a browser-session cookie
  })
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const row = db()
    .prepare('SELECT u.id, u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?')
    .get(sha(token), Date.now())
  return (row as SessionUser | undefined) ?? null
}

export async function destroySession() {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (token) db().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token))
  jar.delete(COOKIE)
}

// ---- input checks (the trust boundary: never rely on the browser having validated) ----
export const checkEmail = (v: unknown) => {
  const s = typeof v === 'string' ? v.trim() : ''
  return s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null
}
export const checkPassword = (v: unknown) => (typeof v === 'string' && v.length >= 8 && v.length <= 200 ? v : null)
export const checkName = (v: unknown) => {
  const s = typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
  return s.length >= 1 && s.length <= 80 ? s : null
}

// JSON only (a cross-site <form> cannot send it) and same-origin only.
export const sameOrigin = (req: Request) => {
  const origin = req.headers.get('origin')
  return !origin || new URL(origin).host === req.headers.get('host')
}

export async function readJson(req: Request, max = 100_000): Promise<Record<string, unknown> | null> {
  if (!sameOrigin(req)) return null
  if (!req.headers.get('content-type')?.includes('application/json')) return null
  try {
    const text = await req.text()
    if (text.length > max) return null
    const b = JSON.parse(text)
    return b && typeof b === 'object' ? b : null
  } catch {
    return null
  }
}

// ---- brute-force limiter: in memory, so it resets on restart and is per server instance ----
const hits = new Map<string, { n: number; until: number }>()
export function tooMany(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const h = hits.get(key)
  if (!h || h.until < now) { hits.set(key, { n: 1, until: now + windowMs }); return false }
  h.n++
  return h.n > max
}
export const clientIp = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local'

export const json = (body: unknown, status = 200) => Response.json(body, { status })
