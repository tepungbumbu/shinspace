import { accountRequest, checkPassword, json, revokeOtherSessions, tooMany } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { passwordIs, setPassword } from '@/lib/profile-db'

// change the password; every other device is signed out
export async function POST(req: Request) {
  const a = await accountRequest(req)
  if (a instanceof Response) return a
  const { body, user } = a
  if (tooMany(`profile|${user.id}`, 10, 15 * 60_000)) return json({ error: 'Too many attempts. Try again in a few minutes.' }, 429)
  const next = checkPassword(body.next)
  if (!next) return json({ error: 'The new password needs at least 8 characters.', field: 'next' }, 400)
  if (!(await passwordIs(user.id, body.current))) return json({ error: 'Your current password is not correct.', field: 'current' }, 403)
  await setPassword(user.id, next)
  const signedOut = await revokeOtherSessions(user.id)
  logActivity(req, user, 'password.change', signedOut ? `${signedOut} other device${signedOut > 1 ? 's' : ''} signed out` : '')
  return json({ ok: true, signedOut })
}
