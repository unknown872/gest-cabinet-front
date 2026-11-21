'use client'

import {CalendarDays, CircleCheck, Clock3, type LucideIcon} from 'lucide-react'
import {useEffect, useMemo, useState} from 'react'
import {
    changeAppointmentStatus,
    formatAppointmentDateTime,
    getAppointmentStatusClasses,
    getAppointmentStatusLabel,
    listAllAppointments,
    type Appointment,
    type AppointmentStatus,
} from '@/lib/appointments'

const WEEKDAYS = [
    {value: 1, label: 'Lundi'},
    {value: 2, label: 'Mardi'},
    {value: 3, label: 'Mercredi'},
    {value: 4, label: 'Jeudi'},
    {value: 5, label: 'Vendredi'},
    {value: 6, label: 'Samedi'},
    {value: 0, label: 'Dimanche'},
]

const STATUS_FILTERS: {value: AppointmentStatus | ''; label: string}[] = [
    {value: '', label: 'Tous les statuts'},
    {value: 'PLANIFIE', label: 'À confirmer'},
    {value: 'CONFIRME', label: 'Confirmé'},
    {value: 'HONORE_PRESENT', label: 'Présent'},
    {value: 'ABSENT', label: 'Absent'},
    {value: 'ANNULE', label: 'Annulé'},
]

export function SecretariatAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [reloadKey, setReloadKey] = useState(0)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('')
    const [weekdayFilter, setWeekdayFilter] = useState<number | ''>('')
    const [updatingAppointmentId, setUpdatingAppointmentId] = useState<number | null>(null)
    const [actionErrors, setActionErrors] = useState<Record<number, string>>({})

    useEffect(() => {
        const controller = new AbortController()
        setIsLoading(true)
        setLoadError('')
        listAllAppointments(controller.signal)
            .then(setAppointments)
            .catch((error: unknown) => {
                if (!controller.signal.aborted) {
                    setLoadError(error instanceof Error ? error.message : 'Impossible de charger le planning.')
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false)
            })

        return () => controller.abort()
    }, [reloadKey])

    const filteredAppointments = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase('fr')
        return [...appointments]
            .filter((appointment) => !statusFilter || appointment.statut === statusFilter)
            .filter((appointment) => {
                if (weekdayFilter === '') return true
                const date = appointment.dateHeure.slice(0, 10)
                const [year, month, day] = date.split('-').map(Number)
                return Number.isInteger(year) && new Date(year, month - 1, day).getDay() === weekdayFilter
            })
            .filter((appointment) => {
                if (!normalizedSearch) return true
                const patient = [appointment.prenomPatient, appointment.nomPatient].join(' ')
                const doctor = [appointment.prenomMedecin, appointment.nomMedecin].join(' ')
                return `${patient} ${doctor} ${appointment.motif ?? ''}`
                    .toLocaleLowerCase('fr')
                    .includes(normalizedSearch)
            })
            .sort((left, right) => left.dateHeure.localeCompare(right.dateHeure))
    }, [appointments, search, statusFilter, weekdayFilter])

    const pendingCount = appointments.filter(({statut}) => statut === 'PLANIFIE').length
    const confirmedCount = appointments.filter(({statut}) => statut === 'CONFIRME').length

    const handleStatusChange = async (appointmentId: number, action: 'confirm' | 'cancel') => {
        if (updatingAppointmentId !== null) return
        setUpdatingAppointmentId(appointmentId)
        setActionErrors((errors) => {
            const nextErrors = {...errors}
            delete nextErrors[appointmentId]
            return nextErrors
        })

        try {
            const statut = await changeAppointmentStatus(appointmentId, action)
            setAppointments((items) => items.map((appointment) =>
                appointment.id === appointmentId ? {...appointment, statut} : appointment))
        } catch (error) {
            setActionErrors((errors) => ({
                ...errors,
                [appointmentId]: error instanceof Error
                    ? error.message
                    : 'Impossible de modifier le statut du rendez-vous.',
            }))
        } finally {
            setUpdatingAppointmentId(null)
        }
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-[#183b50]">Rendez-vous</h1>
                <p className="mt-2 text-sm text-[#78909c]">
                    Consultez et gérez les rendez-vous du cabinet, quelle que soit leur date.
                </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
                <PlanningStat icon={CalendarDays} label="Tous les rendez-vous" value={isLoading ? '…' : String(appointments.length)}/>
                <PlanningStat icon={Clock3} label="À confirmer" value={isLoading ? '…' : String(pendingCount)} tone="orange"/>
                <PlanningStat icon={CircleCheck} label="Confirmés" value={isLoading ? '…' : String(confirmedCount)} tone="blue"/>
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#e7eef0] bg-white shadow-[0_4px_18px_rgba(30,76,95,0.03)]">
                <div className="flex flex-col gap-4 border-b border-[#edf2f2] p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-[#183b50]">Liste des rendez-vous</h2>
                        <p className="mt-1 text-xs text-[#879da5]">
                            {isLoading ? 'Chargement…' : `${filteredAppointments.length} rendez-vous affiché${filteredAppointments.length > 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <label className="sr-only" htmlFor="appointments-search">Rechercher un rendez-vous</label>
                        <input
                            id="appointments-search"
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Patient, médecin, motif…"
                            className="rounded-lg border border-[#dce7e9] px-3 py-2 text-sm text-[#23465b] outline-none focus:border-[#0e8b8c]"
                        />
                        <label className="sr-only" htmlFor="appointments-weekday">Filtrer par jour de la semaine</label>
                        <select
                            id="appointments-weekday"
                            value={weekdayFilter}
                            onChange={(event) => setWeekdayFilter(event.target.value === '' ? '' : Number(event.target.value))}
                            className="rounded-lg border border-[#dce7e9] bg-white px-3 py-2 text-sm text-[#23465b] outline-none focus:border-[#0e8b8c]"
                        >
                            <option value="">Tous les jours</option>
                            {WEEKDAYS.map(({value, label}) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <label className="sr-only" htmlFor="appointments-status">Filtrer par statut</label>
                        <select
                            id="appointments-status"
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value as AppointmentStatus | '')}
                            className="rounded-lg border border-[#dce7e9] bg-white px-3 py-2 text-sm text-[#23465b] outline-none focus:border-[#0e8b8c]"
                        >
                            {STATUS_FILTERS.map(({value, label}) => <option key={value || 'all'} value={value}>{label}</option>)}
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <p className="p-10 text-center text-sm text-[#78909c]">Chargement des rendez-vous…</p>
                ) : loadError ? (
                    <div className="p-10 text-center text-sm text-[#b4533c]">
                        <p>{loadError}</p>
                        <button
                            type="button"
                            onClick={() => setReloadKey((key) => key + 1)}
                            className="mt-2 font-semibold underline"
                        >
                            Réessayer
                        </button>
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <p className="p-10 text-center text-sm text-[#78909c]">
                        {appointments.length === 0 ? 'Aucun rendez-vous.' : 'Aucun rendez-vous ne correspond aux filtres.'}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-[#f8fbfb] text-xs text-[#829aa3]">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Date et heure</th>
                                    <th className="px-5 py-3 font-medium">Patient</th>
                                    <th className="px-5 py-3 font-medium">Médecin</th>
                                    <th className="px-5 py-3 font-medium">Motif</th>
                                    <th className="px-5 py-3 font-medium">Statut</th>
                                    <th className="px-5 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.map((appointment) => {
                                    const patientName = [appointment.prenomPatient, appointment.nomPatient]
                                        .filter(Boolean).join(' ') || 'Patient inconnu'
                                    const doctorName = [appointment.prenomMedecin, appointment.nomMedecin]
                                        .filter(Boolean).join(' ')
                                    const isUpdating = updatingAppointmentId === appointment.id

                                    return (
                                        <tr key={appointment.id} className="border-t border-[#f0f4f4] align-top">
                                            <td className="whitespace-nowrap px-5 py-4 font-medium text-[#23465b]">
                                                {formatAppointmentDateTime(appointment.dateHeure)}
                                            </td>
                                            <td className="px-5 py-4 font-semibold text-[#23465b]">{patientName}</td>
                                            <td className="px-5 py-4 text-[#78909c]">{doctorName ? `Dr. ${doctorName}` : '—'}</td>
                                            <td className="px-5 py-4 text-[#78909c]">{appointment.motif || '—'}</td>
                                            <td className="px-5 py-4">
                                                <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${getAppointmentStatusClasses(appointment.statut)}`}>
                                                    {getAppointmentStatusLabel(appointment.statut)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                {appointment.statut === 'PLANIFIE' ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStatusChange(appointment.id, 'confirm')}
                                                            disabled={updatingAppointmentId !== null}
                                                            className="rounded-lg bg-[#e4f6f4] px-3 py-1.5 text-xs font-semibold text-[#0b898a] disabled:opacity-50"
                                                        >
                                                            {isUpdating ? 'Mise à jour…' : 'Confirmer'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStatusChange(appointment.id, 'cancel')}
                                                            disabled={updatingAppointmentId !== null}
                                                            className="rounded-lg bg-[#fff0e9] px-3 py-1.5 text-xs font-semibold text-[#d77652] disabled:opacity-50"
                                                        >
                                                            Annuler
                                                        </button>
                                                    </div>
                                                ) : <span className="text-xs text-[#a2b2b7]">—</span>}
                                                {actionErrors[appointment.id] && (
                                                    <p role="alert" className="mt-2 max-w-48 text-xs text-[#b4533c]">
                                                        {actionErrors[appointment.id]}
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    )
}

function PlanningStat({icon: Icon, label, value, tone = 'teal'}: {
    icon: LucideIcon
    label: string
    value: string
    tone?: 'teal' | 'orange' | 'blue'
}) {
    const colors = {
        teal: 'bg-[#e4f6f4] text-[#0b898a]',
        orange: 'bg-[#fff1e8] text-[#e9864c]',
        blue: 'bg-[#eaf1fb] text-[#5680b9]',
    }

    return (
        <section className="rounded-2xl border border-[#e7eef0] bg-white p-5 shadow-[0_4px_18px_rgba(30,76,95,0.03)]">
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${colors[tone]}`}>
                <Icon size={19}/>
            </div>
            <p className="text-sm text-[#7c949d]">{label}</p>
            <p className="mt-1 text-2xl font-bold text-[#183b50]">{value}</p>
        </section>
    )
}
