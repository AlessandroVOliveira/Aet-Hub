import { useParams } from 'react-router-dom';
import { useCommunity } from '@/hooks/useCommunity';
import { useGames } from '@/hooks/useGames';
import { CommunityForm } from '@/components/CommunityForm';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';
import type { Game } from '@/types/game';

export function AdminCommunityFormPage() {
  const { id } = useParams<{ id?: string }>();
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

  if (!id) {
    return <CommunityForm mode="create" games={games} />;
  }

  return <EditCommunityForm id={id} games={games} />;
}

function EditCommunityForm({ id, games }: { id: string; games: Game[] }) {
  const { data, isLoading, isError, error } = useCommunity(id);

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

  return <CommunityForm mode="edit" community={data.community} games={games} />;
}
