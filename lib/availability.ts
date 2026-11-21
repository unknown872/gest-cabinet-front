import {unwrapApiResponse} from '@/lib/api-response'

export type Availability = {
    id: number
    medecinNomComplet: string
    dateJour: string
    heureDebut: string
    heureFin: string
    dureeCreneauMinutes: number
}

export type AvailabilityInput = {
    dateJour: string
    heureDebut: string
    heureFin: string
    dureeCreneauMinutes: number
}

export class ApiError extends Error {
    status: number

    constructor(message: string, status: number) {
        super(message)
        this.name = 'ApiError'
        this.status = status
    }
}

const BASE_URL = '/api/backend/medecin/disponibilites'
const GENERIC_ERROR = 'Une erreur est survenue. Veuillez réessayer.'

async function readErrorMessage(response: Response): Promise<string> {
    try {
        const body: unknown = await response.json()
        if (typeof body === 'object' && body !== null && 'message' in body) {
            const {message} = body as {message: unknown}
            if (typeof message === 'string' && message) return message
        }
    } catch {
        // corps vide ou non JSON : message générique
    }
    return GENERIC_ERROR
}

async function request(url: string, init?: RequestInit): Promise<Response> {
    let response: Response
    try {
        response = await fetch(url, {
            ...init,
            headers: {'Content-Type': 'application/json', Accept: 'application/json'},
        })
    } catch {
        throw new ApiError('Impossible de contacter le serveur. Veuillez réessayer plus tard.', 0)
    }
    if (!response.ok) throw new ApiError(await readErrorMessage(response), response.status)
    return response
}

export async function listAvailabilities(): Promise<Availability[]> {
    const response = await request(BASE_URL)
    const body: unknown = unwrapApiResponse(await response.json())
    if (!Array.isArray(body)) throw new ApiError('La réponse du serveur est invalide.', response.status)
    return body as Availability[]
}

export async function createAvailability(input: AvailabilityInput): Promise<Availability> {
    const response = await request(BASE_URL, {method: 'POST', body: JSON.stringify(input)})
    const body: unknown = unwrapApiResponse(await response.json())
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        throw new ApiError('La réponse du serveur est invalide.', response.status)
    }
    return body as Availability
}

export async function updateAvailability(id: number, input: AvailabilityInput): Promise<Availability> {
    const response = await request(`${BASE_URL}/${id}`, {method: 'PUT', body: JSON.stringify(input)})
    const body: unknown = unwrapApiResponse(await response.json())
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        throw new ApiError('La réponse du serveur est invalide.', response.status)
    }
    return body as Availability
}

export async function deleteAvailability(id: number): Promise<void> {
    await request(`${BASE_URL}/${id}`, {method: 'DELETE'})
}

/** "08:30:00" -> "08:30" */
export function toHourMinute(time: string): string {
    return time.slice(0, 5)
}

/** "08:30" ou "08:30:00" -> 510 (minutes depuis minuit) */
export function toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
}

export function validateAvailability(input: AvailabilityInput): string | null {
    if (!input.dateJour || !input.heureDebut || !input.heureFin) {
        return "La date, l'heure de début et l'heure de fin sont obligatoires."
    }
    if (!Number.isInteger(input.dureeCreneauMinutes) || input.dureeCreneauMinutes <= 0) {
        return "La durée d'un créneau doit être strictement supérieure à 0 minute."
    }
    if (input.heureDebut >= input.heureFin) {
        return "L'heure de début doit être strictement antérieure à l'heure de fin."
    }
    return null
}
