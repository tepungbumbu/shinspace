import { notFound, redirect } from 'next/navigation'
import Editor from '@/components/Editor'
import { getSessionUser } from '@/lib/auth'
import { getPage, getSite } from '@/lib/pages-db'

// The editor opens one of the signed-in user's pages: /?page=<id>. Without an id, go pick one.
export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const { page: id } = await searchParams
  if (!id) redirect('/dashboard')
  const page = getPage(user.id, id)
  if (!page) notFound()
  const site = getSite(user.id, id).map((p) => ({ id: p.id, name: p.name })) // the pages of this site, home first
  return <Editor page={page} site={site} isAdmin={user.role === 'admin'} />
}
