import { Link } from 'react-router-dom';
import { useOpenTournaments } from '@/hooks/useOpenTournaments';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { Banner } from '@/components/ui/Banner';
import { formatCurrencyFromCents, formatDate, tournamentStatusLabels, tournamentStatusTone } from '@/utils/format';

export function TournamentsPage() {
  const { data, isLoading, isError, error } = useOpenTournaments();

  return (
    <div>
      <PageHeader
        eyebrow="ARENA"
        title="TORNEIOS"
        accent="ABERTOS"
        description="Encontre a próxima disputa e garanta sua vaga."
      />

      <div className="p-4 md:p-8">
        {isError && (
          <Banner variant="error">
            {error instanceof ApiError ? error.message : 'Erro inesperado'}
          </Banner>
        )}

        {isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {!isLoading && !isError && data?.tournaments.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhum torneio aberto no momento.</p>
        )}

        {data && data.tournaments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                to={`/torneios/${tournament.id}`}
                className="group bg-navy-light ring-1 ring-silver/10 hover:ring-ember/50 transition overflow-hidden flex flex-col"
              >
                <div className="relative aspect-video bg-navy-dark overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-ember/40 via-navy-dark to-navy-light" />
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="font-display text-6xl italic tracking-tighter text-silver/20">
                      {tournament.game.slug.slice(0, 4).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute top-3 left-3">
                    <StatusChip
                      label={tournamentStatusLabels[tournament.status]}
                      tone={tournamentStatusTone[tournament.status]}
                    />
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <p className="font-mono text-[10px] text-silver-muted mb-1">{tournament.game.name}</p>
                  <h3 className="font-display text-xl uppercase italic tracking-tight mb-3 group-hover:text-ember transition">
                    {tournament.name}
                  </h3>
                  <dl className="grid grid-cols-2 gap-2 font-mono text-[10px] text-silver-muted">
                    <div>
                      <dt>EVENTO</dt>
                      <dd className="text-silver">{formatDate(tournament.eventStartAt)}</dd>
                    </div>
                    <div>
                      <dt>TAXA</dt>
                      <dd className="text-ember">
                        {tournament.entryFeeCents === 0
                          ? 'Gratuito'
                          : formatCurrencyFromCents(tournament.entryFeeCents)}
                      </dd>
                    </div>
                    <div>
                      <dt>INSCRIÇÕES ATÉ</dt>
                      <dd className="text-silver">{formatDate(tournament.registrationEndAt)}</dd>
                    </div>
                    <div>
                      <dt>PONTUAÇÃO</dt>
                      <dd className="text-silver">
                        {tournament.pointsPerWin}/{tournament.pointsPerLoss}
                      </dd>
                    </div>
                  </dl>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
