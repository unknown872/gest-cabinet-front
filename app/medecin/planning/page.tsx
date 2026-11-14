import {redirect} from 'next/navigation'
import {AvailabilityManager} from '@/components/availability-manager'
import {DashboardLayout} from '@/components/dashboard-layout'
import {getCurrentUser} from '@/lib/session'

const PATHNAME = '/medecin/planning'

export default async function MedecinPlanningPage() {
    const user = await getCurrentUser()
    if (!user) redirect(`/connexion?returnTo=${encodeURIComponent(PATHNAME)}`)
    if (user.role !== 'medecin') redirect('/403')

    return (
        <DashboardLayout role="medecin" user={user}>
            <AvailabilityManager/>
        </DashboardLayout>
    )
}
