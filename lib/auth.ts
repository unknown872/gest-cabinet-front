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

function getErrorMessage(body: unknown, status: number) {
    if (typeof body === 'object' && body !== null) {
        if ('message' in body && typeof body.message === 'string') return body.message
        if ('error' in body && typeof body.error === 'string') return body.error
    }

    return `L’inscription a échoué (${status}).`
}

export async function registerUser(payload: RegisterPayload) {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
    })

    const body: unknown = await response.json().catch(() => null)
    if (!response.ok) {
        throw new Error(getErrorMessage(body, response.status))
    }
}
