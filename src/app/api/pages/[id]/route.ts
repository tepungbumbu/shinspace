import { getSessionUser, json, readJson, sameOrigin } from '@/lib/auth'
import { checkTitle, removePage, updatePage, validRoot } from '@/lib/pages-db'

const MAX_BODY = 8_000_000

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return json({ error: 'Not signed in.' }, 401)
  const body = await readJson(req, MAX_BODY)
  if (!body) return json({ error: 'Bad request.' }, 400)

  const patch: { name?: string; root?: never } = {}
  if (body.name !== undefined) {
    const name = checkTitle(body.name)
    if (!name) return json({ error: 'Enter a page name.' }, 400)
    patch.name = name
  }
  if (body.root !== undefined) {
    if (!validRoot(body.root)) return json({ error: 'That page content is not valid.' }, 400)
    patch.root = body.root as never
  }
  const { id } = await params
  return updatePage(user.id, id, patch) ? json({ ok: true }) : json({ error: 'Page not found.' }, 404)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return json({ error: 'Not signed in.' }, 401)
  if (!sameOrigin(req)) return json({ error: 'Bad request.' }, 400)
  const { id } = await params
  return removePage(user.id, id) ? json({ ok: true }) : json({ error: 'Page not found.' }, 404)
}
