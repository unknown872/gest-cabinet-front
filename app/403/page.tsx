import Link from 'next/link'

export default function ForbiddenPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f8fbfc] px-6">
            <section className="max-w-md rounded-2xl border border-[#e1eaed] bg-white p-8 text-center shadow-sm">
                <p className="text-sm font-semibold text-[#0e8b8c]">Erreur 403</p>
                <h1 className="mt-3 text-2xl font-semibold text-[#123a53]">Accès interdit</h1>
                <p className="mt-3 text-sm leading-6 text-[#718894]">
                    Votre compte ne dispose pas des autorisations nécessaires pour consulter cette page.
                </p>
                <Link
                    href="/"
                    className="mt-6 inline-flex rounded-xl bg-[#0e8b8c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0a7778]"
                >
                    Retour à mon espace
                </Link>
            </section>
        </main>
    )
}
