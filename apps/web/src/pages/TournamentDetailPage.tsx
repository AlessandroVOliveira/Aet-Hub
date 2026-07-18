import { Link, useParams } from 'react-router-dom';
import { useOpenTournaments } from '@/hooks/useOpenTournaments';
import { ApiError } from '@/services/http';
import {
  bracketTypeLabels,
  formatCurrencyFromCents,
  formatDate,
  tiebreakerRuleLabels,
} from '@/utils/format';
import styles from './TournamentDetailPage.module.css';

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useOpenTournaments();

  if (isLoading) return <p>Carregando...</p>;

  if (isError) {
    return (
      <p className={styles.errorBanner}>
        {error instanceof ApiError ? error.message : 'Erro inesperado'}
      </p>
    );
  }

  const tournament = data?.tournaments.find((item) => item.id === id);

  if (!tournament) {
    return (
      <section>
        <p className={styles.notFound}>
          Torneio não encontrado ou não está mais com inscrições abertas.
        </p>
        <Link to="/torneios" className={styles.backLink}>
          Voltar para torneios
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className={styles.panel}>
        <h2 className={styles.title}>{tournament.name}</h2>
        <p className={styles.game}>{tournament.game.name}</p>

        {tournament.description && <p className={styles.description}>{tournament.description}</p>}

        <p className={styles.detailRow}>
          <span className={styles.detailLabel}>Taxa de inscrição: </span>
          {tournament.entryFeeCents === 0
            ? 'Gratuito'
            : formatCurrencyFromCents(tournament.entryFeeCents)}
        </p>
        <p className={styles.detailRow}>
          <span className={styles.detailLabel}>Inscrições: </span>
          {formatDate(tournament.registrationStartAt)} até{' '}
          {formatDate(tournament.registrationEndAt)}
        </p>
        <p className={styles.detailRow}>
          <span className={styles.detailLabel}>Prazo de checkin: </span>
          {formatDate(tournament.checkinDeadlineAt)}
        </p>
        <p className={styles.detailRow}>
          <span className={styles.detailLabel}>Início do evento: </span>
          {formatDate(tournament.eventStartAt)}
        </p>
        <p className={styles.detailRow}>
          <span className={styles.detailLabel}>Formato: </span>
          {bracketTypeLabels[tournament.bracketType]}
        </p>
        {tournament.tiebreakerRule && (
          <p className={styles.detailRow}>
            <span className={styles.detailLabel}>Critério de desempate: </span>
            {tiebreakerRuleLabels[tournament.tiebreakerRule]}
          </p>
        )}
        <p className={styles.detailRow}>
          <span className={styles.detailLabel}>Pontuação: </span>
          {tournament.pointsPerWin} pts vitória / {tournament.pointsPerLoss} pts derrota
        </p>

        <p className={styles.comingSoonNote}>
          Apoiadores e premiação por colocação aparecem em breve.
        </p>
      </div>
    </section>
  );
}
