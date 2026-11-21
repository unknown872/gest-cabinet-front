'use client'

import {useEffect, useState, type FormEvent} from 'react'
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Check,
    Clock3,
    Filter,
    Info,
    Plus,
    Search,
    Stethoscope,
} from 'lucide-react'

import {Alert} from '@/components/ui/alert'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {Button} from '@/components/ui/button'
import {Input, NativeSelect} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Skeleton} from '@/components/ui/skeleton'
import {
    cancelMyAppointment,
    createAppointment,
    listAvailableSlots,
    listDoctors,
    listMyAppointments,
    updateMyAppointment,
    type AppointmentStatus,
    type Doctor,
    type PatientAppointment,
} from '@/lib/appointments'
import {ApiError, toHourMinute} from '@/lib/availability'

type ViewMode = 'list' | 'booking'
type ListTab = 'upcoming' | 'history'
type BookingStep = 1 | 2 | 3

const QUICK_MOTIFS = [
    'Consultation de médecine générale',
    'Suivi médical',
    'Contrôle de routine',
    "Renouvellement d'ordonnance",
]

const AVATAR_TONES = [
    'bg-[#dff4f4] text-[#0b898a]',
    'bg-[#e0f2fe] text-[#0369a1]',
    'bg-[#dcfce7] text-[#15803d]',
    'bg-[#fef3c7] text-[#b45309]',
]

const fullDateFormatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
})

const shortChipDateFormatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
})

const weekdayFormatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
})

function capitalize(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

function toIsoDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

function parseIsoDate(isoDate: string): Date {
    const [year, month, day] = isoDate.split('-').map(Number)
    return new Date(year, month - 1, day)
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function formatAppointmentDate(isoDateTime: string): string {
    const datePart = isoDateTime.slice(0, 10)
    return capitalize(fullDateFormatter.format(parseIsoDate(datePart)))
}

function formatAppointmentTime(isoDateTime: string): string {
    const timePart = isoDateTime.split('T')[1] ?? ''
    return toHourMinute(timePart)
}

function getDoctorSpecialty(doctor: Doctor): string {
    const first = doctor.specialites?.find((item) => item.libelle && item.libelle.trim())
    return first?.libelle?.trim() ?? 'Médecine Générale'
}

function getDoctorUpcomingDates(doctor: Doctor, todayIso: string, maxIso: string): string[] {
    const unique = new Set<string>()
    for (const slot of doctor.disponibilites ?? []) {
        if (slot.dateJour >= todayIso && slot.dateJour <= maxIso) {
            unique.add(slot.dateJour)
        }
    }
    return [...unique].sort((a, b) => a.localeCompare(b))
}

function getDoctorAvailabilityLabel(doctor: Doctor, todayIso: string, tomorrowIso: string, maxIso: string): {
    label: string
    available: boolean
} {
    const dates = getDoctorUpcomingDates(doctor, todayIso, maxIso)
    if (dates.length === 0) {
        return {label: 'Aucun créneau déclaré', available: false}
    }
    const nextDate = dates[0]
    if (nextDate === todayIso) {
        return {label: "Disponible aujourd'hui", available: true}
    }
    if (nextDate === tomorrowIso) {
        return {label: 'Prochain créneau : Demain', available: true}
    }
    const dayName = capitalize(weekdayFormatter.format(parseIsoDate(nextDate)))
    return {label: `Prochain créneau : ${dayName}`, available: true}
}

function getStatusBadge(status: AppointmentStatus): {label: string; className: string} {
    switch (status) {
        case 'CONFIRME':
            return {label: 'Confirmé', className: 'bg-[#dcfce7] text-[#15803d]'}
        case 'PLANIFIE':
            return {label: 'En attente', className: 'bg-[#fef3c7] text-[#b45309]'}
        case 'HONORE_PRESENT':
            return {label: 'Honoré', className: 'bg-[#e0f2fe] text-[#0369a1]'}
        case 'ANNULE':
            return {label: 'Annulé', className: 'bg-red-50 text-red-700'}
        case 'ABSENT':
            return {label: 'Absent', className: 'bg-red-100 text-red-800'}
    }
}

function isUpcomingAppointment(item: PatientAppointment): boolean {
    if (item.statut === 'ANNULE' || item.statut === 'HONORE_PRESENT' || item.statut === 'ABSENT') {
        return false
    }
    return new Date(item.dateHeure).getTime() >= Date.now() - 60 * 60 * 1000
}

function errorMessage(error: unknown): string {
    return error instanceof ApiError ? error.message : 'Une erreur est survenue. Veuillez réessayer.'
}

export function PatientAppointments() {
    const today = new Date()
    const todayIso = toIsoDate(today)
    const tomorrowIso = toIsoDate(addDays(today, 1))
    const maxIso = toIsoDate(addDays(today, 90))

    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [appointments, setAppointments] = useState<PatientAppointment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState('')

    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [activeTab, setActiveTab] = useState<ListTab>('upcoming')
    const [statusMessage, setStatusMessage] = useState('')

    // Étapes de réservation / modification
    const [step, setStep] = useState<BookingStep>(1)
    const [editingAppointment, setEditingAppointment] = useState<PatientAppointment | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSpecialty, setSelectedSpecialty] = useState('ALL')

    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
    const [selectedDate, setSelectedDate] = useState('')
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [isLoadingSlots, setIsLoadingSlots] = useState(false)
    const [slotsError, setSlotsError] = useState('')
    const [selectedSlot, setSelectedSlot] = useState('')

    const [motif, setMotif] = useState('')
    const [notes, setNotes] = useState('')
    const [submitError, setSubmitError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Annulation
    const [toCancel, setToCancel] = useState<PatientAppointment | null>(null)
    const [cancelError, setCancelError] = useState('')
    const [isCancelling, setIsCancelling] = useState(false)

    async function loadInitialData() {
        setIsLoading(true)
        setLoadError('')
        try {
            const [loadedDoctors, loadedAppointments] = await Promise.all([
                listDoctors(),
                listMyAppointments(),
            ])
            setDoctors(loadedDoctors.filter((doc) => doc != null))
            setAppointments(loadedAppointments.filter((rdv) => rdv != null))
        } catch (error) {
            setLoadError(errorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        void loadInitialData()
    }, [])

    async function fetchSlotsForDoctorAndDate(doctorId: number, dateIso: string) {
        if (!dateIso) {
            setAvailableSlots([])
            return
        }
        setIsLoadingSlots(true)
        setSlotsError('')
        try {
            const rawSlots = await listAvailableSlots(doctorId, dateIso)
            const nowMs = Date.now()
            const futureSlots = rawSlots.filter((slotIso) => new Date(slotIso).getTime() > nowMs)
            setAvailableSlots(futureSlots)
        } catch (error) {
            setSlotsError(errorMessage(error))
            setAvailableSlots([])
        } finally {
            setIsLoadingSlots(false)
        }
    }

    function startNewBooking() {
        setEditingAppointment(null)
        setSelectedDoctor(null)
        setSelectedDate('')
        setSelectedSlot('')
        setAvailableSlots([])
        setSlotsError('')
        setMotif('')
        setNotes('')
        setSubmitError('')
        setStatusMessage('')
        setStep(1)
        setViewMode('booking')
    }

    function startEditAppointment(appointment: PatientAppointment) {
        setEditingAppointment(appointment)
        setMotif(appointment.motif ?? '')
        setNotes(appointment.notes ?? '')
        setSubmitError('')
        setStatusMessage('')

        const matchedDoctor =
            doctors.find(
                (doc) =>
                    doc.nom.toLowerCase() === appointment.nomMedecin.toLowerCase() &&
                    doc.prenom.toLowerCase() === appointment.prenomMedecin.toLowerCase(),
            ) ?? null

        if (matchedDoctor) {
            const datePart = appointment.dateHeure.slice(0, 10)
            const initialDate = datePart >= todayIso ? datePart : todayIso
            setSelectedDoctor(matchedDoctor)
            setSelectedDate(initialDate)
            setSelectedSlot('')
            setStep(2)
            setViewMode('booking')
            void fetchSlotsForDoctorAndDate(matchedDoctor.id, initialDate)
        } else {
            setSelectedDoctor(null)
            setSelectedDate('')
            setSelectedSlot('')
            setStep(1)
            setViewMode('booking')
        }
    }

    function handleSelectDoctor(doctor: Doctor) {
        setSelectedDoctor(doctor)
        setSelectedSlot('')
        setSubmitError('')
        const upcomingDates = getDoctorUpcomingDates(doctor, todayIso, maxIso)
        const defaultDate = upcomingDates[0] ?? todayIso
        setSelectedDate(defaultDate)
        setStep(2)
        void fetchSlotsForDoctorAndDate(doctor.id, defaultDate)
    }

    function handleDateChange(newDate: string) {
        setSelectedDate(newDate)
        setSelectedSlot('')
        if (selectedDoctor && newDate) {
            void fetchSlotsForDoctorAndDate(selectedDoctor.id, newDate)
        }
    }

    async function handleConfirmBooking(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!selectedDoctor || !selectedSlot) {
            setSubmitError('Veuillez sélectionner un médecin et un créneau horaire.')
            return
        }
        const trimmedMotif = motif.trim()
        if (!trimmedMotif) {
            setSubmitError('Veuillez indiquer le motif de votre consultation.')
            return
        }

        setIsSubmitting(true)
        setSubmitError('')
        try {
            const payload = {
                medecinId: selectedDoctor.id,
                dateHeure: selectedSlot,
                motif: trimmedMotif,
                ...(notes.trim() ? {notes: notes.trim()} : {}),
            }

            if (editingAppointment) {
                const updated = await updateMyAppointment(editingAppointment.id, payload)
                setAppointments((current) =>
                    current.map((item) => (item.id === updated.id ? updated : item)),
                )
                setStatusMessage('Votre rendez-vous a été modifié avec succès.')
            } else {
                const created = await createAppointment(payload)
                setAppointments((current) => [created, ...current])
                setStatusMessage('Votre demande de rendez-vous a été enregistrée avec succès.')
            }

            setAvailableSlots((current) => current.filter((slot) => slot !== selectedSlot))
            setEditingAppointment(null)
            setActiveTab('upcoming')
            setViewMode('list')
        } catch (error) {
            setSubmitError(errorMessage(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleConfirmCancel() {
        if (!toCancel) return
        setIsCancelling(true)
        setCancelError('')
        try {
            const targetId = toCancel.id
            await cancelMyAppointment(targetId)
            setAppointments((current) =>
                current.map((item) => (item.id === targetId ? {...item, statut: 'ANNULE'} : item)),
            )
            setToCancel(null)
            setStatusMessage('Le rendez-vous a été annulé.')
        } catch (error) {
            setCancelError(errorMessage(error))
        } finally {
            setIsCancelling(false)
        }
    }

    function resolveAppointmentSpecialty(item: PatientAppointment): string {
        const matchedDoctor = doctors.find(
            (doc) =>
                doc.nom.toLowerCase() === item.nomMedecin.toLowerCase() &&
                doc.prenom.toLowerCase() === item.prenomMedecin.toLowerCase(),
        )
        if (matchedDoctor) {
            return getDoctorSpecialty(matchedDoctor)
        }
        return item.motif ?? 'Médecine Générale'
    }

    const allSpecialties = Array.from(
        new Set(doctors.map((doctor) => getDoctorSpecialty(doctor))),
    ).sort((a, b) => a.localeCompare(b))

    const filteredDoctors = doctors.filter((doctor) => {
        const specialty = getDoctorSpecialty(doctor)
        const matchesSpecialty = selectedSpecialty === 'ALL' || specialty === selectedSpecialty
        const query = searchQuery.trim().toLowerCase()
        if (!query) return matchesSpecialty
        const fullName = `dr. ${doctor.prenom} ${doctor.nom}`.toLowerCase()
        return (
            matchesSpecialty &&
            (fullName.includes(query) || specialty.toLowerCase().includes(query))
        )
    })

    const sortedAppointments = [...appointments].sort((a, b) =>
        a.dateHeure.localeCompare(b.dateHeure),
    )
    const upcomingAppointments = sortedAppointments.filter(isUpcomingAppointment)
    const historyAppointments = sortedAppointments
        .filter((item) => !isUpcomingAppointment(item))
        .reverse()
    const displayedAppointments =
        activeTab === 'upcoming' ? upcomingAppointments : historyAppointments

    const selectedDoctorDates = selectedDoctor
        ? getDoctorUpcomingDates(selectedDoctor, todayIso, maxIso)
        : []

    if (isLoading) {
        return (
            <div className="space-y-4" aria-busy="true" aria-label="Chargement de vos rendez-vous">
                <Skeleton className="h-16" />
                <Skeleton className="h-72" />
            </div>
        )
    }

    if (loadError) {
        return (
            <Alert>
                <p>{loadError}</p>
                <Button variant="outline" className="mt-3" onClick={() => void loadInitialData()}>
                    Réessayer
                </Button>
            </Alert>
        )
    }

    return (
        <>
            {viewMode === 'list' ? (
                <div>
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-[#183b50]">Mes rendez-vous</h1>
                            <p className="mt-1.5 text-sm text-[#78909c]">
                                Gérez et planifiez vos consultations médicales
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={startNewBooking}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#007acc] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(0,122,204,0.2)] transition hover:bg-[#0266ad]"
                        >
                            <Plus size={15} aria-hidden="true" /> Prendre un rendez-vous
                        </button>
                    </div>

                    {statusMessage && (
                        <div
                            role="status"
                            className="mb-5 flex items-center justify-between rounded-xl border border-[#bbf7d0] bg-[#dcfce7]/70 px-4 py-3 text-xs font-semibold text-[#15803d]"
                        >
                            <span>{statusMessage}</span>
                            <button
                                type="button"
                                onClick={() => setStatusMessage('')}
                                className="ml-4 text-xs underline"
                            >
                                Fermer
                            </button>
                        </div>
                    )}

                    <div className="mb-5 flex gap-6 border-b border-[#e7eef0]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('upcoming')}
                            className={`pb-3 text-xs font-semibold transition-colors ${
                                activeTab === 'upcoming'
                                    ? 'border-b-2 border-[#007acc] text-[#007acc]'
                                    : 'text-[#78909c] hover:text-[#183b50]'
                            }`}
                        >
                            À venir ({upcomingAppointments.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            className={`pb-3 text-xs font-semibold transition-colors ${
                                activeTab === 'history'
                                    ? 'border-b-2 border-[#007acc] text-[#007acc]'
                                    : 'text-[#78909c] hover:text-[#183b50]'
                            }`}
                        >
                            Historique ({historyAppointments.length})
                        </button>
                    </div>

                    {displayedAppointments.length === 0 ? (
                        <div className="rounded-2xl border border-[#e7eef0] bg-white p-10 text-center shadow-[0_4px_18px_rgba(30,76,95,0.03)]">
                            <CalendarDays className="mx-auto text-[#8299a1]" size={32} aria-hidden="true" />
                            <p className="mt-3 text-base font-bold text-[#183b50]">
                                {activeTab === 'upcoming'
                                    ? 'Aucun rendez-vous à venir'
                                    : 'Aucun historique de rendez-vous'}
                            </p>
                            <p className="mt-1 text-sm text-[#78909c]">
                                {activeTab === 'upcoming'
                                    ? 'Choisissez un praticien et réservez un créneau selon ses disponibilités.'
                                    : 'Vos consultations passées ou annulées apparaîtront ici.'}
                            </p>
                            {activeTab === 'upcoming' && (
                                <button
                                    type="button"
                                    onClick={startNewBooking}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#007acc] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0266ad]"
                                >
                                    <Plus size={15} aria-hidden="true" /> Prendre un rendez-vous
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-[#e7eef0] bg-white shadow-[0_4px_18px_rgba(30,76,95,0.03)]">
                            <table className="w-full min-w-[680px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-[#edf2f4] bg-[#f8fbfc] text-[11px] font-bold uppercase tracking-wider text-[#6e8794]">
                                        <th className="px-6 py-3.5">Date</th>
                                        <th className="px-4 py-3.5">Heure</th>
                                        <th className="px-4 py-3.5">Médecin</th>
                                        <th className="px-4 py-3.5">Spécialité</th>
                                        <th className="px-4 py-3.5">Statut</th>
                                        <th className="px-6 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#edf2f4] text-sm">
                                    {displayedAppointments.map((item) => {
                                        const badge = getStatusBadge(item.statut)
                                        const canModifyOrCancel =
                                            activeTab === 'upcoming' &&
                                            (item.statut === 'PLANIFIE' || item.statut === 'CONFIRME')

                                        return (
                                            <tr key={item.id} className="transition-colors hover:bg-[#fcfdfe]">
                                                <td className="px-6 py-4 font-bold text-[#183b50]">
                                                    {formatAppointmentDate(item.dateHeure)}
                                                </td>
                                                <td className="px-4 py-4 text-[#5f7a86]">
                                                    {formatAppointmentTime(item.dateHeure)}
                                                </td>
                                                <td className="px-4 py-4 font-bold text-[#183b50]">
                                                    Dr. {item.prenomMedecin} {item.nomMedecin}
                                                </td>
                                                <td className="px-4 py-4 text-[#5f7a86]">
                                                    <div>{resolveAppointmentSpecialty(item)}</div>
                                                    {item.motif && (
                                                        <p className="mt-0.5 text-xs text-[#90a3ae]">{item.motif}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                                                    >
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {canModifyOrCancel ? (
                                                        <div className="inline-flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => startEditAppointment(item)}
                                                                className="rounded-lg border border-[#d8e3e8] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#007acc] transition hover:border-[#007acc] hover:bg-[#f0f9ff]"
                                                            >
                                                                Modifier
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCancelError('')
                                                                    setToCancel(item)
                                                                }}
                                                                className="rounded-lg border border-[#f3d1d1] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#dc2626] transition hover:border-[#dc2626] hover:bg-red-50"
                                                            >
                                                                Annuler
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-[#90a3ae]">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-[#cce7f8] bg-[#e6f4fe] px-4 py-3 text-xs font-medium text-[#007acc]">
                        <Info size={16} className="shrink-0" aria-hidden="true" />
                        <span>
                            Pour toute urgence médicale, veuillez contacter directement le cabinet par téléphone.
                        </span>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-[#183b50]">
                                {editingAppointment ? 'Modifier mon rendez-vous' : 'Prendre un rendez-vous'}
                            </h1>
                            <p className="mt-1.5 text-sm text-[#78909c]">
                                Trouvez un praticien disponible et réservez votre consultation médicale en quelques
                                instants.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEditingAppointment(null)
                                setViewMode('list')
                            }}
                        >
                            <ArrowLeft aria-hidden="true" /> Retour à mes rendez-vous
                        </Button>
                    </div>

                    {/* Stepper 1 -> 2 -> 3 */}
                    <ol className="mb-7 flex flex-wrap items-center gap-3 text-xs font-semibold">
                        <li className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex items-center gap-2.5 text-left"
                            >
                                <span
                                    className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                                        step === 1
                                            ? 'bg-[#007acc] text-white'
                                            : 'bg-[#dff0ff] text-[#007acc]'
                                    }`}
                                >
                                    {step > 1 ? <Check size={14} /> : '1'}
                                </span>
                                <span className={step === 1 ? 'text-[#007acc]' : 'text-[#183b50]'}>
                                    Choisir un médecin
                                </span>
                            </button>
                        </li>

                        <li className="hidden h-px w-12 bg-[#d8e3e8] sm:block" aria-hidden="true" />

                        <li className="flex items-center gap-2.5">
                            <button
                                type="button"
                                disabled={!selectedDoctor}
                                onClick={() => selectedDoctor && setStep(2)}
                                className="flex items-center gap-2.5 text-left disabled:cursor-not-allowed"
                            >
                                <span
                                    className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                                        step === 2
                                            ? 'bg-[#007acc] text-white'
                                            : step > 2
                                              ? 'bg-[#dff0ff] text-[#007acc]'
                                              : 'bg-[#e7eef0] text-[#78909c]'
                                    }`}
                                >
                                    {step > 2 ? <Check size={14} /> : '2'}
                                </span>
                                <span className={step === 2 ? 'text-[#007acc]' : 'text-[#64748b]'}>
                                    Choisir un créneau
                                </span>
                            </button>
                        </li>

                        <li className="hidden h-px w-12 bg-[#d8e3e8] sm:block" aria-hidden="true" />

                        <li className="flex items-center gap-2.5">
                            <span
                                className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                                    step === 3
                                        ? 'bg-[#007acc] text-white'
                                        : 'bg-[#e7eef0] text-[#78909c]'
                                }`}
                            >
                                3
                            </span>
                            <span className={step === 3 ? 'text-[#007acc]' : 'text-[#64748b]'}>
                                Confirmer la demande
                            </span>
                        </li>
                    </ol>

                    {step === 1 && (
                        <div>
                            <div className="mb-6 flex flex-wrap items-center gap-3">
                                <div className="relative w-full max-w-sm">
                                    <Search
                                        size={16}
                                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#90a3ae]"
                                        aria-hidden="true"
                                    />
                                    <Input
                                        type="search"
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        placeholder="Rechercher un médecin.."
                                        className="pl-10"
                                    />
                                </div>
                                <div className="relative w-full sm:w-56">
                                    <Filter
                                        size={15}
                                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f7a86]"
                                        aria-hidden="true"
                                    />
                                    <NativeSelect
                                        value={selectedSpecialty}
                                        onChange={(event) => setSelectedSpecialty(event.target.value)}
                                        className="pl-9 font-medium"
                                        aria-label="Filtrer par spécialité"
                                    >
                                        <option value="ALL">Toutes spécialités</option>
                                        {allSpecialties.map((specialty) => (
                                            <option key={specialty} value={specialty}>
                                                {specialty}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </div>
                            </div>

                            <h2 className="mb-4 text-sm font-bold text-[#183b50]">
                                Praticiens disponibles dans votre cabinet
                            </h2>

                            {filteredDoctors.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-[#d9e4e7] bg-white p-10 text-center">
                                    <Stethoscope className="mx-auto text-[#8299a1]" size={30} aria-hidden="true" />
                                    <p className="mt-3 text-base font-bold text-[#183b50]">
                                        Aucun praticien trouvé
                                    </p>
                                    <p className="mt-1 text-sm text-[#78909c]">
                                        Modifiez votre recherche ou le filtre de spécialité.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {filteredDoctors.map((doctor, index) => {
                                        const specialty = getDoctorSpecialty(doctor)
                                        const availability = getDoctorAvailabilityLabel(
                                            doctor,
                                            todayIso,
                                            tomorrowIso,
                                            maxIso,
                                        )
                                        const initials =
                                            `${doctor.prenom.charAt(0)}${doctor.nom.charAt(0)}`.toUpperCase()
                                        const avatarTone = AVATAR_TONES[index % AVATAR_TONES.length]

                                        return (
                                            <article
                                                key={doctor.id}
                                                className="flex flex-col justify-between rounded-2xl border border-[#e7eef0] bg-white p-5 shadow-[0_4px_18px_rgba(30,76,95,0.03)] transition hover:border-[#b9d9eb] hover:shadow-md"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-3.5">
                                                        <div
                                                            className={`flex size-13 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarTone}`}
                                                            aria-hidden="true"
                                                        >
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="truncate text-sm font-bold text-[#183b50]">
                                                                Dr. {doctor.prenom} {doctor.nom}
                                                            </h3>
                                                            <p className="mt-0.5 truncate text-xs text-[#78909c]">
                                                                {specialty}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-5 flex items-center gap-2 text-xs font-semibold">
                                                        <span
                                                            className={`size-2 rounded-full ${
                                                                availability.available
                                                                    ? 'bg-[#16a34a]'
                                                                    : 'bg-[#94a3b8]'
                                                            }`}
                                                            aria-hidden="true"
                                                        />
                                                        <span
                                                            className={
                                                                availability.available
                                                                    ? 'text-[#15803d]'
                                                                    : 'text-[#78909c]'
                                                            }
                                                        >
                                                            {availability.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-4 border-t border-[#edf2f4] pt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectDoctor(doctor)}
                                                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#007acc] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0266ad]"
                                                    >
                                                        Choisir <ArrowRight size={14} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </article>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && selectedDoctor && (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e7eef0] bg-white p-5 shadow-[0_4px_18px_rgba(30,76,95,0.03)]">
                                <div className="flex items-center gap-3.5">
                                    <div className="flex size-12 items-center justify-center rounded-full bg-[#dff0ff] text-sm font-bold text-[#007acc]">
                                        <Stethoscope size={20} aria-hidden="true" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-[#007acc]">Praticien sélectionné</p>
                                        <h2 className="text-base font-bold text-[#183b50]">
                                            Dr. {selectedDoctor.prenom} {selectedDoctor.nom}
                                        </h2>
                                        <p className="text-xs text-[#78909c]">
                                            {getDoctorSpecialty(selectedDoctor)}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={() => setStep(1)}>
                                    Changer de médecin
                                </Button>
                            </div>

                            <div className="rounded-2xl border border-[#e7eef0] bg-white p-6 shadow-[0_4px_18px_rgba(30,76,95,0.03)]">
                                <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-[#183b50]">
                                                1. Choisissez une date de consultation
                                            </h3>
                                            <p className="mt-1 text-xs text-[#78909c]">
                                                Sélectionnez l&apos;une des journées de présence du médecin ou une date
                                                dans le calendrier.
                                            </p>
                                        </div>

                                        {selectedDoctorDates.length > 0 && (
                                            <div>
                                                <p className="mb-2 text-xs font-semibold text-[#23465b]">
                                                    Prochaines dates disponibles :
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedDoctorDates.slice(0, 8).map((dateIso) => {
                                                        const isSelected = selectedDate === dateIso
                                                        return (
                                                            <button
                                                                key={dateIso}
                                                                type="button"
                                                                onClick={() => handleDateChange(dateIso)}
                                                                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                                                                    isSelected
                                                                        ? 'border-[#007acc] bg-[#007acc] text-white shadow-xs'
                                                                        : 'border-[#d8e3e8] bg-[#f8fbfc] text-[#183b50] hover:border-[#007acc] hover:bg-[#f0f9ff]'
                                                                }`}
                                                            >
                                                                {capitalize(
                                                                    shortChipDateFormatter.format(
                                                                        parseIsoDate(dateIso),
                                                                    ),
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-1.5 pt-1">
                                            <Label htmlFor="booking-date">Autre date (jusqu&apos;à 90 jours)</Label>
                                            <Input
                                                id="booking-date"
                                                type="date"
                                                min={todayIso}
                                                max={maxIso}
                                                value={selectedDate}
                                                onChange={(event) => handleDateChange(event.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t border-[#edf2f4] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                                        <div>
                                            <h3 className="text-sm font-bold text-[#183b50]">
                                                2. Choisissez une heure disponible
                                            </h3>
                                            <p className="mt-1 text-xs text-[#78909c]">
                                                {selectedDate
                                                    ? capitalize(fullDateFormatter.format(parseIsoDate(selectedDate)))
                                                    : 'Sélectionnez une date pour voir les horaires libres.'}
                                            </p>
                                        </div>

                                        {isLoadingSlots ? (
                                            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                                                <Skeleton className="h-10" />
                                                <Skeleton className="h-10" />
                                                <Skeleton className="h-10" />
                                                <Skeleton className="h-10" />
                                            </div>
                                        ) : slotsError ? (
                                            <Alert>{slotsError}</Alert>
                                        ) : availableSlots.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-[#d9e4e7] bg-[#f8fbfc] p-6 text-center">
                                                <Clock3
                                                    className="mx-auto text-[#8299a1]"
                                                    size={24}
                                                    aria-hidden="true"
                                                />
                                                <p className="mt-2 text-xs font-bold text-[#183b50]">
                                                    Aucun créneau libre à cette date
                                                </p>
                                                <p className="mt-1 text-xs text-[#78909c]">
                                                    Ce praticien n&apos;a pas de disponibilité ou tous ses créneaux sont
                                                    déjà réservés ce jour-là.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                                                {availableSlots.map((slotIso) => {
                                                    const active = selectedSlot === slotIso
                                                    return (
                                                        <button
                                                            key={slotIso}
                                                            type="button"
                                                            onClick={() => setSelectedSlot(slotIso)}
                                                            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition ${
                                                                active
                                                                    ? 'border-[#007acc] bg-[#007acc] text-white shadow-xs'
                                                                    : 'border-[#d8e3e8] bg-white text-[#183b50] hover:border-[#007acc] hover:bg-[#f0f9ff]'
                                                            }`}
                                                        >
                                                            <Clock3 size={13} aria-hidden="true" />
                                                            {formatAppointmentTime(slotIso)}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        <div className="flex justify-end pt-4">
                                            <button
                                                type="button"
                                                disabled={!selectedSlot}
                                                onClick={() => setStep(3)}
                                                className="inline-flex items-center gap-2 rounded-xl bg-[#007acc] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0266ad] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Continuer <ArrowRight size={14} aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && selectedDoctor && selectedSlot && (
                        <form
                            onSubmit={handleConfirmBooking}
                            className="w-full rounded-2xl border border-[#e7eef0] bg-white p-6 shadow-[0_4px_18px_rgba(30,76,95,0.03)]"
                        >
                            <h2 className="text-base font-bold text-[#183b50]">
                                Récapitulatif de votre demande de rendez-vous
                            </h2>
                            <p className="mt-1 text-xs text-[#78909c]">
                                Vérifiez les informations choisies et précisez le motif de votre consultation.
                            </p>

                            <div className="mt-5 grid gap-4 rounded-xl border border-[#e7eef0] bg-[#f8fbfc] p-4 sm:grid-cols-3">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase text-[#78909c]">Médecin</p>
                                    <p className="mt-1 text-sm font-bold text-[#183b50]">
                                        Dr. {selectedDoctor.prenom} {selectedDoctor.nom}
                                    </p>
                                    <p className="text-xs text-[#5f7a86]">{getDoctorSpecialty(selectedDoctor)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase text-[#78909c]">Date</p>
                                    <p className="mt-1 text-sm font-bold text-[#183b50]">
                                        {formatAppointmentDate(selectedSlot)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase text-[#78909c]">Horaire</p>
                                    <p className="mt-1 text-sm font-bold text-[#007acc]">
                                        {formatAppointmentTime(selectedSlot)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="rdv-motif">Motif de la consultation *</Label>
                                    <div className="flex flex-wrap gap-1.5 pb-1">
                                        {QUICK_MOTIFS.map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                onClick={() => setMotif(suggestion)}
                                                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                                                    motif === suggestion
                                                        ? 'border-[#007acc] bg-[#dff0ff] text-[#007acc]'
                                                        : 'border-[#e7eef0] bg-[#f8fbfc] text-[#5f7a86] hover:border-[#007acc]'
                                                }`}
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                    <Input
                                        id="rdv-motif"
                                        type="text"
                                        value={motif}
                                        onChange={(event) => setMotif(event.target.value)}
                                        placeholder="Ex : Consultation générale, douleur, suivi..."
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="rdv-notes">Notes complémentaires (optionnel)</Label>
                                    <Input
                                        id="rdv-notes"
                                        type="text"
                                        value={notes}
                                        onChange={(event) => setNotes(event.target.value)}
                                        placeholder="Précisions utiles pour le médecin ou le secrétariat..."
                                    />
                                </div>

                                {submitError && <Alert>{submitError}</Alert>}
                            </div>

                            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf2f4] pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isSubmitting}
                                    onClick={() => setStep(2)}
                                >
                                    <ArrowLeft aria-hidden="true" /> Modifier le créneau
                                </Button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#007acc] px-5 py-2.5 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(0,122,204,0.2)] transition hover:bg-[#0266ad] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmitting
                                        ? 'Confirmation en cours…'
                                        : editingAppointment
                                          ? 'Enregistrer la modification'
                                          : 'Confirmer le rendez-vous'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            <AlertDialog
                open={toCancel !== null}
                onOpenChange={(open) => !open && !isCancelling && setToCancel(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Annuler ce rendez-vous ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {toCancel
                                ? `Rendez-vous avec Dr. ${toCancel.prenomMedecin} ${toCancel.nomMedecin} le ${formatAppointmentDate(toCancel.dateHeure)} à ${formatAppointmentTime(toCancel.dateHeure)}. L'annulation en ligne est possible jusqu'à 24h avant le créneau.`
                                : ''}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {cancelError && <Alert>{cancelError}</Alert>}
                    <AlertDialogFooter>
                        <Button variant="outline" disabled={isCancelling} onClick={() => setToCancel(null)}>
                            Retour
                        </Button>
                        <Button
                            className="bg-red-600 text-white hover:bg-red-700"
                            disabled={isCancelling}
                            onClick={() => void handleConfirmCancel()}
                        >
                            {isCancelling ? 'Annulation…' : 'Confirmer l’annulation'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
