import { notFound, redirect } from 'next/navigation'
import CodeEditor from '@/components/admin/CodeEditor'
import { getSessionUser } from '@/lib/auth'
import { renderPage } from '@/lib/blocks'
import { categoryChoices, getComponent } from '@/lib/components-db'
import { N } from '@/lib/tree'

// An admin edits one library component as code: index.html, style.css and script.js with a live preview.
// A block component is shown as the HTML it renders to; saving converts it to code.
export default async function ComponentCodePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')
  const c = getComponent((await params).id)
  if (!c) notFound()
  const converting = c.html === null
  const initial = converting ? { html: renderPage(N('root', {}, {}, [c.node])), css: '', js: '' } : { html: c.html!, css: c.css, js: c.js }
  const meta = { name: c.name, description: c.description, category: c.category, sub: c.sub, published: c.published }
  return <CodeEditor id={c.id} initial={initial} meta={meta} categories={categoryChoices()} converting={converting} />
}
