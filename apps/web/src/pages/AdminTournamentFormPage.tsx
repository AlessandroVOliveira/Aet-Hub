import { useParams } from 'react-router-dom';
import { useAdminTournament } from '@/hooks/useAdminTournament';
import { useGames } from '@/hooks/useGames';
import { TournamentForm } from '@/components/TournamentForm';
import { ApiError } from '@/services/http';
import type { Game } from '@/types/game';

export function AdminTournamentFormPage() {
  const { id } = useParams<{ id?: string }>();
  const gamesQuery = useGames();

  if (gamesQuery.isLoading) return <p>Carregando...</p>;

  if (gamesQuery.isError) {
    return (
      <p>{gamesQuery.error instanceof ApiError ? gamesQuery.error.message : 'Erro inesperado'}</p>
    );
  }

  const games = gamesQuery.data?.games ?? [];

  if (!id) {
    return <TournamentForm mode="create" games={games} />;
  }

  return <EditTournamentForm id={id} games={games} />;
}

function EditTournamentForm({ id, games }: { id: string; games: Game[] }) {
  const { data, isLoading, isError, error } = useAdminTournament(id);

  if (isLoading) return <p>Carregando...</p>;

  if (isError) {
    return <p>{error instanceof ApiError ? error.message : 'Erro inesperado'}</p>;
  }

  if (!data) return null;

  return <TournamentForm mode="edit" tournament={data.tournament} games={games} />;
}
