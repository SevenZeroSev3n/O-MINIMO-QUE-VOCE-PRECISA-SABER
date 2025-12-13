import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Importa o hook

const ProtectedRoute = ({ children, requiredRole = 'user' }) => {
  // Agora pega os dados diretamente do context!
  // Não precisa mais de useState, useEffect, getCurrentUser...
  const { user, loading, isAuthenticated } = useAuth();

  // Se ainda está carregando, mostra loading
  if (loading) {
    return <div>Carregando...</div>;
  }

  // Se não está autenticado, redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se precisa ser admin mas não é, redireciona para home
  if (requiredRole === 'admin' && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Se passou todas as verificações, renderiza o conteúdo
  return children;
};

export default ProtectedRoute;
