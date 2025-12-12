/**
 * ============================================================================
 * API.JS - Serviço de API (Alternativo)
 * ============================================================================
 *
 * Módulo alternativo para requisições à API.
 * NOTA: Este arquivo duplica funcionalidades do auth.js
 *
 * TODO: [REFATORAÇÃO] Unificar com auth.js ou remover
 *       - Este arquivo contém código duplicado
 *       - Manter apenas um módulo para chamadas de API
 *       - Sugestão: manter auth.js e remover este arquivo
 *       - Ou criar estrutura: api/auth.js, api/leads.js, api/client.js
 *
 * @module services/api
 * @deprecated Usar services/auth.js para requisições autenticadas
 * ============================================================================
 */

import { API_URL } from '../config';

/**
 * Cache do token CSRF
 * @type {string|null}
 * @deprecated Usar getCsrfToken de services/auth.js
 */
let csrfToken = null;

/**
 * Obtém token CSRF do backend
 * @returns {Promise<string|null>} Token CSRF
 * @deprecated Usar getCsrfToken de services/auth.js
 */
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
