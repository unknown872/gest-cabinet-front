import {redirect} from 'next/navigation'
import {DashboardLayout} from '@/components/dashboard-layout'
import {PatientAppointments} from '@/components/patient-appointments'
import {getCurrentUser} from '@/lib/session'

const PATHNAME = '/patient/rendez-vous'

export default async function PatientAppointmentsPage() {
    const user = await getCurrentUser()
    if (!user) redirect(`/connexion?returnTo=${encodeURIComponent(PATHNAME)}`)
    if (user.role !== 'patient') redirect('/403')

    return (
        <DashboardLayout role="patient" user={user}>
            <PatientAppointments />
        </DashboardLayout>
    )
}
