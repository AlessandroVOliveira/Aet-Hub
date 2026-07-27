import { useParams, Link } from 'react-router-dom';
import { useAdminCosmetics } from '@/hooks/useAdminCosmetics';
import { CosmeticForm } from '@/components/CosmeticForm';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';

export function AdminCosmeticFormPage() {
  const { id } = useParams<{ id?: string }>();

  if (!id) {
    return <CosmeticForm mode="create" />;
  }

  return <EditCosmeticForm id={id} />;
}

function EditCosmeticForm({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useAdminCosmetics();

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

  const cosmeticItem = data?.items.find((entry) => entry.id === id);

  if (!cosmeticItem) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-sm text-silver-muted mb-4">Cosmético não encontrado.</p>
        <Link
          to="/admin/cosmeticos"
          className="text-ember hover:underline font-mono text-xs uppercase"
        >
          Voltar para cosméticos
        </Link>
      </div>
    );
  }

  return <CosmeticForm mode="edit" cosmeticItem={cosmeticItem} />;
}
