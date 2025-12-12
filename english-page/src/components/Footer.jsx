/**
 * ============================================================================
 * FOOTER.JSX - Componente de Rodapé
 * ============================================================================
 *
 * Footer simples da landing page pública.
 * Exibe copyright com ano dinâmico.
 *
 * TODO: [CONTEÚDO] Adicionar links úteis
 *       - Política de Privacidade
 *       - Termos de Uso
 *       - Contato
 *
 * TODO: [CONTEÚDO] Adicionar redes sociais
 *       - Links para Instagram, TikTok, YouTube
 *       - Ícones usando react-icons ou similar
 *       - Link: https://react-icons.github.io/react-icons/
 *
 * TODO: [LGPD] Adicionar banner de cookies
 *       - Consentimento para tracking/analytics
 *       - Usar react-cookie-consent
 *       - Link: https://github.com/Mastermindzh/react-cookie-consent
 *
 * @component
 * ============================================================================
 */

import React from 'react';
import styles from '../styles/Footer.module.css';

/**
 * Componente de rodapé da landing page
 * @returns {JSX.Element}
 */
const Footer = () => {
  /** Ano atual para o copyright - atualiza automaticamente */
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div>© {currentYear} O Mínimo que Você Precisa pra se Virar nos EUA. Todos os direitos reservados.</div>
    </footer>
  );
};

export default Footer;
