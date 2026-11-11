import {CalendarDays, Clock3, Stethoscope} from 'lucide-react'
import {DashboardLayout} from '@/components/dashboard-layout'
import {getCurrentUser} from '@/lib/session'

export default async function PatientAppointmentsPage() {
    const user = await getCurrentUser()

    return (
        <DashboardLayout role="patient" user={user}>
            <div className="mb-7">
                <h1 className="text-2xl font-bold tracking-tight text-[#183b50]">Mes rendez-vous</h1>
                <p className="mt-2 text-sm text-[#78909c]">
                    Consultez les informations de votre prochain rendez-vous.
                </p>
            </div>

            <section aria-labelledby="upcoming-appointment-title">
                <h2 id="upcoming-appointment-title" className="mb-4 text-base font-bold text-[#183b50]">
                    Prochain rendez-vous
                </h2>
                <article className="rounded-2xl border border-[#e7eef0] bg-white p-5 shadow-[0_4px_18px_rgba(30,76,95,0.03)] sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <span className="inline-flex rounded-full bg-[#e4f6f4] px-3 py-1 text-xs font-semibold text-[#0b898a]">
                                À venir
                            </span>
                            <h3 className="mt-4 text-lg font-bold text-[#183b50]">Consultation de médecine générale</h3>
                        </div>
                        <CalendarDays className="text-[#0e8b8c]" size={24} aria-hidden="true"/>
                    </div>

                    <div className="mt-5 grid gap-4 border-t border-[#edf2f2] pt-5 sm:grid-cols-3">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="shrink-0 text-[#78909c]" size={18} aria-hidden="true"/>
                            <div>
                                <p className="text-xs text-[#8299a1]">Date</p>
                                <p className="mt-1 text-sm font-semibold text-[#23465b]">Lundi 2 mars 2026</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock3 className="shrink-0 text-[#78909c]" size={18} aria-hidden="true"/>
                            <div>
                                <p className="text-xs text-[#8299a1]">Heure</p>
                                <p className="mt-1 text-sm font-semibold text-[#23465b]">14:30</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Stethoscope className="shrink-0 text-[#78909c]" size={18} aria-hidden="true"/>
                            <div>
                                <p className="text-xs text-[#8299a1]">Médecin</p>
                                <p className="mt-1 text-sm font-semibold text-[#23465b]">Dr. Aminata Diallo</p>
                            </div>
                        </div>
                    </div>
                </article>
            </section>

            <p className="mt-5 text-xs text-[#8299a1]">
                Ces informations sont des données de démonstration et ne proviennent pas encore du serveur.
            </p>
        </DashboardLayout>
    )
}
