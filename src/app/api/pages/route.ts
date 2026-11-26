import { getSessionUser, json, readJson } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { addSubpage, checkTitle, copyPage, createPage, getSite, listPages, validRoot } from '@/lib/pages-db'

const MAX_BODY = 8_000_000 // pages can embed uploaded images

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return json({ error: 'Not signed in.' }, 401)
  const site = new URL(req.url).searchParams.get('site') // every page of one site, home first
  return json(site ? getSite(user.id, site) : listPages(user.id))
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return json({ error: 'Not signed in.' }, 401)
  const body = await readJson(req, MAX_BODY)
  if (!body) return json({ error: 'Bad request.' }, 400)

  if (typeof body.copyOf === 'string') {
    const page = copyPage(user.id, body.copyOf)
    if (page) logActivity(req, user, 'page.copy', page.name)
    return page ? json(page, 201) : json({ error: 'Page not found.' }, 404)
  }
  if (body.root !== undefined && !validRoot(body.root)) return json({ error: 'That page content is not valid.' }, 400)
  const name = checkTitle(body.name) ?? 'Untitled page'
  if (typeof body.site === 'string') { // one more page inside an existing site
    const sub = addSubpage(user.id, body.site, name, body.root as never)
    if (!sub) return json({ error: 'Could not add the page. The site was not found or it is full (50 pages).' }, 404)
    logActivity(req, user, 'page.create', `${getSite(user.id, body.site)[0].name} › ${sub.name}`)
    return json(sub, 201)
  }
  const page = createPage(user.id, name, body.root as never)
  logActivity(req, user, 'page.create', page.name)
  return json(page, 201)
}
