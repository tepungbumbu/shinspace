import { destroySession, getSessionUser, json } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

export async function POST(req: Request) {
  const user = await getSessionUser()
  await destroySession()
  if (user) logActivity(req, user, 'logout')
  return json({ ok: true })
}
