import {unwrapApiResponse} from '@/lib/api-response'

export type AppointmentStatus = 'PLANIFIE' | 'CONFIRME' | 'HONORE_PRESENT' | 'ABSENT' | 'ANNULE'

export type Appointment = {
    id: number
    dateHeure: string
    motif: string | null
    statut: AppointmentStatus
    nomMedecin: string
    prenomMedecin: string
    nomPatient: string
    prenomPatient: string
}

const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
    PLANIFIE: 'À confirmer',
    CONFIRME: 'Confirmé',
    HONORE_PRESENT: 'Présent',
    ABSENT: 'Absent',
    ANNULE: 'Annulé',
}

const APPOINTMENT_STATUS_CLASSES: Record<AppointmentStatus, string> = {
    PLANIFIE: 'bg-[#fff5dd] text-[#c28a2b]',
    CONFIRME: 'bg-[#e4f6f4] text-[#0b898a]',
    HONORE_PRESENT: 'bg-[#eaf1fb] text-[#5680b9]',
    ABSENT: 'bg-[#fff0e9] text-[#d77652]',
    ANNULE: 'bg-[#f1f3f4] text-[#718994]',
}

export function getAppointmentStatusLabel(status: AppointmentStatus): string {
    return APPOINTMENT_STATUS_LABELS[status]
}

export function getAppointmentStatusClasses(status: AppointmentStatus): string {
    return APPOINTMENT_STATUS_CLASSES[status]
}

export function formatAppointmentDateTime(dateTime: string): string {
    const [date, time] = dateTime.split('T')
    if (!date || !time) return dateTime

    const [year, month, day] = date.split('-').map(Number)
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'})
        .format(new Date(year, month - 1, day))
    return `${formattedDate} à ${time.slice(0, 5)}`
}

export class AppointmentApiError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'AppointmentApiError'
    }
}

async function listAppointments(url: string, signal?: AbortSignal): Promise<Appointment[]> {
    let response: Response
    try {
        response = await fetch(url, {
            headers: {Accept: 'application/json'},
            cache: 'no-store',
            signal,
        })
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error
        throw new AppointmentApiError('Impossible de contacter le serveur. Veuillez réessayer plus tard.')
    }

    if (!response.ok) {
        let message = 'Impossible de charger le planning. Veuillez réessayer.'
        try {
            const body: unknown = await response.json()
            if (typeof body === 'object' && body !== null && 'message' in body) {
                const {message: responseMessage} = body as {message: unknown}
                if (typeof responseMessage === 'string' && responseMessage) message = responseMessage
            }
        } catch {
            // Le serveur peut renvoyer une réponse sans corps JSON.
        }
        throw new AppointmentApiError(message)
    }

    let body: unknown
    try {
        body = unwrapApiResponse(await response.json())
    } catch {
        throw new AppointmentApiError('La réponse du serveur est invalide.')
    }

    if (!Array.isArray(body)) throw new AppointmentApiError('La réponse du serveur est invalide.')
    return body as Appointment[]
}

export function listAppointmentsForDay(date: string, signal?: AbortSignal): Promise<Appointment[]> {
    return listAppointments(`/api/backend/rendez-vous/secretaire/jour?date=${encodeURIComponent(date)}`, signal)
}

export function listAllAppointments(signal?: AbortSignal): Promise<Appointment[]> {
    return listAppointments('/api/backend/rendez-vous/secretaire', signal)
}

export async function changeAppointmentStatus(
    appointmentId: number,
    action: 'confirm' | 'cancel',
): Promise<AppointmentStatus> {
    const url = action === 'confirm'
        ? `/api/backend/rendez-vous/${appointmentId}/confirmer`
        : `/api/backend/rendez-vous/secretaire/${appointmentId}/annuler`
    const expectedStatus: AppointmentStatus = action === 'confirm' ? 'CONFIRME' : 'ANNULE'

    let response: Response
    try {
        response = await fetch(url, {
            method: 'PATCH',
            headers: {Accept: 'application/json'},
            cache: 'no-store',
        })
    } catch {
        throw new AppointmentApiError('Impossible de contacter le serveur. Veuillez réessayer plus tard.')
    }

    if (!response.ok) {
        let message = 'Impossible de modifier le statut du rendez-vous. Veuillez réessayer.'
        try {
            const body: unknown = await response.json()
            if (typeof body === 'object' && body !== null && 'message' in body) {
                const {message: responseMessage} = body as {message: unknown}
                if (typeof responseMessage === 'string' && responseMessage) message = responseMessage
            }
        } catch {
            // Le serveur peut renvoyer une réponse sans corps JSON.
        }
        throw new AppointmentApiError(message)
    }

    let body: unknown
    try {
        body = unwrapApiResponse(await response.json())
    } catch {
        throw new AppointmentApiError('La réponse du serveur est invalide.')
    }

    if (typeof body !== 'object' || body === null || !('statut' in body) || body.statut !== expectedStatus) {
        throw new AppointmentApiError('Le serveur n’a pas confirmé le changement de statut.')
    }
    return expectedStatus
}
