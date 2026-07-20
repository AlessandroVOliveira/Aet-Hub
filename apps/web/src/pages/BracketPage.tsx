import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBracket } from '@/hooks/useBracket';
import { useBracketSocket } from '@/hooks/useBracketSocket';
import { buildBracketColumns } from '@/utils/build-bracket-columns';
import { BracketMatchCard } from '@/components/BracketMatchCard';
import { ApiError } from '@/services/http';
import { PageHeader } from '@/components/ui/PageHeader';
import { Banner } from '@/components/ui/Banner';

interface BracketLocationState {
  tournamentName?: string;
}

function seatLabel(displayName: string | undefined, username: string): string {
  return displayName ?? username;
}

export function BracketPage() {
  const { id } = useParams<{ id: string }>();
  const tournamentId = id as string;
  const location = useLocation();
  const tournamentName = (location.state as BracketLocationState | null)?.tournamentName;

  const { user, token } = useAuth();
  const { data, isLoading, isError, error } = useBracket(tournamentId);
  useBracketSocket(tournamentId, token);

  const columns = data ? buildBracketColumns(data.bracket) : null;
  const canRecordResult = user?.role === 'ADMIN';

  return (
    <div>
      <PageHeader
        eyebrow={tournamentName ?? 'Torneio'}
        title="CHAVE"
        accent="AO VIVO"
        description="Acompanhe placares e próximas partidas em tempo real."
        actions={
          <Link
            to={`/torneios/${tournamentId}`}
            className="px-4 py-2 bg-navy-light ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-xs uppercase"
          >
            Voltar ao torneio
          </Link>
        }
      />

      <div className="p-4 md:p-8">
        {isError && (
          <Banner variant="error">
            {error instanceof ApiError ? error.message : 'Erro inesperado'}
          </Banner>
        )}

        {isLoading && <p className="text-sm text-silver-muted">Carregando...</p>}

        {columns && columns.totalRounds === 0 && (
          <p className="text-sm text-silver-muted">A chave ainda não foi gerada para este torneio.</p>
        )}

        {columns && columns.champion?.registration && (
          <div className="mb-6 bg-navy-light ring-1 ring-ember/40 px-4 py-3 inline-block">
            <p className="font-mono text-[10px] text-ember uppercase mb-1">Campeão</p>
            <p className="font-display text-xl italic">
              {seatLabel(
                columns.champion.registration.user.profile?.displayName,
                columns.champion.registration.user.username,
              )}
            </p>
          </div>
        )}

        {columns && columns.columns.length > 0 && (
          <div className="overflow-x-auto pb-4">
            <div
              className="grid gap-4 min-w-max"
              style={{ gridTemplateColumns: `repeat(${columns.columns.length}, minmax(260px, 1fr))` }}
            >
              {columns.columns.map((column) => (
                <div key={column.round}>
                  <h3 className="font-mono text-[10px] text-silver-muted uppercase tracking-widest mb-3">
                    Rodada {column.round}
                  </h3>
                  <div className="space-y-4">
                    {column.pairings.map((pairing) => (
                      <BracketMatchCard
                        key={pairing.destinationSlotId}
                        pairing={pairing}
                        tournamentId={tournamentId}
                        canRecordResult={canRecordResult}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
