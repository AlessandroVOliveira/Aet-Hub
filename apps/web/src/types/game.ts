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

export interface GetGameResponse {
  game: Game;
}

export interface GameFormFields {
  name: string;
  isActive: boolean;
}

export type CreateGamePayload = GameFormFields;
export type UpdateGamePayload = Partial<GameFormFields>;
