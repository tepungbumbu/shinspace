import { checkEmail, checkName, checkPassword, getAdmin, hashPassword, json, readJson } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { getUser } from '@/lib/admin-db'
import { db } from '@/lib/db'

// An admin creates an account directly (name, email, password, role).
export async function POST(req: Request) {
  const admin = await getAdmin()
  if (!admin) return json({ error: 'Admins only.' }, 403)
  const body = await readJson(req)
  if (!body) return json({ error: 'Bad request.' }, 400)
  const name = checkName(body.name)
  const email = checkEmail(body.email)
  const password = checkPassword(body.password)
  const role = body.role === 'admin' ? 'admin' : 'user'
  if (!name) return json({ error: 'Enter a name.', field: 'name' }, 400)
  if (!email) return json({ error: 'Enter a valid email address.', field: 'email' }, 400)
  if (!password) return json({ error: 'The password needs at least 8 characters.', field: 'password' }, 400)
  try {
    const r = db().prepare('INSERT INTO users (name, email, password_hash, created_at, role) VALUES (?, ?, ?, ?, ?)').run(name, email, await hashPassword(password), Date.now(), role)
    logActivity(req, admin, 'user.create', `${name} <${email}> as ${role}`)
    return json(getUser(Number(r.lastInsertRowid)), 201)
  } catch (e) {
    if (String(e).includes('UNIQUE')) return json({ error: 'An account with this email already exists.', field: 'email' }, 409)
    throw e
  }
}
