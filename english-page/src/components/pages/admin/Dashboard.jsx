/**
 * ============================================================================
 * DASHBOARD.JSX - Painel Administrativo Principal
 * ============================================================================
 *
 * Dashboard com visão geral das métricas e estatísticas de leads.
 * Primeira página que o admin vê após login.
 *
 * MÉTRICAS EXIBIDAS:
 * - Total de leads (all time)
 * - Leads por status (new, contacted, converted)
 * - Leads de hoje
 * - Gráfico dos últimos 7 dias
 * - Estatísticas por origem (UTM)
 *
 * FEATURES:
 * - Cards de estatísticas coloridos
 * - Gráfico de barras simples
 * - Links rápidos para ações comuns
 * - Estatísticas por fonte de tráfego
 *
 * TODO: [GRÁFICOS] Implementar gráficos mais robustos
 *       - Usar Chart.js ou Recharts
 *       - Gráfico de linha para tendência
 *       - Gráfico de pizza para distribuição de status
 *       - Link: https://recharts.org/
 *
 * TODO: [TEMPO REAL] Adicionar atualização automática
 *       - Polling a cada 30 segundos
 *       - Ou WebSockets para atualizações em tempo real
 *       - Mostrar indicador de última atualização
 *
 * TODO: [MÉTRICAS] Adicionar mais KPIs
 *       - Taxa de conversão (converted/total)
 *       - Tempo médio para conversão
 *       - Leads por dia da semana
 *       - Comparação com período anterior
 *
 * TODO: [EXPORTAÇÃO] Adicionar botão de exportar relatório
 *       - PDF com gráficos e métricas
 *       - Usar jspdf ou react-pdf
 *       - Link: https://github.com/parallax/jsPDF
 *
 * TODO: [FILTROS] Adicionar seletor de período
 *       - Hoje, últimos 7 dias, 30 dias, custom
 *       - Usar date picker
 *
 * @component
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '../../../services/auth';
import Sidebar from '../../admin/Sidebar';
import StatsCard from '../../admin/StatsCard';
import SourceStats from '../../admin/SourceStats';
import styles from '../../../styles/Admin.module.css';
import { API_URL } from '../../../config';

/**
 * Componente do dashboard administrativo
 * @returns {JSX.Element}
 */
function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_URL}/admin/stats`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.adminLayout}>
        <Sidebar />
        <main className={styles.adminMain}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Carregando dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.adminLayout}>
        <Sidebar />
        <main className={styles.adminMain}>
          <div className={styles.error}>
            ⚠️ {error}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      
      <main className={styles.adminMain}>
        <div className={styles.adminHeader}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Visão geral dos leads e estatísticas
          </p>
        </div>

        <div className={styles.statsGrid}>
          <StatsCard
            title="Total de Leads"
            value={stats?.total || 0}
            icon="👥"
            color="blue"
            subtitle="Todos os tempos"
          />

          <StatsCard
            title="Novos Leads"
            value={stats?.byStatus?.new || 0}
            icon="🆕"
            color="yellow"
            subtitle="Aguardando contato"
          />

          <StatsCard
            title="Contatados"
            value={stats?.byStatus?.contacted || 0}
            icon="📞"
            color="purple"
            subtitle="Em andamento"
          />

          <StatsCard
            title="Convertidos"
            value={stats?.byStatus?.converted || 0}
            icon="✅"
            color="green"
            subtitle="Matrículas efetivadas"
          />

          <StatsCard
            title="Hoje"
            value={stats?.today || 0}
            icon="📅"
            color="blue"
            subtitle="Leads recebidos hoje"
          />
        </div>

        {/* NOVO: Estatísticas por origem */}
        <SourceStats />

        <div className={styles.dashboardSection}>
          <h2 className={styles.sectionTitle}>Últimos 7 dias</h2>
          
          {stats?.last7Days && stats.last7Days.length > 0 ? (
            <div className={styles.chartContainer}>
              <div className={styles.simpleChart}>
                {stats.last7Days.map((day, index) => (
                  <div key={index} className={styles.chartBar}>
                    <div 
                      className={styles.chartBarFill}
                      style={{ 
                        height: `${(day.count / Math.max(...stats.last7Days.map(d => d.count))) * 100}%` 
                      }}
                    >
                      <span className={styles.chartBarValue}>{day.count}</span>
                    </div>
                    <div className={styles.chartBarLabel}>
                      {new Date(day.date).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'short' 
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className={styles.noData}>Sem dados dos últimos 7 dias</p>
          )}
        </div>

        <div className={styles.quickActions}>
          <h2 className={styles.sectionTitle}>Ações Rápidas</h2>
          <div className={styles.actionsGrid}>
            <a href="/admin/leads" className={styles.actionCard}>
              <div className={styles.actionIcon}>👥</div>
              <div className={styles.actionTitle}>Ver Leads</div>
              <div className={styles.actionDescription}>
                Gerenciar todos os leads
              </div>
            </a>

            <a href="/" target="_blank" rel="noopener noreferrer" className={styles.actionCard}>
              <div className={styles.actionIcon}>🌐</div>
              <div className={styles.actionTitle}>Ver Site</div>
              <div className={styles.actionDescription}>
                Abrir site público
              </div>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;