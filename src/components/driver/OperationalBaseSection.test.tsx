import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OperationalBaseSection } from './OperationalBaseSection'
import * as driversService from '../../services/drivers'

jest.mock('../../services/drivers', () => ({
  getDriverOperationalBase: jest.fn(),
  updateDriverOperationalBase: jest.fn(),
}))

jest.mock('./OperationalBaseInput', () => ({
  OperationalBaseInput: ({
    onChange,
    error,
  }: {
    onChange: (value: {
      formattedAddress: string
      providerPlaceId: string
    }) => void
    error?: string
  }) => (
    <div>
      <input aria-label="base-input" readOnly />
      <button
        type="button"
        onClick={() =>
          onChange({
            formattedAddress: 'Av. Paulista, 1000, São Paulo, SP',
            providerPlaceId: 'ChIJ_paulista',
          })
        }
      >
        Selecionar sugestão
      </button>
      {error ? <p aria-live="polite">{error}</p> : null}
    </div>
  ),
}))

const mockGet = driversService.getDriverOperationalBase as jest.MockedFunction<
  typeof driversService.getDriverOperationalBase
>
const mockUpdate = driversService.updateDriverOperationalBase as jest.MockedFunction<
  typeof driversService.updateDriverOperationalBase
>

const BASE = {
  id: 'base_1',
  driverId: 'drv_1',
  formattedAddress: 'Av. Paulista, 1000, São Paulo, SP',
  providerPlaceId: 'ChIJ_paulista',
  latitude: -23.5614,
  longitude: -46.6558,
  updatedAt: '2026-08-18T00:00:00.000Z',
}

function linkNeverResolves() {
  return new Promise<never>(() => undefined)
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('OperationalBaseSection — self-service states', () => {
  it('1. mostra LOADING enquanto a base é carregada', () => {
    mockGet.mockReturnValue(linkNeverResolves() as never)

    render(<OperationalBaseSection />)

    expect(screen.getByText(/carregando base de atendimento/i)).toBeInTheDocument()
  })

  it('2. sem base cadastrada → estado NO_BASE com CTA "Configurar base"', async () => {
    mockGet.mockResolvedValue(null)

    render(<OperationalBaseSection />)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Configurar base' })).toBeInTheDocument(),
    )
    expect(screen.getByText(/você ainda não cadastrou a base/i)).toBeInTheDocument()
  })

  it('3. base cadastrada → estado CONFIGURED exibe o endereço e "Editar"', async () => {
    mockGet.mockResolvedValue(BASE)

    render(<OperationalBaseSection />)

    await waitFor(() => expect(screen.getByText(BASE.formattedAddress)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Configurar base' })).toBeNull()
  })

  it('4. EDITING renderiza o input e "Salvar" fica desabilitado até haver seleção válida', async () => {
    mockGet.mockResolvedValue(null)

    render(<OperationalBaseSection />)

    const configure = await screen.findByRole('button', { name: 'Configurar base' })
    fireEvent.click(configure)

    expect(screen.getByLabelText('base-input')).toBeInTheDocument()
    const save = screen.getByRole('button', { name: 'Salvar base' })
    expect(save).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar sugestão' }))
    expect(screen.getByRole('button', { name: 'Salvar base' })).toBeEnabled()
  })

  it('5. SAVING → PUT envia APENAS formattedAddress + providerPlaceId e mostra SUCCESS', async () => {
    mockGet.mockResolvedValue(null)
    mockUpdate.mockResolvedValue(BASE)

    render(<OperationalBaseSection />)

    fireEvent.click(await screen.findByRole('button', { name: 'Configurar base' }))
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar sugestão' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar base' }))

    await screen.findByText('✓ Base de atendimento atualizada')

    expect(mockUpdate).toHaveBeenCalledWith({
      formattedAddress: BASE.formattedAddress,
      providerPlaceId: BASE.providerPlaceId,
    })
    const sent = mockUpdate.mock.calls[0][0] as Record<string, unknown>
    expect(sent).not.toHaveProperty('latitude')
    expect(sent).not.toHaveProperty('longitude')
    expect(screen.getByText(BASE.formattedAddress)).toBeInTheDocument()
  })

  it('6. falha no PUT → ERROR e permanece em EDITING para retry', async () => {
    mockGet.mockResolvedValue(BASE)
    mockUpdate.mockRejectedValue(new Error('falha simulada'))

    render(<OperationalBaseSection />)

    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar sugestão' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar base' }))

    await screen.findByText('falha simulada')
    expect(screen.getByRole('button', { name: 'Salvar base' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('7. Cancelar no EDITING de uma base existente volta para CONFIGURED sem chamar PUT', async () => {
    mockGet.mockResolvedValue(BASE)

    render(<OperationalBaseSection />)

    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByText(BASE.formattedAddress)).toBeInTheDocument()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('8. falha na leitura → ERROR com "Tentar novamente"; retry recupera', async () => {
    mockGet
      .mockRejectedValueOnce(new Error('erro de rede'))
      .mockResolvedValueOnce(null)

    render(<OperationalBaseSection />)

    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Configurar base' })).toBeInTheDocument(),
    )
    expect(mockGet).toHaveBeenCalledTimes(2)
  })

  it('9. ciclo completo NO_BASE → EDITING → seleção → SAVING → CONFIGURED', async () => {
    mockGet.mockResolvedValue(null)
    mockUpdate.mockResolvedValue(BASE)

    render(<OperationalBaseSection />)

    fireEvent.click(await screen.findByRole('button', { name: 'Configurar base' }))
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar sugestão' }))

    const save = screen.getByRole('button', { name: 'Salvar base' })
    expect(save).toBeEnabled()
    fireEvent.click(save)

    await screen.findByText(BASE.formattedAddress)
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(mockUpdate).toHaveBeenCalledTimes(1)
  })

  it('10. SAVING desabilita as ações e exibe "Salvando base…" enquanto o PUT está em voo', async () => {
    mockGet.mockResolvedValue(null)
    mockUpdate.mockReturnValue(linkNeverResolves() as never)

    render(<OperationalBaseSection />)

    fireEvent.click(await screen.findByRole('button', { name: 'Configurar base' }))
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar sugestão' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar base' }))

    expect(screen.getByText(/salvando base de atendimento/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salvar base' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull()
  })
})