import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBracket } from '@/hooks/useBracket';
import { useBracketSocket } from '@/hooks/useBracketSocket';
import { buildBracketColumns } from '@/utils/build-bracket-columns';
import { BracketMatchCard } from '@/components/BracketMatchCard';
import { ApiError } from '@/services/http';
import styles from './BracketPage.module.css';

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
    <section>
      <h2 className={styles.title}>{tournamentName ?? 'Chaveamento'}</h2>
      <Link to={`/torneios/${tournamentId}`} className={styles.backLink}>
        Ver detalhes do torneio
      </Link>

      {isError && (
        <p className={styles.errorBanner}>
          {error instanceof ApiError ? error.message : 'Erro inesperado'}
        </p>
      )}

      {isLoading && <p>Carregando...</p>}

      {columns && columns.totalRounds === 0 && (
        <p className={styles.emptyState}>A chave ainda não foi gerada para este torneio.</p>
      )}

      {columns && columns.champion?.registration && (
        <p className={styles.championBanner}>
          Campeão:{' '}
          {seatLabel(
            columns.champion.registration.user.profile?.displayName,
            columns.champion.registration.user.username,
          )}
        </p>
      )}

      {columns && columns.columns.length > 0 && (
        <div className={styles.board}>
          {columns.columns.map((column) => (
            <div key={column.round} className={styles.column}>
              <h3 className={styles.columnTitle}>Rodada {column.round}</h3>
              {column.pairings.map((pairing) => (
                <BracketMatchCard
                  key={pairing.destinationSlotId}
                  pairing={pairing}
                  tournamentId={tournamentId}
                  canRecordResult={canRecordResult}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
