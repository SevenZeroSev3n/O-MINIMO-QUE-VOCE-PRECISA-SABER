import React, { useState, useEffect } from 'react';
import styles from '../../styles/Profile.module.css';
import { API_URL } from '../../config';

const HomePageContent = () => {
  const [formData, setFormData] = useState({
    nome: '',
    cidade: '',
    whatsapp: '',
    nivel: '',
    objetivo: '',
    horario: '',
    mensagem: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [trackingData, setTrackingData] = useState({});

  // ✨ Capturar UTM parameters quando a página carregar
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tracking = {
      utm_source: urlParams.get('utm_source') || 'direct',
      utm_medium: urlParams.get('utm_medium') || 'none',
      utm_campaign: urlParams.get('utm_campaign') || 'none',
      source: urlParams.get('utm_source') || 'direct'
    };
    
    setTrackingData(tracking);
    
    // Salvar no localStorage para não perder se o usuário navegar
    localStorage.setItem('tracking', JSON.stringify(tracking));
    
    console.log('📊 Tracking capturado:', tracking);
    
    // Mostrar para o usuário se veio de uma campanha (opcional)
    if (tracking.utm_campaign && tracking.utm_campaign !== 'none') {
      console.log(`🎯 Usuário veio da campanha: ${tracking.utm_campaign} via ${tracking.utm_source}`);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Pegar tracking do state ou localStorage
      const savedTracking = trackingData.utm_source 
        ? trackingData 
        : JSON.parse(localStorage.getItem('tracking') || '{}');

      const leadData = {
        name: formData.nome,
        whatsapp: formData.whatsapp,
        city: formData.cidade,
        level: formData.nivel,
        goal: formData.objetivo,
        schedule: formData.horario,
        message: formData.mensagem,
        // ✨ Adicionar dados de tracking
        source: savedTracking.source || 'direct',
        utm_source: savedTracking.utm_source || 'direct',
        utm_medium: savedTracking.utm_medium || 'none',
        utm_campaign: savedTracking.utm_campaign || 'none'
      };

      console.log('📤 Enviando lead com tracking:', leadData);

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
      
      setMessage('✅ Inscrição enviada! Você receberá uma mensagem no WhatsApp em breve.');
      
      // Limpar formulário
      setFormData({
        nome: '',
        cidade: '',
        whatsapp: '',
        nivel: '',
        objetivo: '',
        horario: '',
        mensagem: ''
      });

      // Limpar tracking após envio
      localStorage.removeItem('tracking');

      console.log('✅ Lead criado com sucesso:', data);
    } catch (error) {
      setMessage('❌ Erro ao enviar. Tente novamente.');
      console.error('Erro ao enviar lead:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
    
      <section className={styles.hero}>
        <div>
          <div className={styles.heroBadgeRow}>
            <div className={styles.heroBadge}>
              <span>🧳</span> Para quem acabou de chegar nos EUA
            </div>
            <div className={styles.heroBadge}>
              <span>🎧</span> Curso em vídeo 100% online
            </div>
          </div>
          <h1 className={styles.heroTitle}>
            O mínimo que você precisa pra <span>se virar nos EUA</span>.
          </h1>
          <p className={styles.heroSubtitle}>
            Não é sobre falar inglês perfeito. É sobre conseguir comer, trabalhar,
            pagar conta, pedir ajuda e viver sozinho em outro país.
          </p>
          <p className={`${styles.heroSubtitle} ${styles.heroSubtitleStrong}`}>
            Em vez de decorar gramática, você aprende a funcionar numa nova maneira de pensar.
          </p>

          <div className={styles.heroCtas}>
            <a
              className="btn btn-primary"
              href="#formulario"
            >
              🚀 Preencher formulário rápido
            </a>
            <a
              className="btn btn-ghost"
              href="#modulos"
            >
              Ver tudo o que você vai aprender
            </a>
          </div>

          <div className={styles.heroGuarantee}>
            <span>✅</span>
            <span>Acesso vitalício • 108 vídeo aulas práticas • Explicado em português</span>
          </div>
        </div>

        
        <aside className={styles.heroSideCard} id="formulario">
          <div className={styles.heroSideTag}>Resposta em poucas horas</div>
          <div className={styles.heroSideTitle}>Aplicar para a próxima turma</div>
          <p className={styles.heroSideText}>
            Preenche rapidinho e eu te respondo <strong>direto no WhatsApp</strong>
          </p>

          <form onSubmit={handleSubmit} className={styles.leadForm}>
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
                <label htmlFor="nivel" className={styles.leadLabel}>Seu nível de inglês</label>
                <select 
                  id="nivel" 
                  name="nivel" 
                  className={styles.leadSelect}
                  value={formData.nivel}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione</option>
                  <option>Começando do zero</option>
                  <option>Sei algumas frases</option>
                  <option>Consigo me virar mais ou menos</option>
                  <option>Já falo, mas quero destravar</option>
                </select>
              </div>
            </div>

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
                  <option>Imigração / entrevista</option>
                  <option>Viagem / turismo</option>
                  <option>Outro</option>
                </select>
              </div>
              
              <div className={styles.leadField}>
                <label htmlFor="horario" className={styles.leadLabel}>Melhor horário</label>
                <select 
                  id="horario" 
                  name="horario" 
                  className={styles.leadSelect}
                  value={formData.horario}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione</option>
                  <option>Manhã</option>
                  <option>Tarde</option>
                  <option>Noite</option>
                  <option>Fim de semana</option>
                </select>
              </div>
            </div>

            <div className={styles.leadFormGrid}>
              <div className={styles.leadField}>
                <label htmlFor="mensagem" className={styles.leadLabel}>
                  Me conta rapidinho sua situação
                </label>
                <textarea
                  id="mensagem"
                  name="mensagem"
                  className={styles.leadTextarea}
                  placeholder="Ex: Moro nos EUA, trabalho na construção e preciso de inglês pra crescer no trabalho."
                  value={formData.mensagem}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            {message && (
              <div style={{ 
                padding: '10px', 
                marginTop: '10px',
                borderRadius: '8px',
                background: message.includes('✅') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${message.includes('✅') ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: message.includes('✅') ? '#4ade80' : '#f87171',
                fontSize: '0.85rem'
              }}>
                {message}
              </div>
            )}

            <button 
              type="submit" 
              className={`btn btn-primary ${styles.leadSubmit}`}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '⏳ Enviando...' : '💬 Enviar dados e falar no WhatsApp'}
            </button>

            <div className={styles.leadLegal}>
              Ao enviar, você concorda em receber contato por WhatsApp e e-mail sobre o curso.
            </div>
          </form>

          <div className={styles.heroSideFooter}>
            <span className={styles.muted}>Se eu estiver em aula, respondo assim que sair.</span>
            <div className={styles.dotRow}>
              <div className={`${styles.dot} ${styles.active}`}></div>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
            </div>
          </div>
        </aside>
      </section>

    
      <section id="sobre" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEyebrow}>O que você vai aprender</div>
          <h2 className={styles.sectionTitle}>Inglês que paga boleto, não prova de proficiência</h2>
          <p className={styles.sectionSubtitle}>
            Aqui não tem vocabulário "fancy" nem inglês de escritório. É o inglês que você usa
            todo dia pra viver sozinho nos Estados Unidos.
          </p>
        </div>

        <div className={styles.split}>
          <div>
            <ul className={styles.checkList}>
              <li>
                <span className={styles.checkIco}>🍽️</span>
                <span>Comer em qualquer lugar – restaurante, café, fast food, mercado, feira.</span>
              </li>
              <li>
                <span className={styles.checkIco}>💼</span>
                <span>Trabalhar com segurança em limpeza, construção, cozinha, entrega, fábrica.</span>
              </li>
              <li>
                <span className={styles.checkIco}>💳</span>
                <span>Pagar contas, resolver banco, entender preços, gorjetas e não ser passado pra trás.</span>
              </li>
              <li>
                <span className={styles.checkIco}>🧭</span>
                <span>Pedir e dar direções, usar GPS, se virar em qualquer lugar da cidade.</span>
              </li>
              <li>
                <span className={styles.checkIco}>🆘</span>
                <span>Resolver emergências – médico, farmácia, hospital, chamar ajuda.</span>
              </li>
              <li>
                <span className={styles.checkIco}>🤝</span>
                <span>Fazer amigos, conversar com americanos, falar de sentimentos, hobbies, dia a dia.</span>
              </li>
            </ul>
          </div>

          <div className={`${styles.card} ${styles.cardGhost}`}>
            <div className={styles.cardTitle}>Resumo do curso em números</div>
            <div className={styles.cardText}>
              • <span className={styles.highlight}>108 vídeo aulas práticas</span><br />
              • Acesso vitalício – estude no seu ritmo<br />
              • Explicações em português, frases em inglês prontas pra uso<br />
              • Cenários reais: aeroporto, trabalho, mercado, rua, restaurante e muito mais
            </div>
            <div className={styles.pillRow}>
              <div className={styles.pillSoft}>🎧 100% online</div>
              <div className={styles.pillSoft}>📱 Assista do celular</div>
              <div className={styles.pillSoft}>🗣️ Foco em fala</div>
              <div className={styles.pillSoft}>🇧🇷 Pensado pra brasileiro</div>
            </div>
          </div>
        </div>
      </section>


      <section id="como-funciona" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEyebrow}>Como funciona na prática</div>
          <h2 className={styles.sectionTitle}>Direto ao ponto: você aprende, aplica e repete</h2>
          <p className={styles.sectionSubtitle}>
            Nada de teoria infinita. Cada aula é um cenário real com frases que você usa na vida
            real já na próxima vez que sair de casa.
          </p>
        </div>

        <div className={styles.split}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Como funciona:</div>
            <ul className={styles.checkList} style={{marginTop: "6px"}}>
              <li>
                <span className={styles.checkIco}>🎥</span>
                <span><strong>108 vídeo aulas práticas</strong> – cada uma focada em uma situação real.</span>
              </li>
              <li>
                <span className={styles.checkIco}>♾️</span>
                <span><strong>Acesso vitalício</strong> – você pode rever sempre que precisar.</span>
              </li>
              <li>
                <span className={styles.checkIco}>🇧🇷</span>
                <span><strong>Explicado em português</strong> – pra você entender rápido e sem rodeios.</span>
              </li>
              <li>
                <span className={styles.checkIco}>🗣️</span>
                <span><strong>Foco em frases que funcionam</strong> – não em regras de gramática.</span>
              </li>
              <li>
                <span className={styles.checkIco}>🌎</span>
                <span><strong>Cenários reais</strong> – aeroporto, trabalho, mercado, rua, restaurante e muito mais.</span>
              </li>
            </ul>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Pra quem é esse curso:</div>
            <ul className={styles.tagList} style={{ marginTop: "6px"}}>
              <li>
                <span className={styles.checkIco}>✅</span>
                <span>Você acabou de chegar (ou vai chegar) nos EUA.</span>
              </li>
              <li>
                <span className={styles.checkIco}>✅</span>
                <span>Você trabalha com limpeza, construção, cozinha, entrega ou fábrica.</span>
              </li>
              <li>
                <span className={styles.checkIco}>✅</span>
                <span>Você até entende inglês, mas trava na hora de falar.</span>
              </li>
              <li>
                <span className={styles.checkIco}>✅</span>
                <span>Você quer autonomia – viver sem depender de tradutor ou amigo bilíngue.</span>
              </li>
              <li>
                <span className={styles.checkIco}>✅</span>
                <span>Você não tem anos pra estudar – precisa funcionar <strong>agora</strong>.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="resultado" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEyebrow}>Seja honesto com você</div>
          <h2 className={styles.sectionTitle}>Esse curso não é pra todo mundo (e tá tudo bem)</h2>
          <p className={styles.sectionSubtitle}>
            Ele foi feito pra quem quer usar inglês na vida real – não pra colecionar certificado.
          </p>
        </div>

        <div className={styles.columns2}>
          <div className={`${styles.card} ${styles.cardGhost}`}>
            <div className={styles.cardTitle}>Pra quem NÃO é:</div>
            <ul className={styles.badList} style={{marginTop: "6px"}}>
              <li>
                <span className={styles.badIco}>❌</span>
                <span>Você quer inglês acadêmico ou focado em prova de proficiência.</span>
              </li>
              <li>
                <span className={styles.badIco}>❌</span>
                <span>Você quer impressionar os outros com vocabulário sofisticado.</span>
              </li>
              <li>
                <span className={styles.badIco}>❌</span>
                <span>Você não está disposto a praticar na vida real.</span>
              </li>
            </ul>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Depois dessas 108 aulas, você vai:</div>
            <ul className={styles.resultList} style={{ marginTop: "6px" }}>
              <li>
                <span className={styles.resultIco}>✅</span>
                <span>Sair de casa sozinho e resolver tudo o que precisa.</span>
              </li>
              <li>
                <span className={styles.resultIco}>✅</span>
                <span>Entender exatamente o que o seu chefe quer de você.</span>
              </li>
              <li>
                <span className={styles.resultIco}>✅</span>
                <span>Pedir comida sem medo de errar ou travar.</span>
              </li>
              <li>
                <span className={styles.resultIco}>✅</span>
                <span>Pagar contas sem ser enganado por falta de inglês.</span>
              </li>
              <li>
                <span className={styles.resultIco}>✅</span>
                <span>Pegar transporte sozinho – ônibus, metrô, avião, carro alugado.</span>
              </li>
              <li>
                <span className={styles.resultIco}>✅</span>
                <span>Fazer amigos, conversar, conhecer americanos.</span>
              </li>
              <li>
                <span className={styles.resultIco}>✅</span>
                <span>Resolver emergências com calma, sem pânico na hora de explicar.</span>
              </li>
              <li>
                <span className={styles.resultIco}>✅</span>
                <span>Parar de só sobreviver e <strong>começar a viver</strong> nos EUA.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="cta-final" className={styles.ctaFinal}>
        <h2>Pronto pra parar de depender dos outros pra tudo nos EUA?</h2>
        <p>
          Se você quer autonomia pra viver nos Estados Unidos – trabalhar, comer, se virar
          em emergência, falar com as pessoas e resolver a própria vida – esse curso foi
          feito pra você.
        </p>
        <div className={styles.heroCtas} style={{ justifyContent: "center", marginTop: "10px" }}>
          <a
            className="btn btn-primary"
            href="#formulario"
          >
            🔐 Garantir acesso preenchendo o formulário
          </a>
          <a
            className="btn btn-ghost"
            href="#modulos"
          >
            Ver os módulos antes de decidir
          </a>
        </div>
        <div className={styles.ctaSmall}>
          Você tem acesso vitalício. Estude no seu tempo, revise quando quiser e leve o curso com você
          em qualquer mudança, cidade ou estado.
        </div>
      </section>

    </main>
  );
};

export default HomePageContent;