import { getAdmin, json, readJson, sameOrigin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { changeUser, getUser, removeUser, type Change } from '@/lib/admin-db'

const idOf = async (params: Promise<{ id: string }>) => Number((await params).id)

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin()
  if (!admin) return json({ error: 'Admins only.' }, 403)
  const body = await readJson(req)
  if (!body) return json({ error: 'Bad request.' }, 400)
  const ch: Change = {}
  if (body.role !== undefined) { if (body.role !== 'admin' && body.role !== 'user') return json({ error: 'Unknown role.' }, 400); ch.role = body.role }
  if (body.status !== undefined) { if (body.status !== 'active' && body.status !== 'suspended') return json({ error: 'Unknown status.' }, 400); ch.status = body.status }
  if (!ch.role && !ch.status) return json({ error: 'Nothing to change.' }, 400)
  const id = await idOf(params)
  const target = getUser(id)
  const r = changeUser(admin.id, id, ch)
  if ('error' in r) return json({ error: r.error }, r.code)
  if (ch.role) logActivity(req, admin, 'user.role', `${target!.name} <${target!.email}>: ${target!.role} → ${ch.role}`)
  if (ch.status) logActivity(req, admin, 'user.status', `${target!.name} <${target!.email}>: ${ch.status}`)
  return json(getUser(id))
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin()
  if (!admin) return json({ error: 'Admins only.' }, 403)
  if (!sameOrigin(req)) return json({ error: 'Bad request.' }, 400)
  const id = await idOf(params)
  const target = getUser(id)
  const r = removeUser(admin.id, id)
  if ('error' in r) return json({ error: r.error }, r.code)
  logActivity(req, admin, 'user.delete', `${target!.name} <${target!.email}>`)
  return json({ ok: true })
}
