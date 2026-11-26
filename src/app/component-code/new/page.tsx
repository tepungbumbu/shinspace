import { redirect } from 'next/navigation'
import CodeEditor from '@/components/admin/CodeEditor'
import { getSessionUser } from '@/lib/auth'
import { EXAMPLE_HTML } from '@/lib/code'
import { categoryChoices } from '@/lib/components-db'

// A new library component starts in the code editor, with its details in the left column.
export default async function NewComponentPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')
  return (
    <CodeEditor
      id={null}
      initial={{ html: EXAMPLE_HTML, css: '', js: '' }}
      meta={{ name: '', description: '', category: 'Custom', sub: '', published: true }}
      categories={categoryChoices()}
      converting={false}
    />
  )
}
