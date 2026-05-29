import { resolveInviteUrl } from './inviteUrls'

describe('resolveInviteUrl', () => {
  it('prefers explicit d2d over legacy aliases', () => {
    const result = resolveInviteUrl(
      {
        d2d: 'https://aliado.app/invite/d2d/abc',
        driverToDriver: 'https://aliado.app/invite/driver/legacy',
      },
      'd2d',
    )

    expect(result).toBe('https://aliado.app/invite/d2d/abc')
  })

  it('falls back to legacy alias when explicit key is absent', () => {
    const result = resolveInviteUrl(
      {
        driverToPassenger: 'https://aliado.app/invite/passenger/legacy',
      },
      'd2p',
    )

    expect(result).toBe('https://aliado.app/invite/passenger/legacy')
  })

  it('resolves p2p from explicit or legacy key', () => {
    expect(
      resolveInviteUrl(
        {
          p2p: 'https://aliado.app/invite/p2p/new',
        },
        'p2p',
      ),
    ).toBe('https://aliado.app/invite/p2p/new')

    expect(
      resolveInviteUrl(
        {
          passengerToPassenger: 'https://aliado.app/invite/passenger/peer',
        },
        'p2p',
      ),
    ).toBe('https://aliado.app/invite/passenger/peer')
  })

  it('returns null for missing or blank values', () => {
    expect(resolveInviteUrl(null, 'd2d')).toBeNull()
    expect(resolveInviteUrl({ d2d: '   ' }, 'd2d')).toBeNull()
  })
})
