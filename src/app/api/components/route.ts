import { getSessionUser, json } from '@/lib/auth'
import { listComponents } from '@/lib/components-db'

// The Sections tab loads the library from here. Any signed-in user may read it; only published sections are returned.
export async function GET() {
  if (!(await getSessionUser())) return json({ error: 'Not signed in.' }, 401)
  const list = listComponents(true).map(({ id, name, description, category, sub, builtin, node }) => ({ id, name, description, category, sub, builtin: !!builtin, node }))
  return Response.json(list, { headers: { 'Cache-Control': 'private, no-cache' } })
}
