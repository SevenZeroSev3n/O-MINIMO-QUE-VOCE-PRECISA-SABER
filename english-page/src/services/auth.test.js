import { describe, it, expect, vi, beforeEach } from 'vitest'

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

global.fetch = vi.fn()

const locationMock = { href: '' }
Object.defineProperty(window, 'location', { value: locationMock, writable: true })

import {
  setToken, getToken, removeToken, isAuthenticated,
  login, logout, getCurrentUser,
} from './auth.js'

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    locationMock.href = ''
  })

  describe('setToken', () => {
    it('deve salvar token no localStorage', () => {
      setToken('my-token')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'my-token')
    })
  })

  describe('getToken', () => {
    it('deve retornar token do localStorage', () => {
      localStorageMock.getItem.mockReturnValue('stored-token')
      const token = getToken()
      expect(token).toBe('stored-token')
      expect(localStorageMock.getItem).toHaveBeenCalledWith('token')
    })

    it('deve retornar null quando nao ha token', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const token = getToken()
      expect(token).toBeNull()
    })
  })

  describe('removeToken', () => {
    it('deve remover token do localStorage', () => {
      removeToken()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    })
  })

  describe('isAuthenticated', () => {
    it('deve retornar true quando ha token', () => {
      localStorageMock.getItem.mockReturnValue('valid-token')
      expect(isAuthenticated()).toBe(true)
    })

    it('deve retornar false quando nao ha token', () => {
      localStorageMock.getItem.mockReturnValue(null)
      expect(isAuthenticated()).toBe(false)
    })

    it('deve retornar false quando token e string vazia', () => {
      localStorageMock.getItem.mockReturnValue('')
      expect(isAuthenticated()).toBe(false)
    })
  })

  describe('login', () => {
    it('deve fazer requisicao POST para /auth/login', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'new-token', user: { id: 1 } }),
      })
      await login('test@example.com', 'password123')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      )
    })

    it('deve salvar token apos login bem sucedido', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'new-token' }),
      })
      await login('test@example.com', 'password')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-token')
    })

    it('deve retornar dados do usuario', async () => {
      const userData = { token: 'token', user: { id: 1, name: 'Test' } }
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(userData),
      })
      const result = await login('test@example.com', 'password')
      expect(result).toEqual(userData)
    })

    it('deve lancar erro quando login falha', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Credenciais invalidas' }),
      })
      await expect(login('wrong@example.com', 'wrong')).rejects.toThrow('Credenciais invalidas')
    })

    it('deve usar mensagem padrao quando servidor nao retorna erro', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      })
      await expect(login('test@example.com', 'password')).rejects.toThrow('Erro ao fazer login')
    })
  })

  describe('logout', () => {
    it('deve remover token', () => {
      logout()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    })

    it('deve redirecionar para /login', () => {
      logout()
      expect(locationMock.href).toBe('/login')
    })
  })

  describe('getCurrentUser', () => {
    it('deve fazer requisicao GET para /auth/me', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token')
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Admin' }),
      })
      await getCurrentUser()
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token',
          }),
        })
      )
    })

    it('deve retornar dados do usuario', async () => {
      localStorageMock.getItem.mockReturnValue('token')
      const userData = { id: 1, name: 'Admin', email: 'admin@example.com' }
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(userData),
      })
      const result = await getCurrentUser()
      expect(result).toEqual(userData)
    })

    it('deve lancar erro quando nao ha token', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      await expect(getCurrentUser()).rejects.toThrow('Token não encontrado')
    })

    it('deve remover token e lancar erro quando sessao expira (401)', async () => {
      localStorageMock.getItem.mockReturnValue('expired-token')
      fetch.mockResolvedValueOnce({ ok: false, status: 401 })
      await expect(getCurrentUser()).rejects.toThrow('Sessão expirada')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    })
  })
})
