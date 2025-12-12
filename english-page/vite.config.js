/**
 * ============================================================================
 * VITE.CONFIG.JS - Configuração do Build Tool
 * ============================================================================
 *
 * Configuração do Vite para o projeto React.
 * Vite é um build tool moderno e extremamente rápido.
 *
 * PLUGINS ATIVOS:
 * - @vitejs/plugin-react: Suporte a React com Fast Refresh
 * - babel-plugin-react-compiler: Compilador React (experimental)
 *
 * FEATURES DO VITE:
 * - Hot Module Replacement (HMR) instantâneo
 * - Build otimizado com Rollup
 * - Suporte nativo a ESM
 * - Import de CSS modules
 *
 * TODO: [BUILD] Configurar aliases de path
 *       - Usar @ para src/
 *       - Evitar imports relativos longos
 *       - Exemplo:
 *         resolve: {
 *           alias: {
 *             '@': '/src',
 *             '@components': '/src/components',
 *             '@services': '/src/services'
 *           }
 *         }
 *
 * TODO: [PERFORMANCE] Configurar code splitting
 *       - Chunks separados para vendor
 *       - Lazy loading de rotas
 *       - Exemplo:
 *         build: {
 *           rollupOptions: {
 *             output: {
 *               manualChunks: { vendor: ['react', 'react-dom'] }
 *             }
 *           }
 *         }
 *
 * TODO: [PWA] Adicionar plugin PWA
 *       - vite-plugin-pwa para service worker
 *       - Manifest e offline support
 *       - Link: https://vite-pwa-org.netlify.app/
 *
 * TODO: [OTIMIZAÇÃO] Adicionar compressão
 *       - vite-plugin-compression para gzip/brotli
 *       - Reduzir tamanho dos assets
 *
 * TODO: [ANÁLISE] Adicionar visualizador de bundle
 *       - rollup-plugin-visualizer
 *       - Identificar dependências pesadas
 *       - Link: https://github.com/btd/rollup-plugin-visualizer
 *
 * @see https://vitejs.dev/config/
 * ============================================================================
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Babel plugin para o React Compiler (experimental)
      // Otimiza automaticamente re-renders
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],

  // TODO: Adicionar configurações futuras aqui
  // server: {
  //   port: 5173,
  //   proxy: {
  //     '/api': 'http://localhost:3000'
  //   }
  // },
  // build: {
  //   sourcemap: true,
  //   outDir: 'dist'
  // }
})
