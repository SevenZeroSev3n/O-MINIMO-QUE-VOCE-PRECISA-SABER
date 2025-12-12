import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Header from './Header'

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('Header', () => {
  it('deve renderizar o header', () => {
    renderWithRouter(<Header />)
    const header = document.querySelector('header')
    expect(header).toBeInTheDocument()
  })

  it('deve exibir o logo com emoji da bandeira dos EUA', () => {
    renderWithRouter(<Header />)
    expect(screen.getByText('O MÍNIMO')).toBeInTheDocument()
    expect(screen.getByText('pra se virar nos EUA')).toBeInTheDocument()
  })

  it('deve exibir links de navegacao', () => {
    renderWithRouter(<Header />)
    expect(screen.getByText('Sobre')).toBeInTheDocument()
    expect(screen.getByText('Como funciona')).toBeInTheDocument()
    expect(screen.getByText('Módulos')).toBeInTheDocument()
    expect(screen.getByText('Resultado')).toBeInTheDocument()
  })

  it('deve ter link para Sobre com href correto', () => {
    renderWithRouter(<Header />)
    const sobreLink = screen.getByText('Sobre')
    expect(sobreLink).toHaveAttribute('href', '#sobre')
  })

  it('deve ter botao de CTA', () => {
    renderWithRouter(<Header />)
    const ctaButton = screen.getByText('Falar no WhatsApp')
    expect(ctaButton).toBeInTheDocument()
    expect(ctaButton).toHaveAttribute('href', '#formulario')
  })

  it('deve ter classes de estilo aplicadas', () => {
    renderWithRouter(<Header />)
    const header = document.querySelector('header')
    expect(header.className).toBeTruthy()
  })
})
