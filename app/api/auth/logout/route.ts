import {cookies} from 'next/headers'
import {NextResponse} from 'next/server'
import {SESSION_COOKIE, USER_COOKIE} from '@/lib/auth'

const backendBaseUrl = process.env.BACKEND_API_BASE_URL ?? 'http://localhost:8080'

export async function POST() {
    const token = (await cookies()).get(SESSION_COOKIE)?.value
    if (token) {
        let backendResponse: Response
        try {
            backendResponse = await fetch(`${backendBaseUrl}/api/auth/logout`, {
                method: 'POST',
                headers: {Authorization: `Bearer ${token}`},
                cache: 'no-store',
            })
        } catch (error) {
            console.error('Logout API request failed:', error instanceof Error ? error.name : 'UnknownError')
            return NextResponse.json(
                {message: 'Impossible de contacter le serveur. Veuillez réessayer plus tard.'},
                {status: 503, headers: {'Cache-Control': 'no-store'}},
            )
        }

        if (!backendResponse.ok && backendResponse.status !== 401) {
            console.error('Logout API backend returned an error.')
            return NextResponse.json(
                {message: 'La déconnexion a échoué. Veuillez réessayer.'},
                {status: backendResponse.status >= 500 ? 502 : backendResponse.status,
                    headers: {'Cache-Control': 'no-store'}},
            )
        }
    }

    const response = NextResponse.json({success: true}, {headers: {'Cache-Control': 'no-store'}})
    for (const name of [SESSION_COOKIE, USER_COOKIE]) {
        response.cookies.set(name, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        })
    }
    return response
}
