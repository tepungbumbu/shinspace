import { getAdmin, json, readJson } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { checkCategory, checkDescription, checkName, checkNode, checkSub, createComponent, htmlNode, MAX_HTML } from '@/lib/components-db'

const MAX_BODY = 3_000_000

// Create a component from raw HTML ({ html }) or from a block tree saved in the editor ({ node }).
export async function POST(req: Request) {
  const admin = await getAdmin()
  if (!admin) return json({ error: 'Admins only.' }, 403)
  const body = await readJson(req, MAX_BODY)
  if (!body) return json({ error: 'Bad request.' }, 400)
  const name = checkName(body.name)
  if (!name) return json({ error: 'Enter a name for the component.', field: 'name' }, 400)

  let html: string | null = null
  let css = ''
  let js = ''
  let node
  if (typeof body.html === 'string') {
    css = typeof body.css === 'string' ? body.css : ''
    js = typeof body.js === 'string' ? body.js : ''
    if (!body.html.trim()) return json({ error: 'The HTML is empty.', field: 'html' }, 400)
    if (body.html.length > MAX_HTML || css.length > MAX_HTML || js.length > MAX_HTML) return json({ error: 'That is too large (400 KB per part).', field: 'html' }, 400)
    html = body.html
    node = htmlNode(html, css, js)
  } else {
    node = checkNode(body.node)
    if (!node) return json({ error: 'That block cannot be saved as a component.' }, 400)
  }
  const made = createComponent(admin.id, { name, description: checkDescription(body.description), category: checkCategory(body.category), sub: checkSub(body.sub), published: body.published !== false, html, css, js, node })
  logActivity(req, admin, 'component.create', made.name)
  return json(made, 201)
}
