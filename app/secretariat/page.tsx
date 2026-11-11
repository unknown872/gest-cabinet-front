import { MedicabDashboard } from '@/components/medicab-dashboard'
import {getCurrentUser} from '@/lib/session'

export default async function SecretariatPage() {
  return <MedicabDashboard role="secretariat" user={await getCurrentUser()} />
}
