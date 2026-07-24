import { useParams, Link } from 'react-router-dom';
import { useAdminGames } from '@/hooks/useAdminGames';
import { GameForm } from '@/components/GameForm';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';

export function AdminGameFormPage() {
  const { id } = useParams<{ id?: string }>();

  if (!id) {
    return <GameForm mode="create" />;
  }

  return <EditGameForm id={id} />;
}

function EditGameForm({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useAdminGames();

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

  const game = data?.games.find((entry) => entry.id === id);

  if (!game) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-sm text-silver-muted mb-4">Jogo não encontrado.</p>
        <Link to="/admin/jogos" className="text-ember hover:underline font-mono text-xs uppercase">
          Voltar para jogos
        </Link>
      </div>
    );
  }

  return <GameForm mode="edit" game={game} />;
}
