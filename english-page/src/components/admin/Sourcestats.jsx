import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '../../services/auth';
import styles from '../../styles/Admin.module.css';

function SourceStats() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSourceStats();
  }, []);

  const fetchSourceStats = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('http://localhost:3000/api/admin/stats/sources');
      
      if (response.ok) {
        const data = await response.json();
        setSources(data);
      }
    } catch (error) {
      console.error('Erro ao buscar stats por fonte:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source) => {
    const icons = {
      instagram: '📸',
      tiktok: '🎵',
      facebook: '📘',
      youtube: '📺',
      google: '🔍',
      twitter: '🐦',
      linkedin: '💼',
      direct: '🔗',
      email: '📧'
    };
    
    return icons[source?.toLowerCase()] || '🌐';
  };

  const getSourceLabel = (source) => {
    const labels = {
      instagram: 'Instagram',
      tiktok: 'TikTok',
      facebook: 'Facebook',
      youtube: 'YouTube',
      google: 'Google',
      twitter: 'Twitter',
      linkedin: 'LinkedIn',
      direct: 'Direto',
      email: 'Email'
    };
    
    return labels[source?.toLowerCase()] || source || 'Desconhecido';
  };

  const calculateConversionRate = (converted, total) => {
    if (total === 0) return 0;
    return ((converted / total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className={styles.dashboardSection}>
        <h2 className={styles.sectionTitle}>📊 Leads por Origem</h2>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className={styles.dashboardSection}>
        <h2 className={styles.sectionTitle}>📊 Leads por Origem</h2>
        <p className={styles.noData}>Nenhum dado de origem ainda</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardSection}>
      <h2 className={styles.sectionTitle}>📊 Leads por Origem</h2>
      
      <div className={styles.sourceStatsGrid}>
        {sources.map((source, index) => {
          const icon = getSourceIcon(source.source);
          const label = getSourceLabel(source.source);
          const conversionRate = calculateConversionRate(source.converted, source.total);
          
          return (
            <div key={index} className={styles.sourceStatCard}>
              <div className={styles.sourceStatHeader}>
                <span className={styles.sourceStatIcon}>{icon}</span>
                <span className={styles.sourceStatName}>{label}</span>
              </div>
              
              <div className={styles.sourceStatValue}>{source.total}</div>
              
              <div className={styles.sourceStatMeta}>
                <span>
                  ✅ {source.converted} convertido{source.converted !== 1 ? 's' : ''}
                </span>
                {conversionRate > 0 && (
                  <span className={styles.sourceStatConversion}>
                    {conversionRate}%
                  </span>
                )}
              </div>
              
              {source.utm_campaign && source.utm_campaign !== 'none' && (
                <div className={styles.sourceStatMeta} style={{ marginTop: '8px' }}>
                  🎯 {source.utm_campaign}
                </div>
              )}
              
              <div className={styles.sourceStatMeta} style={{ marginTop: '4px', fontSize: '11px' }}>
                🆕 {source.new} • 📞 {source.contacted}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SourceStats;