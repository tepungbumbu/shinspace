import { getAdmin, json, readJson, sameOrigin } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { checkCategory, checkDescription, checkName, checkNode, checkSub, getComponent, htmlNode, MAX_HTML, removeComponent, updateComponent, type Input } from '@/lib/components-db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin()
  if (!admin) return json({ error: 'Admins only.' }, 403)
  const body = await readJson(req, 3_000_000)
  if (!body) return json({ error: 'Bad request.' }, 400)
  const { id } = await params
  const current = getComponent(id)
  if (!current) return json({ error: 'Component not found.' }, 404)

  const patch: Partial<Input> = {}
  if (body.name !== undefined) { const n = checkName(body.name); if (!n) return json({ error: 'Enter a name for the component.', field: 'name' }, 400); patch.name = n }
  if (body.description !== undefined) patch.description = checkDescription(body.description)
  if (body.category !== undefined) patch.category = checkCategory(body.category)
  if (body.sub !== undefined) patch.sub = checkSub(body.sub)
  if (body.published !== undefined) patch.published = !!body.published
  if (body.node !== undefined) { // the visual editor saves the section's block tree here
    if (current.html !== null) return json({ error: 'This component is written as HTML. Edit its HTML instead.' }, 400)
    const node = checkNode(body.node)
    if (!node) return json({ error: 'That content cannot be saved as a component.' }, 400)
    patch.node = node
  }
  // code: the markup, the style.css and the script.js tabs of the code editor (the old quick-edit form sends only html)
  if (body.html !== undefined || body.css !== undefined || body.js !== undefined) {
    const convert = body.convert === true // opening a block component in the code editor turns it into code
    if (current.html === null && !convert) return json({ error: 'This component is made of blocks. Edit it in the visual editor, or open it in the code editor to convert it.' }, 400)
    const html = typeof body.html === 'string' ? body.html : (current.html ?? '')
    const css = typeof body.css === 'string' ? body.css : current.css
    const js = typeof body.js === 'string' ? body.js : current.js
    if (!html.trim()) return json({ error: 'The HTML is empty.', field: 'html' }, 400)
    if (html.length > MAX_HTML || css.length > MAX_HTML || js.length > MAX_HTML) return json({ error: 'That is too large (400 KB per part).', field: 'html' }, 400)
    patch.html = html
    patch.css = css
    patch.js = js
    patch.node = htmlNode(html, css, js)
  }
  updateComponent(id, patch)
  logActivity(req, admin, 'component.update', patch.name ?? current.name, 5) // the editors save often: one entry per 5 minutes
  return json(getComponent(id))
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin()
  if (!admin) return json({ error: 'Admins only.' }, 403)
  if (!sameOrigin(req)) return json({ error: 'Bad request.' }, 400)
  const c = getComponent((await params).id)
  if (!c || !removeComponent(c.id)) return json({ error: 'Component not found.' }, 404)
  logActivity(req, admin, 'component.delete', c.name)
  return json({ ok: true })
}
