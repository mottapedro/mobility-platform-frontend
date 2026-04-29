import { render, screen } from '@testing-library/react'
import { Countdown } from './Countdown'

function isoSecondsFromNow(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString()
}

function isoSecondsAgo(seconds: number): string {
  return new Date(Date.now() - seconds * 1000).toISOString()
}

describe('Countdown', () => {
  it('shows "Expirado" when the expiry date is in the past', () => {
    render(<Countdown expiresAt={isoSecondsAgo(10)} />)
    expect(screen.getByText('Expirado')).toBeInTheDocument()
  })

  it('shows remaining seconds when under 60 seconds remain', () => {
    render(<Countdown expiresAt={isoSecondsFromNow(45)} />)
    expect(screen.getByText(/Expira em \d+s/)).toBeInTheDocument()
  })

  it('shows minutes and seconds when more than 60 seconds remain', () => {
    render(<Countdown expiresAt={isoSecondsFromNow(130)} />)
    expect(screen.getByText(/Expira em \d+m \d+s/)).toBeInTheDocument()
  })

  it('applies urgent style (text-red-400) when 30 seconds or fewer remain', () => {
    render(<Countdown expiresAt={isoSecondsFromNow(25)} />)
    const el = screen.getByText(/Expira em/)
    expect(el.className).toContain('text-red-400')
  })

  it('does not apply urgent style when more than 30 seconds remain', () => {
    render(<Countdown expiresAt={isoSecondsFromNow(90)} />)
    const el = screen.getByText(/Expira em/)
    expect(el.className).not.toContain('text-red-400')
  })
})
