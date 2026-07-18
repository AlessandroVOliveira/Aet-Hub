export interface Game {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetGamesResponse {
  games: Game[];
}
