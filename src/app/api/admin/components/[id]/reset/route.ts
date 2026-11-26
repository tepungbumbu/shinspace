import { getAdmin, json, sameOrigin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { getComponent, resetBuiltin } from '@/lib/components-db'

// Restore a built-in section to the way it shipped.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin()
  if (!admin) return json({ error: 'Admins only.' }, 403)
  if (!sameOrigin(req)) return json({ error: 'Bad request.' }, 400)
  const { id } = await params
  if (resetBuiltin(id)) { logActivity(req, admin, 'component.reset', getComponent(id)?.name ?? ''); return json(getComponent(id)) }
  return json({ error: 'Only the sections that shipped with the app can be reset.' }, 400)
}
