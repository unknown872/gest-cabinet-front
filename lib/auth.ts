export type UserRole = 'patient' | 'medecin' | 'secretariat' | 'admin'

export type AuthenticatedUser = {
    identifiant: string | null
    nom: string | null
    email: string | null
    role: UserRole
}

export type RegisterPayload = {
    nom: string
    prenom: string
    email: string
    motDePasse: string
    genre: 'MASCULIN' | 'FEMININ'
    adresse: string
    dateNaissance: string
    telephone: string
}

export type LoginPayload = {
    email: string
    motDePasse: string
}

export type LoginResponse = {
    user: AuthenticatedUser
}

export const SESSION_COOKIE = 'medicab_session'
export const USER_COOKIE = 'medicab_user'

const ROLE_ROUTE_MAP: Record<UserRole, string> = {
    patient: '/patient',
    medecin: '/medecin',
    secretariat: '/secretariat',
    admin: '/admin',
}

export function normalizeRole(value: unknown): UserRole | null {
    if (Array.isArray(value)) {
        for (const item of value) {
            const role = normalizeRole(item)
            if (role) return role
        }
        return null
    }

    if (typeof value === 'object' && value !== null) {
        const record = value as Record<string, unknown>
        for (const key of ['role', 'roles', 'authorities', 'data', 'user', 'utilisateur', 'account', 'profile', 'realm_access']) {
            if (key in record) {
                const role = normalizeRole(record[key])
                if (role) return role
            }
        }
        return null
    }

    if (typeof value !== 'string') return null

    const normalized = value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (normalized.includes('admin')) return 'admin'
    if (normalized.includes('secretariat') || normalized.includes('secretaire') || normalized.includes('secretary')) {
        return 'secretariat'
    }
    if (normalized.includes('medecin') || normalized.includes('doctor') || normalized.includes('docteur')) {
        return 'medecin'
    }
    if (normalized.includes('patient')) return 'patient'

    return null
}

export function getRoleRoute(role: UserRole): string {
    return ROLE_ROUTE_MAP[role]
}

export function getSafeReturnTo(value: string | undefined): string | null {
    if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
    if (value.startsWith('/connexion') || value.startsWith('/inscription') || value.startsWith('/api/')) return null
    return value
}

export function getJwtClaims(token: string): Record<string, unknown> | null {
    try {
        const payload = token.split('.')[1]
        if (!payload) return null

        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
        const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
        const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0))
        const claims: unknown = JSON.parse(new TextDecoder().decode(bytes))
        return typeof claims === 'object' && claims !== null
            ? claims as Record<string, unknown>
            : null
    } catch {
        return null
    }
}

export function findAccessToken(value: unknown, depth = 0): string | null {
    if (depth > 4 || typeof value !== 'object' || value === null) return null

    const record = value as Record<string, unknown>
    for (const key of ['token', 'accessToken', 'jwt', 'access_token']) {
        const token = record[key]
        if (typeof token === 'string' && token.trim()) return token
    }

    for (const key of ['data', 'user', 'utilisateur', 'account']) {
        const token = findAccessToken(record[key], depth + 1)
        if (token) return token
    }
    return null
}

function findValue(records: Record<string, unknown>[], keys: string[]): unknown {
    for (const record of records) {
        for (const key of keys) {
            const value = record[key]
            if (typeof value === 'string' || typeof value === 'number') return value
        }
    }
    return undefined
}

function getUserRecords(value: unknown, depth = 0): Record<string, unknown>[] {
    if (depth > 3 || typeof value !== 'object' || value === null || Array.isArray(value)) return []

    const record = value as Record<string, unknown>
    return [
        record,
        ...['data', 'user', 'utilisateur', 'account', 'profile']
            .flatMap((key) => getUserRecords(record[key], depth + 1)),
    ]
}

export function getLoginUser(body: unknown, token: string): AuthenticatedUser | null {
    const claims = getJwtClaims(token)
    const records = [...getUserRecords(body), ...(claims ? getUserRecords(claims) : [])]
    const role = records.map(normalizeRole).find((candidate) => candidate !== null) ?? null
    if (!role) return null

    const id = findValue(records, ['id', 'userId', 'identifiant', 'sub', 'username', 'login'])
    const nom = findValue(records, ['nomComplet', 'fullName', 'name', 'nom', 'username'])
    const prenom = findValue(records, ['prenom', 'firstName', 'given_name'])
    const nomFamille = findValue(records, ['nom', 'lastName', 'family_name'])
    const email = findValue(records, ['email', 'mail'])
    const displayName = nom ?? [prenom, nomFamille].filter(Boolean).join(' ')
    const userIdentifier = id ?? email

    return {
        identifiant: userIdentifier === undefined ? null : String(userIdentifier),
        nom: displayName ? String(displayName) : null,
        email: email === undefined ? null : String(email),
        role,
    }
}

function getLoginError(status: number): string {
    if (status === 401) return 'Email ou mot de passe incorrect. Veuillez réessayer.'
    if (status === 502 || status === 503 || status >= 500) {
        return 'Impossible de contacter le serveur. Veuillez réessayer plus tard.'
    }
    return 'Une erreur inattendue est survenue. Veuillez réessayer.'
}

export async function registerUser(payload: RegisterPayload) {
    let response: Response
    try {
        response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload),
        })
    } catch {
        throw new Error('Impossible de contacter le serveur. Veuillez réessayer plus tard.')
    }

    if (!response.ok) {
        throw new Error(response.status >= 500
            ? 'Impossible de contacter le serveur. Veuillez réessayer plus tard.'
            : 'Impossible de créer ce compte. Vérifiez les informations saisies puis réessayez.')
    }
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
    let response: Response
    try {
        response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload),
        })
    } catch {
        throw new Error('Impossible de contacter le serveur. Veuillez réessayer plus tard.')
    }

    if (!response.ok) throw new Error(getLoginError(response.status))

    let body: unknown
    try {
        body = await response.json()
    } catch {
        throw new Error('Une erreur inattendue est survenue. Veuillez réessayer.')
    }

    const record = typeof body === 'object' && body !== null
        ? body as Record<string, unknown>
        : null
    const userValue = record?.user
    if (typeof userValue !== 'object' || userValue === null) {
        throw new Error('Une erreur inattendue est survenue. Veuillez réessayer.')
    }

    const userRecord = userValue as Record<string, unknown>
    const role = normalizeRole(userRecord.role)
    if (!role) throw new Error('Une erreur inattendue est survenue. Veuillez réessayer.')
    return {
        user: {
            identifiant: typeof userRecord.identifiant === 'string' ? userRecord.identifiant : null,
            nom: typeof userRecord.nom === 'string' ? userRecord.nom : null,
            email: typeof userRecord.email === 'string' ? userRecord.email : null,
            role,
        },
    }
}
