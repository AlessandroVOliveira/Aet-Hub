import { Link } from 'react-router-dom';
import { Trophy, Store } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOpenTournaments } from '@/hooks/useOpenTournaments';
import { useMyRegistrations } from '@/hooks/useMyRegistrations';
import { useMyWallet } from '@/hooks/useMyWallet';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusChip } from '@/components/ui/StatusChip';
import { Banner } from '@/components/ui/Banner';
import {
  formatDate,
  formatCurrencyFromCents,
  tournamentStatusLabels,
  tournamentStatusTone,
} from '@/utils/format';

const SHORTCUTS = [
  { to: '/torneios', label: 'Torneios', icon: Trophy },
  { to: '/minhas-inscricoes', label: 'Minhas inscrições', icon: Trophy },
  { to: '/loja', label: 'Loja', icon: Store },
  { to: '/minhas-trocas', label: 'Minhas trocas', icon: Store },
];

export function HomePage() {
  const { user } = useAuth();
  const openTournamentsQuery = useOpenTournaments();
  const myRegistrationsQuery = useMyRegistrations();
  const walletQuery = useMyWallet();

  const featured = openTournamentsQuery.data?.tournaments[0];

  const alreadyRegisteredInFeatured = myRegistrationsQuery.data?.registrations.some(
    (registration) => registration.tournamentId === featured?.id && registration.status === 'CONFIRMED',
  );

  const pendingCheckins = (myRegistrationsQuery.data?.registrations ?? []).filter(
    (registration) => registration.status === 'CONFIRMED' && registration.checkin === null,
  );

  return (
    <div>
      <PageHeader eyebrow="INÍCIO" title="BEM-VINDO" accent={user?.displayName || user?.username} />

      <div className="p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Panel title="Próximo torneio">
              {openTournamentsQuery.isLoading && (
                <p className="text-sm text-silver-muted">Carregando...</p>
              )}

              {openTournamentsQuery.isError && (
                <Banner variant="error">
                  {openTournamentsQuery.error instanceof ApiError
                    ? openTournamentsQuery.error.message
                    : 'Erro inesperado'}
                </Banner>
              )}

              {!openTournamentsQuery.isLoading && !openTournamentsQuery.isError && !featured && (
                <p className="text-sm text-silver-muted">
                  Nenhum torneio com inscrições abertas no momento.{' '}
                  <Link to="/torneios" className="text-ember hover:underline">
                    Ver todos os torneios
                  </Link>
                </p>
              )}

              {featured && (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <StatusChip
                      label={tournamentStatusLabels[featured.status]}
                      tone={tournamentStatusTone[featured.status]}
                    />
                    <span className="font-mono text-[10px] text-silver-muted uppercase">
                      {featured.game.name}
                    </span>
                  </div>
                  <h3 className="font-display italic uppercase tracking-tight text-xl mb-3">
                    {featured.name}
                  </h3>
                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-[10px] text-silver-muted mb-4">
                    <div>
                      <dt className="uppercase">Inscrições até</dt>
                      <dd className="text-silver mt-1">{formatDate(featured.registrationEndAt)}</dd>
                    </div>
                    <div>
                      <dt className="uppercase">Evento</dt>
                      <dd className="text-silver mt-1">{formatDate(featured.eventStartAt)}</dd>
                    </div>
                    <div>
                      <dt className="uppercase">Taxa</dt>
                      <dd className="text-silver mt-1">
                        {featured.entryFeeCents === 0
                          ? 'Gratuito'
                          : formatCurrencyFromCents(featured.entryFeeCents)}
                      </dd>
                    </div>
                  </dl>
                  {alreadyRegisteredInFeatured ? (
                    <Link
                      to="/minhas-inscricoes"
                      className="inline-block bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase tracking-widest px-4 py-2 transition"
                    >
                      Você já está inscrito — ver em Minhas inscrições
                    </Link>
                  ) : (
                    <Link
                      to={`/torneios/${featured.id}`}
                      className="inline-block bg-ember hover:bg-ember-glow text-white font-mono text-[10px] uppercase tracking-widest px-4 py-2 transition-colors"
                    >
                      Ver detalhes e inscrever-se
                    </Link>
                  )}
                </div>
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Check-in pendente">
              {myRegistrationsQuery.isLoading && (
                <p className="text-sm text-silver-muted">Carregando...</p>
              )}

              {myRegistrationsQuery.isError && (
                <Banner variant="error">
                  {myRegistrationsQuery.error instanceof ApiError
                    ? myRegistrationsQuery.error.message
                    : 'Erro inesperado'}
                </Banner>
              )}

              {!myRegistrationsQuery.isLoading &&
                !myRegistrationsQuery.isError &&
                pendingCheckins.length === 0 && (
                  <p className="text-sm text-silver-muted">Nenhuma pendência de check-in.</p>
                )}

              {pendingCheckins.length > 0 && (
                <div>
                  <p className="text-sm mb-2">
                    Você tem <strong>{pendingCheckins.length}</strong> pendência(s) de check-in.
                  </p>
                  <ul className="font-mono text-[10px] text-silver-muted mb-3 space-y-1">
                    {pendingCheckins.slice(0, 3).map((registration) => (
                      <li key={registration.id}>{registration.tournament.name}</li>
                    ))}
                  </ul>
                  <Link
                    to="/minhas-inscricoes"
                    className="inline-block bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase tracking-widest px-4 py-2 transition"
                  >
                    Fazer check-in
                  </Link>
                </div>
              )}
            </Panel>

            <Panel title="Meu saldo">
              {walletQuery.isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

              {walletQuery.isError && (
                <Banner variant="error">
                  {walletQuery.error instanceof ApiError ? walletQuery.error.message : 'Erro inesperado'}
                </Banner>
              )}

              {!walletQuery.isLoading && !walletQuery.isError && (
                <div>
                  <p className="font-display text-3xl italic mb-3">
                    {walletQuery.data?.balance ?? 0}{' '}
                    <span className="text-ember text-sm font-mono not-italic">PTS</span>
                  </p>
                  <Link to="/loja" className="text-ember hover:underline font-mono text-xs uppercase">
                    Ver loja de pontos
                  </Link>
                </div>
              )}
            </Panel>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:hidden">
          {SHORTCUTS.map((shortcut) => (
            <Link
              key={shortcut.to}
              to={shortcut.to}
              className="bg-navy-light ring-1 ring-silver/10 hover:ring-ember/40 p-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest transition"
            >
              <shortcut.icon className="size-4 text-ember" />
              {shortcut.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
