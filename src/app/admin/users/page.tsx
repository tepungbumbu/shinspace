import UsersManager from '@/components/admin/UsersManager'
import { listUsers } from '@/lib/admin-db'
import { getAdmin } from '@/lib/auth'

export default async function UsersPage() {
  const me = await getAdmin() // the layout already guards this; we need the id to disable self-edits
  return <UsersManager initial={listUsers()} meId={me!.id} />
}
