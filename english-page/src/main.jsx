/**
 * ============================================================================
 * MAIN.JSX - Entry Point da Aplicação React
 * ============================================================================
 *
 * Ponto de entrada da aplicação frontend.
 * Inicializa o React e monta o componente App no DOM.
 *
 * CONFIGURAÇÃO:
 * - StrictMode habilitado para detectar problemas potenciais
 * - CSS global importado
 *
 * TODO: [PERFORMANCE] Adicionar Web Vitals tracking
 *       - Usar web-vitals para métricas de performance
 *       - Reportar para analytics
 *       - Link: https://github.com/GoogleChrome/web-vitals
 *
 * TODO: [PWA] Considerar transformar em Progressive Web App
 *       - Adicionar service worker
 *       - Manifest.json para instalação
 *       - Usar vite-plugin-pwa
 *       - Link: https://vite-pwa-org.netlify.app/
 *
 * @module main
 * ============================================================================
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css"

/**
 * Inicializa a aplicação React
 * Renderiza o componente App dentro de StrictMode
 */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
