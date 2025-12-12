import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Login from './Login'

vi.mock('../../services/auth', () => ({
  login: vi.fn(),
  isAuthenticated: vi.fn(() => false),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import { login, isAuthenticated } from '../../services/auth'

const renderLogin = () => render(<BrowserRouter><Login /></BrowserRouter>)

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isAuthenticated.mockReturnValue(false)
  })

  describe('Renderizacao', () => {
    it('deve renderizar o formulario de login', () => {
      renderLogin()
      expect(screen.getByRole('heading', { name: /Área Administrativa/i })).toBeInTheDocument()
    })

    it('deve ter campo de email', () => {
      renderLogin()
      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('deve ter campo de senha', () => {
      renderLogin()
      const passwordInput = screen.getByLabelText(/senha/i)
      expect(passwordInput).toBeInTheDocument()
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('deve ter botao de submit', () => {
      renderLogin()
      const submitButton = screen.getByRole('button', { name: /entrar/i })
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('deve exibir logo', () => {
      renderLogin()
      expect(screen.getByText(/O Mínimo que Você Precisa pra se Virar nos EUA/i)).toBeInTheDocument()
    })
  })

  describe('Interacao do usuario', () => {
    it('deve permitir digitar email', async () => {
      const user = userEvent.setup()
      renderLogin()
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'test@example.com')
      expect(emailInput).toHaveValue('test@example.com')
    })

    it('deve permitir digitar senha', async () => {
      const user = userEvent.setup()
      renderLogin()
      const passwordInput = screen.getByLabelText(/senha/i)
      await user.type(passwordInput, 'minhasenha123')
      expect(passwordInput).toHaveValue('minhasenha123')
    })

    it('deve chamar login ao submeter formulario', async () => {
      const user = userEvent.setup()
      login.mockResolvedValueOnce({ token: 'fake-token' })
      renderLogin()
      await user.type(screen.getByLabelText(/email/i), 'admin@example.com')
      await user.type(screen.getByLabelText(/senha/i), 'password123')
      await user.click(screen.getByRole('button', { name: /entrar/i }))
      await waitFor(() => {
        expect(login).toHaveBeenCalledWith('admin@example.com', 'password123')
      })
    })
  })

  describe('Estados de loading', () => {
    it('deve desabilitar botao durante loading', async () => {
      const user = userEvent.setup()
      login.mockImplementation(() => new Promise(() => {}))
      renderLogin()
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/senha/i), 'password')
      await user.click(screen.getByRole('button', { name: /entrar/i }))
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeDisabled()
      })
    })

    it('deve mostrar texto de loading', async () => {
      const user = userEvent.setup()
      login.mockImplementation(() => new Promise(() => {}))
      renderLogin()
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/senha/i), 'password')
      await user.click(screen.getByRole('button', { name: /entrar/i }))
      await waitFor(() => {
        expect(screen.getByText(/entrando/i)).toBeInTheDocument()
      })
    })
  })

  describe('Tratamento de erros', () => {
    it('deve exibir mensagem de erro quando login falha', async () => {
      const user = userEvent.setup()
      login.mockRejectedValueOnce(new Error('Credenciais invalidas'))
      renderLogin()
      await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
      await user.type(screen.getByLabelText(/senha/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /entrar/i }))
      await waitFor(() => {
        expect(screen.getByText(/credenciais invalidas/i)).toBeInTheDocument()
      })
    })

    it('deve exibir mensagem generica quando erro nao tem message', async () => {
      const user = userEvent.setup()
      login.mockRejectedValueOnce(new Error())
      renderLogin()
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/senha/i), 'password')
      await user.click(screen.getByRole('button', { name: /entrar/i }))
      await waitFor(() => {
        expect(screen.getByText(/erro ao fazer login/i)).toBeInTheDocument()
      })
    })
  })

  describe('Redirecionamento', () => {
    it('deve redirecionar para /admin se ja autenticado', () => {
      isAuthenticated.mockReturnValue(true)
      renderLogin()
      expect(mockNavigate).toHaveBeenCalledWith('/admin')
    })

    it('deve redirecionar para /admin apos login bem sucedido', async () => {
      const user = userEvent.setup()
      login.mockResolvedValueOnce({ token: 'fake-token' })
      renderLogin()
      await user.type(screen.getByLabelText(/email/i), 'admin@example.com')
      await user.type(screen.getByLabelText(/senha/i), 'password123')
      await user.click(screen.getByRole('button', { name: /entrar/i }))
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin')
      })
    })
  })
})
