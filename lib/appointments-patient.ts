import {ApiError} from '@/lib/availability'
import {unwrapApiResponse} from '@/lib/api-response'

export type DoctorSpecialite = {
    id: number
    code: string | null
    libelle: string | null
    description: string | null
}

export type DoctorAvailabilitySlot = {
    id: number
    dateJour: string
    heureDebut: string
    heureFin: string
    dureeCreneauMinutes: number
}

export type Doctor = {
    id: number
    nom: string
    prenom: string
    email: string
    telephone: string
    codeMedecin: string | null
    actif: boolean
    specialites?: DoctorSpecialite[] | null
    disponibilites?: DoctorAvailabilitySlot[] | null
}

export type AppointmentStatus =
    | 'PLANIFIE'
    | 'CONFIRME'
    | 'HONORE_PRESENT'
    | 'ABSENT'
    | 'ANNULE'

export type PatientAppointment = {
    id: number
    dateHeure: string
    motif: string | null
    notes: string | null
    statut: AppointmentStatus
    nomMedecin: string
    prenomMedecin: string
}

export type CreateAppointmentInput = {
    medecinId: number
    dateHeure: string
    motif: string
    notes?: string
}

const GENERIC_ERROR = 'Une erreur est survenue. Veuillez réessayer.'

async function readErrorMessage(response: Response): Promise<string> {
    try {
        const body: unknown = await response.json()
        if (typeof body === 'object' && body !== null && 'message' in body) {
            const {message} = body as {message: unknown}
            if (typeof message === 'string' && message.trim()) return message
        }
    } catch {
        // corps vide ou non JSON
    }
    return GENERIC_ERROR
}

async function request(url: string, init?: RequestInit): Promise<Response> {
    let response: Response
    try {
        response = await fetch(url, {
            ...init,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(init?.headers ?? {}),
            },
        })
    } catch {
        throw new ApiError('Impossible de contacter le serveur. Veuillez réessayer plus tard.', 0)
    }
    if (!response.ok) {
        throw new ApiError(await readErrorMessage(response), response.status)
    }
    return response
}

async function readResponseData(response: Response): Promise<unknown> {
    try {
        return unwrapApiResponse(await response.json())
    } catch {
        throw new ApiError('La réponse du serveur est invalide.', response.status)
    }
}

async function readResponseList<T>(response: Response): Promise<T[]> {
    const data = await readResponseData(response)
    if (!Array.isArray(data)) throw new ApiError('La réponse du serveur est invalide.', response.status)
    return data as T[]
}

async function readResponseObject<T>(response: Response): Promise<T> {
    const data = await readResponseData(response)
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new ApiError('La réponse du serveur est invalide.', response.status)
    }
    return data as T
}

/**
 * GET /api/backend/medecins
 * Récupère la liste des médecins du cabinet avec leurs spécialités et disponibilités déclarées.
 */
export async function listDoctors(): Promise<Doctor[]> {
    const response = await request('/api/backend/medecins')
    return readResponseList<Doctor>(response)
}

/**
 * GET /api/backend/rendez-vous/creneaux-disponibles?medecinId=X&date=YYYY-MM-DD
 * Récupère les créneaux horaires libres (LocalDateTime ISO) pour un médecin et une date donnés.
 */
export async function listAvailableSlots(medecinId: number, date: string): Promise<string[]> {
    const params = new URLSearchParams({
        medecinId: String(medecinId),
        date,
    })
    const response = await request(`/api/backend/rendez-vous/creneaux-disponibles?${params.toString()}`)
    return readResponseList<string>(response)
}

/**
 * GET /api/backend/rendez-vous
 * Récupère tous les rendez-vous du patient connecté.
 */
export async function listMyAppointments(): Promise<PatientAppointment[]> {
    const response = await request('/api/backend/rendez-vous')
    return readResponseList<PatientAppointment>(response)
}

/**
 * POST /api/backend/rendez-vous
 * Crée une demande de rendez-vous pour le patient connecté.
 */
export async function createAppointment(input: CreateAppointmentInput): Promise<PatientAppointment> {
    const response = await request('/api/backend/rendez-vous', {
        method: 'POST',
        body: JSON.stringify(input),
    })
    return readResponseObject<PatientAppointment>(response)
}

/**
 * PUT /api/backend/rendez-vous/{id}
 * Modifie ou reporte un rendez-vous existant du patient connecté (jusqu'à 24h avant, RG06).
 */
export async function updateMyAppointment(
    id: number,
    input: CreateAppointmentInput,
): Promise<PatientAppointment> {
    const response = await request(`/api/backend/rendez-vous/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
    })
    return readResponseObject<PatientAppointment>(response)
}

/**
 * PATCH /api/backend/rendez-vous/{id}/annuler
 * Annule un rendez-vous du patient connecté (jusqu'à 24h avant, RG06).
 */
export async function cancelMyAppointment(id: number): Promise<void> {
    await request(`/api/backend/rendez-vous/${id}/annuler`, {
        method: 'PATCH',
    })
}
