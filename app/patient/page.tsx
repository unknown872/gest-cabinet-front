import { MedicabDashboard } from '@/components/medicab-dashboard'
import {getCurrentUser} from '@/lib/session'

export default async function PatientPage() {
  return <MedicabDashboard role="patient" user={await getCurrentUser()} />
}
