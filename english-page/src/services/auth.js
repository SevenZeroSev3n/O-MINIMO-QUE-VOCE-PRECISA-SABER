/**
 * ============================================================================
 * AUTH.JS - Serviço de Autenticação
 * ============================================================================
 *
 * Módulo responsável por toda a lógica de autenticação do frontend.
 * Gerencia tokens JWT, proteção CSRF e requisições autenticadas.
 *
 * FUNCIONALIDADES:
 * - Gerenciamento de tokens JWT (localStorage)
 * - Obtenção e cache de tokens CSRF
 * - Login/Logout
 * - Requisições autenticadas com renovação automática de CSRF
 *
 * SEGURANÇA:
 * - Tokens JWT armazenados em localStorage (ver TODO abaixo)
 * - CSRF tokens para proteção contra ataques CSRF
 * - Redirecionamento automático em sessão expirada
 *
 * TODO: [SEGURANÇA] Migrar token JWT para httpOnly cookie
 *       - localStorage é vulnerável a XSS
 *       - Usar cookie httpOnly enviado pelo backend
 *       - Remover setToken/getToken e usar apenas cookies
 *       - Link: https://owasp.org/www-community/HttpOnly
 *
 * TODO: [UX] Implementar renovação silenciosa de token
 *       - Renovar token antes de expirar
 *       - Usar refresh token para obter novo access token
 *       - Evitar logout inesperado do usuário
 *
 * TODO: [SEGURANÇA] Adicionar validação de expiração do token no cliente
 *       - Decodificar JWT e verificar exp claim
 *       - Usar jwt-decode: https://github.com/auth0/jwt-decode
 *       - Redirecionar para login se token expirado
 *
 * TODO: [REFATORAÇÃO] Usar React Context para estado de autenticação
 *       - Criar AuthContext e AuthProvider
 *       - useAuth hook para acesso fácil ao estado
 *       - Evitar prop drilling de dados de usuário
 *
 * @module services/auth
 * ============================================================================
 */

import { API_URL } from '../config';

/**
 * Cache do token CSRF para evitar requisições desnecessárias
 * @type {string|null}
 */
let csrfToken = null;

// ============================================================================
// GERENCIAMENTO DE TOKEN JWT
// ============================================================================

/**
 * Salva o token JWT no localStorage
 * @param {string} token - Token JWT recebido do backend
 *
 * TODO: [SEGURANÇA] Este método será removido ao migrar para httpOnly cookies
 */
export const setToken = (token) => {

  localStorage.setItem('token', token);

}; 

/**
 * Recupera o token JWT do localStorage
 * @returns {string|null} Token JWT ou null se não existir
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Remove o token JWT do localStorage
 * Usado no logout e quando a sessão expira
 */
export const removeToken = () => {
  localStorage.removeItem('token');
};

/**
 * Verifica se o usuário está autenticado
 * @returns {boolean} True se existe token, false caso contrário
 *
 * TODO: [MELHORIA] Verificar também se o token não está expirado
 */
export const isAuthenticated = () => {
  return !!getToken();
};

// ============================================================================
// PROTEÇÃO CSRF
// ============================================================================

/**
 * Obtém token CSRF do backend
 * Usa cache para evitar requisições desnecessárias
 *
 * @returns {Promise<string|null>} Token CSRF ou null em caso de erro
 *
 * TODO: [PERFORMANCE] Adicionar expiração ao cache do CSRF token
 *       - Tokens CSRF podem expirar no backend
 *       - Implementar TTL de ~30min no cache
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

// ============================================================================
// AUTENTICAÇÃO
// ============================================================================

/**
 * Realiza login do usuário
 * Envia credenciais para a API e armazena o token JWT retornado
 *
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise<Object>} Dados do usuário autenticado
 * @throws {Error} Se as credenciais forem inválidas ou houver erro de rede
 *
 * TODO: [UX] Adicionar feedback mais detalhado de erros
 *       - Diferenciar entre credenciais inválidas, conta bloqueada, etc.
 *       - Mostrar número de tentativas restantes se rate limited
 */
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

/**
 * Realiza logout do usuário
 * Remove o token e redireciona para a página de login
 *
 * TODO: [BACKEND] Implementar invalidação do token no backend
 *       - Chamar endpoint /api/auth/logout
 *       - Adicionar token à blacklist no Redis
 */
export const logout = () => {
  removeToken();
  window.location.href = '/login';
};

/**
 * Busca dados do usuário autenticado atual
 * Usado para validar sessão e obter informações do perfil
 *
 * @returns {Promise<Object>} Dados do usuário (id, name, email, role)
 * @throws {Error} Se não autenticado ou sessão expirada
 *
 * TODO: [PERFORMANCE] Implementar cache dos dados do usuário
 *       - Usar React Query ou SWR para cache automático
 *       - Evitar requisições repetidas em cada página
 *       - Link: https://tanstack.com/query/latest
 */
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

// ============================================================================
// REQUISIÇÕES AUTENTICADAS
// ============================================================================

/**
 * Helper para fazer requisições autenticadas à API
 * Adiciona automaticamente:
 * - Token JWT no header Authorization
 * - Token CSRF para métodos que alteram estado (POST, PUT, PATCH, DELETE)
 * - Content-Type application/json
 * - Credentials para cookies
 *
 * Também trata:
 * - Sessão expirada (401) - redireciona para login
 * - CSRF expirado (403) - renova automaticamente e retenta
 *
 * @param {string} url - URL completa da requisição
 * @param {Object} options - Opções do fetch (method, body, headers, etc.)
 * @returns {Promise<Response>} Resposta do fetch
 * @throws {Error} Se não autenticado
 *
 * TODO: [REFATORAÇÃO] Usar axios ou ky para melhor DX
 *       - Interceptors para tratamento global de erros
 *       - Retry automático em falhas de rede
 *       - Link: https://github.com/sindresorhus/ky
 *
 * TODO: [LOADING] Implementar indicador global de loading
 *       - Mostrar spinner durante requisições
 *       - Usar React Context ou biblioteca como nprogress
 */
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