import { accountRequest, checkEmail, checkName, destroySession, json, tooMany } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { deleteAccount, getProfile, passwordIs, updateProfile } from '@/lib/profile-db'

// change name and/or email; a new email needs the current password
export async function PATCH(req: Request) {
  const a = await accountRequest(req)
  if (a instanceof Response) return a
  const { body, user } = a
  const name = checkName(body.name)
  const email = checkEmail(body.email)
  if (!name) return json({ error: 'Enter your name.', field: 'name' }, 400)
  if (!email) return json({ error: 'Enter a valid email address.', field: 'email' }, 400)
  if (email.toLowerCase() !== user.email.toLowerCase()) {
    if (tooMany(`profile|${user.id}`, 10, 15 * 60_000)) return json({ error: 'Too many attempts. Try again in a few minutes.' }, 429)
    if (!(await passwordIs(user.id, body.password))) return json({ error: 'Enter your current password to change the email.', field: 'password' }, 403)
  }
  const r = updateProfile(user.id, name, email)
  if ('error' in r) return json({ error: r.error, field: r.field }, r.code)
  const changed = [name !== user.name && `name: ${user.name} → ${name}`, email !== user.email && `email: ${user.email} → ${email}`].filter(Boolean).join('; ')
  if (changed) logActivity(req, { ...user, name, email }, 'profile.update', changed)
  return json({ ok: true, name, email })
}

// delete the account (password required)
export async function DELETE(req: Request) {
  const a = await accountRequest(req)
  if (a instanceof Response) return a
  const { body, user } = a
  if (tooMany(`profile|${user.id}`, 10, 15 * 60_000)) return json({ error: 'Too many attempts. Try again in a few minutes.' }, 429)
  if (!(await passwordIs(user.id, body.password))) return json({ error: 'That password is not correct.', field: 'password' }, 403)
  const r = deleteAccount(user.id, getProfile(user.id).role)
  if ('error' in r) return json({ error: r.error }, 400)
  await destroySession()
  logActivity(req, { ...user, id: null }, 'account.delete', 'Pages and sessions were removed') // the account is gone, the entry keeps its name
  return json({ ok: true })
}
