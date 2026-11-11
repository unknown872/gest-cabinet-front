import {cookies} from 'next/headers'
import {NextRequest, NextResponse} from 'next/server'
import {getJwtClaims, SESSION_COOKIE, USER_COOKIE} from '@/lib/auth'

const backendBaseUrl = process.env.BACKEND_API_BASE_URL ?? 'http://localhost:8080'
const unavailableMessage = 'Impossible de contacter le serveur. Veuillez réessayer plus tard.'

type RouteContext = {
    params: Promise<{path: string[]}>
}

async function proxyBackendRequest(request: NextRequest, context: RouteContext) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value
    if (!token) {
        return NextResponse.json(
            {message: 'Votre session a expiré. Veuillez vous reconnecter.'},
            {status: 401, headers: {'Cache-Control': 'no-store'}},
        )
    }

    const expiresAt = getJwtClaims(token)?.exp
    if (typeof expiresAt === 'number' && expiresAt * 1000 <= Date.now()) {
        const response = NextResponse.json(
            {message: 'Votre session a expiré. Veuillez vous reconnecter.'},
            {status: 401, headers: {'Cache-Control': 'no-store'}},
        )
        for (const name of [SESSION_COOKIE, USER_COOKIE]) {
            response.cookies.set(name, '', {path: '/', maxAge: 0})
        }
        return response
    }

    const {path} = await context.params
    const backendPath = path.map((segment) => encodeURIComponent(segment)).join('/')
    const backendUrl = new URL(`/api/${backendPath}`, backendBaseUrl)
    backendUrl.search = request.nextUrl.search

    let backendResponse: Response
    try {
        backendResponse = await fetch(backendUrl, {
            method: request.method,
            headers: {
                Authorization: `Bearer ${token}`,
                ...(request.headers.get('content-type')
                    ? {'Content-Type': request.headers.get('content-type') as string}
                    : {}),
                ...(request.headers.get('accept') ? {Accept: request.headers.get('accept') as string} : {}),
            },
            ...(['GET', 'HEAD'].includes(request.method) ? {} : {body: await request.arrayBuffer()}),
            cache: 'no-store',
        })
    } catch (error) {
        console.error('Authenticated API proxy request failed:', error instanceof Error ? error.name : 'UnknownError')
        return NextResponse.json({message: unavailableMessage}, {status: 503})
    }

    if (backendResponse.status === 401) {
        const response = NextResponse.json(
            {message: 'Votre session a expiré. Veuillez vous reconnecter.'},
            {status: 401, headers: {'Cache-Control': 'no-store'}},
        )
        for (const name of [SESSION_COOKIE, USER_COOKIE]) {
            response.cookies.set(name, '', {path: '/', maxAge: 0})
        }
        return response
    }

    if (backendResponse.status === 403) {
        return NextResponse.json(
            {message: 'Vous ne disposez pas des autorisations nécessaires.'},
            {status: 403, headers: {'Cache-Control': 'no-store'}},
        )
    }

    if (backendResponse.status >= 500) {
        console.error('Authenticated API backend returned a server error.')
        return NextResponse.json({message: unavailableMessage}, {status: 502, headers: {'Cache-Control': 'no-store'}})
    }

    const responseBody = await backendResponse.arrayBuffer()
    return new NextResponse(responseBody.byteLength ? responseBody : null, {
        status: backendResponse.status,
        headers: {
            'Content-Type': backendResponse.headers.get('Content-Type') ?? 'application/json',
            'Cache-Control': 'no-store',
        },
    })
}

export const GET = proxyBackendRequest
export const POST = proxyBackendRequest
export const PUT = proxyBackendRequest
export const PATCH = proxyBackendRequest
export const DELETE = proxyBackendRequest
