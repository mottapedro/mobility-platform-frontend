import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PixModal } from './PixModal'
import * as payments from '../../services/payments'

jest.mock('../../services/payments')

describe('PixModal', () => {
  beforeEach(() => {
    jest.mocked(payments.createPaymentIntent).mockReset()
    jest.mocked(payments.confirmPaymentManually).mockReset()
  })

  it('renders the modal and calls API on mount', async () => {
    jest.mocked(payments.createPaymentIntent).mockResolvedValue({
      qrCode: '00020126580014br.gov.bcb.pix0136123456789005204000053039865802BR5909Aliado6008BRASILIA62070503***63041234',
      pixKey: '12345678900',
      pixCopiaCola: '00020126580014br.gov.bcb.pix0136123456789005204000053039865802BR5909Aliado6008BRASILIA62070503***63041234',
      amount: 5000,
      status: 'pending',
    })
    render(<PixModal rideId="ride-abc123" onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: /pagar via pix/i })).toBeInTheDocument()
    expect(payments.createPaymentIntent).toHaveBeenCalledWith('ride-abc123', undefined)
  })

  it('uses fixed random PIX key exclusively, ignoring backend payload', async () => {
    jest.mocked(payments.createPaymentIntent).mockResolvedValue({
      qrCode: '00020126580014br.gov.bcb.pix0136123456789005204000053039865802BR5909Aliado6008BRASILIA62070503***63041234',
      pixCopiaCola: '00020126580014br.gov.bcb.pix0136123456789005204000053039865802BR5909Aliado6008BRASILIA62070503***63041234',
      amount: 5000,
      status: 'pending',
    })
    render(<PixModal rideId="ride-abc123" onClose={() => {}} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    const copyBtn = await screen.findByRole('button', { name: /copiar/i })
    expect(copyBtn).toBeInTheDocument()
  })

  it('shows the last 8 chars of rideId in uppercase', async () => {
    jest.mocked(payments.createPaymentIntent).mockResolvedValue({
      qrCode: '',
      pixCopiaCola: '',
      amount: 5000,
      status: 'pending',
    })
    render(<PixModal rideId="0000000011223344" onClose={() => {}} />)
    await screen.findByText(/11223344/i)
  })

  it('calls onClose when backdrop is clicked', async () => {
    jest.mocked(payments.createPaymentIntent).mockResolvedValue({
      qrCode: '',
      pixCopiaCola: '',
      amount: 5000,
      status: 'pending',
    })
    const user = userEvent.setup()
    const onClose = jest.fn()
    render(<PixModal rideId="test-ride" onClose={onClose} />)
    const dialog = screen.getByRole('dialog')
    await user.click(dialog)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when X button is clicked', async () => {
    jest.mocked(payments.createPaymentIntent).mockResolvedValue({
      qrCode: '',
      pixCopiaCola: '',
      amount: 5000,
      status: 'pending',
    })
    const user = userEvent.setup()
    const onClose = jest.fn()
    render(<PixModal rideId="test-ride" onClose={onClose} />)
    const closeBtn = screen.getByRole('button', { name: /fechar/i })
    await user.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders the Copiar button', async () => {
    jest.mocked(payments.createPaymentIntent).mockResolvedValue({
      qrCode: '00020126580014br.gov.bcb.pix0136123456789005204000053039865802BR5909Aliado6008BRASILIA62070503***63041234',
      pixCopiaCola: '00020126580014br.gov.bcb.pix0136123456789005204000053039865802BR5909Aliado6008BRASILIA62070503***63041234',
      amount: 5000,
      status: 'pending',
    })
    render(<PixModal rideId="test-ride" onClose={() => {}} />)
    // Aguarda o modal sair do loading e o botão copiar aparecer
    const copyBtn = await screen.findByRole('button', { name: /copiar/i })
    expect(copyBtn).toBeInTheDocument()
  })

  it('renders the confirm payment button', () => {
    jest.mocked(payments.createPaymentIntent).mockResolvedValue({
      qrCode: '',
      pixCopiaCola: '',
      amount: 5000,
      status: 'pending',
    })
    render(<PixModal rideId="test-ride" onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: /pagar via pix/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /já paguei/i }),
    ).toBeInTheDocument()
  })

  it('renders only the backend breakdown components in cents', async () => {
    jest.mocked(payments.createPaymentIntent).mockResolvedValue({
      qrCode: '00020126580014br.gov.bcb.pix0136123456789005204000053039865802BR5909Aliado6008BRASILIA62070503***63041234',
      amount: 73.66,
      status: 'pending',
      breakdown: [
        { code: 'TRANSPORT_SERVICE', label: 'Serviço de transporte', amountCents: 6336 },
        { code: 'DRIVER_APPROACH', label: 'Deslocamento do motorista', amountCents: 780 },
        { code: 'PLATFORM_FEE', label: 'Taxa da plataforma', amountCents: 250 },
      ],
    })

    render(<PixModal rideId="ride-breakdown" onClose={() => {}} />)

    expect(await screen.findByText('Serviço de transporte')).toBeInTheDocument()
    expect(screen.getByText('Deslocamento do motorista')).toBeInTheDocument()
    expect(screen.getByText('Taxa da plataforma')).toBeInTheDocument()
    expect(screen.queryByText('Aliado Mobilidade')).not.toBeInTheDocument()
    expect(screen.getAllByText('R$ 63,36').length).toBeGreaterThan(0)
    expect(screen.getAllByText('R$ 7,80').length).toBeGreaterThan(0)
    expect(screen.getAllByText('R$ 2,50').length).toBeGreaterThan(0)
  })

  it('confirms the same ride through the manual endpoint and shows success only after 2xx', async () => {
    jest.mocked(payments.createPaymentIntent).mockResolvedValue({ amount: 50, status: 'pending' })
    jest.mocked(payments.confirmPaymentManually).mockResolvedValue({
      success: true,
      rideId: 'ride-manual',
      intentId: 'intent-1',
      status: 'CONFIRMED',
      settlementId: 'settlement-1',
      settled: true,
      confirmationMode: 'MANUAL',
    })
    const user = userEvent.setup()
    render(<PixModal rideId="ride-manual" onClose={() => {}} />)

    const button = await screen.findByRole('button', { name: /paguei/i })
    await user.click(button)

    await waitFor(() => expect(payments.confirmPaymentManually).toHaveBeenCalledWith('ride-manual'))
    expect(payments.createPaymentIntent).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('dialog', { name: /pagamento confirmado/i })).toBeInTheDocument()
  })

  it('keeps the modal open and retries the same ride after a confirmation error', async () => {
    jest.mocked(payments.createPaymentIntent).mockResolvedValue({ amount: 50, status: 'pending' })
    jest.mocked(payments.confirmPaymentManually)
      .mockRejectedValueOnce(new Error('Pagamento ainda não confirmado'))
      .mockResolvedValueOnce({
        success: true,
        rideId: 'ride-retry',
        intentId: 'intent-2',
        status: 'CONFIRMED',
        settlementId: 'settlement-2',
        settled: false,
        confirmationMode: 'MANUAL',
      })
    const user = userEvent.setup()
    render(<PixModal rideId="ride-retry" onClose={() => {}} />)
    const button = await screen.findByRole('button', { name: /paguei/i })

    await user.click(button)
    expect(await screen.findByText('Pagamento ainda não confirmado')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: /pagar via pix/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /paguei/i }))
    await waitFor(() => expect(payments.confirmPaymentManually).toHaveBeenCalledTimes(2))
    expect(payments.confirmPaymentManually).toHaveBeenNthCalledWith(1, 'ride-retry')
    expect(payments.confirmPaymentManually).toHaveBeenNthCalledWith(2, 'ride-retry')
    expect(payments.createPaymentIntent).toHaveBeenCalledTimes(1)
  })

  it('ignores a double click while manual confirmation is pending', async () => {
    jest.mocked(payments.createPaymentIntent).mockResolvedValue({ amount: 50, status: 'pending' })
    let resolveConfirmation!: (value: payments.ManualPaymentConfirmationResponse) => void
    jest.mocked(payments.confirmPaymentManually).mockReturnValue(new Promise((resolve) => {
      resolveConfirmation = resolve
    }))
    const user = userEvent.setup()
    render(<PixModal rideId="ride-double" onClose={() => {}} />)
    const button = await screen.findByRole('button', { name: /paguei/i })

    await user.click(button)
    await user.click(button)
    expect(payments.confirmPaymentManually).toHaveBeenCalledTimes(1)
    resolveConfirmation({
      success: true,
      rideId: 'ride-double',
      intentId: 'intent-3',
      status: 'CONFIRMED',
      settlementId: 'settlement-3',
      settled: true,
      confirmationMode: 'MANUAL',
    })
    await waitFor(() => expect(screen.getByRole('dialog', { name: /pagamento confirmado/i })).toBeInTheDocument())
  })
})
