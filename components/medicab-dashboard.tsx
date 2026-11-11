'use client'

import {Activity, CalendarDays, ChevronRight} from 'lucide-react'
import type {ReactNode} from 'react'
import type {AuthenticatedUser, UserRole} from '@/lib/auth'
import {DashboardLayout, PermissionAction} from '@/components/dashboard-layout'
import {roleData, type DashboardPermission} from '@/lib/permissions'

type ListRow = [label: string, title: string, description: string]

function Card({children, className = ''}: {children: ReactNode; className?: string}) {
    return (
        <section className={`rounded-2xl border border-[#e7eef0] bg-white p-5 shadow-[0_4px_18px_rgba(30,76,95,0.03)] ${className}`}>
            {children}
        </section>
    )
}

function SectionTitle({title, action, role, permission}: {
    title: string
    action?: string
    role: UserRole
    permission?: DashboardPermission
}) {
    return (
        <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#183b50]">{title}</h2>
            {action && permission && (
                <PermissionAction
                    role={role}
                    permission={permission}
                    className="text-xs font-semibold text-[#0b898a] hover:underline"
                >
                    {action}
                </PermissionAction>
            )}
        </div>
    )
}

function Stat({label, value, note, tone = 'teal'}: {
    label: string
    value: string
    note?: string
    tone?: 'teal' | 'orange' | 'blue'
}) {
    const colors = {
        teal: 'bg-[#e4f6f4] text-[#0b898a]',
        orange: 'bg-[#fff1e8] text-[#e9864c]',
        blue: 'bg-[#eaf1fb] text-[#5680b9]',
    }

    return (
        <Card>
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${colors[tone]}`}>
                <Activity size={19}/>
            </div>
            <p className="text-sm text-[#7c949d]">{label}</p>
            <p className="mt-1 text-2xl font-bold text-[#183b50]">{value}</p>
            {note && <p className="mt-1 text-xs text-[#829aa3]">{note}</p>}
        </Card>
    )
}

function PatientDashboard() {
    const consultations: ListRow[] = [
        ['10 FÉVRIER 2026', 'Dr. Aminata Diallo', 'Suivi de routine & Fatigue'],
        ['15 JANVIER 2026', 'Dr. Amadou Ba', 'Radiologie Cheville gauche'],
    ]
    const prescriptions: ListRow[] = [
        ['Traitement Fatigue Passagère', 'Valide jusqu’au 10 Mai', 'Dr. Diallo'],
        ['Renouvellement Vitamines D', 'Valide jusqu’au 15 Mars', 'Dr. Diallo'],
    ]

    return (
        <>
            <div className="mb-7">
                <h1 className="text-2xl font-bold tracking-tight text-[#183b50]">{roleData.patient.title}</h1>
                <p className="mt-2 text-sm text-[#78909c]">{roleData.patient.intro}</p>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
                <Card className="bg-[#0e8b8c] text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[.12em] text-white/70">
                                Prochain rendez-vous
                            </p>
                            <p className="mt-5 text-2xl font-bold">Lundi 2 Mars à 14:30</p>
                            <p className="mt-2 text-sm text-white/75">Dr. Aminata Diallo • Médecine Générale</p>
                        </div>
                        <CalendarDays className="text-white/65"/>
                    </div>
                    <PermissionAction
                        role="patient"
                        permission="appointments.create.own"
                        className="mt-6 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0e8b8c]"
                    >
                        Gérer le rendez-vous
                    </PermissionAction>
                </Card>

                <Card>
                    <SectionTitle
                        role="patient"
                        permission="exams.read.own"
                        title="Derniers résultats d'examens"
                        action="Voir tout"
                    />
                    <div className="rounded-xl bg-[#f4faf9] p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-[#23465b]">Bilan Sanguin Complet</p>
                                <p className="mt-1 text-xs text-[#8299a1]">Analysé le 22 Février 2026</p>
                            </div>
                            <span className="rounded-full bg-[#d6f1e7] px-2.5 py-1 text-[11px] font-semibold text-[#27866b]">
                                Nouveau
                            </span>
                        </div>
                        <PermissionAction
                            role="patient"
                            permission="exams.read.own"
                            className="mt-4 text-xs font-bold text-[#0e8b8c]"
                        >
                            Consulter <ChevronRight className="inline" size={13}/>
                        </PermissionAction>
                    </div>
                </Card>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <Card>
                    <SectionTitle
                        role="patient"
                        permission="consultations.read.own"
                        title="Dernières consultations"
                        action="Historique complet"
                    />
                    <List rows={consultations}/>
                </Card>
                <Card>
                    <SectionTitle
                        role="patient"
                        permission="prescriptions.read.own"
                        title="Ordonnances actives"
                        action="Voir tout"
                    />
                    <List rows={prescriptions}/>
                </Card>
            </div>

            <Card className="mt-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-[#23465b]">Mes paiements en attente</p>
                        <p className="mt-2 text-sm text-[#78909c]">15.000 FCFA en attente de règlement</p>
                        <p className="mt-1 text-xs text-[#9aadb3]">
                            Consultation du 10 Février • Tiers Payant non appliqué
                        </p>
                    </div>
                    <PermissionAction
                        role="patient"
                        permission="invoices.pay.own"
                        className="rounded-xl bg-[#fff0e9] px-4 py-2.5 text-sm font-semibold text-[#dc754f]"
                    >
                        Régler
                    </PermissionAction>
                </div>
            </Card>
        </>
    )
}

function List({rows}: {rows: ListRow[]}) {
    return (
        <div className="divide-y divide-[#edf2f2]">
            {rows.map(([label, title, description]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#92a6ad]">{label}</p>
                        <p className="mt-1 text-sm font-semibold text-[#23465b]">{title}</p>
                        <p className="mt-1 text-xs text-[#81979f]">{description}</p>
                    </div>
                    <ChevronRight size={16} className="text-[#abc0c5]"/>
                </div>
            ))}
        </div>
    )
}

function DoctorDashboard() {
    const appointments = [
        {time: '09:00', patient: 'Jean-Pierre Diop'},
        {time: '09:45', patient: 'Awa Sall'},
        {time: '10:30', patient: 'Rama Sy'},
        {time: '11:15', patient: 'Malick Cissokho'},
        {time: '14:00', patient: 'Stéphane Mbengue'},
        {time: '14:45', patient: 'Amélie Diop'},
    ]
    const recentPatients = [
        {name: 'Thierno Ndiaye', details: '42 ans • Visite : Hier, 16:30'},
        {name: 'Sophie Kane', details: '29 ans • Visite : 23 Fév, 11:00'},
        {name: 'Ameth Diop', details: '67 ans • Visite : 22 Fév, 14:15'},
        {name: 'Yasmine Sall', details: '35 ans • Visite : 20 Fév, 09:30'},
    ]

    return (
        <>
            <Intro role="medecin"/>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Stat label="Consultations ce mois" value="47" tone="teal"/>
                <Stat label="Examens en attente" value="3" tone="orange"/>
                <Stat label="Patients suivis" value="128" note="Aujourd'hui, 24 Février" tone="blue"/>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
                <Card>
                    <SectionTitle
                        role="medecin"
                        permission="appointments.read.assigned"
                        title="Rendez-vous du jour"
                        action="Voir l’agenda complet"
                    />
                    <div className="space-y-2">
                        {appointments.map(({time, patient}) => (
                            <div
                                key={time}
                                className="flex items-center gap-3 rounded-xl bg-[#f6fafa] px-3 py-2.5 text-sm text-[#23465b]"
                            >
                                <span className="w-12 font-bold text-[#0e8b8c]">{time}</span>
                                {patient}
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <SectionTitle
                        role="medecin"
                        permission="patients.read.assigned"
                        title="Derniers dossiers consultés"
                        action="Voir tous les patients"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                        {recentPatients.map(({name, details}) => (
                            <div key={name} className="flex items-center gap-3 rounded-xl border border-[#edf2f2] p-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dff4f4] text-xs font-bold text-[#0e8b8c]">
                                    {name.split(' ').map((part) => part[0]).join('')}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#23465b]">{name}</p>
                                    <p className="mt-1 text-[11px] text-[#879da5]">{details}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </>
    )
}

function SecretariatDashboard() {
    const appointments = [
        {time: '10:30', patient: 'Lucas Mercier', doctor: 'Dr. Aminata Diallo', status: 'En cours'},
        {time: '11:00', patient: 'Chloé Vasseur', doctor: 'Dr. Alexandre Roy', status: 'Confirmé'},
        {time: '11:15', patient: 'Chantal Gauthier', doctor: 'Dr. Aminata Diallo', status: 'En attente'},
        {time: '11:30', patient: 'Marc Lafont', doctor: 'Dr. Alexandre Roy', status: 'Absent'},
        {time: '12:00', patient: 'Henriette Petit', doctor: 'Dr. Alexandre Roy', status: 'En attente'},
    ]
    const appointmentsToConfirm = [
        {name: 'Nathalie Morel', date: 'Demain à 10:00', details: 'Consultation • Dr. Diallo'},
        {name: 'Paul Lefèvre', date: '26 Fév à 15:30', details: 'Premier rdv • Dr. Roy'},
        {name: 'Julie Simon', date: '26 Fév à 16:15', details: 'Suivi • Dr. Diallo'},
    ]

    return (
        <>
            <Intro role="secretariat"/>
            <div className="grid gap-4 sm:grid-cols-3">
                <Stat label="Patients attendus" value="24" note="Aujourd'hui"/>
                <Stat label="RDV à confirmer" value="5" tone="orange"/>
                <Stat label="Demandes web" value="8" tone="blue"/>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
                <Card>
                    <SectionTitle
                        role="secretariat"
                        permission="appointments.create"
                        title="File d'attente du jour"
                        action="Nouveau rendez-vous"
                    />
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#edf2f2] text-xs text-[#92a6ad]">
                                    <th className="pb-3 font-medium">Heure</th>
                                    <th className="pb-3 font-medium">Patient</th>
                                    <th className="pb-3 font-medium">Médecin</th>
                                    <th className="pb-3 font-medium">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map(({time, patient, doctor, status}) => (
                                    <tr key={patient} className="border-b border-[#f0f4f4] last:border-0">
                                        <td className="py-3 font-semibold text-[#0e8b8c]">{time}</td>
                                        <td className="py-3 font-semibold text-[#23465b]">{patient}</td>
                                        <td className="py-3 text-xs text-[#78909c]">{doctor}</td>
                                        <td className="py-3">
                                            <span className="rounded-full bg-[#fff5dd] px-2 py-1 text-[10px] font-semibold text-[#c28a2b]">
                                                {status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <Card>
                    <SectionTitle role="secretariat" title="Rendez-vous à valider (5)"/>
                    <div className="space-y-3">
                        {appointmentsToConfirm.map(({name, date, details}) => (
                            <div key={name} className="rounded-xl border border-[#edf2f2] p-3">
                                <div className="flex justify-between">
                                    <p className="text-sm font-semibold text-[#23465b]">{name}</p>
                                    <span className="text-[10px] text-[#9aadb3]">{date}</span>
                                </div>
                                <p className="mt-1 text-xs text-[#81979f]">{details}</p>
                                <div className="mt-3 flex gap-2">
                                    <PermissionAction
                                        role="secretariat"
                                        permission="appointments.manage"
                                        className="rounded-lg bg-[#e4f6f4] px-3 py-1.5 text-xs font-semibold text-[#0b898a]"
                                    >
                                        Confirmer
                                    </PermissionAction>
                                    <PermissionAction
                                        role="secretariat"
                                        permission="appointments.manage"
                                        className="rounded-lg bg-[#fff0e9] px-3 py-1.5 text-xs font-semibold text-[#d77652]"
                                    >
                                        Annuler
                                    </PermissionAction>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </>
    )
}

function AdminDashboard() {
    const consultationsByDoctor = [
        {name: 'Dr. Aminata Diallo', count: '124', percentage: 100},
        {name: 'Dr. Alassane Kanté', count: '98', percentage: 79},
        {name: 'Dr. Sara Diop', count: '45', percentage: 36},
        {name: 'Dr. Rokhya Fall', count: '30', percentage: 24},
        {name: 'Dr. Pape Sarr', count: '15', percentage: 12},
    ]
    const recentActivity = [
        {name: 'Marie Dupont (Secrétaire)', action: 'Création de compte patient pour Chantal Gauthier.', time: 'Il y a 10m'},
        {name: 'Dr. Aminata Diallo', action: 'Validation de la prescription pour Thomas Laurent.', time: 'Il y a 45m'},
        {name: 'Marie Dupont (Secrétaire)', action: 'Modification de la date du rdv de Lucas Mercier.', time: 'Il y a 2h'},
        {name: 'Système MédiCab', action: 'Sauvegarde automatique quotidienne effectuée avec succès.', time: 'Hier, 23:30'},
    ]

    return (
        <>
            <Intro role="admin"/>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Patients enregistrés" value="1 247" note="+24 ce mois-ci"/>
                <Stat label="Nouveaux ce mois" value="38" note="Objectif : 40" tone="blue"/>
                <Stat label="Consultations ce mois" value="312" note="Stable vs Fév"/>
                <Stat label="Taux d'absence" value="4.2 %" note="-0.8 % vs l’an dernier" tone="orange"/>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
                <Card>
                    <SectionTitle role="admin" title="Consultations par médecin"/>
                    <div className="space-y-4">
                        {consultationsByDoctor.map(({name, count, percentage}) => (
                            <div key={name}>
                                <div className="mb-1 flex justify-between text-sm">
                                    <span className="text-[#536f7b]">{name}</span>
                                    <span className="font-bold text-[#23465b]">{count}</span>
                                </div>
                                <div className="h-2 rounded-full bg-[#edf4f3]">
                                    <div
                                        className="h-2 rounded-full bg-[#0e8b8c]"
                                        style={{width: `${percentage}%`}}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <SectionTitle
                        role="admin"
                        permission="audit.read"
                        title="Activité récente du cabinet"
                        action="Voir le journal"
                    />
                    <div className="space-y-4">
                        {recentActivity.map(({name, action, time}) => (
                            <div key={action} className="flex gap-3">
                                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#0e8b8c]"/>
                                <div>
                                    <div className="flex flex-wrap gap-2 text-sm">
                                        <span className="font-semibold text-[#23465b]">{name}</span>
                                        <span className="text-xs text-[#9aadb3]">{time}</span>
                                    </div>
                                    <p className="mt-1 text-xs leading-5 text-[#78909c]">{action}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Card className="mt-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-[#23465b]">
                            Suivi des impayés : 480 000 FCFA en attente de règlement
                        </p>
                        <p className="mt-1 text-xs text-[#81979f]">
                            Concerne 8 dossiers distincts de tiers payant mutuelle à relancer.
                        </p>
                    </div>
                    <PermissionAction
                        role="admin"
                        permission="invoices.manage"
                        className="rounded-xl bg-[#0e8b8c] px-4 py-2.5 text-sm font-semibold text-white"
                    >
                        Relancer les mutuelles
                    </PermissionAction>
                </div>
            </Card>
        </>
    )
}

function Intro({role, user}: {role: UserRole; user?: AuthenticatedUser | null}) {
    const welcome = user?.nom ? `Bienvenue ${user.nom} • ` : ''

    return (
        <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight text-[#183b50]">{roleData[role].title}</h1>
            <p className="mt-2 text-sm text-[#78909c]">{welcome}{roleData[role].intro}</p>
        </div>
    )
}

function DashboardContent({role}: {role: UserRole}) {
    switch (role) {
        case 'patient':
            return <PatientDashboard/>
        case 'medecin':
            return <DoctorDashboard/>
        case 'secretariat':
            return <SecretariatDashboard/>
        case 'admin':
            return <AdminDashboard/>
    }
}

export function MedicabDashboard({role, user}: {role: UserRole; user: AuthenticatedUser | null}) {
    return (
        <DashboardLayout role={role} user={user}>
            <DashboardContent role={role}/>
        </DashboardLayout>
    )
}
