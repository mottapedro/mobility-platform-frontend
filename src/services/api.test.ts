import { ApiError, api } from './api'

describe('ApiError', () => {
  it('is an instance of Error', () => {
    const err = new ApiError(404, 'Not Found')
    expect(err).toBeInstanceOf(Error)
  })

  it('sets status and message correctly', () => {
    const err = new ApiError(422, 'Unprocessable Entity')
    expect(err.status).toBe(422)
    expect(err.message).toBe('Unprocessable Entity')
  })

  it('has name "ApiError"', () => {
    const err = new ApiError(500, 'Internal Server Error')
    expect(err.name).toBe('ApiError')
  })
})

describe('api.get — request()', () => {
  const originalFetch = global.fetch
  const originalEnv = process.env.NEXT_PUBLIC_API_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'
    jest.resetModules()
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env.NEXT_PUBLIC_API_URL = originalEnv
  })

  it('returns parsed JSON on success', async () => {
    const payload = { id: '1', name: 'Test' }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(payload)),
    } as unknown as Response)

    const result = await api.get<typeof payload>('/test')
    expect(result).toEqual(payload)
  })

  it('throws ApiError with status on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve('Not Found'),
    } as unknown as Response)

    await expect(api.get('/missing')).rejects.toThrow(ApiError)
    await expect(api.get('/missing')).rejects.toMatchObject({ status: 404 })
  })

  it('returns undefined when response body is empty', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(''),
    } as unknown as Response)

    const result = await api.get('/empty')
    expect(result).toBeUndefined()
  })
})
