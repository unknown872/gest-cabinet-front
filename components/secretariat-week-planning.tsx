'use client'

import {ChevronLeft, ChevronRight, CalendarDays} from 'lucide-react'
import {useEffect, useMemo, useState} from 'react'
import {
    getAppointmentStatusClasses,
    getAppointmentStatusLabel,
    listAllAppointments,
    type Appointment,
} from '@/lib/appointments'

const dateLabel = new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'short'})
const weekLabel = new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'})
const monthYearLabel = new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'})
const weekdayLabel = new Intl.DateTimeFormat('fr-FR', {weekday: 'long'})

function startOfWeek(date: Date): Date {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    result.setDate(result.getDate() - ((result.getDay() + 6) % 7))
    return result
}

function addDays(date: Date, count: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + count)
    return result
}

function toLocalDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function SecretariatWeekPlanning() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [reloadKey, setReloadKey] = useState(0)
    const [week, setWeek] = useState(() => startOfWeek(new Date()))

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

    const days = useMemo(() => Array.from({length: 7}, (_, index) => {
        const date = addDays(week, index)
        const key = toLocalDateKey(date)
        return {
            date,
            key,
            appointments: appointments
                .filter((appointment) => appointment.dateHeure.slice(0, 10) === key)
                .sort((left, right) => left.dateHeure.localeCompare(right.dateHeure)),
        }
    }), [appointments, week])

    const weekAppointments = days.flatMap(({appointments: dayAppointments}) => dayAppointments)
    const pendingCount = weekAppointments.filter(({statut}) => statut === 'PLANIFIE').length
    const confirmedCount = weekAppointments.filter(({statut}) => statut === 'CONFIRME').length
    const weekEnd = addDays(week, 6)
    const rangeLabel = week.getMonth() === weekEnd.getMonth() && week.getFullYear() === weekEnd.getFullYear()
        ? `${week.getDate()} – ${weekEnd.getDate()} ${monthYearLabel.format(week)}`
        : `${weekLabel.format(week)} – ${weekLabel.format(weekEnd)}`

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold tracking-tight text-[#183b50]">Planning hebdomadaire</h1>
                <p className="mt-2 text-sm text-[#78909c]">Vue d’ensemble des rendez-vous du cabinet, organisée par jour.</p>
            </header>

            <section className="rounded-2xl border border-[#e7eef0] bg-white p-5 shadow-[0_4px_18px_rgba(30,76,95,0.03)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[#91a5ad]">Semaine affichée</p>
                        <h2 className="mt-1 text-lg font-bold capitalize text-[#183b50]">{rangeLabel}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setWeek((current) => addDays(current, -7))}
                            aria-label="Semaine précédente"
                            className="rounded-lg border border-[#dce7e9] p-2 text-[#55717e] hover:bg-[#f4f8f8]"
                        >
                            <ChevronLeft size={18}/>
                        </button>
                        <button
                            type="button"
                            onClick={() => setWeek(startOfWeek(new Date()))}
                            className="rounded-lg border border-[#dce7e9] px-3 py-2 text-xs font-semibold text-[#55717e] hover:bg-[#f4f8f8]"
                        >
                            Aujourd’hui
                        </button>
                        <button
                            type="button"
                            onClick={() => setWeek((current) => addDays(current, 7))}
                            aria-label="Semaine suivante"
                            className="rounded-lg border border-[#dce7e9] p-2 text-[#55717e] hover:bg-[#f4f8f8]"
                        >
                            <ChevronRight size={18}/>
                        </button>
                    </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <WeekStat label="Rendez-vous cette semaine" value={isLoading ? '…' : String(weekAppointments.length)}/>
                    <WeekStat label="À confirmer" value={isLoading ? '…' : String(pendingCount)}/>
                    <WeekStat label="Confirmés" value={isLoading ? '…' : String(confirmedCount)}/>
                </div>
            </section>

            {isLoading ? (
                <section className="rounded-2xl border border-[#e7eef0] bg-white p-10 text-center text-sm text-[#78909c]">
                    Chargement du planning…
                </section>
            ) : loadError ? (
                <section className="rounded-2xl border border-[#e7eef0] bg-white p-10 text-center text-sm text-[#b4533c]">
                    <p>{loadError}</p>
                    <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-2 font-semibold underline">
                        Réessayer
                    </button>
                </section>
            ) : (
                <section className="overflow-x-auto rounded-2xl border border-[#e7eef0] bg-white p-4 shadow-[0_4px_18px_rgba(30,76,95,0.03)]">
                    <div className="grid min-w-[980px] grid-cols-7 divide-x divide-[#edf2f2]">
                        {days.map(({date, key, appointments: dayAppointments}) => (
                            <div key={key} className="min-h-72 px-2">
                                <div className="mb-3 border-b border-[#edf2f2] pb-3 text-center">
                                    <p className="text-xs font-semibold capitalize text-[#78909c]">{weekdayLabel.format(date)}</p>
                                    <p className="mt-1 text-sm font-bold text-[#23465b]">{dateLabel.format(date)}</p>
                                    <p className="mt-1 text-[10px] text-[#9aadb3]">{dayAppointments.length} rendez-vous</p>
                                </div>
                                <div className="space-y-2">
                                    {dayAppointments.length === 0 ? (
                                        <p className="pt-2 text-center text-[11px] text-[#b1c0c4]">Aucun rendez-vous</p>
                                    ) : dayAppointments.map((appointment) => {
                                        const patient = [appointment.prenomPatient, appointment.nomPatient]
                                            .filter(Boolean).join(' ') || 'Patient inconnu'
                                        const time = appointment.dateHeure.split('T')[1]?.slice(0, 5) ?? '—'
                                        return (
                                            <article key={appointment.id} className="rounded-lg border border-[#edf2f2] bg-[#fbfdfd] p-2">
                                                <p className="text-xs font-bold text-[#0e8b8c]">{time}</p>
                                                <p className="mt-1 text-xs font-semibold text-[#23465b]">{patient}</p>
                                                <p className="mt-1 truncate text-[10px] text-[#81979f]">
                                                    {appointment.prenomMedecin || appointment.nomMedecin
                                                        ? `Dr. ${[appointment.prenomMedecin, appointment.nomMedecin].filter(Boolean).join(' ')}`
                                                        : appointment.motif || 'Consultation'}
                                                </p>
                                                <span className={`mt-2 inline-block rounded-full px-2 py-1 text-[9px] font-semibold ${getAppointmentStatusClasses(appointment.statut)}`}>
                                                    {getAppointmentStatusLabel(appointment.statut)}
                                                </span>
                                            </article>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    {weekAppointments.length === 0 && (
                        <div className="flex items-center justify-center gap-2 py-5 text-sm text-[#78909c]">
                            <CalendarDays size={17}/>
                            Aucun rendez-vous cette semaine.
                        </div>
                    )}
                </section>
            )}
        </div>
    )
}

function WeekStat({label, value}: {label: string; value: string}) {
    return (
        <div className="rounded-xl bg-[#f7fafa] px-4 py-3">
            <p className="text-xs text-[#7c949d]">{label}</p>
            <p className="mt-1 text-xl font-bold text-[#183b50]">{value}</p>
        </div>
    )
}
