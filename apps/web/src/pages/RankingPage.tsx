import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useRanking } from '@/hooks/useRanking';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { Banner } from '@/components/ui/Banner';

export function RankingPage() {
  const { data, isLoading, isError, error } = useRanking();
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        eyebrow="LEADERBOARD"
        title="RANKING"
        accent="AET"
        description="Pontuação acumulada nos torneios da AET."
      />

      <div className="p-4 md:p-8">
        {isError && (
          <Banner variant="error">
            {error instanceof ApiError ? error.message : 'Erro inesperado'}
          </Banner>
        )}

        {isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {!isLoading && !isError && data?.entries.length === 0 && (
          <p className="text-sm text-silver-muted">Nenhum player no ranking ainda.</p>
        )}

        {data && data.entries.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
            <div className="bg-navy-light ring-1 ring-silver/10">
              <div className="grid grid-cols-[3rem_1fr_6rem_2.5rem] px-4 py-2 border-b border-silver/10 font-mono text-[10px] uppercase text-silver-muted">
                <span>#</span>
                <span>Player</span>
                <span className="text-right">Pontos</span>
                <span />
              </div>
              {data.entries.map((entry) => {
                const isMe = entry.userId === user?.id;
                return (
                  <div
                    key={entry.userId}
                    className={`grid grid-cols-[3rem_1fr_6rem_2.5rem] items-center px-4 py-3 border-b border-silver/5 text-sm ${
                      isMe ? 'bg-ember/10' : ''
                    }`}
                  >
                    <span className="font-display italic text-lg">{entry.position}</span>
                    <span className="font-mono truncate">
                      {entry.displayName ?? entry.username}{' '}
                      {isMe && <span className="text-ember text-[10px]">(você)</span>}
                    </span>
                    <span className="text-right font-mono text-ember">
                      {entry.points.toLocaleString('pt-BR')}
                    </span>
                    {isMe ? (
                      <span />
                    ) : (
                      <Link
                        to={`/mensagens/${entry.userId}`}
                        state={{ displayName: entry.displayName ?? entry.username }}
                        aria-label={`Conversar com ${entry.displayName ?? entry.username}`}
                        className="justify-self-end text-silver-muted hover:text-ember"
                      >
                        <MessageCircle className="size-4" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            <aside className="lg:w-72 space-y-4">
              <div className="bg-navy-light ring-1 ring-ember/30 p-4">
                <p className="font-mono text-[10px] text-ember uppercase mb-1">SUA POSIÇÃO</p>
                {data.me ? (
                  <>
                    <p className="font-display text-5xl italic leading-none">
                      #{data.me.position}
                    </p>
                    <p className="font-mono text-xs text-silver-muted mt-2">
                      {data.me.points.toLocaleString('pt-BR')} pts · entre {data.totalPlayers}{' '}
                      players
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-5xl italic leading-none">—</p>
                    <p className="font-mono text-xs text-silver-muted mt-2">
                      Contas admin não participam do ranking.
                    </p>
                  </>
                )}
              </div>

              {data.me && data.entries.length > 0 && (
                <div className="bg-navy-light ring-1 ring-silver/10 p-4">
                  <p className="font-mono text-[10px] uppercase text-silver-muted mb-3">
                    PRÓXIMA META
                  </p>
                  {data.me.position <= 3 ? (
                    <>
                      <p className="text-sm mb-2">Você está no Top 3</p>
                      <div className="h-1 bg-navy-dark">
                        <div className="h-full bg-ember" style={{ width: '100%' }} />
                      </div>
                    </>
                  ) : (
                    (() => {
                      const third = data.entries[2].points;
                      const missing = third - data.me.points;
                      const fillPercent =
                        third > 0 ? Math.min(100, Math.max(0, (data.me.points / third) * 100)) : 0;
                      return (
                        <>
                          <p className="text-sm mb-2">Top 3 — faltam {missing} pts</p>
                          <div className="h-1 bg-navy-dark">
                            <div className="h-full bg-ember" style={{ width: `${fillPercent}%` }} />
                          </div>
                        </>
                      );
                    })()
                  )}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
