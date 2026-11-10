import {MedicabLogin} from '@/components/medicab-login'

type LoginPageProps = {
    searchParams: Promise<{inscription?: string}>
}

export default async function LoginPage({searchParams}: LoginPageProps) {
    const {inscription} = await searchParams
    return <MedicabLogin registrationSuccess={inscription === 'success'}/>
}
