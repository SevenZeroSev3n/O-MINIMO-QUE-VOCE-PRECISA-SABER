/**
 * ============================================================================
 * STATSCARD.JSX - Card de Estatísticas
 * ============================================================================
 *
 * Componente de card para exibir métricas no dashboard.
 * Design limpo com ícone, título, valor e subtítulo opcional.
 *
 * USO:
 * ```jsx
 * <StatsCard
 *   title="Total de Leads"
 *   value={125}
 *   icon="👥"
 *   color="blue"
 *   subtitle="Todos os tempos"
 * />
 * ```
 *
 * CORES DISPONÍVEIS:
 * - blue (padrão)
 * - green
 * - yellow
 * - red
 * - purple
 *
 * TODO: [UX] Adicionar animação no valor
 *       - Count up animation ao carregar
 *       - Usar react-countup
 *       - Link: https://github.com/glennreyes/react-countup
 *
 * TODO: [UX] Adicionar indicador de tendência
 *       - Seta para cima/baixo vs período anterior
 *       - Porcentagem de mudança
 *       - Cor verde/vermelho para positivo/negativo
 *
 * TODO: [UX] Adicionar sparkline mini gráfico
 *       - Linha de tendência simples
 *       - Usar recharts ou similar
 *
 * @component
 * @param {Object} props
 * @param {string} props.title - Título do card
 * @param {number|string} props.value - Valor principal a exibir
 * @param {string} props.icon - Emoji ou ícone
 * @param {string} props.color - Cor do card (blue, green, yellow, red, purple)
 * @param {string} props.subtitle - Texto adicional abaixo do valor
 * ============================================================================
 */

import React from 'react';
import styles from '../../styles/Admin.module.css';

/**
 * Componente de card para métricas
 * @param {Object} props - Props do componente
 * @returns {JSX.Element}
 */
const StatsCard = ({ title, value, icon, color = 'blue', subtitle }) => {
  const colorClasses = {
    blue: styles.statsCardBlue,
    green: styles.statsCardGreen,
    yellow: styles.statsCardYellow,
    red: styles.statsCardRed,
    purple: styles.statsCardPurple
  };

  return (
    <div className={`${styles.statsCard} ${colorClasses[color]}`}>
      <div className={styles.statsCardHeader}>
        <div className={styles.statsCardIcon}>{icon}</div>
        <div className={styles.statsCardTitle}>{title}</div>
      </div>
      <div className={styles.statsCardValue}>{value}</div>
      {subtitle && (
        <div className={styles.statsCardSubtitle}>{subtitle}</div>
      )}
    </div>
  );
};

export default StatsCard;