import { notFound, redirect } from 'next/navigation'
import Editor from '@/components/Editor'
import { getSessionUser } from '@/lib/auth'
import { getComponent } from '@/lib/components-db'
import { N } from '@/lib/tree'

// An admin edits one section of the library in the full visual editor. Only block-tree components can be edited this way;
// components written as HTML are edited as HTML in the admin.
export default async function ComponentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')
  const { id } = await params
  const c = getComponent(id)
  if (!c) notFound()
  if (c.html !== null) redirect('/admin/components')
  const page = { id: c.id, name: c.name, updated: c.updated, parent: null, extra: 0, root: N('root', {}, {}, [c.node]) }
  return <Editor page={page} isAdmin component />
}
