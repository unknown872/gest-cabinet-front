import {cookies} from 'next/headers'
import {
    getJwtClaims,
    normalizeRole,
    SESSION_COOKIE,
    USER_COOKIE,
    type AuthenticatedUser,
} from '@/lib/auth'

function isExpired(claims: Record<string, unknown> | null): boolean {
    const expiresAt = claims?.exp
    return typeof expiresAt === 'number' && expiresAt * 1000 <= Date.now()
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null

    const claims = getJwtClaims(token)
    if (isExpired(claims)) return null

    const storedUser = cookieStore.get(USER_COOKIE)?.value
    if (storedUser) {
        try {
            const user: unknown = JSON.parse(storedUser)
            if (typeof user === 'object' && user !== null && 'role' in user) {
                const record = user as Record<string, unknown>
                const role = normalizeRole(claims) ?? normalizeRole(record.role)
                if (role) {
                    return {
                        identifiant: typeof record.identifiant === 'string' ? record.identifiant : null,
                        nom: typeof record.nom === 'string' ? record.nom : null,
                        email: typeof record.email === 'string' ? record.email : null,
                        role,
                    }
                }
            }
        } catch {
            return null
        }
    }

    const role = normalizeRole(claims)
    if (!role) return null

    const id = claims?.sub ?? claims?.id ?? claims?.userId
    const nom = claims?.name ?? claims?.nom
    const email = claims?.email
    return {
        identifiant: typeof id === 'string' || typeof id === 'number' ? String(id) : null,
        nom: typeof nom === 'string' ? nom : null,
        email: typeof email === 'string' ? email : null,
        role,
    }
}
