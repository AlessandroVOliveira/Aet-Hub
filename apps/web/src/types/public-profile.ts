import type { UserAchievementView, UserProgress } from './achievement';

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
}

export interface GetPublicProfileResponse {
  profile: PublicProfile;
}
