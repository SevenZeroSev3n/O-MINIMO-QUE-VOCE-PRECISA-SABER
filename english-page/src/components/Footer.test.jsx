/**
 * Testes do componente Footer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from './Footer'

describe('Footer', () => {
  it('deve renderizar o footer', () => {
    render(<Footer />)

    const footer = document.querySelector('footer')
    expect(footer).toBeInTheDocument()
  })

  it('deve exibir texto de copyright', () => {
    render(<Footer />)

    expect(screen.getByText(/Todos os direitos reservados/i)).toBeInTheDocument()
  })

  it('deve exibir nome do curso', () => {
    render(<Footer />)

    expect(screen.getByText(/O Mínimo que Você Precisa pra se Virar nos EUA/i)).toBeInTheDocument()
  })

  it('deve exibir o ano atual', () => {
    const currentYear = new Date().getFullYear()
    render(<Footer />)

    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument()
  })
})
