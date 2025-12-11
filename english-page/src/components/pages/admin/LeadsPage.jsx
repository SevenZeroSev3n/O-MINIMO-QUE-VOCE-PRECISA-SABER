import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '../../../services/auth';
import Sidebar from '../../admin/Sidebar';
import LeadsTable from '../../admin/LeadsTable';
import styles from '../../../styles/Admin.module.css';
import { API_URL } from '../../../config';

function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      
      const url = `${API_URL}/admin/leads?${params.toString()}`;
      const response = await authenticatedFetch(url);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar leads');
      }

      const data = await response.json();
      setLeads(data.leads || []);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar leads:', err);
    } finally {
      setLoading(false);
    }
  };

    // Exemplo: Atualizar status de lead
const updateLeadStatus = async (leadId, newStatus) => {
  try {
    const response = await authenticatedFetch(
      `${API_URL}/admin/leads/${leadId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao atualizar status');
    }

    // Recarregar leads
    fetchLeads();
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao atualizar status do lead');
  }
};

// Exemplo: Deletar lead
const deleteLead = async (leadId) => {
  if (!confirm('Tem certeza que deseja deletar este lead?')) return;

  try {
    const response = await authenticatedFetch(
      `${API_URL}/admin/leads/${leadId}`,
      {
        method: 'DELETE'
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao deletar lead');
    }

    // Recarregar leads
    fetchLeads();
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao deletar lead');
  }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const response = await authenticatedFetch(
        `http://localhost:3000/api/admin/leads/${leadId}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message);
      console.error(err);
    }
  };

  const handleDelete = async (leadId) => {
    try {
      const response = await authenticatedFetch(
        `http://localhost:3000/api/admin/leads/${leadId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Erro ao deletar lead');
      }

      setLeads(leads.filter(lead => lead.id !== leadId));
    } catch (err) {
      alert('Erro ao deletar lead: ' + err.message);
      console.error(err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusCount = (status) => {
    if (status === 'all') return leads.length;
    return leads.filter(lead => lead.status === status).length;
  };

  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      
      <main className={styles.adminMain}>
        <div className={styles.adminHeader}>
          <div>
            <h1 className={styles.pageTitle}>Gerenciar Leads</h1>
            <p className={styles.pageSubtitle}>
              Total de {leads.length} lead{leads.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <button 
            onClick={fetchLeads} 
            className={styles.refreshButton}
            disabled={loading}
          >
            🔄 Atualizar
          </button>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            ⚠️ {error}
          </div>
        )}

        <div className={styles.filtersBar}>
          <div className={styles.filterTabs}>
            <button
              onClick={() => handleFilterChange('status', 'all')}
              className={`${styles.filterTab} ${filters.status === 'all' ? styles.filterTabActive : ''}`}
            >
              Todos ({getStatusCount('all')})
            </button>
            <button
              onClick={() => handleFilterChange('status', 'new')}
              className={`${styles.filterTab} ${filters.status === 'new' ? styles.filterTabActive : ''}`}
            >
              🆕 Novos ({getStatusCount('new')})
            </button>
            <button
              onClick={() => handleFilterChange('status', 'contacted')}
              className={`${styles.filterTab} ${filters.status === 'contacted' ? styles.filterTabActive : ''}`}
            >
              📞 Contatados ({getStatusCount('contacted')})
            </button>
            <button
              onClick={() => handleFilterChange('status', 'converted')}
              className={`${styles.filterTab} ${filters.status === 'converted' ? styles.filterTabActive : ''}`}
            >
              ✅ Convertidos ({getStatusCount('converted')})
            </button>
          </div>

          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="🔍 Buscar por nome, telefone ou cidade..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.tableContainer}>
          <LeadsTable
            leads={leads}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}

export default LeadsPage;