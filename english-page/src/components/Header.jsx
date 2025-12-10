import { Link } from 'react-router-dom';
import styles from '../styles/Header.module.css';

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

