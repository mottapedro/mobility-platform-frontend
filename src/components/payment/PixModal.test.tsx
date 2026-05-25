import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PixModal } from './PixModal'

describe('PixModal', () => {
  it('renders the modal with PIX key content', () => {
    render(<PixModal rideId="ride-abc123" onClose={() => {}} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Pagar via PIX/)).toBeInTheDocument()
  })

  it('shows the last 8 chars of rideId in uppercase', () => {
    render(<PixModal rideId="0000000011223344" onClose={() => {}} />)
    expect(screen.getByText(/11223344/i)).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    render(<PixModal rideId="test-ride" onClose={onClose} />)
    const dialog = screen.getByRole('dialog')
    await user.click(dialog)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    render(<PixModal rideId="test-ride" onClose={onClose} />)
    const closeBtn = screen.getByRole('button', { name: /fechar/i })
    await user.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders the Copiar button', () => {
    render(<PixModal rideId="test-ride" onClose={() => {}} />)
    expect(screen.getByRole('button', { name: /copiar/i })).toBeInTheDocument()
  })

  it('renders the confirm payment button', () => {
    render(<PixModal rideId="test-ride" onClose={() => {}} />)
    expect(screen.getByRole('button', { name: /confirmar pagamento/i })).toBeInTheDocument()
  })
})
