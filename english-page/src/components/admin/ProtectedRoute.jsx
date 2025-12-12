/**
 * ============================================================================
 * PROTECTEDROUTE.JSX - Componente de Rota Protegida
 * ============================================================================
 *
 * HOC (Higher Order Component) que protege rotas administrativas.
 * Verifica autenticação e autorização antes de renderizar filhos.
 *
 * USO:
 * ```jsx
 * <ProtectedRoute requiredRole="admin">
 *   <Dashboard />
 * </ProtectedRoute>
 * ```
 *
 * COMPORTAMENTO:
 * - Mostra loading enquanto valida autenticação
 * - Redireciona para /login se não autenticado
 * - Redireciona para / se não tem role necessária
 * - Renderiza children se autorizado
 *
 * TODO: [UX] Melhorar estado de loading
 *       - Skeleton screen em vez de texto
 *       - Spinner animado centralizado
 *       - Timeout com mensagem de erro
 *
 * TODO: [SEGURANÇA] Adicionar verificação de expiração do token
 *       - Decodificar JWT e verificar exp
 *       - Renovar token se próximo de expirar
 *
 * TODO: [UX] Salvar URL original para redirect após login
 *       - Guardar location.pathname antes de redirecionar
 *       - Após login, voltar para página original
 *       - Usar state do Navigate ou query param
 *
 * TODO: [REFATORAÇÃO] Usar React Context para auth state
 *       - Evitar múltiplas chamadas a getCurrentUser
 *       - Compartilhar estado de auth entre componentes
 *       - Criar AuthProvider e useAuth hook
 *
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes filhos a renderizar
 * @param {string} props.requiredRole - Role mínima necessária ('user' | 'admin')
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../../services/auth';

/**
 * Componente de proteção de rotas
 * @param {Object} props
 * @param {React.ReactNode} props.children - Conteúdo a proteger
 * @param {string} props.requiredRole - Role necessária para acesso
 * @returns {JSX.Element}
 */
const ProtectedRoute = ({ children, requiredRole = 'user' }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const validateAuth = async () => {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    validateAuth();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated() || error) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
