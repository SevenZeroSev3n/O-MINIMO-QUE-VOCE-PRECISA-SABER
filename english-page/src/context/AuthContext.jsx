import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  login as authLogin,      // Renomeia para evitar conflito com nossa função login
  logout as authLogout,
  getCurrentUser,
  isAuthenticated as checkAuthenticated,
  getToken
} from '../services/auth';

// ========================================
// CRIAÇÃO DO CONTEXT
// ========================================

// createContext cria um "container" para nossos dados
// O valor inicial é null (será preenchido pelo Provider)
const AuthContext = createContext(null);

// ========================================
// PROVIDER COMPONENT
// ========================================

// Este componente vai envolver toda a aplicação
// Todos os filhos terão acesso aos dados de autenticação
export function AuthProvider({ children }) {
  // Estados do contexto
  const [user, setUser] = useState(null);           // Dados do usuário logado
  const [loading, setLoading] = useState(true);     // Carregando autenticação?
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Está logado?

  // Verifica autenticação quando o app carrega
  useEffect(() => {
    checkAuth();
  }, []);

  // ========================================
  // FUNÇÃO PARA VERIFICAR AUTENTICAÇÃO
  // ========================================
  
  const checkAuth = async () => {
    try {
      // Primeiro verifica se existe token
      if (!checkAuthenticated()) {
        setLoading(false);
        return;
      }

      // Se existe token, valida ele buscando dados do usuário
      const userData = await getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Erro ao verificar autenticacao:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // FUNÇÃO DE LOGIN (wrapper)
  // ========================================
  
  const login = async (email, password) => {
    const data = await authLogin(email, password);
    setUser(data.user || { email });
    setIsAuthenticated(true);
    return data;
  };

  // ========================================
  // FUNÇÃO DE LOGOUT (wrapper)
  // ========================================
  
  const logout = () => {
    authLogout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // ========================================
  // VALOR DO CONTEXT
  // ========================================
  
  // Este objeto será acessível por qualquer componente filho
  const value = {
    user,           // Dados do usuário
    loading,        // Se está carregando
    isAuthenticated,// Se está logado
    login,          // Função para logar
    logout,         // Função para deslogar
    checkAuth       // Função para re-verificar auth
  };

  // Provider passa o value para todos os filhos
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ========================================
// CUSTOM HOOK - useAuth
// ========================================

// Custom hooks são funções que usam outros hooks
// Convenção: sempre começam com "use"
export function useAuth() {
  const context = useContext(AuthContext);
  
  // Proteção: se alguém usar fora do Provider, avisa
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}

export default AuthContext;
