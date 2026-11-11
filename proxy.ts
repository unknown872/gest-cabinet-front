import {NextRequest, NextResponse} from 'next/server'
import {
    getJwtClaims,
    getRoleRoute,
    normalizeRole,
    SESSION_COOKIE,
    USER_COOKIE,
    type UserRole,
} from '@/lib/auth'
import {canAccessDashboardPath, getDashboardPagePermission} from '@/lib/permissions'

const roleRoots: Record<string, UserRole> = {
    patient: 'patient',
    medecin: 'medecin',
    secretariat: 'secretariat',
    admin: 'admin',
}

function clearSession(response: NextResponse) {
    response.cookies.set(SESSION_COOKIE, '', {path: '/', maxAge: 0})
    response.cookies.set(USER_COOKIE, '', {path: '/', maxAge: 0})
    return response
}

function sessionRole(request: NextRequest, claims: Record<string, unknown> | null): UserRole | null {
    const claimRole = normalizeRole(claims)
    if (claimRole) return claimRole

    try {
        const storedUser: unknown = JSON.parse(request.cookies.get(USER_COOKIE)?.value ?? '')
        return typeof storedUser === 'object' && storedUser !== null && 'role' in storedUser
            ? normalizeRole(storedUser.role)
            : null
    } catch {
        return null
    }
}

function redirectToLogin(request: NextRequest, clearCookies: boolean) {
    const loginUrl = new URL('/connexion', request.url)
    const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`
    if (returnTo !== '/') loginUrl.searchParams.set('returnTo', returnTo)
    const response = NextResponse.redirect(loginUrl)
    return clearCookies ? clearSession(response) : response
}

export function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl
    const isPublicPage = pathname === '/connexion' || pathname === '/inscription'
    const token = request.cookies.get(SESSION_COOKIE)?.value
    const claims = token ? getJwtClaims(token) : null
    const expiresAt = claims?.exp
    const isExpired = typeof expiresAt === 'number' && expiresAt * 1000 <= Date.now()
    const role = token && !isExpired ? sessionRole(request, claims) : null
    const isAuthenticated = Boolean(token && !isExpired && role)

    if (isPublicPage) {
        return isAuthenticated
            ? NextResponse.redirect(new URL(getRoleRoute(role as UserRole), request.url))
            : NextResponse.next()
    }

    if (pathname === '/') {
        return isAuthenticated
            ? NextResponse.redirect(new URL(getRoleRoute(role as UserRole), request.url))
            : NextResponse.redirect(new URL('/connexion', request.url))
    }

    if (!isAuthenticated) return redirectToLogin(request, Boolean(token && isExpired))

    const requestedRole = roleRoots[pathname.split('/')[1]]
    if (requestedRole && requestedRole !== role) {
        return NextResponse.redirect(new URL('/403', request.url))
    }
    if (requestedRole && role && getDashboardPagePermission(pathname) && !canAccessDashboardPath(role, pathname)) {
        return NextResponse.redirect(new URL('/403', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
