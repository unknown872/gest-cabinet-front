import {NextResponse} from 'next/server'
import {
    findAccessToken,
    getJwtClaims,
    getLoginUser,
    SESSION_COOKIE,
    USER_COOKIE,
} from '@/lib/auth'

const backendBaseUrl = process.env.BACKEND_API_BASE_URL ?? 'http://localhost:8080'
const unavailableMessage = 'Impossible de contacter le serveur. Veuillez réessayer plus tard.'

export async function POST(request: Request) {
    let backendResponse: Response
    try {
        backendResponse = await fetch(`${backendBaseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: await request.text(),
            cache: 'no-store',
        })
    } catch (error) {
        console.error('Login API proxy request failed:', error instanceof Error ? error.name : 'UnknownError')
        return Response.json({message: unavailableMessage}, {status: 503})
    }

    if (!backendResponse.ok) {
        if (backendResponse.status === 401) {
            return Response.json(
                {message: 'Email ou mot de passe incorrect. Veuillez réessayer.'},
                {status: 401},
            )
        }
        if (backendResponse.status >= 500) {
            console.error('Login API backend returned a server error.')
            return Response.json({message: unavailableMessage}, {status: 503})
        }
        return Response.json(
            {message: 'Une erreur inattendue est survenue. Veuillez réessayer.'},
            {status: 400},
        )
    }

    let body: unknown
    try {
        body = await backendResponse.json()
    } catch {
        console.error('Login API backend returned an invalid response.')
        return Response.json(
            {message: 'Une erreur inattendue est survenue. Veuillez réessayer.'},
            {status: 502},
        )
    }

    const record = typeof body === 'object' && body !== null
        ? body as Record<string, unknown>
        : null
    const token = findAccessToken(record)
    if (!token) {
        console.error('Login API backend response did not contain an access token.')
        return Response.json(
            {message: 'Une erreur inattendue est survenue. Veuillez réessayer.'},
            {status: 502},
        )
    }

    const user = getLoginUser(body, token)
    if (!user) {
        console.error('Login API backend response did not contain a recognized user role.')
        return Response.json(
            {message: 'Une erreur inattendue est survenue. Veuillez réessayer.'},
            {status: 502},
        )
    }

    const response = NextResponse.json({user}, {headers: {'Cache-Control': 'no-store'}})
    const claims = getJwtClaims(token)
    if (!claims || typeof claims.exp !== 'number' || !Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now()) {
        console.error('Login API backend returned an invalid or expired JWT.')
        return Response.json(
            {message: 'Une erreur inattendue est survenue. Veuillez réessayer.'},
            {status: 502},
        )
    }
    const maxAge = Math.floor(claims.exp - Date.now() / 1000)
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge,
    }

    response.cookies.set(SESSION_COOKIE, token, cookieOptions)
    response.cookies.set(USER_COOKIE, JSON.stringify(user), cookieOptions)
    return response
}
