'use client'

import {useEffect, useState, type FormEvent} from 'react'
import {CalendarDays, ChevronLeft, ChevronRight, Plus} from 'lucide-react'

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
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Input, NativeSelect} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Skeleton} from '@/components/ui/skeleton'
import {
    ApiError,
    createAvailability,
    deleteAvailability,
    listAvailabilities,
    toHourMinute,
    toMinutes,
    updateAvailability,
    validateAvailability,
    type Availability,
    type AvailabilityInput,
} from '@/lib/availability'

const SLOT_DURATIONS = [10, 15, 20, 30, 45, 60]
const ROW_HEIGHT = 60 // px par heure
const DEFAULT_START_HOUR = 8
const DEFAULT_END_HOUR = 19 // exclu : la dernière ligne affichée est 18:00

const EMPTY_FORM = {dateJour: '', heureDebut: '', heureFin: '', dureeCreneauMinutes: '30'}
type FormState = typeof EMPTY_FORM

type DragSelection = {
    dateJour: string
    startHour: number
    endHour: number
}

const primaryButton = 'bg-[#0e8b8c] text-white hover:bg-[#0b7778]'

function parseIso(isoDate: string): Date {
    const [year, month, day] = isoDate.split('-').map(Number)
    return new Date(year, month - 1, day)
}

function toIso(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function mondayOf(date: Date): Date {
    const offset = (date.getDay() + 6) % 7
    return addDays(date, -offset)
}

function formatHour(hour: number): string {
    return `${String(hour).padStart(2, '0')}:00`
}

const weekdayFormat = new Intl.DateTimeFormat('fr-FR', {weekday: 'long'})
const shortDateFormat = new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'short'})
const longDateFormat = new Intl.DateTimeFormat('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})
const weekLabelFormat = new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long'})

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
}

function errorMessage(error: unknown): string {
    return error instanceof ApiError ? error.message : 'Une erreur est survenue. Veuillez réessayer.'
}

export function AvailabilityManager() {
    const [availabilities, setAvailabilities] = useState<Availability[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()))
    const [dragSelection, setDragSelection] = useState<DragSelection | null>(null)

    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Availability | null>(null)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [formError, setFormError] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const [toDelete, setToDelete] = useState<Availability | null>(null)
    const [deleteError, setDeleteError] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    async function load() {
        setIsLoading(true)
        setLoadError('')
        try {
            setAvailabilities(await listAvailabilities())
        } catch (error) {
            setLoadError(errorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        void load()
    }, [])

    function openCreate() {
        setEditing(null)
        setForm({
            ...EMPTY_FORM,
            dateJour: toIso(weekStart),
            heureDebut: '09:00',
            heureFin: '12:00',
        })
        setFormError('')
        setFormOpen(true)
    }

    function openCreateAt(dateJour: string, fromHour: number, toHour: number) {
        const minHour = Math.min(fromHour, toHour)
        const maxHour = Math.min(Math.max(fromHour, toHour) + 1, 23)
        setEditing(null)
        setForm({
            dateJour,
            heureDebut: formatHour(minHour),
            heureFin: formatHour(maxHour),
            dureeCreneauMinutes: '30',
        })
        setFormError('')
        setFormOpen(true)
    }

    function openEdit(item: Availability) {
        setEditing(item)
        setForm({
            dateJour: item.dateJour,
            heureDebut: toHourMinute(item.heureDebut),
            heureFin: toHourMinute(item.heureFin),
            dureeCreneauMinutes: String(item.dureeCreneauMinutes),
        })
        setFormError('')
        setFormOpen(true)
    }

    function updateField(field: keyof FormState, value: string) {
        setForm((current) => ({...current, [field]: value}))
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const input: AvailabilityInput = {
            dateJour: form.dateJour,
            heureDebut: form.heureDebut,
            heureFin: form.heureFin,
            dureeCreneauMinutes: Number(form.dureeCreneauMinutes),
        }
        const validationError = validateAvailability(input)
        if (validationError) {
            setFormError(validationError)
            return
        }

        setIsSaving(true)
        setFormError('')
        try {
            if (editing) {
                const updated = await updateAvailability(editing.id, input)
                setAvailabilities((current) =>
                    current.map((item) => (item.id === updated.id ? updated : item)),
                )
            } else {
                const created = await createAvailability(input)
                setAvailabilities((current) => [...current, created])
            }
            setFormOpen(false)
        } catch (error) {
            setFormError(errorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDelete() {
        if (!toDelete) return
        setIsDeleting(true)
        setDeleteError('')
        try {
            const deletedId = toDelete.id
            await deleteAvailability(deletedId)
            setAvailabilities((current) => current.filter((item) => item.id !== deletedId))
            setToDelete(null)
        } catch (error) {
            setDeleteError(errorMessage(error))
        } finally {
            setIsDeleting(false)
        }
    }

    // Données dérivées de la liste (aucune requête supplémentaire) : semaine affichée et bornes horaires.
    const weekItems = availabilities.filter((item) => {
        const day = parseIso(item.dateJour)
        return day >= weekStart && day < addDays(weekStart, 7)
    })
    const hasSunday = weekItems.some((item) => parseIso(item.dateJour).getDay() === 0)
    const days = Array.from({length: hasSunday ? 7 : 6}, (_, index) => addDays(weekStart, index))

    const startHour = Math.min(DEFAULT_START_HOUR, ...weekItems.map((item) => Math.floor(toMinutes(item.heureDebut) / 60)))
    const endHour = Math.max(DEFAULT_END_HOUR, ...weekItems.map((item) => Math.ceil(toMinutes(item.heureFin) / 60)))
    const hours = Array.from({length: endHour - startHour}, (_, index) => startHour + index)
    const gridStartMinutes = startHour * 60
    const pxPerMinute = ROW_HEIGHT / 60

    const weekEnd = addDays(weekStart, days.length - 1)
    const weekLabel = `Semaine du ${weekLabelFormat.format(weekStart)}`

    return (
        <>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#183b50]">Mon planning</h1>
                    <p className="mt-1.5 text-sm text-[#78909c]">
                        Gérez votre emploi du temps et vos disponibilités hebdomadaires
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="inline-flex rounded-xl border border-[#e7eef0] bg-white p-1 shadow-xs">
                        <span className="rounded-lg bg-[#dff0ff] px-3.5 py-1.5 text-xs font-semibold text-[#1d6fb8]">
                            Semaine
                        </span>
                    </div>
                    <div className="flex items-center rounded-xl border border-[#e7eef0] bg-white px-1 py-0.5 shadow-xs">
                        <Button
                            variant="ghost"
                            aria-label="Semaine précédente"
                            onClick={() => setWeekStart((current) => addDays(current, -7))}
                        >
                            <ChevronLeft aria-hidden="true"/>
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-xs font-semibold text-[#183b50]"
                            onClick={() => setWeekStart(mondayOf(new Date()))}
                        >
                            <CalendarDays className="text-[#5f7a86]" aria-hidden="true"/> {capitalize(weekLabel)}
                        </Button>
                        <Button
                            variant="ghost"
                            aria-label="Semaine suivante"
                            onClick={() => setWeekStart((current) => addDays(current, 7))}
                        >
                            <ChevronRight aria-hidden="true"/>
                        </Button>
                    </div>
                    <Button className={primaryButton} onClick={openCreate}>
                        <Plus aria-hidden="true"/> Ajouter une plage
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <Skeleton className="h-[520px]" aria-busy="true" aria-label="Chargement des disponibilités"/>
            ) : loadError ? (
                <Alert>
                    <p>{loadError}</p>
                    <Button variant="outline" className="mt-3" onClick={() => void load()}>
                        Réessayer
                    </Button>
                </Alert>
            ) : (
                <>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#5f7a86]">
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1.5 font-medium text-[#183b50]">
                                <span className="size-2.5 rounded-full border-2 border-[#16a34a] bg-[#dcfce7]" aria-hidden="true"/>
                                Plage de disponibilité
                            </span>
                            <span className="text-[#78909c]">
                                Cliquez (ou glissez) sur une case du tableau pour ajouter une plage horaire.
                            </span>
                        </div>
                        <span className="text-[#78909c]">
                            Heures de consultation standard :{' '}
                            <strong className="font-semibold text-[#183b50]">
                                {formatHour(startHour)} – {formatHour(endHour - 1)}
                            </strong>
                        </span>
                    </div>

                    {weekItems.length === 0 && (
                        <div
                            role="status"
                            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[#cbe4e2] bg-[#f4fbfa] px-4 py-3 text-xs text-[#23465b]"
                        >
                            <span>
                                Aucune plage de disponibilité du{' '}
                                <strong>{shortDateFormat.format(weekStart)}</strong> au{' '}
                                <strong>{shortDateFormat.format(weekEnd)}</strong>. Cliquez directement sur une case du
                                tableau ci-dessous pour en ajouter une.
                            </span>
                        </div>
                    )}

                    <div
                        className="overflow-x-auto rounded-2xl border border-[#e7eef0] bg-white shadow-[0_4px_18px_rgba(30,76,95,0.03)] select-none"
                        onMouseLeave={() => setDragSelection(null)}
                    >
                        <div
                            className="grid min-w-[780px]"
                            style={{gridTemplateColumns: `76px repeat(${days.length}, minmax(0, 1fr))`}}
                        >
                            <div className="flex items-center justify-center border-b border-r border-[#edf2f4] bg-[#f8fbfc] py-3.5 text-xs font-semibold text-[#5f7a86]">
                                Heure
                            </div>
                            {days.map((day) => (
                                <div
                                    key={toIso(day)}
                                    className="border-b border-r border-[#edf2f4] bg-[#f8fbfc] py-3 text-center last:border-r-0"
                                >
                                    <p className="text-sm font-bold text-[#183b50]">{capitalize(weekdayFormat.format(day))}</p>
                                    <p className="mt-0.5 text-xs text-[#78909c]">{shortDateFormat.format(day)}</p>
                                </div>
                            ))}

                            <div className="border-r border-[#edf2f4] bg-[#fcfdfe]">
                                {hours.map((hour) => (
                                    <div
                                        key={hour}
                                        style={{height: ROW_HEIGHT}}
                                        className="flex items-center justify-center border-b border-[#edf2f4] text-xs font-semibold text-[#5f7a86] last:border-b-0"
                                    >
                                        {formatHour(hour)}
                                    </div>
                                ))}
                            </div>

                            {days.map((day) => {
                                const iso = toIso(day)
                                const dayItems = weekItems.filter((item) => item.dateJour === iso)
                                return (
                                    <div
                                        key={iso}
                                        className="relative border-r border-[#edf2f4] last:border-r-0"
                                        style={{height: hours.length * ROW_HEIGHT}}
                                    >
                                        {hours.map((hour) => {
                                            const isSelectedDrag =
                                                dragSelection?.dateJour === iso &&
                                                hour >= Math.min(dragSelection.startHour, dragSelection.endHour) &&
                                                hour <= Math.max(dragSelection.startHour, dragSelection.endHour)

                                            return (
                                                <button
                                                    key={hour}
                                                    type="button"
                                                    aria-label={`Ajouter une plage le ${capitalize(weekdayFormat.format(day))} ${shortDateFormat.format(day)} à ${formatHour(hour)}`}
                                                    style={{height: ROW_HEIGHT}}
                                                    onMouseDown={() =>
                                                        setDragSelection({dateJour: iso, startHour: hour, endHour: hour})
                                                    }
                                                    onMouseEnter={() => {
                                                        if (dragSelection && dragSelection.dateJour === iso) {
                                                            setDragSelection({...dragSelection, endHour: hour})
                                                        }
                                                    }}
                                                    onMouseUp={() => {
                                                        if (dragSelection && dragSelection.dateJour === iso) {
                                                            const {startHour: s, endHour: e} = dragSelection
                                                            setDragSelection(null)
                                                            openCreateAt(iso, s, e)
                                                        } else {
                                                            openCreateAt(iso, hour, hour)
                                                        }
                                                    }}
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter' || event.key === ' ') {
                                                            event.preventDefault()
                                                            openCreateAt(iso, hour, hour)
                                                        }
                                                    }}
                                                    className={`group flex w-full items-center justify-center border-b border-[#edf2f4] text-xs transition-colors last:border-b-0 focus-visible:bg-[#eaf8f7] focus-visible:outline-none ${
                                                        isSelectedDrag
                                                            ? 'bg-[#dcfce7]/80 ring-1 ring-inset ring-[#16a34a]'
                                                            : 'hover:bg-[#f0faf9]'
                                                    }`}
                                                >
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-[#0e8b8c] opacity-0 shadow-2xs transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                                        <Plus size={12} aria-hidden="true"/> {formatHour(hour)}
                                                    </span>
                                                </button>
                                            )
                                        })}

                                        {dayItems.map((item) => {
                                            const start = toMinutes(item.heureDebut)
                                            const end = toMinutes(item.heureFin)
                                            const totalHeight = Math.max((end - start) * pxPerMinute - 6, 36)
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation()
                                                        openEdit(item)
                                                    }}
                                                    aria-label={`Plage de disponibilité de ${toHourMinute(item.heureDebut)} à ${toHourMinute(item.heureFin)}`}
                                                    className="absolute inset-x-1.5 z-10 flex flex-col justify-center overflow-hidden rounded-lg border border-[#bbf7d0] bg-[#dcfce7] px-2.5 py-1.5 text-left shadow-2xs transition-all hover:border-[#86efac] hover:shadow-md focus-visible:ring-3 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none"
                                                    style={{
                                                        top: (start - gridStartMinutes) * pxPerMinute + 3,
                                                        height: totalHeight,
                                                    }}
                                                >
                                                    <span className="truncate text-xs font-bold text-[#15803d]">
                                                        {item.medecinNomComplet ? `Dr. ${item.medecinNomComplet}` : 'Plage disponible'}
                                                    </span>
                                                    <span className="truncate text-[11px] font-medium text-[#166534]">
                                                        Disponibilité ({toHourMinute(item.heureDebut)} – {toHourMinute(item.heureFin)})
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}

            <Dialog open={formOpen} onOpenChange={(open) => !isSaving && setFormOpen(open)}>
                <DialogContent>
                    <form onSubmit={handleSubmit} noValidate>
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Modifier la plage de disponibilité' : 'Ajouter une plage de disponibilité'}</DialogTitle>
                            <DialogDescription>
                                {form.dateJour
                                    ? capitalize(longDateFormat.format(parseIso(form.dateJour)))
                                    : 'Définissez la date et les horaires de votre plage de disponibilité.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="dispo-date">Date</Label>
                                <Input
                                    id="dispo-date"
                                    type="date"
                                    value={form.dateJour}
                                    onChange={(event) => updateField('dateJour', event.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="dispo-debut">Heure de début</Label>
                                    <Input
                                        id="dispo-debut"
                                        type="time"
                                        value={form.heureDebut}
                                        onChange={(event) => updateField('heureDebut', event.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="dispo-fin">Heure de fin</Label>
                                    <Input
                                        id="dispo-fin"
                                        type="time"
                                        value={form.heureFin}
                                        onChange={(event) => updateField('heureFin', event.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="dispo-duree">Durée de consultation (minutes)</Label>
                                <NativeSelect
                                    id="dispo-duree"
                                    value={form.dureeCreneauMinutes}
                                    onChange={(event) => updateField('dureeCreneauMinutes', event.target.value)}
                                >
                                    {SLOT_DURATIONS.map((minutes) => (
                                        <option key={minutes} value={minutes}>
                                            {minutes} minutes
                                        </option>
                                    ))}
                                </NativeSelect>
                            </div>

                            {formError && <Alert>{formError}</Alert>}
                        </div>

                        <DialogFooter>
                            {editing && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mr-auto text-red-700"
                                    disabled={isSaving}
                                    onClick={() => {
                                        setFormOpen(false)
                                        setDeleteError('')
                                        setToDelete(editing)
                                    }}
                                >
                                    Supprimer
                                </Button>
                            )}
                            <Button type="button" variant="outline" disabled={isSaving} onClick={() => setFormOpen(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" className={primaryButton} disabled={isSaving}>
                                {isSaving ? 'Enregistrement…' : 'Enregistrer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && !isDeleting && setToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette plage de disponibilité ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {toDelete
                                ? `${capitalize(longDateFormat.format(parseIso(toDelete.dateJour)))}, de ${toHourMinute(toDelete.heureDebut)} à ${toHourMinute(toDelete.heureFin)}. Cette action est définitive.`
                                : ''}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && <Alert>{deleteError}</Alert>}
                    <AlertDialogFooter>
                        <Button variant="outline" disabled={isDeleting} onClick={() => setToDelete(null)}>
                            Annuler
                        </Button>
                        <Button className="bg-red-600 text-white hover:bg-red-700" disabled={isDeleting} onClick={() => void handleDelete()}>
                            {isDeleting ? 'Suppression…' : 'Supprimer'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
