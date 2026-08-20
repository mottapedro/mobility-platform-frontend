import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OperationalBaseInput, type OperationalBaseSelection } from './OperationalBaseInput'
import * as geocode from '../../services/geocode'

jest.mock('../../services/geocode')
const mockSearch = geocode.searchAddresses as jest.MockedFunction<typeof geocode.searchAddresses>

const SUGGESTIONS = [
  { displayName: 'Av. Rio Branco, 1500, Centro, Rio de Janeiro, RJ', placeId: 'place-rio-001', lat: -22.9055, lng: -43.1791 },
  { displayName: 'Av. Paulista, 100, Bela Vista, São Paulo, SP', placeId: 'place-spa-001', lat: -23.5614, lng: -46.6558 },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockSearch.mockResolvedValue([])
})

describe('OperationalBaseInput', () => {
  it('renders label, helper text and input', () => {
    render(<OperationalBaseInput value={null} onChange={jest.fn()} />)
    expect(screen.getByText(/base de atendimento/i)).toBeInTheDocument()
    expect(
      screen.getByText(/usaremos esta base quando sua localização atual/i)
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/endereço\/base de onde você normalmente/i)
    ).toBeInTheDocument()
  })

  it('shows suggestions dropdown after debounce when results exist', async () => {
    mockSearch.mockResolvedValue(SUGGESTIONS)
    const onChange = jest.fn()

    render(<OperationalBaseInput value={null} onChange={onChange} />)
    const input = screen.getByPlaceholderText(/endereço\/base de onde você normalmente/i)

    fireEvent.change(input, { target: { value: 'Av. Rio' } })

    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument(), {
      timeout: 600,
    })

    expect(screen.getByText(/Av\. Rio Branco/)).toBeInTheDocument()
  })

  it('selects a suggestion and calls onChange with formattedAddress + providerPlaceId (no lat/lng)', async () => {
    mockSearch.mockResolvedValue(SUGGESTIONS)
    const onChange = jest.fn()

    render(<OperationalBaseInput value={null} onChange={onChange} />)
    const input = screen.getByPlaceholderText(/endereço\/base de onde você normalmente/i)

    fireEvent.change(input, { target: { value: 'Av. Rio' } })

    await waitFor(() => screen.getByRole('listbox'), { timeout: 600 })

    fireEvent.mouseDown(screen.getAllByRole('option')[0])

    const expected: OperationalBaseSelection = {
      formattedAddress: 'Av. Rio Branco, 1500, Centro, Rio de Janeiro, RJ',
      providerPlaceId: 'place-rio-001',
    }
    expect(onChange).toHaveBeenCalledWith(expected)
    // Assert the selection never leaks lat/lng
    expect(JSON.stringify(onChange.mock.calls[0][0])).not.toContain('lat')
    expect(JSON.stringify(onChange.mock.calls[0][0])).not.toContain('lng')
    expect(screen.getByText(/endereço confirmado na lista de sugestões/i)).toBeInTheDocument()
  })

  it('clears the selection when the user edits the typed text manually', async () => {
    const onChange = jest.fn()
    const current: OperationalBaseSelection = {
      formattedAddress: 'Av. Rio Branco, 1500, Centro, Rio de Janeiro, RJ',
      providerPlaceId: 'place-rio-001',
    }

    render(<OperationalBaseInput value={current} onChange={onChange} />)
    const input = screen.getByPlaceholderText(/endereço\/base de onde você normalmente/i)
    expect(input).toHaveValue('Av. Rio Branco, 1500, Centro, Rio de Janeiro, RJ')

    fireEvent.change(input, { target: { value: 'Av. Rio' } })

    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('calls onChange(null) when a suggestion lacks providerPlaceId', async () => {
    mockSearch.mockResolvedValue([
      { displayName: 'Texto sem place', lat: -22.9, lng: -43.1 },
    ])
    const onChange = jest.fn()

    render(<OperationalBaseInput value={null} onChange={onChange} />)
    const input = screen.getByPlaceholderText(/endereço\/base de onde você normalmente/i)

    fireEvent.change(input, { target: { value: 'Texto sem' } })

    await waitFor(() => screen.getByRole('listbox'), { timeout: 600 })

    fireEvent.mouseDown(screen.getAllByRole('option')[0])

    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('renders the error message when provided', () => {
    render(
      <OperationalBaseInput
        value={null}
        onChange={jest.fn()}
        error="Selecione um endereço válido da lista de sugestões"
      />
    )
    expect(screen.getByText(/selecione um endereço válido/i)).toBeInTheDocument()
  })

  it('does not search when value is shorter than 4 chars', async () => {
    render(<OperationalBaseInput value={null} onChange={jest.fn()} />)
    const input = screen.getByPlaceholderText(/endereço\/base de onde você normalmente/i)

    fireEvent.change(input, { target: { value: 'Rio' } })

    await act(async () => {
      await new Promise((r) => setTimeout(r, 500))
    })

    expect(mockSearch).not.toHaveBeenCalled()
  })
})