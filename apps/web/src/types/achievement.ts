export type AchievementRarity = 'COMMON' | 'RARE';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  rarity: AchievementRarity;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Nunca "UserAchievement" sozinho colide com nada de lib.dom, mas segue a
// convenção do projeto de sufixar "View"/tipo próprio pra deixar claro que
// é o shape de LEITURA (com achievement aninhado), não o insert.
export interface UserAchievementView {
  id: string;
  userId: string;
  achievementId: string;
  tournamentId: string | null;
  unlockedAt: string;
  achievement: Achievement;
}

export interface UserProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

export interface GetAchievementsResponse {
  achievements: Achievement[];
}

export interface GetAchievementResponse {
  achievement: Achievement;
}

export interface GetMyXpResponse {
  progress: UserProgress;
  achievements: UserAchievementView[];
}

export interface AchievementFormFields {
  code: string;
  name: string;
  description: string;
  rarity: AchievementRarity;
  isActive: boolean;
}

export type CreateAchievementPayload = AchievementFormFields;
// code é imutável após criação (mesma regra do backend) — fora do payload de update.
export type UpdateAchievementPayload = Partial<Omit<AchievementFormFields, 'code'>>;
