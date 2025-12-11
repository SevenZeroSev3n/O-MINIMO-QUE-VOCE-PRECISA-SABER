import React from 'react';
import styles from '../styles/Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={styles.footer}>
      <div>© {currentYear} O Mínimo que Você Precisa pra se Virar nos EUA. Todos os direitos reservados.</div>
    </footer>
  );
};

export default Footer;
