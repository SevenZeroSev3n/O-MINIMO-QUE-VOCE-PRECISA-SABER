import React from 'react';
import styles from '../../styles/Admin.module.css';

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