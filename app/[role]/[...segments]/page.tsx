import {notFound, redirect} from 'next/navigation'
import {DashboardLayout} from '@/components/dashboard-layout'
import {getCurrentUser} from '@/lib/session'
import {getDashboardPagePermission, getDashboardPageTitle, hasPermission} from '@/lib/permissions'
import {normalizeRole} from '@/lib/auth'

type DashboardRouteProps = {
    params: Promise<{role: string; segments: string[]}>
}

export default async function DashboardRoutePage({params}: DashboardRouteProps) {
    const {role: roleSegment, segments} = await params
    const role = normalizeRole(roleSegment)
    if (!role || roleSegment !== role) notFound()

    const pathname = `/${[roleSegment, ...segments].join('/')}`
    const requiredPermission = getDashboardPagePermission(pathname)
    if (!requiredPermission) notFound()

    const user = await getCurrentUser()
    if (!user) redirect(`/connexion?returnTo=${encodeURIComponent(pathname)}`)
    if (user.role !== role || !hasPermission(user.role, requiredPermission)) redirect('/403')

    const title = getDashboardPageTitle(role, pathname)
    return <DashboardLayout role={role} user={user}>
        <section className="rounded-2xl border border-[#e7eef0] bg-white p-6 shadow-[0_4px_18px_rgba(30,76,95,0.03)]">
            <h1 className="text-2xl font-bold tracking-tight text-[#183b50]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-[#78909c]">
                Cet espace est prêt à accueillir les fonctionnalités correspondant à vos autorisations.
            </p>
        </section>
    </DashboardLayout>
}
