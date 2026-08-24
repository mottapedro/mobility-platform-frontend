import { AUTH_INVALIDATED_EVENT, ApiError, api } from './api'

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

  it('dispatches auth invalidation on protected endpoint 401', async () => {
    const listener = jest.fn()
    localStorage.setItem('aliado:auth', JSON.stringify({ id: 'u1' }))
    localStorage.setItem('aliado:token', 'expired-token')
    localStorage.setItem('passengerId', 'p1')
    localStorage.setItem('driverId', 'd1')
    window.addEventListener(AUTH_INVALIDATED_EVENT, listener)
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve(JSON.stringify({ error: 'Unauthorized' })),
    } as unknown as Response)

    await expect(api.get('/protected')).rejects.toMatchObject({ status: 401 })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('aliado:auth')).toBeNull()
    expect(localStorage.getItem('aliado:token')).toBeNull()
    expect(localStorage.getItem('passengerId')).toBeNull()
    expect(localStorage.getItem('driverId')).toBeNull()
    window.removeEventListener(AUTH_INVALIDATED_EVENT, listener)
  })

  it('does not dispatch auth invalidation for login 401', async () => {
    const listener = jest.fn()
    window.addEventListener(AUTH_INVALIDATED_EVENT, listener)
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve(JSON.stringify({ error: 'Invalid credentials' })),
    } as unknown as Response)

    await expect(api.post('/auth/login', { email: 'a@b.com', password: 'bad' })).rejects.toMatchObject({ status: 401 })
    expect(listener).not.toHaveBeenCalled()
    window.removeEventListener(AUTH_INVALIDATED_EVENT, listener)
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

describe('api.get — auto token injection from localStorage', () => {
  const originalFetch = global.fetch
  const originalEnv = process.env.NEXT_PUBLIC_API_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'
    localStorage.clear()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('{}'),
    } as unknown as Response)
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env.NEXT_PUBLIC_API_URL = originalEnv
    localStorage.clear()
  })

  it('sends Authorization header when aliado:token is in localStorage', async () => {
    localStorage.setItem('aliado:token', 'jwt-abc-123')
    await api.get('/drivers/d1/network')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-abc-123',
        }),
      }),
    )
  })

  it('does not send Authorization header when localStorage has no token', async () => {
    await api.get('/drivers/d1/network')
    const callHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers
    expect(callHeaders).not.toHaveProperty('Authorization')
  })

  it('explicit token parameter takes precedence over localStorage token', async () => {
    localStorage.setItem('aliado:token', 'stored-token')
    await api.get('/drivers/d1/network', 'explicit-token')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer explicit-token',
        }),
      }),
    )
  })

  it('does not send x-driver-id when localStorage has an invalid driverId', async () => {
    localStorage.setItem('driverId', 'undefined')

    await api.get('/drivers/d1/network')

    const callHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers
    expect(callHeaders).not.toHaveProperty('x-driver-id')
  })
})
