import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useMyHistory } from '@/hooks/useMyHistory';
import { useMyXp } from '@/hooks/useMyXp';
import { useFollowers, useFollowing, useUnfollowMutation } from '@/hooks/useFollows';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { Banner } from '@/components/ui/Banner';
import { StatusChip } from '@/components/ui/StatusChip';
import { LevelProgressBar } from '@/components/LevelProgressBar';
import { AchievementsList } from '@/components/AchievementsList';
import { CosmeticCloset } from '@/components/CosmeticCloset';
import {
  cosmeticRarityStyle,
  formatDate,
  matchResultLabels,
  matchResultTone,
  registrationStatusLabels,
  registrationStatusTone,
} from '@/utils/format';

interface LocationState {
  updated?: boolean;
}

export function ProfilePage() {
  const [tab, setTab] = useState<'overview' | 'closet'>('overview');
  const profileQuery = useMyProfile();
  const historyQuery = useMyHistory();
  const xpQuery = useMyXp();
  const followingQuery = useFollowing();
  const followersQuery = useFollowers();
  const unfollowMutation = useUnfollowMutation();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const profile = profileQuery.data?.profile;

  const registrations = [...(historyQuery.data?.registrations ?? [])].sort(
    (a, b) =>
      new Date(b.tournament.eventStartAt).getTime() - new Date(a.tournament.eventStartAt).getTime(),
  );
  const matches = [...(historyQuery.data?.matches ?? [])].sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
  );

  return (
    <div>
      <PageHeader
        eyebrow="MEU_PERFIL"
        title={profile?.displayName ?? 'PERFIL'}
        accent={xpQuery.data ? `LVL ${xpQuery.data.progress.level}` : undefined}
        description={profile?.bio ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab(tab === 'closet' ? 'overview' : 'closet')}
              className="bg-ember hover:bg-ember-glow text-white font-display italic uppercase text-xs tracking-widest px-4 py-2 transition"
            >
              {tab === 'closet' ? 'Voltar' : 'Personalizar'}
            </button>
            <Link
              to="/perfil/editar"
              className="bg-navy-light ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase tracking-widest px-4 py-2 transition"
            >
              Editar perfil
            </Link>
          </div>
        }
      />

      <div className="p-4 md:p-8 space-y-8">
        {state?.updated && <Banner variant="success">Perfil atualizado.</Banner>}

        {(profileQuery.isError ||
          historyQuery.isError ||
          xpQuery.isError ||
          followingQuery.isError ||
          followersQuery.isError) && (
          <Banner variant="error">
            {profileQuery.error instanceof ApiError
              ? profileQuery.error.message
              : historyQuery.error instanceof ApiError
                ? historyQuery.error.message
                : xpQuery.error instanceof ApiError
                  ? xpQuery.error.message
                  : followingQuery.error instanceof ApiError
                    ? followingQuery.error.message
                    : followersQuery.error instanceof ApiError
                      ? followersQuery.error.message
                      : 'Erro inesperado'}
          </Banner>
        )}

        {profileQuery.isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {profile && tab === 'overview' && (
          <div className="flex flex-wrap items-center gap-6">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className={`size-20 object-cover ${profile.equippedFrame?.className ?? 'ring-1 ring-silver/20'}`}
              />
            ) : (
              <div
                className={`size-20 bg-ember/20 grid place-items-center font-display italic text-3xl shrink-0 ${profile.equippedFrame?.className ?? 'ring-1 ring-ember/40'}`}
              >
                {profile.displayName[0]?.toUpperCase() ?? profile.user.username[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex flex-col gap-3">
              {profile.equippedTitle && (
                <span
                  className={`self-start px-2 py-1 bg-navy-dark/70 ring-1 font-mono text-[10px] uppercase tracking-widest ${cosmeticRarityStyle[profile.equippedTitle.rarity]}`}
                >
                  {profile.equippedTitle.name}
                </span>
              )}
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 font-mono text-xs">
                <div>
                  <dt className="text-silver-muted uppercase tracking-widest text-[10px]">
                    Jogo favorito
                  </dt>
                  <dd className="mt-1">{profile.favoriteGame?.name ?? '—'}</dd>
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
              </dl>
            </div>
          </div>
        )}

        {tab === 'closet' && <CosmeticCloset />}

        {tab === 'overview' && xpQuery.data && (
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-silver-muted mb-3">
              Nível &amp; conquistas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-navy-light ring-1 ring-silver/10 p-4">
                <LevelProgressBar progress={xpQuery.data.progress} />
              </div>
              <AchievementsList achievements={xpQuery.data.achievements} />
            </div>
          </section>
        )}

        {tab === 'overview' && (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-silver-muted mb-3">
              Seguindo ({followingQuery.data?.following.length ?? 0})
            </h2>

            {followingQuery.isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

            {!followingQuery.isLoading && followingQuery.data?.following.length === 0 && (
              <p className="text-sm text-silver-muted">
                Você ainda não segue nenhum player.{' '}
                <Link to="/ranking" className="text-ember hover:underline">
                  Ver ranking
                </Link>
              </p>
            )}

            {followingQuery.data && followingQuery.data.following.length > 0 && (
              <div className="bg-navy-light ring-1 ring-silver/10 divide-y divide-silver/5">
                {followingQuery.data.following.map((follow) => (
                  <div key={follow.id} className="p-4 flex items-center justify-between gap-3">
                    <span className="font-mono text-sm truncate">
                      {follow.followingDisplayName}
                    </span>
                    <button
                      type="button"
                      onClick={() => unfollowMutation.mutate(follow.followingId)}
                      disabled={unfollowMutation.isPending}
                      className="font-mono text-[10px] uppercase tracking-widest text-silver-muted hover:text-ember disabled:opacity-50 shrink-0"
                    >
                      Deixar de seguir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-silver-muted mb-3">
              Seguidores ({followersQuery.data?.followers.length ?? 0})
            </h2>

            {followersQuery.isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

            {!followersQuery.isLoading && followersQuery.data?.followers.length === 0 && (
              <p className="text-sm text-silver-muted">Nenhum player te segue ainda.</p>
            )}

            {followersQuery.data && followersQuery.data.followers.length > 0 && (
              <div className="bg-navy-light ring-1 ring-silver/10 divide-y divide-silver/5">
                {followersQuery.data.followers.map((follow) => (
                  <div key={follow.id} className="p-4">
                    <span className="font-mono text-sm truncate">{follow.followerDisplayName}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-silver-muted mb-3">
            Histórico de torneios
          </h2>

          {historyQuery.isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

          {!historyQuery.isLoading && registrations.length === 0 && (
            <p className="text-sm text-silver-muted">
              Você ainda não se inscreveu em nenhum torneio.{' '}
              <Link to="/torneios" className="text-ember hover:underline">
                Ver torneios abertos
              </Link>
            </p>
          )}

          {registrations.length > 0 && (
            <div className="bg-navy-light ring-1 ring-silver/10 divide-y divide-silver/5">
              {registrations.map((registration) => (
                <div
                  key={registration.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <h3 className="font-display italic uppercase tracking-tight">
                      {registration.tournament.name}
                    </h3>
                    <p className="font-mono text-[10px] text-silver-muted mt-1">
                      Evento em {formatDate(registration.tournament.eventStartAt)}
                      {registration.finalPlacement && ` • ${registration.finalPlacement}º lugar`}
                    </p>
                  </div>
                  <StatusChip
                    label={registrationStatusLabels[registration.status]}
                    tone={registrationStatusTone[registration.status]}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-silver-muted mb-3">
            Histórico de partidas
          </h2>

          {historyQuery.isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

          {!historyQuery.isLoading && matches.length === 0 && (
            <p className="text-sm text-silver-muted">Você ainda não jogou nenhuma partida.</p>
          )}

          {matches.length > 0 && (
            <div className="bg-navy-light ring-1 ring-silver/10 divide-y divide-silver/5">
              {matches.map((match) => (
                <div
                  key={match.matchId}
                  className="p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <h3 className="font-display italic uppercase tracking-tight">
                      {match.tournamentName}
                    </h3>
                    <p className="font-mono text-[10px] text-silver-muted mt-1">
                      vs. {match.opponent?.displayName || match.opponent?.username || 'Bye'}
                      {match.scoreSelf !== null &&
                        match.scoreOpponent !== null &&
                        ` • ${match.scoreSelf}–${match.scoreOpponent}`}
                      {' • '}
                      {formatDate(match.playedAt)}
                    </p>
                  </div>
                  <StatusChip
                    label={matchResultLabels[match.result]}
                    tone={matchResultTone[match.result]}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
        </>
        )}
      </div>
    </div>
  );
}
