import { Link } from 'react-router-dom';
import { Trophy, Store } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOpenTournaments } from '@/hooks/useOpenTournaments';
import { useMyRegistrations } from '@/hooks/useMyRegistrations';
import { useMyWallet } from '@/hooks/useMyWallet';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
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

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <section className="relative overflow-hidden bg-navy-light ring-1 ring-silver/10">
              {openTournamentsQuery.isLoading && (
                <p className="p-6 text-sm text-silver-muted">Carregando...</p>
              )}

              {openTournamentsQuery.isError && (
                <div className="p-6">
                  <Banner variant="error">
                    {openTournamentsQuery.error instanceof ApiError
                      ? openTournamentsQuery.error.message
                      : 'Erro inesperado'}
                  </Banner>
                </div>
              )}

              {!openTournamentsQuery.isLoading && !openTournamentsQuery.isError && !featured && (
                <p className="p-6 text-sm text-silver-muted">
                  Nenhum torneio com inscrições abertas no momento.{' '}
                  <Link to="/torneios" className="text-ember hover:underline">
                    Ver todos os torneios
                  </Link>
                </p>
              )}

              {featured && (
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/2 aspect-video md:aspect-auto relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-ember/40 via-navy-dark to-navy-light" />
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="font-display text-6xl italic tracking-tighter text-silver/20">
                        {featured.game.slug.slice(0, 4).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute top-3 left-3">
                      <StatusChip
                        label={tournamentStatusLabels[featured.status]}
                        tone={tournamentStatusTone[featured.status]}
                      />
                    </div>
                  </div>

                  <div className="md:w-1/2 p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-silver/10">
                    <div>
                      <p className="font-mono text-ember text-xs mb-2 uppercase">[ Próximo torneio ]</p>
                      <h2 className="font-display text-4xl md:text-5xl tracking-tighter uppercase italic leading-[0.9] mb-4">
                        {featured.name}
                      </h2>
                      <div className="space-y-1 font-mono text-sm text-silver-muted">
                        <p>
                          <span className="text-silver">JOGO:</span> {featured.game.name}
                        </p>
                        <p>
                          <span className="text-silver">EVENTO:</span> {formatDate(featured.eventStartAt)}
                        </p>
                        <p>
                          <span className="text-silver">TAXA:</span>{' '}
                          {featured.entryFeeCents === 0
                            ? 'Gratuito'
                            : formatCurrencyFromCents(featured.entryFeeCents)}
                        </p>
                        <p>
                          <span className="text-silver">INSCRIÇÕES ATÉ:</span>{' '}
                          {formatDate(featured.registrationEndAt)}
                        </p>
                      </div>
                    </div>

                    {alreadyRegisteredInFeatured ? (
                      <Link
                        to="/minhas-inscricoes"
                        className="mt-8 w-full bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 text-center font-display py-4 tracking-widest uppercase italic transition"
                      >
                        Você já está inscrito — ver em Minhas inscrições
                      </Link>
                    ) : (
                      <Link
                        to={`/torneios/${featured.id}`}
                        className="mt-8 w-full bg-ember hover:bg-ember-glow text-white text-center font-display py-4 tracking-widest uppercase italic transition-colors"
                      >
                        Ver detalhes e inscrever-se
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="bg-navy-light/50 border-l-4 border-ember p-6">
              <h3 className="font-display text-2xl tracking-tight uppercase italic mb-4">
                Check-in pendente
              </h3>

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
                  <ul className="font-mono text-[10px] text-silver-muted mb-4 space-y-1">
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
            </section>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-navy-light p-6 ring-1 ring-silver/10">
              <p className="text-[10px] font-mono text-silver-muted mb-2">MEU SALDO</p>

              {walletQuery.isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

              {walletQuery.isError && (
                <Banner variant="error">
                  {walletQuery.error instanceof ApiError ? walletQuery.error.message : 'Erro inesperado'}
                </Banner>
              )}

              {!walletQuery.isLoading && !walletQuery.isError && (
                <div>
                  <p className="font-display text-4xl italic leading-none mb-4">
                    {walletQuery.data?.balance ?? 0}{' '}
                    <span className="text-ember text-sm font-mono not-italic">PTS</span>
                  </p>
                  <Link to="/loja" className="text-ember hover:underline font-mono text-xs uppercase">
                    Ver loja de pontos
                  </Link>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 font-display uppercase italic text-sm">
              {SHORTCUTS.map((shortcut) => (
                <Link
                  key={shortcut.to}
                  to={shortcut.to}
                  className="p-4 bg-navy-light ring-1 ring-silver/5 hover:ring-ember/50 hover:bg-navy-dark transition-all text-center flex flex-col items-center gap-2"
                >
                  <shortcut.icon className="size-4 text-ember" />
                  {shortcut.label}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
