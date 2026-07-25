import { XP_PER_LEVEL } from './xp-constants.js';

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

// Fórmula flat (sem precedente no projeto a seguir, decisão simples e
// ajustável via XP_PER_LEVEL): nível nunca é armazenado, sempre derivado
// do total de XP no momento da leitura — mesmo princípio de saldo
// derivado de PointsTransaction (SUM(amount) via aggregate).
export function levelFromXp(totalXp: number): LevelProgress {
  const safeXp = Math.max(0, totalXp);
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = safeXp % XP_PER_LEVEL;
  return { level, xpIntoLevel, xpForNextLevel: XP_PER_LEVEL };
}
