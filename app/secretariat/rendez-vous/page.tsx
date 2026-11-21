import {redirect} from 'next/navigation'
import {DashboardLayout} from '@/components/dashboard-layout'
import {SecretariatAppointments} from '@/components/secretariat-appointments'
import {getCurrentUser} from '@/lib/session'

const PATHNAME = '/secretariat/rendez-vous'

export default async function SecretariatAppointmentsPage() {
    const user = await getCurrentUser()
    if (!user) redirect(`/connexion?returnTo=${encodeURIComponent(PATHNAME)}`)
    if (user.role !== 'secretariat') redirect('/403')

    return (
        <DashboardLayout role="secretariat" user={user}>
            <SecretariatAppointments/>
        </DashboardLayout>
    )
}
