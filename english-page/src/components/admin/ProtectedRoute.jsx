import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../../services/auth';

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
