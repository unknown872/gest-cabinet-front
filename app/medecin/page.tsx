import { MedicabDashboard } from '@/components/medicab-dashboard'
import {getCurrentUser} from '@/lib/session'

export default async function MedecinPage() {
  return <MedicabDashboard role="medecin" user={await getCurrentUser()} />
}
