/**
 * Configuração centralizada da aplicação
 *
 * Este arquivo centraliza todas as configurações sensíveis ao ambiente,
 * permitindo fácil mudança entre desenvolvimento, staging e produção.
 */

// URL base da API - lê da variável de ambiente ou usa fallback para desenvolvimento
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Outras configurações podem ser adicionadas aqui
export const config = {
  apiUrl: API_URL,
  // Adicione outras configs conforme necessário
  // exemplo: maxFileSize: import.meta.env.VITE_MAX_FILE_SIZE || '5MB',
};

export default config;