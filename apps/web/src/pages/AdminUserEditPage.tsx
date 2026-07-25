import { useParams, Link } from 'react-router-dom';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { AdminUserForm } from '@/components/AdminUserForm';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';

export function AdminUserEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useAdminUsers();

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

  const user = data?.users.find((entry) => entry.id === id);

  if (!user) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-sm text-silver-muted mb-4">Usuário não encontrado.</p>
        <Link to="/admin/usuarios" className="text-ember hover:underline font-mono text-xs uppercase">
          Voltar para usuários
        </Link>
      </div>
    );
  }

  return <AdminUserForm user={user} />;
}
