import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logout, getCurrentUser } from '../../services/auth';
import styles from '../../styles/Admin.module.css';

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