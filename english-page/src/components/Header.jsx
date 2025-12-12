/**
 * ============================================================================
 * HEADER.JSX - Componente de Cabeçalho
 * ============================================================================
 *
 * Header da landing page pública com navegação e CTA principal.
 * Usado apenas nas páginas públicas (não no admin).
 *
 * FEATURES:
 * - Logo com emoji da bandeira dos EUA
 * - Navegação por âncoras para seções da landing page
 * - CTA principal para o formulário de captura
 *
 * TODO: [RESPONSIVIDADE] Implementar menu hamburguer para mobile
 *       - Esconder links de navegação em telas pequenas
 *       - Adicionar botão de menu com animação
 *       - Usar estado local ou CSS puro para toggle
 *
 * TODO: [UX] Adicionar efeito de scroll no header
 *       - Header transparente no topo
 *       - Background sólido ao rolar a página
 *       - Usar useEffect com scroll listener
 *
 * TODO: [SEO] Melhorar estrutura semântica
 *       - Usar <nav> com aria-label
 *       - Adicionar aria-current para link ativo
 *
 * TODO: [ACESSIBILIDADE] Melhorar navegação por teclado
 *       - Skip link para conteúdo principal
 *       - Focus visible nos links
 *       - Suporte a atalhos de teclado
 *
 * @component
 * ============================================================================
 */

import { Link } from 'react-router-dom';
import styles from '../styles/Header.module.css';

/**
 * Componente de cabeçalho da landing page
 * @returns {JSX.Element}
 */
const Header = () => {
  return (
    <header className={styles.headerContainer}>
      <div className={styles.navInner}>
        <div className={styles.logo}>
          <div className={styles.logoBadge}>🇺🇸</div>
          <div>
            <div>O MÍNIMO</div>
            <div className={styles.logoSubtitle}>
              pra se virar nos EUA
            </div>
          </div>
        </div>

        <div className={styles.navLinks}>
          <a href="#sobre">Sobre</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#modulos">Módulos</a>
          <a href="#resultado">Resultado</a>

          <a className={`${styles.btn} ${styles.btnPrimary} ${styles.navCta}`} href="#formulario">
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;

