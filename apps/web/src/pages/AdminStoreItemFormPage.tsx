import { useParams, Link } from 'react-router-dom';
import { useAdminStoreItems } from '@/hooks/useAdminStoreItems';
import { StoreItemForm } from '@/components/StoreItemForm';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';

export function AdminStoreItemFormPage() {
  const { id } = useParams<{ id?: string }>();

  if (!id) {
    return <StoreItemForm mode="create" />;
  }

  return <EditStoreItemForm id={id} />;
}

function EditStoreItemForm({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useAdminStoreItems();

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

  const item = data?.items.find((entry) => entry.id === id);

  if (!item) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-sm text-silver-muted mb-4">Item não encontrado.</p>
        <Link to="/admin/loja" className="text-ember hover:underline font-mono text-xs uppercase">
          Voltar para a loja
        </Link>
      </div>
    );
  }

  return <StoreItemForm mode="edit" item={item} />;
}
