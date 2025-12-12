/**
 * ============================================================================
 * LEADSTABLE.JSX - Tabela de Leads
 * ============================================================================
 *
 * Componente de tabela para exibir lista de leads com ações.
 * Usado na página de gerenciamento de leads.
 *
 * COLUNAS:
 * - ID, Nome, WhatsApp (com link), Cidade
 * - Origem (UTM source), Campanha (UTM campaign)
 * - Nível de inglês, Objetivo
 * - Data de criação, Status
 * - Ações (mudar status, deletar)
 *
 * FEATURES:
 * - Link direto para WhatsApp
 * - Ícones por fonte de tráfego
 * - Badges coloridos por status
 * - Ciclo de status com clique
 * - Deleção com confirmação
 *
 * TODO: [REFATORAÇÃO] Extrair mapeamentos para constantes
 *       - getStatusBadge, getSourceIcon, getSourceLabel
 *       - Criar arquivo constants/leads.js
 *       - Reutilizar em outros componentes
 *
 * TODO: [UX] Adicionar tooltip com mais informações
 *       - Mostrar mensagem do lead no hover
 *       - Usar react-tooltip ou similar
 *       - Link: https://react-tooltip.com/
 *
 * TODO: [UX] Adicionar linha expansível
 *       - Clicar na linha para expandir detalhes
 *       - Mostrar todos os campos do lead
 *       - Mensagem completa, horário preferido, etc.
 *
 * TODO: [UX] Melhorar mudança de status
 *       - Dropdown em vez de ciclo
 *       - Permitir selecionar status específico
 *       - Confirmar antes de mudar
 *
 * TODO: [RESPONSIVIDADE] Tornar tabela responsiva
 *       - Scroll horizontal em mobile
 *       - Ou converter para cards em telas pequenas
 *
 * TODO: [ACESSIBILIDADE] Melhorar tabela
 *       - scope="col" nos headers
 *       - aria-sort para colunas ordenáveis
 *       - Feedback de ação com aria-live
 *
 * @component
 * @param {Object} props
 * @param {Array} props.leads - Lista de leads a exibir
 * @param {Function} props.onStatusChange - Callback para mudança de status
 * @param {Function} props.onDelete - Callback para deleção
 * @param {boolean} props.loading - Estado de carregamento
 * ============================================================================
 */

import React from 'react';
import styles from '../../styles/Admin.module.css';

/**
 * Componente de tabela de leads
 * @param {Object} props - Props do componente
 * @returns {JSX.Element}
 */
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