import { getSessionUser, json, readJson } from '@/lib/auth'
import { checkTitle, copyPage, createPage, listPages, validRoot } from '@/lib/pages-db'

const MAX_BODY = 8_000_000 // pages can embed uploaded images

export async function GET() {
  const user = await getSessionUser()
  if (!user) return json({ error: 'Not signed in.' }, 401)
  return json(listPages(user.id))
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return json({ error: 'Not signed in.' }, 401)
  const body = await readJson(req, MAX_BODY)
  if (!body) return json({ error: 'Bad request.' }, 400)

  if (typeof body.copyOf === 'string') {
    const page = copyPage(user.id, body.copyOf)
    return page ? json(page, 201) : json({ error: 'Page not found.' }, 404)
  }
  if (body.root !== undefined && !validRoot(body.root)) return json({ error: 'That page content is not valid.' }, 400)
  return json(createPage(user.id, checkTitle(body.name) ?? 'Untitled page', body.root as never), 201)
}
