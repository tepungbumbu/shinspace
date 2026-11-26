import ComponentsManager from '@/components/admin/ComponentsManager'
import { listComponents } from '@/lib/components-db'

export default function ComponentsPage() {
  return <ComponentsManager initial={listComponents()} />
}
