import { useLocation, Link } from 'react-router-dom';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useMyHistory } from '@/hooks/useMyHistory';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { Banner } from '@/components/ui/Banner';
import { StatusChip } from '@/components/ui/StatusChip';
import {
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
  const profileQuery = useMyProfile();
  const historyQuery = useMyHistory();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const profile = profileQuery.data?.profile;

  const registrations = [...(historyQuery.data?.registrations ?? [])].sort(
    (a, b) => new Date(b.tournament.eventStartAt).getTime() - new Date(a.tournament.eventStartAt).getTime(),
  );
  const matches = [...(historyQuery.data?.matches ?? [])].sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
  );

  return (
    <div>
      <PageHeader
        eyebrow="MEU_PERFIL"
        title={profile?.displayName ?? 'PERFIL'}
        description={profile?.bio ?? undefined}
        actions={
          <Link
            to="/perfil/editar"
            className="bg-navy-light ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase tracking-widest px-4 py-2 transition"
          >
            Editar perfil
          </Link>
        }
      />

      <div className="p-4 md:p-8 space-y-8">
        {state?.updated && <Banner variant="success">Perfil atualizado.</Banner>}

        {(profileQuery.isError || historyQuery.isError) && (
          <Banner variant="error">
            {profileQuery.error instanceof ApiError
              ? profileQuery.error.message
              : historyQuery.error instanceof ApiError
                ? historyQuery.error.message
                : 'Erro inesperado'}
          </Banner>
        )}

        {profileQuery.isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {profile && (
          <div className="flex flex-wrap items-center gap-6">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="size-20 object-cover ring-1 ring-silver/20"
              />
            ) : (
              <div className="size-20 bg-ember/20 ring-1 ring-ember/40 grid place-items-center font-display italic text-3xl shrink-0">
                {profile.displayName[0]?.toUpperCase() ?? profile.user.username[0]?.toUpperCase()}
              </div>
            )}
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 font-mono text-xs">
              <div>
                <dt className="text-silver-muted uppercase tracking-widest text-[10px]">Jogo favorito</dt>
                <dd className="mt-1">{profile.favoriteGame?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-silver-muted uppercase tracking-widest text-[10px]">Personagem favorito</dt>
                <dd className="mt-1">{profile.favoriteCharacter ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-silver-muted uppercase tracking-widest text-[10px]">Tema</dt>
                <dd className="mt-1">{profile.theme ?? '—'}</dd>
              </div>
            </dl>
          </div>
        )}

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
      </div>
    </div>
  );
}
