import { Navigate, useParams } from 'react-router-dom';
import { UserCheck, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePublicProfile } from '@/hooks/usePublicProfile';
import { useFollowing, useFollowMutation, useUnfollowMutation } from '@/hooks/useFollows';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { Banner } from '@/components/ui/Banner';
import { LevelProgressBar } from '@/components/LevelProgressBar';
import { AchievementsList } from '@/components/AchievementsList';

export function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();

  const profileQuery = usePublicProfile(userId);
  const followingQuery = useFollowing();
  const followMutation = useFollowMutation();
  const unfollowMutation = useUnfollowMutation();

  // Sem tela dedicada pra "meu próprio perfil público" — /perfil já cobre
  // isso (com edição, seguidos/seguidores). Evita visão duplicada/confusa.
  if (userId && user && userId === user.id) {
    return <Navigate to="/perfil" replace />;
  }

  const profile = profileQuery.data?.profile;
  const isFollowing =
    followingQuery.data?.following.some((follow) => follow.followingId === userId) ?? false;
  const followToggle = isFollowing ? unfollowMutation : followMutation;

  return (
    <div>
      <PageHeader
        eyebrow="PERFIL"
        title={profile?.displayName ?? 'Perfil'}
        accent={profile ? `LVL ${profile.progress.level}` : undefined}
        actions={
          userId ? (
            <button
              type="button"
              onClick={() => followToggle.mutate(userId)}
              disabled={followToggle.isPending}
              className={`font-mono text-[10px] uppercase tracking-widest px-4 py-2 transition flex items-center gap-2 disabled:opacity-50 ${
                isFollowing
                  ? 'bg-navy-light ring-1 ring-ember/40 text-ember'
                  : 'bg-navy-light ring-1 ring-silver/20 hover:ring-ember/40'
              }`}
            >
              {isFollowing ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
              {isFollowing ? 'Seguindo' : 'Seguir'}
            </button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8 space-y-8">
        {profileQuery.isError && (
          <Banner variant="error">
            {profileQuery.error instanceof ApiError
              ? profileQuery.error.message
              : 'Erro inesperado'}
          </Banner>
        )}

        {profileQuery.isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {profile && (
          <>
            <div className="flex flex-wrap items-center gap-6">
              <div className="size-20 bg-ember/20 ring-1 ring-ember/40 grid place-items-center font-display italic text-3xl shrink-0">
                {profile.displayName[0]?.toUpperCase() ?? profile.username[0]?.toUpperCase()}
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 font-mono text-xs">
                <div>
                  <dt className="text-silver-muted uppercase tracking-widest text-[10px]">
                    Jogo favorito
                  </dt>
                  <dd className="mt-1">{profile.favoriteGameName ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-silver-muted uppercase tracking-widest text-[10px]">
                    Personagem favorito
                  </dt>
                  <dd className="mt-1">{profile.favoriteCharacter ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-silver-muted uppercase tracking-widest text-[10px]">Tema</dt>
                  <dd className="mt-1">{profile.theme ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-silver-muted uppercase tracking-widest text-[10px]">
                    Seguidores
                  </dt>
                  <dd className="mt-1">{profile.followersCount}</dd>
                </div>
                <div>
                  <dt className="text-silver-muted uppercase tracking-widest text-[10px]">
                    Seguindo
                  </dt>
                  <dd className="mt-1">{profile.followingCount}</dd>
                </div>
              </dl>
            </div>

            <LevelProgressBar progress={profile.progress} />

            <AchievementsList achievements={profile.achievements} />
          </>
        )}
      </div>
    </div>
  );
}
