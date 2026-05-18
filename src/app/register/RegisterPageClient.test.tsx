import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import RegisterPageClient from './RegisterPageClient';

const mockPush = jest.fn();
const mockRegister = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    prefetch: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}));

jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: null,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: mockRegister,
  }),
}));

const fillRegisterForm = async (
  user: ReturnType<typeof userEvent.setup>
) => {
  await user.type(screen.getByPlaceholderText('Seu nome'), 'Invalid Referral');
  await user.type(screen.getByPlaceholderText('seu@email.com'), 'invalid.referral@test.com');
  await user.type(screen.getByPlaceholderText('(11) 99999-9999'), '21955554444');
  await user.type(screen.getByPlaceholderText('Mínimo 6 caracteres'), '123456');
};

describe('RegisterPageClient invalid referral flow', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    mockRegister.mockReset();
  });

  it('clears invalid referral and retries without referralCode', async () => {
    const user = userEvent.setup();

    localStorage.setItem('aliado:referralCode', 'pedro-motta-zs');
    localStorage.setItem('aliado:referredSlug', 'pedro-motta-zs');
    localStorage.setItem(
      'aliado:referredDriver',
      JSON.stringify({ id: 'driver-1', name: 'Pedro Motta', phone: '21900000001' })
    );

    mockRegister
      .mockImplementationOnce(() => Promise.reject(new Error('Referral code inválido ou expirado')))
      .mockImplementationOnce(() => Promise.resolve());

    render(<RegisterPageClient referralSlug="pedro-motta-zs" />);

    await fillRegisterForm(user);
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    const errorMessage = await screen.findByText(/Referral code inválido ou expirado/i);
    expect(errorMessage).toBeInTheDocument();

    // Aguarda o DOM atualizar: convite deve sumir após erro de referral inválido
    await waitFor(() => {
      expect(screen.queryByText(/convite ativo/i)).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.queryByText(/você foi convidado por/i)).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledTimes(2);
    });
  });

  it('redirects on successful retry after invalid referral cleanup', async () => {
    const user = userEvent.setup();

    localStorage.setItem('aliado:referralCode', 'pedro-motta-zs');
    localStorage.setItem('aliado:referredSlug', 'pedro-motta-zs');

    mockRegister
      .mockImplementationOnce(() => Promise.reject(new Error('Referral code inválido ou expirado')))
      .mockImplementationOnce(() => Promise.resolve());

    render(<RegisterPageClient referralSlug="pedro-motta-zs" />);

    await fillRegisterForm(user);
    await user.click(screen.getByRole('button', { name: /criar conta/i }));
    await screen.findByText(/Referral code inválido ou expirado/i);
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });
});


