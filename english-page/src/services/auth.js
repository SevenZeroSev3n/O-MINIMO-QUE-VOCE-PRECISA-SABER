const API_URL = 'http://localhost:3000/api';

let csrfToken = null;

// Funções de gerenciamento de token
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  return !!getToken();
};

// Função para obter CSRF token
export const getCsrfToken = async () => {
  if (csrfToken) return csrfToken;

  try {
    const response = await fetch(`${API_URL}/csrf-token`, {
      credentials: 'include'
    });
    const data = await response.json();
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Erro ao obter CSRF token:', error);
    return null;
  }
};

// Função de login
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao fazer login');
    }

    const data = await response.json();
    setToken(data.token);
    return data;
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
};

// Função de logout
export const logout = () => {
  removeToken();
  window.location.href = '/login';
};

// Buscar usuário atual
export const getCurrentUser = async () => {
  try {
    const token = getToken();

    if (!token) {
      throw new Error('Token não encontrado');
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        throw new Error('Sessão expirada');
      }
      throw new Error('Erro ao buscar usuário');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw error;
  }
};

// Helper para fazer requisições autenticadas com CSRF
export const authenticatedFetch = async (url, options = {}) => {
  const token = getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  // Para métodos que alteram estado, adiciona CSRF token
  const needsCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    (options.method || 'GET').toUpperCase()
  );

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  if (needsCSRF) {
    const csrf = await getCsrfToken();
    if (csrf) {
      headers['X-CSRF-Token'] = csrf;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (response.status === 401) {
    removeToken();
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  // Se CSRF token expirou, tenta renovar
  if (response.status === 403 && needsCSRF) {
    csrfToken = null;
    const newCsrf = await getCsrfToken();
    if (newCsrf) {
      headers['X-CSRF-Token'] = newCsrf;
      return fetch(url, { ...options, headers, credentials: 'include' });
    }
  }

  return response;
};

export default {
  setToken,
  getToken,
  removeToken,
  isAuthenticated,
  getCsrfToken,
  login,
  logout,
  getCurrentUser,
  authenticatedFetch
};
