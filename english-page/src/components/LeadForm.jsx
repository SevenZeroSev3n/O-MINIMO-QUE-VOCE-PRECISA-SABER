import React, { useState, useEffect } from 'react';
import styles from '../styles/Profile.module.css';
import { API_URL } from '../config';

const LeadForm = () => {
  // ========================================
  // ESTADOS DO COMPONENTE
  // ========================================
  
  // Estado do formulário - cada campo é uma propriedade
  const [formData, setFormData] = useState({
    nome: '',
    cidade: '',
    whatsapp: '',
    nivel: '',
    objetivo: '',
    horario: '',
    mensagem: ''
  });

  // Estado para controlar loading do botão
  const [loading, setLoading] = useState(false);
  
  // Estado para mensagem de sucesso/erro
  const [message, setMessage] = useState('');
  
  // Estado para dados de rastreamento (de onde o usuário veio)
  const [trackingData, setTrackingData] = useState({});

  // ========================================
  // EFEITO PARA CAPTURAR UTM PARAMETERS
  // ========================================
  
  // useEffect com [] vazio = executa apenas quando componente monta
  useEffect(() => {
    // URLSearchParams é uma API do navegador para ler query strings
    // Ex: ?utm_source=instagram&utm_campaign=promo
    const urlParams = new URLSearchParams(window.location.search);
    
    const tracking = {
      utm_source: urlParams.get('utm_source') || 'direct',
      utm_medium: urlParams.get('utm_medium') || 'none',
      utm_campaign: urlParams.get('utm_campaign') || 'none',
      source: urlParams.get('utm_source') || 'direct'
    };

    setTrackingData(tracking);

    // Salva no localStorage para não perder se usuário navegar
    localStorage.setItem('tracking', JSON.stringify(tracking));

    console.log('Tracking capturado:', tracking);
  }, []);

  // ========================================
  // HANDLER PARA MUDANÇA NOS CAMPOS
  // ========================================
  
  // Função genérica que funciona para qualquer campo
  // e.target.name = nome do campo (ex: "nome", "cidade")
  // e.target.value = valor digitado
  const handleChange = (e) => {
    setFormData({
      ...formData, // Spread operator: mantém os outros campos
      [e.target.name]: e.target.value // Atualiza apenas o campo que mudou
    });
  };

  // ========================================
  // HANDLER PARA ENVIO DO FORMULÁRIO
  // ========================================
  
  const handleSubmit = async (e) => {
    e.preventDefault(); // Impede o comportamento padrão do form (recarregar página)
    setLoading(true);
    setMessage('');

    try {
      // Recupera tracking do state ou localStorage
      const savedTracking = trackingData.utm_source
        ? trackingData
        : JSON.parse(localStorage.getItem('tracking') || '{}');

      // Monta objeto com dados do lead
      // Note que os nomes das propriedades mudam (nome -> name, cidade -> city)
      // Isso é porque o backend espera em inglês
      const leadData = {
        name: formData.nome,
        whatsapp: formData.whatsapp,
        city: formData.cidade,
        level: formData.nivel,
        goal: formData.objetivo,
        schedule: formData.horario,
        message: formData.mensagem,
        source: savedTracking.source || 'direct',
        utm_source: savedTracking.utm_source || 'direct',
        utm_medium: savedTracking.utm_medium || 'none',
        utm_campaign: savedTracking.utm_campaign || 'none'
      };

      console.log('Enviando lead com tracking:', leadData);

      // Envia para a API
      const response = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData)
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar formulário');
      }

      const data = await response.json();

      setMessage('Inscricao enviada! Voce recebera uma mensagem no WhatsApp em breve.');

      // Limpa o formulário (volta ao estado inicial)
      setFormData({
        nome: '',
        cidade: '',
        whatsapp: '',
        nivel: '',
        objetivo: '',
        horario: '',
        mensagem: ''
      });

      // Limpa tracking após envio
      localStorage.removeItem('tracking');

      console.log('Lead criado com sucesso:', data);
    } catch (error) {
      setMessage('Erro ao enviar. Tente novamente.');
      console.error('Erro ao enviar lead:', error);
    } finally {
      // finally SEMPRE executa, mesmo se der erro
      setLoading(false);
    }
  };

  // ========================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ========================================
  
  return (
    <form onSubmit={handleSubmit} className={styles.leadForm}>
      {/* Grid com 2 colunas para Nome e Cidade */}
      <div className={`${styles.leadFormGrid} ${styles.leadFormGrid2}`}>
        <div className={styles.leadField}>
          <label htmlFor="nome" className={styles.leadLabel}>Nome completo</label>
          <input
            id="nome"
            name="nome"
            type="text"
            className={styles.leadInput}
            placeholder="Seu nome"
            value={formData.nome}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.leadField}>
          <label htmlFor="cidade" className={styles.leadLabel}>Cidade / Estado</label>
          <input
            id="cidade"
            name="cidade"
            type="text"
            className={styles.leadInput}
            placeholder="Ex: Boston, MA"
            value={formData.cidade}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Grid com 2 colunas para WhatsApp e Nível */}
      <div className={`${styles.leadFormGrid} ${styles.leadFormGrid2}`}>
        <div className={styles.leadField}>
          <label htmlFor="whatsapp" className={styles.leadLabel}>WhatsApp (com DDI)</label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            className={styles.leadInput}
            placeholder="+1 857 000 0000"
            value={formData.whatsapp}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.leadField}>
          <label htmlFor="nivel" className={styles.leadLabel}>Seu nivel de ingles</label>
          <select
            id="nivel"
            name="nivel"
            className={styles.leadSelect}
            value={formData.nivel}
            onChange={handleChange}
            required
          >
            <option value="">Selecione</option>
            <option>Comecando do zero</option>
            <option>Sei algumas frases</option>
            <option>Consigo me virar mais ou menos</option>
            <option>Ja falo, mas quero destravar</option>
          </select>
        </div>
      </div>

      {/* Grid com 2 colunas para Objetivo e Horário */}
      <div className={`${styles.leadFormGrid} ${styles.leadFormGrid2}`}>
        <div className={styles.leadField}>
          <label htmlFor="objetivo" className={styles.leadLabel}>Principal objetivo</label>
          <select
            id="objetivo"
            name="objetivo"
            className={styles.leadSelect}
            value={formData.objetivo}
            onChange={handleChange}
            required
          >
            <option value="">Selecione</option>
            <option>Trabalho / ganhar mais</option>
            <option>Sobreviver no dia a dia</option>
            <option>Imigracao / entrevista</option>
            <option>Viagem / turismo</option>
            <option>Outro</option>
          </select>
        </div>

        <div className={styles.leadField}>
          <label htmlFor="horario" className={styles.leadLabel}>Melhor horario</label>
          <select
            id="horario"
            name="horario"
            className={styles.leadSelect}
            value={formData.horario}
            onChange={handleChange}
            required
          >
            <option value="">Selecione</option>
            <option>Manha</option>
            <option>Tarde</option>
            <option>Noite</option>
            <option>Fim de semana</option>
          </select>
        </div>
      </div>

      {/* Campo de mensagem (largura total) */}
      <div className={styles.leadFormGrid}>
        <div className={styles.leadField}>
          <label htmlFor="mensagem" className={styles.leadLabel}>
            Me conta rapidinho sua situacao
          </label>
          <textarea
            id="mensagem"
            name="mensagem"
            className={styles.leadTextarea}
            placeholder="Ex: Moro nos EUA, trabalho na construcao e preciso de ingles pra crescer no trabalho."
            value={formData.mensagem}
            onChange={handleChange}
          ></textarea>
        </div>
      </div>

      {/* Mensagem de sucesso ou erro */}
      {message && (
        <div style={{
          padding: '10px',
          marginTop: '10px',
          borderRadius: '8px',
          background: message.includes('enviada') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${message.includes('enviada') ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: message.includes('enviada') ? '#4ade80' : '#f87171',
          fontSize: '0.85rem'
        }}>
          {message}
        </div>
      )}

      {/* Botão de envio */}
      <button
        type="submit"
        className={`btn btn-primary ${styles.leadSubmit}`}
        disabled={loading}
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Enviando...' : 'Enviar dados e falar no WhatsApp'}
      </button>

      {/* Texto legal */}
      <div className={styles.leadLegal}>
        Ao enviar, voce concorda em receber contato por WhatsApp e e-mail sobre o curso.
      </div>
    </form>
  );
};

export default LeadForm;
