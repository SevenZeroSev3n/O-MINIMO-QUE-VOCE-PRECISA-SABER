/**
 * ============================================================================
 * APP.JSX - Componente Principal da Aplicação
 * ============================================================================
 *
 * Componente raiz que define a estrutura de rotas da aplicação.
 * Utiliza React Router para navegação client-side.
 *
 * ESTRUTURA DE ROTAS:
 * - /           → Landing page pública (captura de leads)
 * - /login      → Página de login do admin
 * - /admin      → Dashboard administrativo (protegido)
 * - /admin/leads → Gerenciamento de leads (protegido)
 * - *           → Redireciona para home
 *
 * LAYOUT:
 * - Páginas públicas: Header + Conteúdo + Footer
 * - Páginas admin: Sidebar integrada nos componentes
 *
 * TODO: [ARQUITETURA] Implementar layout system
 *       - Criar componentes de layout reutilizáveis
 *       - Layout público: Header + children + Footer
 *       - Layout admin: Sidebar + TopNav + children
 *       - Usar Outlet do React Router v6
 *
 * TODO: [UX] Adicionar animações de transição entre páginas
 *       - Usar framer-motion ou react-transition-group
 *       - Link: https://www.framer.com/motion/
 *
 * TODO: [SEO] Implementar React Helmet para meta tags dinâmicas
 *       - Title, description, og:tags por página
 *       - Link: https://github.com/nfl/react-helmet
 *
 * TODO: [LOADING] Adicionar Suspense com fallback para lazy loading
 *       - Usar React.lazy() para code splitting
 *       - Carregar componentes admin apenas quando necessário
 *
 * TODO: [ERROR] Implementar Error Boundary global
 *       - Capturar erros de renderização
 *       - Mostrar página de erro amigável
 *       - Reportar erros para Sentry ou similar
 *       - Link: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 *
 * @component
 * ============================================================================
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePageContent from './components/pages/HomePageContent';
import Login from './components/pages/Login';
import Dashboard from './components/pages/admin/Dashboard';
import LeadsPage from './components/pages/admin/LeadsPage';
import ProtectedRoute from './components/admin/ProtectedRoute';
import './index.css';

/**
 * Componente principal da aplicação
 * Define todas as rotas e estrutura base
 * @returns {JSX.Element}
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas Públicas */}
        <Route 
          path="/" 
          element={
            <>
              <Header />
              <HomePageContent />
              <Footer />
            </>
          } 
        />
        
        <Route path="/login" element={<Login />} />

        {/* Rotas Protegidas (Admin) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/leads"
          element={
            <ProtectedRoute>
              <LeadsPage />
            </ProtectedRoute>
          }
        />

        {/* Rota não encontrada - redireciona para home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;