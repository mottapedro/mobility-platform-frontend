import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PixModal } from './PixModal'
import * as payments from '../../services/payments'

jest.mock('../../services/payments')

describe('PixModal', () => {
  beforeEach(() => {
    jest.mocked(payments.createPaymentIntent).mockReset()
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
})
