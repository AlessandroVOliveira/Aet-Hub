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
import { cosmeticRarityStyle } from '@/utils/format';

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
            {profileQuery.error instanceof ApiError ? profileQuery.error.message : 'Erro inesperado'}
          </Banner>
        )}

        {profileQuery.isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {profile && (
          <>
            {/* Card de perfil — mesma estrutura visual de ProfilePage.tsx,
                adaptada aos campos que app_public_profile_snapshot expõe pra
                terceiros (sem avatarUrl/bio/histórico de torneios/partidas). */}
            <section className="ring-1 ring-silver/10 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
              <div className="relative shrink-0">
                <div
                  className={`size-24 bg-navy-dark grid place-items-center font-display italic text-3xl ${profile.equippedFrame?.className ?? 'ring-1 ring-ember/40'}`}
                >
                  {profile.displayName[0]?.toUpperCase() ?? profile.username[0]?.toUpperCase()}
                </div>
                {profile.equippedMascot?.emoji && (
                  <span
                    className={`pointer-events-none absolute -bottom-2 -left-3 text-2xl drop-shadow-[0_0_6px_var(--color-ember)] ${profile.equippedMascot.className ?? ''}`}
                    title={profile.equippedMascot.name}
                    aria-hidden
                  >
                    {profile.equippedMascot.emoji}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-3xl md:text-5xl uppercase leading-none ${profile.equippedFont?.className ?? 'font-display italic'}`}
                >
                  {profile.displayName}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {profile.equippedTitle && (
                    <span
                      className={`px-2 py-1 bg-navy-dark/70 ring-1 font-mono text-[10px] uppercase tracking-widest ${cosmeticRarityStyle[profile.equippedTitle.rarity]}`}
                    >
                      {profile.equippedTitle.name}
                    </span>
                  )}
                  <span className="px-2 py-1 bg-navy-dark/70 ring-1 ring-silver/15 font-mono text-[10px] uppercase text-silver-muted">
                    LVL {profile.progress.level}
                  </span>
                </div>
              </div>
              <div className="md:ml-auto font-mono text-[10px] uppercase text-silver-muted space-y-1">
                <p>
                  Jogo favorito: <span className="text-silver">{profile.favoriteGameName ?? '—'}</span>
                </p>
                <p>
                  Personagem: <span className="text-silver">{profile.favoriteCharacter ?? '—'}</span>
                </p>
                <p>
                  Tema: <span className="text-silver">{profile.theme ?? '—'}</span>
                </p>
              </div>
            </section>

            {/* Layout principal/aside espelha ProfilePage.tsx — sem histórico
                de torneios/partidas (não existe endpoint pra terceiro) nem
                listas de seguindo/seguidores (API pública só devolve
                contagem, não a lista, pra um terceiro). */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2 space-y-6">
                <div className="bg-navy-light ring-1 ring-silver/10 p-6">
                  <LevelProgressBar progress={profile.progress} />
                </div>
              </section>

              <aside className="space-y-6">
                <section className="bg-navy-light ring-1 ring-silver/10">
                  <header className="px-4 py-3 border-b border-silver/10">
                    <h3 className="font-mono text-[10px] uppercase text-silver-muted tracking-widest">
                      Loadout
                    </h3>
                  </header>
                  <ul className="p-4 space-y-2">
                    <li className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-mono text-[10px] uppercase text-silver-muted">Borda</span>
                      <span
                        className={cosmeticRarityStyle[profile.equippedFrame?.rarity ?? 'COMMON'].split(' ')[0]}
                      >
                        {profile.equippedFrame?.name ?? '—'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-mono text-[10px] uppercase text-silver-muted">Título</span>
                      <span
                        className={cosmeticRarityStyle[profile.equippedTitle?.rarity ?? 'COMMON'].split(' ')[0]}
                      >
                        {profile.equippedTitle?.name ?? '—'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-mono text-[10px] uppercase text-silver-muted">Fonte</span>
                      <span
                        className={cosmeticRarityStyle[profile.equippedFont?.rarity ?? 'COMMON'].split(' ')[0]}
                      >
                        {profile.equippedFont?.name ?? '—'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-mono text-[10px] uppercase text-silver-muted">Mascote</span>
                      <span
                        className={cosmeticRarityStyle[profile.equippedMascot?.rarity ?? 'COMMON'].split(' ')[0]}
                      >
                        {profile.equippedMascot?.name ?? '—'}
                      </span>
                    </li>
                  </ul>
                </section>

                <AchievementsList achievements={profile.achievements} />

                <section className="bg-navy-light ring-1 ring-silver/10 p-4 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="font-display italic text-2xl">{profile.followersCount}</p>
                    <p className="font-mono text-[10px] uppercase text-silver-muted tracking-widest mt-1">
                      Seguidores
                    </p>
                  </div>
                  <div>
                    <p className="font-display italic text-2xl">{profile.followingCount}</p>
                    <p className="font-mono text-[10px] uppercase text-silver-muted tracking-widest mt-1">
                      Seguindo
                    </p>
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
