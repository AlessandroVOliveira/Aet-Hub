import { useMyProfile } from '@/hooks/useMyProfile';
import { useGames } from '@/hooks/useGames';
import { ProfileForm } from '@/components/ProfileForm';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';
import { PageHeader } from '@/components/ui/PageHeader';

export function ProfileEditPage() {
  const profileQuery = useMyProfile();
  const gamesQuery = useGames();

  const isLoading = profileQuery.isLoading || gamesQuery.isLoading;
  const isError = profileQuery.isError || gamesQuery.isError;

  return (
    <div>
      <PageHeader eyebrow="MEU_PERFIL" title="EDITAR" accent="PERFIL" />

      {isLoading && <p className="p-4 md:p-8 text-sm text-silver-muted">Carregando...</p>}

      {isError && (
        <div className="p-4 md:p-8">
          <Banner variant="error">
            {profileQuery.error instanceof ApiError
              ? profileQuery.error.message
              : gamesQuery.error instanceof ApiError
                ? gamesQuery.error.message
                : 'Erro inesperado'}
          </Banner>
        </div>
      )}

      {!isLoading && !isError && profileQuery.data && (
        <ProfileForm profile={profileQuery.data.profile} games={gamesQuery.data?.games ?? []} />
      )}
    </div>
  );
}
