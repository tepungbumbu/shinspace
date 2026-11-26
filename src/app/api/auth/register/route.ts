import { checkEmail, checkName, checkPassword, clientIp, createSession, hashPassword, json, readJson, tooMany } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const body = await readJson(req)
  if (!body) return json({ error: 'Bad request.' }, 400)
  if (tooMany(`register|${clientIp(req)}`, 10, 60 * 60_000)) return json({ error: 'Too many attempts. Try again later.' }, 429)

  const name = checkName(body.name)
  const email = checkEmail(body.email)
  const password = checkPassword(body.password)
  if (!name) return json({ error: 'Enter your name.', field: 'name' }, 400)
  if (!email) return json({ error: 'Enter a valid email address.', field: 'email' }, 400)
  if (!password) return json({ error: 'Your password needs at least 8 characters.', field: 'password' }, 400)

  let id: number
  try {
    const r = db().prepare('INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(name, email, await hashPassword(password), Date.now())
    id = Number(r.lastInsertRowid)
  } catch (e) {
    if (String(e).includes('UNIQUE')) return json({ error: 'An account with this email already exists.', field: 'email' }, 409)
    throw e
  }
  await createSession(id, true)
  return json({ ok: true }, 201)
}
