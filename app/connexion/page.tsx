import {MedicabLogin} from '@/components/medicab-login'

type LoginPageProps = {
    searchParams: Promise<{inscription?: string; returnTo?: string}>
}

export default async function LoginPage({searchParams}: LoginPageProps) {
    const {inscription, returnTo} = await searchParams
    return <MedicabLogin registrationSuccess={inscription === 'success'} returnTo={returnTo}/>
}
