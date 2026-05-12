import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import PasswordInput from './PasswordInput'

function ControlledPasswordInput() {
  const [value, setValue] = useState('segredo123')

  return (
    <PasswordInput
      required
      name="password"
      placeholder="Digite sua senha"
      autoComplete="current-password"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white"
    />
  )
}

describe('PasswordInput', () => {
  it('toggles password visibility without losing the entered value', async () => {
    const user = userEvent.setup()

    render(<ControlledPasswordInput />)

    const input = screen.getByPlaceholderText('Digite sua senha')
    expect(input).toHaveAttribute('type', 'password')
    expect(input).toHaveAttribute('name', 'password')
    expect(input).toHaveAttribute('autocomplete', 'current-password')
    expect(input).toBeRequired()
    expect(input).toHaveValue('segredo123')

    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))

    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveValue('segredo123')
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Ocultar senha' }))

    expect(input).toHaveAttribute('type', 'password')
    expect(input).toHaveValue('segredo123')
    expect(screen.getByRole('button', { name: 'Mostrar senha' })).toHaveAttribute('aria-pressed', 'false')
  })
})