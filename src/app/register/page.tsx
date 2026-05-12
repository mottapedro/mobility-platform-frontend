import RegisterPageClient from './RegisterPageClient'

type RegisterPageProps = {
  searchParams: Promise<{ ref?: string }>
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { ref } = await searchParams

  return <RegisterPageClient referralSlug={typeof ref === 'string' ? ref : ''} />
}
