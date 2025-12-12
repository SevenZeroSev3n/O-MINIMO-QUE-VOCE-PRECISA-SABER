/**
 * ============================================================================
 * LOGIN.JSX - Página de Login Administrativo
 * ============================================================================
 *
 * Página de autenticação para acesso à área administrativa.
 * Usa JWT para autenticação stateless.
 *
 * FEATURES:
 * - Formulário de email/senha
 * - Redirecionamento automático se já autenticado
 * - Estados de loading e erro
 * - Feedback visual para o usuário
 *
 * FLUXO:
 * 1. Usuário insere credenciais
 * 2. Envia para API /auth/login
 * 3. Recebe token JWT e armazena
 * 4. Redireciona para /admin
 *
 * TODO: [UX] Adicionar "Esqueceu a senha?"
 *       - Endpoint de reset de senha
 *       - Email com link de recuperação
 *       - Usar Nodemailer ou SendGrid
 *       - Link: https://sendgrid.com/
 *
 * TODO: [SEGURANÇA] Implementar 2FA
 *       - Two-factor authentication via TOTP
 *       - Usar speakeasy para geração de códigos
 *       - Link: https://github.com/speakeasyjs/speakeasy
 *
 * TODO: [UX] Adicionar "Lembrar-me"
 *       - Checkbox para sessão estendida
 *       - Token com expiração maior (30 dias)
 *
 * TODO: [UX] Mostrar força da senha visualmente
 *       - Indicador durante digitação
 *       - Feedback de requisitos
 *
 * TODO: [ACESSIBILIDADE] Melhorar feedback de erros
 *       - aria-live para mensagens de erro
 *       - Focus no campo com erro
 *
 * @component
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, isAuthenticated } from '../../services/auth';
import styles from '../../styles/Login.module.css';

/**
 * Componente de página de login
 * @returns {JSX.Element}
 */
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.loginHeader}>
          <div className={styles.logo}>🇺🇸</div>
          <h1 className={styles.title}>Área Administrativa</h1>
          <p className={styles.subtitle}>
            O Mínimo que Você Precisa pra se Virar nos EUA
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="admin@example.com"
              required
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className={styles.error}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? '⏳ Entrando...' : '🔐 Entrar'}
          </button>
        </form>

        <div className={styles.footer}>
          
        </div>
      </div>
    </div>
  );
}

export default Login;