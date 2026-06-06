import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddressInput } from './AddressInput'
import * as geocode from '../../services/geocode'

jest.mock('../../services/geocode')
const mockSearch = geocode.searchAddresses as jest.MockedFunction<typeof geocode.searchAddresses>

const SUGGESTIONS = [
  { displayName: 'Barra da Tijuca, Rio de Janeiro, RJ, Brasil', lat: -22.9988, lng: -43.3654 },
  { displayName: 'Barra Funda, São Paulo, SP, Brasil', lat: -23.5272, lng: -46.6621 },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockSearch.mockResolvedValue([])
})

describe('AddressInput', () => {
  it('renders label and input', () => {
    render(
      <AddressInput
        label="Origem"
        placeholder="Digite o endereço"
        value=""
        onChange={jest.fn()}
      />,
    )
    expect(screen.getByText('Origem')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Digite o endereço')).toBeInTheDocument()
  })

  it('calls onChange with typed value', async () => {
    const onChange = jest.fn()
    render(
      <AddressInput label="Origem" placeholder="Endereço" value="" onChange={onChange} />,
    )
    const input = screen.getByPlaceholderText('Endereço')
    await userEvent.type(input, 'B')
    expect(onChange).toHaveBeenCalledWith('B')
  })

  it('shows suggestions dropdown after debounce when results exist', async () => {
    mockSearch.mockResolvedValue(SUGGESTIONS)
    const onChange = jest.fn()

    render(
      <AddressInput label="Origem" placeholder="Endereço" value="Barra" onChange={onChange} />,
    )

    await waitFor(
      () => {
        expect(mockSearch).toHaveBeenCalledWith('Barra')
      },
      { timeout: 600 },
    )

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    expect(screen.getByText(/Barra da Tijuca/)).toBeInTheDocument()
  })

  it('selects a suggestion and calls onChange with coords', async () => {
    mockSearch.mockResolvedValue(SUGGESTIONS)
    const onChange = jest.fn()

    render(
      <AddressInput label="Origem" placeholder="Endereço" value="Barra" onChange={onChange} />,
    )

    await waitFor(() => screen.getByRole('listbox'), { timeout: 600 })

    const firstOption = screen.getAllByRole('option')[0]
    fireEvent.mouseDown(firstOption)

    expect(onChange).toHaveBeenCalledWith(SUGGESTIONS[0].displayName, {
      lat: SUGGESTIONS[0].lat,
      lng: SUGGESTIONS[0].lng,
    })
  })

  it('hides dropdown on Escape key', async () => {
    mockSearch.mockResolvedValue(SUGGESTIONS)

    render(
      <AddressInput label="Origem" placeholder="Endereço" value="Barra" onChange={jest.fn()} />,
    )

    await waitFor(() => screen.getByRole('listbox'), { timeout: 600 })

    const input = screen.getByPlaceholderText('Endereço')
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('does not search when value is shorter than 4 chars', async () => {
    render(
      <AddressInput label="Origem" placeholder="Endereço" value="Bar" onChange={jest.fn()} />,
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 500))
    })

    expect(mockSearch).not.toHaveBeenCalled()
  })
})
