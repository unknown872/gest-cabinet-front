'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck} from 'lucide-react'
import {registerUser, type RegisterPayload} from '@/lib/auth'

const steps = ['Personnel', 'Identifiants', 'Confirmation']

type Profile = {
    firstName: string
    lastName: string
    gender: string
    phone: string
    address: string
    dateOfBirth: string
    email: string
    password: string
    confirmPassword: string
}

const initialProfile: Profile = {
    firstName: '',
    lastName: '',
    gender: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    email: '',
    password: '',
    confirmPassword: '',
}

function Brand() {
    return (
        <div className="flex items-center gap-2.5 text-[#102f4c]">
            <div
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dff4f4] text-sm font-bold text-[#0e8b8c]">M
            </div>
            <span className="text-[22px] font-bold tracking-[-0.04em]">Médi<span
                className="text-[#0e8b8c]">Cab</span></span>
        </div>
    )
}

function Progress({current}: { current: number }) {
    return (
        <div className="mb-10 flex items-center justify-center gap-0">
            {steps.map((step, index) => {
                const active = index <= current
                return (
                    <div key={step} className="flex items-center">
                        <div className="flex flex-col items-center gap-2">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${active ? 'bg-[#0e8b8c] text-white' : 'bg-[#e8eff2] text-[#80929e]'}`}>
                                {index + 1}
                            </div>
                            <span
                                className={`text-[11px] font-medium ${active ? 'text-[#0e8b8c]' : 'text-[#94a4ad]'}`}>{step}</span>
                        </div>
                        {index < steps.length - 1 && <div
                            className={`mb-5 h-px w-16 sm:w-24 ${index < current ? 'bg-[#0e8b8c]' : 'bg-[#dce6ea]'}`}/>}
                    </div>
                )
            })}
        </div>
    )
}

function Field({label, value, onChange, type = 'text', placeholder}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string
}) {
    return (
        <label className="block space-y-2">
            <span className="text-sm font-medium text-[#24445a]">{label}</span>
            <input
                className="h-12 w-full rounded-xl border border-[#d8e3e8] bg-white px-4 text-sm text-[#18374d] shadow-[0_2px_8px_rgba(29,76,96,0.03)] outline-none transition focus:border-[#0e8b8c] focus:ring-4 focus:ring-[#0e8b8c]/10"
                value={value} onChange={(event) => onChange(event.target.value)} type={type} placeholder={placeholder}/>
        </label>
    )
}

function PasswordField({label, value, onChange}: { label: string; value: string; onChange: (value: string) => void }) {
    const [visible, setVisible] = useState(false)
    return (
        <label className="block space-y-2">
            <span className="text-sm font-medium text-[#24445a]">{label}</span>
            <span className="relative block">
        <input
            className="h-12 w-full rounded-xl border border-[#d8e3e8] bg-white px-4 pr-12 text-sm text-[#18374d] outline-none transition focus:border-[#0e8b8c] focus:ring-4 focus:ring-[#0e8b8c]/10"
            value={value} onChange={(event) => onChange(event.target.value)} type={visible ? 'text' : 'password'}/>
        <button type="button" aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                onClick={() => setVisible(!visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#90a3ae] hover:text-[#0e8b8c]">
          {visible ? <EyeOff size={18}/> : <Eye size={18}/>}
        </button>
      </span>
        </label>
    )
}

function SidePanel({screen}: { screen: 'signup' | 'login' }) {
    return (
        <aside
            className="relative hidden min-h-screen overflow-hidden bg-[#eaf8f7] lg:flex lg:w-[43%] lg:flex-col lg:justify-between lg:p-14">
            <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-[#d3f1ef] opacity-70"/>
            <div
                className="absolute -bottom-20 -left-24 h-80 w-80 rounded-full border-[42px] border-[#d9f3f1] opacity-80"/>
            <div className="relative z-10"><Brand/></div>
            <div className="relative z-10 max-w-md pb-8">
                <div
                    className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#0e8b8c] shadow-sm">
                    <ShieldCheck size={28} strokeWidth={1.7}/></div>
                <h2 className="max-w-sm text-4xl font-semibold leading-[1.12] tracking-[-0.05em] text-[#123a53]">{screen === 'signup' ? 'La santé à portée de main' : 'La gestion simplifiée de votre cabinet'}</h2>
                <p className="mt-5 text-[15px] leading-7 text-[#5a7885]">{screen === 'signup' ? 'Rejoignez MédiCab en quelques clics. Créez votre espace personnel pour suivre vos dossiers de soins, consulter vos ordonnances et rester en contact permanent avec votre équipe médicale.' : 'Gagnez du temps au quotidien pour vous concentrer sur la santé de vos patients. Un espace dédié pour les médecins, secrétaires, patients et administrateurs.'}</p>
            </div>
            <p className="relative z-10 text-xs text-[#78919d]">© 2026 MédiCab. Tous droits réservés.</p>
        </aside>
    )
}

export function MedicabOnboarding() {
    const router = useRouter()
    const [step, setStep] = useState(0)
    const [profile, setProfile] = useState(initialProfile)
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const update = (key: keyof Profile) => (value: string) => setProfile((current) => ({...current, [key]: value}))

    const goNext = () => {
        setError('')
        if (step === 0 && (!profile.firstName.trim() || !profile.lastName.trim() ||
            !profile.gender || !profile.phone.trim() || !profile.address.trim() || !profile.dateOfBirth)) {
            setError('Veuillez renseigner tous les champs personnels.')
            return
        }
        if (step === 1) {
            if (!profile.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
                setError('Veuillez saisir une adresse e-mail valide.')
                return
            }
            if (!profile.password || !profile.confirmPassword) {
                setError('Veuillez renseigner et confirmer votre mot de passe.')
                return
            }
            if (profile.password !== profile.confirmPassword) {
                setError('Les deux mots de passe ne correspondent pas.')
                return
            }
        }
        setStep((current) => Math.min(current + 1, 2))
    }

    const register = async () => {
        if (!acceptedTerms) {
            setError('Veuillez accepter les conditions générales d’utilisation.')
            return
        }

        setError('')
        setIsSubmitting(true)

        if (profile.gender !== 'MASCULIN' && profile.gender !== 'FEMININ') {
            setError('Veuillez sélectionner un genre.')
            setIsSubmitting(false)
            return
        }

        const payload: RegisterPayload = {
            nom: profile.lastName.trim(),
            prenom: profile.firstName.trim(),
            email: profile.email.trim(),
            motDePasse: profile.password,
            genre: profile.gender,
            adresse: profile.address.trim(),
            dateNaissance: profile.dateOfBirth,
            telephone: profile.phone.trim(),
        }

        try {
            await registerUser(payload)
            router.replace('/connexion?inscription=success')

        } catch (error) {
            setError(error instanceof Error
                ? error.message
                : 'Impossible de contacter le serveur. Vérifiez qu’il est démarré puis réessayez.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const goBack = () => setStep((current) => Math.max(current - 1, 0))
    return <main className="min-h-screen bg-[#f8fbfc]">
        <div className="flex min-h-screen"><SidePanel screen="signup"/>
            <section className="flex flex-1 items-center justify-center px-6 py-10">
                <div className="w-full max-w-[520px]">
                    <div className="mb-10 lg:hidden"><Brand/></div>
                    <Progress current={step}/>{step === 0 && <div>
                    <div className="mb-8"><h1
                        className="text-3xl font-semibold tracking-[-0.04em] text-[#123a53]">Informations
                        personnelles</h1><p className="mt-3 text-sm leading-6 text-[#78909c]">Commençons par faire
                        connaissance pour configurer votre dossier médical.</p></div>
                    <div className="grid gap-5 sm:grid-cols-2"><Field label="Prénom" value={profile.firstName}
                                                                      onChange={update('firstName')}/><Field label="Nom"
                                                                                                             value={profile.lastName}
                                                                                                             onChange={update('lastName')}/><label
                        className="block space-y-2"><span
                        className="text-sm font-medium text-[#24445a]">Genre</span><select
                        className="h-12 w-full appearance-none rounded-xl border border-[#d8e3e8] bg-white px-4 text-sm text-[#18374d] outline-none focus:border-[#0e8b8c] focus:ring-4 focus:ring-[#0e8b8c]/10"
                        value={profile.gender} onChange={(event) => update('gender')(event.target.value)}>
                        <option value="">Sélectionnez</option>
                        <option value="MASCULIN">Homme</option>
                        <option value="FEMININ">Femme</option>
                    </select></label>
                        <Field label="Date de naissance" value={profile.dateOfBirth}
                               onChange={update('dateOfBirth')} type="date"/>
                        <div className="sm:col-span-2"><Field label="Numéro de téléphone" value={profile.phone}
                                                              onChange={update('phone')}/></div>
                        <div className="sm:col-span-2"><Field label="Adresse" value={profile.address}
                                                              onChange={update('address')}/></div>
                    </div>
                </div>}{step === 1 && <div>
                    <div className="mb-8"><h1
                        className="text-3xl font-semibold tracking-[-0.04em] text-[#123a53]">Informations de
                        connexion</h1><p className="mt-3 text-sm leading-6 text-[#78909c]">Sécurisez l&apos;accès à
                        votre espace patient en configurant vos identifiants MédiCab.</p></div>
                    <div className="space-y-5"><Field label="Adresse e-mail" value={profile.email}
                                                      onChange={update('email')} type="email"/><PasswordField
                        label="Mot de passe" value={profile.password} onChange={update('password')}/><PasswordField
                        label="Confirmation du mot de passe" value={profile.confirmPassword}
                        onChange={update('confirmPassword')}/></div>
                </div>}{step === 2 && <div>
                    <div className="mb-8"><h1
                        className="text-3xl font-semibold tracking-[-0.04em] text-[#123a53]">Vérifiez vos
                        informations</h1><p className="mt-3 text-sm leading-6 text-[#78909c]">Veuillez confirmer
                        l&apos;exactitude des informations ci-dessous avant de finaliser la création de votre
                        compte.</p></div>
                    <div className="divide-y divide-[#e5edf0] rounded-2xl border border-[#e1eaed] bg-white px-5">
                        <div className="flex justify-between py-4 text-sm"><span
                            className="text-[#78909c]">Prénom</span><span
                            className="font-medium text-[#23465b]">{profile.firstName}</span></div>
                        <div className="flex justify-between py-4 text-sm"><span
                            className="text-[#78909c]">Nom</span><span
                            className="font-medium text-[#23465b]">{profile.lastName}</span></div>
                        <div className="flex justify-between py-4 text-sm"><span className="text-[#78909c]">Genre</span><span
                            className="font-medium text-[#23465b]">{profile.gender === 'MASCULIN' ? 'Homme' : 'Femme'}</span></div>
                        <div className="flex justify-between py-4 text-sm"><span
                            className="text-[#78909c]">Téléphone</span><span
                            className="font-medium text-[#23465b]">{profile.phone}</span></div>
                        <div className="flex justify-between py-4 text-sm"><span
                            className="text-[#78909c]">Adresse</span><span
                            className="font-medium text-[#23465b]">{profile.address}</span></div>
                        <div className="flex justify-between py-4 text-sm"><span
                            className="text-[#78909c]">Date de naissance</span><span
                            className="font-medium text-[#23465b]">{profile.dateOfBirth}</span></div>
                        <div className="flex justify-between py-4 text-sm"><span
                            className="text-[#78909c]">E-mail</span><span
                            className="font-medium text-[#23465b]">{profile.email}</span></div>
                    </div>
                    <label className="mt-6 flex items-start gap-3 text-sm leading-5 text-[#526f7b]"><input
                        type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)}
                        className="mt-1 h-4 w-4 accent-[#0e8b8c]"/>J&apos;accepte les conditions
                        générales d&apos;utilisation</label></div>}
                    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                    <div className="mt-9 flex gap-3">{step > 0 && <button onClick={goBack}
                                                                          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#d8e3e8] text-sm font-semibold text-[#426274] hover:bg-white">
                        <ArrowLeft size={16}/>Précédent</button>}
                        <button onClick={step === 2 ? register : goNext} disabled={isSubmitting}
                                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0e8b8c] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(14,139,140,0.18)] hover:bg-[#0a7778] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Création en cours…' : step === 2 ? 'Créer mon compte' : 'Suivant'}{step < 2 &&
                            <ArrowRight size={16}/>}</button>
                    </div>
                    <p className="mt-8 text-center text-sm text-[#718894]">Déjà inscrit ? <a
                        href="/connexion" className="font-semibold text-[#0e8b8c] hover:underline">Se connecter</a></p>
                </div>
            </section>
        </div>
    </main>
}
