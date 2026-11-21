import {redirect} from 'next/navigation'
import {DashboardLayout} from '@/components/dashboard-layout'
import {SecretariatWeekPlanning} from '@/components/secretariat-week-planning'
import {getCurrentUser} from '@/lib/session'

const PATHNAME = '/secretariat/planning'

export default async function SecretariatPlanningPage() {
    const user = await getCurrentUser()
    if (!user) redirect(`/connexion?returnTo=${encodeURIComponent(PATHNAME)}`)
    if (user.role !== 'secretariat') redirect('/403')

    return (
        <DashboardLayout role="secretariat" user={user}>
            <SecretariatWeekPlanning/>
        </DashboardLayout>
    )
}
