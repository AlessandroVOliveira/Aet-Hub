import { useParams, Link } from 'react-router-dom';
import { useAdminAchievements } from '@/hooks/useAdminAchievements';
import { AchievementForm } from '@/components/AchievementForm';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';

export function AdminAchievementFormPage() {
  const { id } = useParams<{ id?: string }>();

  if (!id) {
    return <AchievementForm mode="create" />;
  }

  return <EditAchievementForm id={id} />;
}

function EditAchievementForm({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useAdminAchievements();

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

  const achievement = data?.achievements.find((entry) => entry.id === id);

  if (!achievement) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-sm text-silver-muted mb-4">Conquista não encontrada.</p>
        <Link
          to="/admin/conquistas"
          className="text-ember hover:underline font-mono text-xs uppercase"
        >
          Voltar para conquistas
        </Link>
      </div>
    );
  }

  return <AchievementForm mode="edit" achievement={achievement} />;
}
