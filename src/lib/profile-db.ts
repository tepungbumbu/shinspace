// Server-only: the signed-in user's own account (name, email, password, devices, deletion).
import { db } from './db'
import { hashPassword, verifyPassword } from './auth'
import { otherActiveAdmins } from './admin-db'

export type Profile = { id: number; name: string; email: string; role: 'admin' | 'user'; created: number; pages: number }

export const getProfile = (id: number): Profile =>
  ({ ...(db().prepare('SELECT u.id, u.name, u.email, u.role, u.created_at AS created, (SELECT COUNT(*) FROM pages p WHERE p.user_id = u.id) AS pages FROM users u WHERE u.id = ?').get(id) as Profile) })

// is this the account's current password?
export async function passwordIs(id: number, pw: unknown) {
  if (typeof pw !== 'string' || !pw || pw.length > 200) return false
  const r = db().prepare('SELECT password_hash FROM users WHERE id = ?').get(id) as { password_hash: string } | undefined
  return !!r && verifyPassword(pw, r.password_hash)
}

export function updateProfile(id: number, name: string, email: string): { ok: true } | { error: string; field: string; code: number } {
  try {
    db().prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, id)
    return { ok: true }
  } catch (e) {
    if (String(e).includes('UNIQUE')) return { error: 'Another account already uses this email.', field: 'email', code: 409 }
    throw e
  }
}

export async function setPassword(id: number, pw: string) {
  db().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await hashPassword(pw), id)
}

// An admin cannot delete the account that is the last active admin.
export function deleteAccount(id: number, role: string): { ok: true } | { error: string } {
  if (role === 'admin' && otherActiveAdmins(id) === 0) return { error: 'You are the only active admin. Make someone else an admin first.' }
  db().prepare('DELETE FROM users WHERE id = ?').run(id) // pages and sessions go with it (ON DELETE CASCADE)
  return { ok: true }
}
