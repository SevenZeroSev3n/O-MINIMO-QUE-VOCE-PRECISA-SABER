const API_URL = 'http://localhost:3000/api';

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

export const logout = () => {
  removeToken();
  window.location.href = '/login';
};

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

export const authenticatedFetch = async (url, options = {}) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    removeToken();
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  return response;
};