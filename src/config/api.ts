const isTestEnv = process.env.NODE_ENV === 'test'

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? (isTestEnv ? 'http://localhost:3000' : '')) as string

if (!API_URL && !isTestEnv) {
  throw new Error('NEXT_PUBLIC_API_URL não definida')
}
