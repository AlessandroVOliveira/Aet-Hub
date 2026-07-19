import { useState, type FormEvent } from 'react';
import { useRecordMatchResult } from '@/hooks/useMatchMutations';
import { ApiError } from '@/services/http';
import type { RegistrationSeat } from '@/types/bracket';
import type { BracketPairing } from '@/utils/build-bracket-columns';
import styles from './BracketMatchCard.module.css';

interface BracketMatchCardProps {
  pairing: BracketPairing;
  tournamentId: string;
  canRecordResult: boolean;
}

function seatLabel(seat: RegistrationSeat | null): string {
  if (!seat) return 'A definir';
  return seat.user.profile?.displayName ?? seat.user.username;
}

export function BracketMatchCard({ pairing, tournamentId, canRecordResult }: BracketMatchCardProps) {
  const { match, seatA, seatB, isBye } = pairing;
  const recordMatchResult = useRecordMatchResult(tournamentId);

  const [isEditing, setIsEditing] = useState(false);
  const [winnerRegistrationId, setWinnerRegistrationId] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const canShowForm = canRecordResult && match?.status === 'SCHEDULED';

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!match || !winnerRegistrationId) return;
    setFormError(null);
    recordMatchResult.mutate(
      {
        matchId: match.id,
        payload: {
          winnerRegistrationId,
          scoreA: scoreA.trim() ? Number(scoreA) : undefined,
          scoreB: scoreB.trim() ? Number(scoreB) : undefined,
        },
      },
      {
        onError: (mutationError) => {
          setFormError(mutationError instanceof ApiError ? mutationError.message : 'Erro inesperado');
        },
      },
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.seats}>
        <div
          className={styles.seat}
          data-winner={!!match?.winnerRegistrationId && match.winnerRegistrationId === seatA?.id}
        >
          <span>{seatLabel(seatA)}</span>
          {match?.scoreA !== null && match?.scoreA !== undefined && (
            <span className={styles.score}>{match.scoreA}</span>
          )}
        </div>
        <div
          className={styles.seat}
          data-winner={!!match?.winnerRegistrationId && match.winnerRegistrationId === seatB?.id}
        >
          <span>{seatLabel(seatB)}</span>
          {match?.scoreB !== null && match?.scoreB !== undefined && (
            <span className={styles.score}>{match.scoreB}</span>
          )}
        </div>
      </div>

      {isBye && <p className={styles.byeTag}>Bye</p>}

      {canShowForm && !isEditing && (
        <button type="button" className={styles.editButton} onClick={() => setIsEditing(true)}>
          Registrar resultado
        </button>
      )}

      {canShowForm && isEditing && match && (
        <form className={styles.form} onSubmit={handleSubmit}>
          {formError && <p className={styles.formError}>{formError}</p>}

          <fieldset className={styles.winnerFieldset}>
            <legend>Vencedor</legend>
            {[seatA, seatB]
              .filter((seat): seat is RegistrationSeat => seat !== null)
              .map((seat) => (
                <label key={seat.id} className={styles.winnerOption}>
                  <input
                    type="radio"
                    name={`winner-${match.id}`}
                    value={seat.id}
                    checked={winnerRegistrationId === seat.id}
                    onChange={() => setWinnerRegistrationId(seat.id)}
                  />
                  {seatLabel(seat)}
                </label>
              ))}
          </fieldset>

          <div className={styles.scoreRow}>
            <input
              type="number"
              min={0}
              placeholder="Placar A"
              value={scoreA}
              onChange={(event) => setScoreA(event.target.value)}
              className={styles.scoreInput}
            />
            <input
              type="number"
              min={0}
              placeholder="Placar B"
              value={scoreB}
              onChange={(event) => setScoreB(event.target.value)}
              className={styles.scoreInput}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!winnerRegistrationId || recordMatchResult.isPending}
            >
              Confirmar
            </button>
            <button type="button" className={styles.cancelButton} onClick={() => setIsEditing(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
