'use client'

import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {
    Activity,
    Bell,
    CalendarDays,
    ClipboardList,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    Search,
    Settings,
    Stethoscope,
    Users,
    WalletCards,
    X,
    type LucideIcon,
} from 'lucide-react'
import {useState, type ButtonHTMLAttributes, type ReactNode} from 'react'
import type {AuthenticatedUser, UserRole} from '@/lib/auth'
import {
    DASHBOARD_NAVIGATION,
    hasPermission,
    roleData,
    type DashboardIcon,
    type DashboardPermission,
} from '@/lib/permissions'

const icons: Record<DashboardIcon, LucideIcon> = {
    activity: Activity,
    calendar: CalendarDays,
    clipboard: ClipboardList,
    file: FileText,
    layout: LayoutDashboard,
    stethoscope: Stethoscope,
    users: Users,
    wallet: WalletCards,
}

export function PermissionAction({
    role,
    permission,
    children,
    ...buttonProps
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    role: UserRole
    permission: DashboardPermission
}) {
    if (!hasPermission(role, permission)) return null
    return <button {...buttonProps}>{children}</button>
}

function Brand() {
    return <Link href="/" className="flex items-center gap-2 text-[#123a53]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dff4f4] font-bold text-[#0e8b8c]">M</span><span className="text-xl font-bold tracking-tight">Médi<span className="text-[#0e8b8c]">Cab</span></span></Link>
}

function Sidebar({
    role,
    user,
    open,
    onClose,
    onLogout,
    isLoggingOut,
}: {
    role: UserRole
    user: AuthenticatedUser | null
    open: boolean
    onClose: () => void
    onLogout: () => void
    isLoggingOut: boolean
}) {
    const pathname = usePathname()
    const displayName = user?.nom || user?.email || roleData[role].name
    const navigation = DASHBOARD_NAVIGATION[role].filter((item) => hasPermission(role, item.permission))

    return <>
        {open && <button aria-label="Fermer le menu" onClick={onClose} className="fixed inset-0 z-30 bg-[#123a53]/20 lg:hidden" />}
        <aside className={`fixed inset-y-0 left-0 z-40 flex h-screen min-h-0 w-64 shrink-0 flex-col overflow-hidden border-r border-[#e6eef0] bg-white px-5 py-6 transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="mb-10 flex items-center justify-between"><Brand/><button aria-label="Fermer le menu" onClick={onClose} className="lg:hidden"><X size={20}/></button></div>
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#f0f9f8] p-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#bde9e5] text-sm font-bold text-[#087d7e]">{displayName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#183b50]">{displayName}</p><p className="truncate text-xs text-[#74909a]">{roleData[role].subtitle}</p></div></div>
                <nav className="space-y-1" aria-label="Navigation principale">
                    {navigation.map(({href, label, icon}) => {
                        const Icon = icons[icon]
                        const active = pathname === href || (href !== `/${role}` && pathname.startsWith(`${href}/`))
                        return <Link key={href} href={href} onClick={onClose} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? 'bg-[#e4f6f4] text-[#087e80]' : 'text-[#6c858f] hover:bg-[#f4f8f8] hover:text-[#123a53]'}`}><Icon size={18}/>{label}</Link>
                    })}
                </nav>
            </div>
            <div className="mt-auto space-y-1"><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#6c858f] hover:bg-[#f4f8f8]"><Settings size={18}/>Paramètres</button><button type="button" onClick={onLogout} disabled={isLoggingOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#6c858f] hover:bg-[#f4f8f8] disabled:opacity-60"><LogOut size={18}/>{isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'}</button></div>
        </aside>
    </>
}

function Header({role, user, title, onMenu}: {
    role: UserRole
    user: AuthenticatedUser | null
    title: string
    onMenu: () => void
}) {
    return <header className="flex items-center justify-between border-b border-[#e6eef0] bg-white px-5 py-4 md:px-8"><button aria-label="Ouvrir le menu" onClick={onMenu} className="rounded-lg p-2 text-[#55717e] lg:hidden"><Menu size={21}/></button><div className="hidden text-sm text-[#78909c] md:block">MédiCab <span className="mx-2 text-[#c4d4d8]">/</span> {title}</div><div className="ml-auto flex items-center gap-4"><button aria-label="Rechercher" className="hidden text-[#718994] sm:block"><Search size={19}/></button><button aria-label="Notifications" className="relative text-[#718994]"><Bell size={19}/><span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#ef6e5b]"/></button><div className="hidden h-8 w-px bg-[#e6eef0] sm:block"/><div className="text-right"><p className="text-sm font-semibold text-[#23465b]">{user?.nom || user?.email || roleData[role].name}</p><p className="text-xs text-[#8aa0a8]">{roleData[role].subtitle}</p></div></div></header>
}

export function DashboardLayout({role, user, children}: {
    role: UserRole
    user: AuthenticatedUser | null
    children: ReactNode
}) {
    const [open, setOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [logoutError, setLogoutError] = useState('')
    const pathname = usePathname()
    const router = useRouter()
    const activeItem = DASHBOARD_NAVIGATION[role]
        .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
        .sort((left, right) => right.href.length - left.href.length)[0]
    const title = activeItem?.label ?? roleData[role].title

    const handleLogout = async () => {
        if (isLoggingOut) return
        setIsLoggingOut(true)
        setLogoutError('')
        try {
            const response = await fetch('/api/auth/logout', {method: 'POST'})
            if (!response.ok) {
                setLogoutError('La déconnexion a échoué. Veuillez réessayer.')
                setIsLoggingOut(false)
                return
            }
            router.replace('/connexion')
            router.refresh()
        } catch {
            setLogoutError('La déconnexion a échoué. Veuillez réessayer.')
            setIsLoggingOut(false)
        }
    }

    return <div className="min-h-screen bg-[#f7fafb] text-[#183b50]"><div className="flex min-h-screen"><Sidebar role={role} user={user} open={open} onClose={() => setOpen(false)} onLogout={handleLogout} isLoggingOut={isLoggingOut}/><div className="flex min-w-0 flex-1 flex-col"><Header role={role} user={user} title={title} onMenu={() => setOpen(true)}/><main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-7 md:px-8 md:py-9">{logoutError && <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{logoutError}</p>}{children}</main></div></div></div>
}
