import { useParams, useSearchParams } from 'react-router-dom';
import { useAdminTournament } from '@/hooks/useAdminTournament';
import { useGames } from '@/hooks/useGames';
import { TournamentForm } from '@/components/TournamentForm';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';
import type { Game } from '@/types/game';

export function AdminTournamentFormPage() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const duplicarDe = searchParams.get('duplicarDe');
  const gamesQuery = useGames();

  if (gamesQuery.isLoading) return <p className="p-4 md:p-8 text-sm text-silver-muted">Carregando...</p>;

  if (gamesQuery.isError) {
    return (
      <div className="p-4 md:p-8">
        <Banner variant="error">
          {gamesQuery.error instanceof ApiError ? gamesQuery.error.message : 'Erro inesperado'}
        </Banner>
      </div>
    );
  }

  const games = gamesQuery.data?.games ?? [];

  if (id) {
    return <EditTournamentForm id={id} games={games} />;
  }

  if (duplicarDe) {
    return <DuplicateTournamentForm sourceId={duplicarDe} games={games} />;
  }

  return <TournamentForm mode="create" games={games} />;
}

function EditTournamentForm({ id, games }: { id: string; games: Game[] }) {
  const { data, isLoading, isError, error } = useAdminTournament(id);

  if (isLoading) return <p className="p-4 md:p-8 text-sm text-silver-muted">Carregando...</p>;

  if (isError) {
    return (
      <div className="p-4 md:p-8">
        <Banner variant="error">
          {error instanceof ApiError ? error.message : 'Erro inesperado'}
        </Banner>
      </div>
    );
  }

  if (!data) return null;

  return <TournamentForm mode="edit" tournament={data.tournament} games={games} />;
}

function DuplicateTournamentForm({ sourceId, games }: { sourceId: string; games: Game[] }) {
  const { data, isLoading, isError, error } = useAdminTournament(sourceId);

  if (isLoading) return <p className="p-4 md:p-8 text-sm text-silver-muted">Carregando...</p>;

  if (isError) {
    return (
      <div className="p-4 md:p-8">
        <Banner variant="error">
          {error instanceof ApiError ? error.message : 'Erro inesperado'}
        </Banner>
      </div>
    );
  }

  if (!data) return null;

  return <TournamentForm mode="create" games={games} sourceTournament={data.tournament} />;
}
