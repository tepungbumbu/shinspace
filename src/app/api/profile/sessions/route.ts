import { accountRequest, json, revokeOtherSessions } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

// sign out everywhere except this browser
export async function DELETE(req: Request) {
  const a = await accountRequest(req)
  if (a instanceof Response) return a
  const signedOut = await revokeOtherSessions(a.user.id)
  if (signedOut) logActivity(req, a.user, 'sessions.revoke', `${signedOut} device${signedOut > 1 ? 's' : ''}`)
  return json({ ok: true, signedOut })
}
