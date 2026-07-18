import { Link } from 'react-router-dom';
import { useOpenTournaments } from '@/hooks/useOpenTournaments';
import { ApiError } from '@/services/http';
import { formatCurrencyFromCents, formatDate } from '@/utils/format';
import styles from './TournamentsPage.module.css';

export function TournamentsPage() {
  const { data, isLoading, isError, error } = useOpenTournaments();

  return (
    <section>
      <h2 className={styles.title}>Torneios abertos</h2>

      {isError && (
        <p className={styles.errorBanner}>
          {error instanceof ApiError ? error.message : 'Erro inesperado'}
        </p>
      )}

      {isLoading && <p>Carregando...</p>}

      {!isLoading && !isError && data?.tournaments.length === 0 && (
        <p className={styles.emptyState}>Nenhum torneio aberto no momento.</p>
      )}

      {data && data.tournaments.length > 0 && (
        <div className={styles.grid}>
          {data.tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              to={`/torneios/${tournament.id}`}
              className={styles.card}
            >
              <h3 className={styles.cardTitle}>{tournament.name}</h3>
              <p className={styles.cardGame}>{tournament.game.name}</p>
              <p className={styles.cardDetail}>
                {tournament.entryFeeCents === 0
                  ? 'Gratuito'
                  : formatCurrencyFromCents(tournament.entryFeeCents)}
              </p>
              <p className={styles.cardDetail}>
                Inscrições até {formatDate(tournament.registrationEndAt)}
              </p>
              <p className={styles.cardDetail}>
                Evento em {formatDate(tournament.eventStartAt)}
              </p>
              <p className={styles.cardDetail}>
                {tournament.pointsPerWin} pts vitória / {tournament.pointsPerLoss} pts derrota
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
