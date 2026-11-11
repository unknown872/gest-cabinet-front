import { MedicabDashboard } from '@/components/medicab-dashboard'
import {getCurrentUser} from '@/lib/session'

export default async function AdminPage() {
  return <MedicabDashboard role="admin" user={await getCurrentUser()} />
}
