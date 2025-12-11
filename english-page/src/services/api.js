const API_URL = 'http://localhost:3000/api';

let csrfToken = null;

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

// Helper para fazer requisições autenticadas com CSRF 
export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
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
    localStorage.removeItem('token');
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

export default { getCsrfToken, authenticatedFetch };
