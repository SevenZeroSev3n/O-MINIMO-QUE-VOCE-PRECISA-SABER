/**
 * ============================================================================
 * CONFIG.JS - Configuração Centralizada do Frontend
 * ============================================================================
 *
 * Este arquivo centraliza todas as configurações sensíveis ao ambiente,
 * permitindo fácil mudança entre desenvolvimento, staging e produção.
 *
 * VARIÁVEIS DE AMBIENTE (Vite):
 * - VITE_API_URL: URL base da API backend
 *
 * IMPORTANTE:
 * - Variáveis Vite devem começar com VITE_
 * - Configuradas em .env, .env.local, .env.production
 * - Acessadas via import.meta.env.VITE_*
 *
 * TODO: [CONFIG] Adicionar mais configurações centralizadas
 *       - Timeouts de requisição
 *       - Configurações de paginação
 *       - Feature flags
 *
 * TODO: [VALIDAÇÃO] Validar variáveis de ambiente
 *       - Usar Zod para validar config
 *       - Falhar fast se config inválida
 *       - Exemplo:
 *         const envSchema = z.object({
 *           VITE_API_URL: z.string().url()
 *         });
 *
 * TODO: [AMBIENTE] Adicionar configs por ambiente
 *       - Config de analytics (GA, Pixel)
 *       - URL de CDN para assets
 *       - Sentry DSN para error tracking
 *
 * @module config
 * ============================================================================
 */

/**
 * URL base da API
 * Lê da variável de ambiente ou usa fallback para desenvolvimento
 * @type {string}
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Objeto de configuração centralizada
 * Expande conforme necessário
 * @type {Object}
 */
export const config = {
  apiUrl: API_URL,

  // TODO: Adicionar configurações futuras aqui
  // requestTimeout: 30000,
  // paginationLimit: 20,
  // features: {
  //   analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  //   sentry: import.meta.env.VITE_ENABLE_SENTRY === 'true',
  // }
};

export default config;