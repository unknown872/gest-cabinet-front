import type {UserRole} from '@/lib/auth'

export type DashboardPermission =
    | 'dashboard.view'
    | 'appointments.read.own'
    | 'appointments.create.own'
    | 'records.read.own'
    | 'prescriptions.read.own'
    | 'exams.read.own'
    | 'invoices.read.own'
    | 'invoices.pay.own'
    | 'appointments.read.assigned'
    | 'patients.read.assigned'
    | 'consultations.read.own'
    | 'consultations.manage'
    | 'prescriptions.manage'
    | 'exams.manage'
    | 'patients.read'
    | 'patients.create'
    | 'appointments.manage'
    | 'appointments.create'
    | 'invoices.manage'
    | 'users.manage'
    | 'doctors.manage'
    | 'references.manage'
    | 'audit.read'
    | 'statistics.read'

export type DashboardIcon =
    | 'activity'
    | 'calendar'
    | 'clipboard'
    | 'file'
    | 'layout'
    | 'stethoscope'
    | 'users'
    | 'wallet'

export type DashboardNavItem = {
    href: string
    label: string
    icon: DashboardIcon
    permission: DashboardPermission
}

export const roleData: Record<UserRole, {name: string; subtitle: string; title: string; intro: string}> = {
    patient: {
        name: 'Patient',
        subtitle: 'Espace Patient',
        title: 'Mon espace santé',
        intro: 'Suivi de vos soins en ligne',
    },
    medecin: {
        name: 'Médecin',
        subtitle: 'Espace Médecin',
        title: 'Tableau de bord',
        intro: 'Votre activité médicale',
    },
    secretariat: {
        name: 'Secrétariat',
        subtitle: 'Espace Secrétariat',
        title: 'Tableau de bord',
        intro: 'Gestion des activités du cabinet',
    },
    admin: {
        name: 'Administration',
        subtitle: 'Administrateur',
        title: "Console d'administration",
        intro: "Suivi de l'activité globale et de la performance du cabinet",
    },
}

export const ROLE_PERMISSIONS: Record<UserRole, readonly DashboardPermission[]> = {
    patient: [
        'dashboard.view',
        'appointments.read.own',
        'appointments.create.own',
        'records.read.own',
        'prescriptions.read.own',
        'exams.read.own',
        'consultations.read.own',
        'invoices.read.own',
        'invoices.pay.own',
    ],
    medecin: [
        'dashboard.view',
        'appointments.read.assigned',
        'patients.read.assigned',
        'consultations.manage',
        'prescriptions.manage',
        'exams.manage',
    ],
    secretariat: [
        'dashboard.view',
        'patients.read',
        'patients.create',
        'appointments.manage',
        'appointments.create',
        'invoices.manage',
    ],
    admin: [
        'dashboard.view',
        'users.manage',
        'doctors.manage',
        'references.manage',
        'invoices.manage',
        'audit.read',
        'statistics.read',
    ],
}

export const DASHBOARD_NAVIGATION: Record<UserRole, readonly DashboardNavItem[]> = {
    patient: [
        {href: '/patient', label: 'Tableau de bord', icon: 'layout', permission: 'dashboard.view'},
        {href: '/patient/rendez-vous', label: 'Mes rendez-vous', icon: 'calendar', permission: 'appointments.read.own'},
        {href: '/patient/dossier', label: 'Mon dossier médical', icon: 'file', permission: 'records.read.own'},
        {href: '/patient/prescriptions', label: 'Mes prescriptions', icon: 'clipboard', permission: 'prescriptions.read.own'},
        {href: '/patient/examens', label: 'Mes examens', icon: 'activity', permission: 'exams.read.own'},
        {href: '/patient/factures', label: 'Mes factures', icon: 'wallet', permission: 'invoices.read.own'},
    ],
    medecin: [
        {href: '/medecin', label: 'Tableau de bord', icon: 'layout', permission: 'dashboard.view'},
        {href: '/medecin/planning', label: 'Mon planning', icon: 'calendar', permission: 'appointments.read.assigned'},
        {href: '/medecin/patients', label: 'Mes patients', icon: 'users', permission: 'patients.read.assigned'},
        {href: '/medecin/consultations', label: 'Consultations', icon: 'stethoscope', permission: 'consultations.manage'},
        {href: '/medecin/prescriptions', label: 'Prescriptions', icon: 'clipboard', permission: 'prescriptions.manage'},
        {href: '/medecin/examens', label: 'Examens', icon: 'activity', permission: 'exams.manage'},
    ],
    secretariat: [
        {href: '/secretariat', label: 'Tableau de bord', icon: 'layout', permission: 'dashboard.view'},
        {href: '/secretariat/planning', label: 'Planning', icon: 'calendar', permission: 'appointments.manage'},
        {href: '/secretariat/patients', label: 'Patients', icon: 'users', permission: 'patients.read'},
        {href: '/secretariat/rendez-vous', label: 'Rendez-vous', icon: 'clipboard', permission: 'appointments.manage'},
        {href: '/secretariat/facturation', label: 'Facturation', icon: 'wallet', permission: 'invoices.manage'},
    ],
    admin: [
        {href: '/admin', label: 'Tableau de bord', icon: 'layout', permission: 'dashboard.view'},
        {href: '/admin/utilisateurs', label: 'Utilisateurs', icon: 'users', permission: 'users.manage'},
        {href: '/admin/medecins', label: 'Médecins', icon: 'stethoscope', permission: 'doctors.manage'},
        {href: '/admin/referentiels', label: 'Référentiels', icon: 'file', permission: 'references.manage'},
        {href: '/admin/facturation', label: 'Facturation', icon: 'wallet', permission: 'invoices.manage'},
        {href: '/admin/journal', label: "Journal d'activité", icon: 'activity', permission: 'audit.read'},
        {href: '/admin/statistiques', label: 'Statistiques', icon: 'activity', permission: 'statistics.read'},
    ],
}

export function hasPermission(role: UserRole, permission: DashboardPermission): boolean {
    return ROLE_PERMISSIONS[role].includes(permission)
}

function matchesDashboardPath(href: string, pathname: string): boolean {
    const isRoleHome = href.split('/').filter(Boolean).length === 1
    return pathname === href || (!isRoleHome && pathname.startsWith(`${href}/`))
}

export function getDashboardPagePermission(pathname: string): DashboardPermission | null {
    const items = Object.values(DASHBOARD_NAVIGATION).flat()
    const matchingItem = items
        .filter((item) => matchesDashboardPath(item.href, pathname))
        .sort((left, right) => right.href.length - left.href.length)[0]
    return matchingItem?.permission ?? null
}

export function canAccessDashboardPath(role: UserRole, pathname: string): boolean {
    const permission = getDashboardPagePermission(pathname)
    return permission !== null && hasPermission(role, permission)
}

export function getDashboardPageTitle(role: UserRole, pathname: string): string {
    const item = DASHBOARD_NAVIGATION[role]
        .filter((entry) => matchesDashboardPath(entry.href, pathname))
        .sort((left, right) => right.href.length - left.href.length)[0]
    return item?.label ?? roleData[role].title
}
