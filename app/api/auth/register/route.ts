const backendBaseUrl = process.env.BACKEND_API_BASE_URL ?? 'http://localhost:8080'

export async function POST(request: Request) {
    try {
        const backendResponse = await fetch(`${backendBaseUrl}/api/auth/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: await request.text(),
            cache: 'no-store',
        })

        const responseBody = await backendResponse.text()
        return new Response(responseBody || null, {
            status: backendResponse.status,
            headers: {
                'Content-Type': backendResponse.headers.get('Content-Type') ?? 'application/json',
            },
        })
    } catch (error) {
        console.error('Registration API proxy request failed:', error)
        return Response.json(
            {message: 'Le serveur d’inscription est inaccessible. Vérifiez sa disponibilité.'},
            {status: 502},
        )
    }
}
