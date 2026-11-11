'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Eye, EyeOff, ShieldCheck} from 'lucide-react'
import {getRoleRoute, getSafeReturnTo, loginUser} from '@/lib/auth'

function Brand() {
    return (
        <div className="flex items-center gap-2.5 text-[#102f4c]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dff4f4] text-sm font-bold text-[#0e8b8c]">M</div>
            <span className="text-[22px] font-bold tracking-[-0.04em]">Médi<span className="text-[#0e8b8c]">Cab</span></span>
        </div>
    )
}

export function MedicabLogin({registrationSuccess, returnTo}: {registrationSuccess: boolean; returnTo?: string}) {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (isSubmitting) return
        setError('')

        const trimmedEmail = email.trim()
        if (!trimmedEmail || !password) {
            setError('Veuillez renseigner votre e-mail et votre mot de passe.')
            return
        }

        setIsSubmitting(true)

        try {
            const {user} = await loginUser({
                email: trimmedEmail,
                motDePasse: password,
            })

            router.replace(getSafeReturnTo(returnTo) ?? getRoleRoute(user.role))
            router.refresh()
        } catch (loginError) {
            setError(loginError instanceof Error ? loginError.message : 'Une erreur est survenue pendant la connexion.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="min-h-screen bg-[#f8fbfc]">
            <div className="flex min-h-screen">
                <aside className="relative hidden min-h-screen overflow-hidden bg-[#eaf8f7] lg:flex lg:w-[43%] lg:flex-col lg:justify-between lg:p-14">
                    <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-[#d3f1ef] opacity-70"/>
                    <div className="absolute -bottom-20 -left-24 h-80 w-80 rounded-full border-[42px] border-[#d9f3f1] opacity-80"/>
                    <div className="relative z-10"><Brand/></div>
                    <div className="relative z-10 max-w-md pb-8">
                        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#0e8b8c] shadow-sm">
                            <ShieldCheck size={28} strokeWidth={1.7}/>
                        </div>
                        <h2 className="max-w-sm text-4xl font-semibold leading-[1.12] tracking-[-0.05em] text-[#123a53]">
                            La gestion simplifiée de votre cabinet
                        </h2>
                        <p className="mt-5 text-[15px] leading-7 text-[#5a7885]">
                            Gagnez du temps au quotidien pour vous concentrer sur la santé de vos patients. Un espace dédié pour les médecins, secrétaires, patients et administrateurs.
                        </p>
                    </div>
                    <p className="relative z-10 text-xs text-[#78919d]">© 2026 MédiCab. Tous droits réservés.</p>
                </aside>
                <section className="flex flex-1 items-center justify-center px-6 py-12">
                    <div className="w-full max-w-[430px]">
                        <div className="mb-10 lg:hidden"><Brand/></div>
                        <div className="mb-9">
                            <p className="mb-3 text-sm font-semibold text-[#0e8b8c]">Bienvenue</p>
                            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#123a53]">Connectez-vous à votre espace</h1>
                            <p className="mt-3 text-sm leading-6 text-[#78909c]">Accédez à votre cabinet médical en toute simplicité.</p>
                        </div>
                        {registrationSuccess && (
                            <p role="status" className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.
                            </p>
                        )}
                        {error && (
                            <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </p>
                        )}
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-[#24445a]">Identifiant ou e-mail</span>
                                <input
                                    className="h-12 w-full rounded-xl border border-[#d8e3e8] bg-white px-4 text-sm text-[#18374d] outline-none focus:border-[#0e8b8c] focus:ring-4 focus:ring-[#0e8b8c]/10"
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    autoComplete="email"
                                    placeholder="votre.identifiant@medicab.fr"
                                />
                            </label>
                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-[#24445a]">Mot de passe</span>
                                <span className="relative block">
                                    <input
                                        className="h-12 w-full rounded-xl border border-[#d8e3e8] bg-white px-4 pr-12 text-sm text-[#18374d] outline-none focus:border-[#0e8b8c] focus:ring-4 focus:ring-[#0e8b8c]/10"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                        onClick={() => setShowPassword((visible) => !visible)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#90a3ae] hover:text-[#0e8b8c]"
                                    >
                                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                    </button>
                                </span>
                            </label>
                            <div className="text-right">
                                <button type="button" className="text-xs font-medium text-[#0e8b8c] hover:underline">
                                    Mot de passe oublié ?
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#0e8b8c] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(14,139,140,0.18)] transition hover:bg-[#0a7778] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isSubmitting ? 'Connexion...' : 'Se connecter'}
                            </button>
                        </form>
                        <p className="mt-8 text-center text-sm text-[#718894]">
                            Pas encore de compte ? <a href="/inscription" className="font-semibold text-[#0e8b8c] hover:underline">Créer un compte</a>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    )
}
