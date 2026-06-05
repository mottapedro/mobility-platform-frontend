import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { PassengerReferralCard } from './PassengerReferralCard'

afterEach(() => {
  delete (navigator as { clipboard?: unknown }).clipboard
})

describe('PassengerReferralCard — URL source', () => {
  it('renders all action buttons enabled when p2pUrl is provided', async () => {
    render(
      <PassengerReferralCard
        passengerId="pax-1"
        passengerName="Celso Amorim das Neves"
        p2pUrl="https://app.aliado.app/r/ca-neves-7g2k"
      />,
    )

    await act(async () => {})

    screen.getAllByRole('button').forEach((btn) => expect(btn).not.toBeDisabled())
  })

  it('disables all action buttons when both p2pUrl and referralCode are absent', async () => {
    render(
      <PassengerReferralCard
        passengerId="pax-1"
        passengerName="Celso Amorim das Neves"
        p2pUrl={null}
        referralCode={null}
      />,
    )

    await act(async () => {})

    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled())
  })

  it('does not write any URL to clipboard when no backend URL is present', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    })

    render(
      <PassengerReferralCard
        passengerId="pax-1"
        passengerName="Celso Amorim das Neves"
        p2pUrl={null}
        referralCode={null}
      />,
    )

    await act(async () => {})

    screen.getAllByRole('button').forEach((btn) => fireEvent.click(btn))

    expect(writeText).not.toHaveBeenCalled()
  })

  it('enables card and copies /r/{referralCode} when only referralCode is provided', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    })

    render(
      <PassengerReferralCard
        passengerId="pax-1"
        passengerName="Alice"
        p2pUrl={null}
        referralCode="alice-code-123"
      />,
    )

    await act(async () => {})

    fireEvent.click(screen.getByRole('button', { name: /^Copiar$/i }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/r/alice-code-123'))
    })
  })
})
