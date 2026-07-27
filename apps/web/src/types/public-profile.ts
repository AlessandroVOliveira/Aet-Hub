import type { UserAchievementView, UserProgress } from './achievement';
import type { CosmeticItem } from './cosmetic';

export interface PublicProfile {
  username: string;
  displayName: string;
  favoriteGameName: string | null;
  favoriteCharacter: string | null;
  theme: string | null;
  progress: UserProgress;
  achievements: UserAchievementView[];
  followersCount: number;
  followingCount: number;
  equippedFrame: CosmeticItem | null;
  equippedTitle: CosmeticItem | null;
}

export interface GetPublicProfileResponse {
  profile: PublicProfile;
}
