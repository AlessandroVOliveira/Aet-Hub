import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOpenTournaments } from '@/hooks/useOpenTournaments';
import { useMyRegistrations } from '@/hooks/useMyRegistrations';
import { useCreateRegistration } from '@/hooks/useRegistrationMutations';
import { ApiError } from '@/services/http';
import { StatusChip } from '@/components/ui/StatusChip';
import { Panel } from '@/components/ui/Panel';
import { Banner } from '@/components/ui/Banner';
import {
  bracketTypeLabels,
  formatCurrencyFromCents,
  formatDate,
  tiebreakerRuleLabels,
  tournamentStatusLabels,
  tournamentStatusTone,
} from '@/utils/format';

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase text-silver-muted">{label}</p>
      <p className={`font-display text-2xl italic tracking-tight ${accent ? 'text-ember' : ''}`}>
        {value}
      </p>
    </div>
  );
}

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useOpenTournaments();
  const { data: myRegistrationsData } = useMyRegistrations();
  const createRegistration = useCreateRegistration();
  const [actionError, setActionError] = useState<string | null>(null);

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

  const tournament = data?.tournaments.find((item) => item.id === id);

  const alreadyRegistered = myRegistrationsData?.registrations.some(
    (registration) => registration.tournamentId === id && registration.status === 'CONFIRMED',
  );

  function handleRegister() {
    if (!tournament) return;
    setActionError(null);
    createRegistration.mutate(
      { tournamentId: tournament.id },
      {
        onError: (mutationError) => {
          setActionError(
            mutationError instanceof ApiError ? mutationError.message : 'Erro inesperado',
          );
        },
      },
    );
  }

  if (!tournament) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-sm text-silver-muted mb-4">
          Torneio não encontrado ou não está mais com inscrições abertas.
        </p>
        <Link to="/torneios" className="text-ember hover:underline font-mono text-xs uppercase">
          Voltar para torneios
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="relative border-b border-silver/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ember/30 via-navy-dark to-navy-light" />
        <div className="relative px-4 md:px-8 py-10">
          <div className="flex items-center gap-3 mb-4">
            <StatusChip
              label={tournamentStatusLabels[tournament.status]}
              tone={tournamentStatusTone[tournament.status]}
            />
            <span className="font-mono text-[10px] text-silver-muted uppercase">
              {tournament.game.name}
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl tracking-tighter uppercase italic leading-none">
            {tournament.name}
          </h1>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
            <Stat label="Evento" value={formatDate(tournament.eventStartAt)} />
            <Stat
              label="Taxa"
              value={
                tournament.entryFeeCents === 0
                  ? 'Gratuito'
                  : formatCurrencyFromCents(tournament.entryFeeCents)
              }
              accent
            />
            <Stat label="Formato" value={bracketTypeLabels[tournament.bracketType]} />
            <Stat label="Pontuação" value={`${tournament.pointsPerWin}/${tournament.pointsPerLoss}`} />
          </div>

          {actionError && (
            <div className="mt-6 max-w-md">
              <Banner variant="error">{actionError}</Banner>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {alreadyRegistered ? (
              <Link
                to="/minhas-inscricoes"
                className="bg-navy-light ring-1 ring-silver/20 hover:ring-ember/40 font-display py-3 px-6 tracking-widest uppercase italic transition"
              >
                Você já está inscrito — ver em Minhas inscrições
              </Link>
            ) : (
              <button
                type="button"
                disabled={createRegistration.isPending}
                onClick={handleRegister}
                className="bg-ember hover:bg-ember-glow disabled:opacity-60 disabled:cursor-not-allowed text-white font-display py-3 px-6 tracking-widest uppercase italic transition-colors"
              >
                Inscrever-se
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <Panel title="DETALHES">
            {tournament.description && (
              <p className="text-sm text-silver-muted mb-4">{tournament.description}</p>
            )}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <dt className="text-silver-muted uppercase text-[10px]">Inscrições</dt>
                <dd className="text-silver mt-1">
                  {formatDate(tournament.registrationStartAt)} até{' '}
                  {formatDate(tournament.registrationEndAt)}
                </dd>
              </div>
              <div>
                <dt className="text-silver-muted uppercase text-[10px]">Prazo de checkin</dt>
                <dd className="text-silver mt-1">{formatDate(tournament.checkinDeadlineAt)}</dd>
              </div>
              {tournament.tiebreakerRule && (
                <div>
                  <dt className="text-silver-muted uppercase text-[10px]">Critério de desempate</dt>
                  <dd className="text-silver mt-1">
                    {tiebreakerRuleLabels[tournament.tiebreakerRule]}
                  </dd>
                </div>
              )}
            </dl>
          </Panel>
          <p className="text-xs font-mono text-silver-muted">
            Apoiadores e premiação por colocação aparecem em breve.
          </p>
        </section>
      </div>
    </div>
  );
}
