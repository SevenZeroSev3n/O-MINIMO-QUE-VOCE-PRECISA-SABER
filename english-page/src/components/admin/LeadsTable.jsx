import React from 'react';
import styles from '../../styles/Admin.module.css';

const LeadsTable = ({ leads, onStatusChange, onDelete, loading }) => {
  const getStatusBadge = (status) => {
    const badges = {
      new: { label: 'Novo', class: styles.badgeNew },
      contacted: { label: 'Contatado', class: styles.badgeContacted },
      converted: { label: 'Convertido', class: styles.badgeConverted }
    };
    
    return badges[status] || badges.new;
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = (leadId, currentStatus) => {
    const statuses = ['new', 'contacted', 'converted'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onStatusChange(leadId, nextStatus);
  };

  const handleDelete = (leadId, leadName) => {
    if (window.confirm(`Tem certeza que deseja deletar o lead "${leadName}"?`)) {
      onDelete(leadId);
    }
  };

  if (loading) {
    return (
      <div className={styles.tableLoading}>
        <div className={styles.spinner}></div>
        <p>Carregando leads...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className={styles.tableEmpty}>
        <p>📭 Nenhum lead encontrado</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>WhatsApp</th>
            <th>Cidade</th>
            <th>Origem</th>
            <th>Campanha</th>
            <th>Nível</th>
            <th>Objetivo</th>
            <th>Data</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const statusBadge = getStatusBadge(lead.status);
            const sourceIcon = getSourceIcon(lead.source);
            const sourceLabel = getSourceLabel(lead.source);
            
            return (
              <tr key={lead.id}>
                <td className={styles.tableId}>#{lead.id}</td>
                <td className={styles.tableName}>{lead.name}</td>
                <td className={styles.tableWhatsapp}>
                  <a 
                    href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.whatsappLink}
                  >
                    {lead.whatsapp}
                  </a>
                </td>
                <td>{lead.city || '-'}</td>
                <td>
                  <span className={styles.sourceBadge} title={`Meio: ${lead.utm_medium || 'none'}`}>
                    {sourceIcon} {sourceLabel}
                  </span>
                </td>
                <td className={styles.tableCampaign}>
                  {lead.utm_campaign && lead.utm_campaign !== 'none' ? (
                    <span className={styles.campaignTag}>
                      🎯 {lead.utm_campaign}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className={styles.tableLevel}>{lead.level || '-'}</td>
                <td className={styles.tableGoal}>{lead.goal || '-'}</td>
                <td className={styles.tableDate}>{formatDate(lead.created_at)}</td>
                <td>
                  <span className={`${styles.badge} ${statusBadge.class}`}>
                    {statusBadge.label}
                  </span>
                </td>
                <td className={styles.tableActions}>
                  <button
                    onClick={() => handleStatusChange(lead.id, lead.status)}
                    className={styles.actionButton}
                    title="Mudar status"
                  >
                    🔄
                  </button>
                  <button
                    onClick={() => handleDelete(lead.id, lead.name)}
                    className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                    title="Deletar"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LeadsTable;