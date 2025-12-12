/**
 * ============================================================================
 * SIDEBAR.JSX - Menu Lateral do Admin
 * ============================================================================
 *
 * Componente de navegação lateral para a área administrativa.
 * Exibe logo, info do usuário, links de navegação e logout.
 *
 * FEATURES:
 * - Logo e título do painel
 * - Info do usuário logado (nome e role)
 * - Links de navegação com estado ativo
 * - Link externo para ver o site
 * - Botão de logout com confirmação
 *
 * TODO: [UX] Adicionar collapse/expand
 *       - Botão para minimizar sidebar
 *       - Mostrar apenas ícones quando colapsado
 *       - Salvar preferência no localStorage
 *
 * TODO: [PERFORMANCE] Evitar chamada repetida a getCurrentUser
 *       - Usar React Context para compartilhar dados do usuário
 *       - Sidebar está chamando getCurrentUser a cada render
 *       - Centralizar em AuthContext
 *
 * TODO: [UX] Adicionar indicador de notificações
 *       - Badge com número de leads novos
 *       - Atualizar em tempo real
 *
 * TODO: [ACESSIBILIDADE] Melhorar navegação
 *       - Adicionar aria-label na nav
 *       - aria-current para link ativo
 *       - Suporte a navegação por teclado
 *
 * @component
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logout, getCurrentUser } from '../../services/auth';
import styles from '../../styles/Admin.module.css';

/**
 * Componente de sidebar para navegação admin
 * @returns {JSX.Element}
 */
const Sidebar = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
      }
    };

    fetchUser();
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarLogo}>🇺🇸</div>
        <h2 className={styles.sidebarTitle}>Admin Panel</h2>
        {user && (
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user.name}</div>
            <div className={styles.userRole}>{user.role}</div>
          </div>
        )}
      </div>

      <nav className={styles.sidebarNav}>
        <Link
          to="/admin"
          className={`${styles.navItem} ${isActive('/admin') ? styles.navItemActive : ''}`}
        >
          <span className={styles.navIcon}>📊</span>
          <span>Dashboard</span>
        </Link>

        <Link
          to="/admin/leads"
          className={`${styles.navItem} ${isActive('/admin/leads') ? styles.navItemActive : ''}`}
        >
          <span className={styles.navIcon}>👥</span>
          <span>Gerenciar Leads</span>
        </Link>

        <Link
          to="/"
          className={styles.navItem}
          target="_blank"
        >
          <span className={styles.navIcon}>🌐</span>
          <span>Ver Site</span>
        </Link>
      </nav>

      <div className={styles.sidebarFooter}>
        <button onClick={handleLogout} className={styles.logoutButton}>
          <span className={styles.navIcon}>🚪</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;