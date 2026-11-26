import { checkEmail, clientIp, createSession, hashPassword, json, readJson, tooMany, verifyPassword } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { db } from '@/lib/db'

// Hashed once so an unknown email costs the same time as a wrong password.
let dummy: Promise<string> | undefined

export async function POST(req: Request) {
  const body = await readJson(req)
  if (!body) return json({ error: 'Bad request.' }, 400)
  const email = checkEmail(body.email)
  const password = typeof body.password === 'string' && body.password.length <= 200 ? body.password : null
  if (!email || !password) return json({ error: 'Enter your email and password.' }, 400)
  if (tooMany(`login|${clientIp(req)}|${email.toLowerCase()}`, 8, 15 * 60_000)) return json({ error: 'Too many attempts. Try again in a few minutes.' }, 429)

  const user = db().prepare('SELECT id, name, email, password_hash, status FROM users WHERE email = ?').get(email) as { id: number; name: string; email: string; password_hash: string; status: string } | undefined
  const hash = user?.password_hash ?? (await (dummy ??= hashPassword('not-a-real-password')))
  const ok = await verifyPassword(password, hash)
  if (!user || !ok) {
    if (user) logActivity(req, user, 'login.failed', 'Wrong password') // only for real accounts, so strangers cannot fill the log
    return json({ error: 'Incorrect email or password.' }, 401)
  }

  if (user.status !== 'active') {
    logActivity(req, user, 'login.failed', 'Account is suspended')
    return json({ error: 'This account is suspended. Contact an administrator.' }, 403) // only reached with the right password
  }
  await createSession(user.id, body.remember !== false)
  logActivity(req, user, 'login')
  return json({ ok: true })
}
