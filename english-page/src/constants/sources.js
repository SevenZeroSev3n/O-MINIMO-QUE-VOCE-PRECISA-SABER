// ========================================
// CONSTANTES DE FONTES DE LEADS
// ========================================

// Ícones para cada fonte (usados na UI)
export const SOURCE_ICONS = {
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

// Labels (nomes bonitos) para cada fonte
export const SOURCE_LABELS = {
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

// ========================================
// FUNÇÕES HELPER
// ========================================

// Retorna o ícone da fonte, ou ícone padrão se não encontrar
// O "?" é optional chaining - evita erro se source for null/undefined
export const getSourceIcon = (source) => {
  return SOURCE_ICONS[source?.toLowerCase()] || '🌐';
};

// Retorna o label da fonte, ou o próprio valor, ou "Desconhecido"
export const getSourceLabel = (source) => {
  return SOURCE_LABELS[source?.toLowerCase()] || source || 'Desconhecido';
};
