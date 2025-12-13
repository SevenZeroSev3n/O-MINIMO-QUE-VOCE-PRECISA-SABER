import { API_URL } from '../config';

// Variável para guardar o token CSRF em memória (evita buscar toda hora)
let csrfToken = null;

// ========================================
// FUNÇÕES DE GERENCIAMENTO DE TOKEN JWT
// ========================================

// Salva o token JWT no localStorage do navegador
// localStorage persiste mesmo fechando o navegador
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Recupera o token JWT do localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Remove o token (usado no logout)
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Verifica se existe um token (usuário está logado?)
// O "!!" converte qualquer valor para boolean
// Ex: !!"texto" = true, !!null = false, !!undefined = false
export const isAuthenticated = () => {
  return !!getToken();
};

// ========================================
// FUNÇÃO PARA OBTER CSRF TOKEN
// ========================================

// CSRF = Cross-Site Request Forgery (proteção contra ataques)
// O servidor gera um token único que deve ser enviado em requisições POST/PUT/DELETE
export const getCsrfToken = async () => {
  // Se já temos o token em memória, retorna ele (evita requisição desnecessária)
  if (csrfToken) return csrfToken;
  
  try {
    // Busca o token do servidor
    const response = await fetch(`${API_URL}/csrf-token`, {
      credentials: 'include' // Inclui cookies na requisição
    });
    const data = await response.json();
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Erro ao obter CSRF token:', error);
    return null;
  }
};

// ========================================
// FUNÇÃO DE LOGIN
// ========================================

export const login = async (email, password) => {
  try {
    // Envia credenciais para o servidor
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Diz ao servidor que estamos enviando JSON
      },
      body: JSON.stringify({ email, password }) // Converte objeto JS para string JSON
    });

    // Se a resposta não for OK (status 200-299), trata o erro
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao fazer login');
    }

    // Pega os dados da resposta e salva o token
    const data = await response.json();
    setToken(data.token);
    return data;
  } catch (error) {
    console.error('Erro no login:', error);
    throw error; // Re-lança o erro para quem chamou a função tratar
  }
};

// ========================================
// FUNÇÃO DE LOGOUT
// ========================================

export const logout = () => {
  removeToken();
  window.location.href = '/login'; // Redireciona para página de login
};

// ========================================
// BUSCAR USUÁRIO ATUAL
// ========================================

// Valida se o token ainda é válido e retorna dados do usuário
export const getCurrentUser = async () => {
  try {
    const token = getToken();

    if (!token) {
      throw new Error('Token não encontrado');
    }

    // Faz requisição autenticada para pegar dados do usuário
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`, // Padrão JWT: "Bearer <token>"
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeToken(); // Token inválido/expirado, remove ele
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

// ========================================
// HELPER PARA REQUISIÇÕES AUTENTICADAS
// ========================================

// Esta função é um "wrapper" - envolve o fetch padrão adicionando:
// 1. Token JWT de autenticação
// 2. Token CSRF para proteção
// 3. Tratamento automático de sessão expirada
export const authenticatedFetch = async (url, options = {}) => {
  const token = getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  // Verifica se o método precisa de CSRF (métodos que alteram dados)
  const needsCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    (options.method || 'GET').toUpperCase()
  );

  // Monta os headers da requisição
  const headers = {
    ...options.headers, // Mantém headers que já foram passados
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Adiciona CSRF token se necessário
  if (needsCSRF) {
    const csrf = await getCsrfToken();
    if (csrf) {
      headers['X-CSRF-Token'] = csrf;
    }
  }

  // Faz a requisição
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  // Se receber 401, a sessão expirou
  if (response.status === 401) {
    removeToken();
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  // Se receber 403 e era uma requisição que precisava CSRF, tenta renovar o token
  if (response.status === 403 && needsCSRF) {
    csrfToken = null; // Limpa o token antigo
    const newCsrf = await getCsrfToken();
    if (newCsrf) {
      headers['X-CSRF-Token'] = newCsrf;
      return fetch(url, { ...options, headers, credentials: 'include' });
    }
  }

  return response;
};

// Exporta tudo como objeto default também (permite import de duas formas)
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
