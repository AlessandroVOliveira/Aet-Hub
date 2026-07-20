import { useState, type FormEvent } from 'react';
import { useRecordMatchResult } from '@/hooks/useMatchMutations';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';
import type { RegistrationSeat } from '@/types/bracket';
import type { BracketPairing } from '@/utils/build-bracket-columns';

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
  const isLive = match?.status === 'IN_PROGRESS';

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
    <article className={`bg-navy-light ring-1 ${isLive ? 'ring-ember/60' : 'ring-silver/10'}`}>
      {[
        { seat: seatA, score: match?.scoreA, isWinner: match?.winnerRegistrationId === seatA?.id },
        { seat: seatB, score: match?.scoreB, isWinner: match?.winnerRegistrationId === seatB?.id },
      ].map(({ seat, score, isWinner }, index) => (
        <div
          key={index}
          className={`flex items-center justify-between px-3 py-2 text-sm ${
            isWinner ? 'bg-ember/10 text-ember' : ''
          } ${index === 0 ? 'border-b border-silver/5' : ''}`}
        >
          <span className="font-mono truncate">{seatLabel(seat)}</span>
          {score !== null && score !== undefined && (
            <span className="font-display italic text-lg">{score}</span>
          )}
        </div>
      ))}

      {isBye && (
        <p className="px-3 py-1.5 font-mono text-[10px] text-silver-muted border-t border-silver/10 uppercase">
          Bye
        </p>
      )}

      {canShowForm && !isEditing && (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="w-full py-2 border-t border-silver/10 font-mono text-[10px] uppercase tracking-widest text-silver-muted hover:text-ember transition"
        >
          Registrar resultado
        </button>
      )}

      {canShowForm && isEditing && match && (
        <form className="border-t border-silver/10 p-3 space-y-2" onSubmit={handleSubmit}>
          {formError && <Banner variant="error">{formError}</Banner>}

          <fieldset className="space-y-1">
            <legend className="font-mono text-[10px] uppercase text-silver-muted mb-1">
              Vencedor
            </legend>
            {[seatA, seatB]
              .filter((seat): seat is RegistrationSeat => seat !== null)
              .map((seat) => (
                <label
                  key={seat.id}
                  className="flex items-center gap-2 font-mono text-xs text-silver-muted"
                >
                  <input
                    type="radio"
                    name={`winner-${match.id}`}
                    value={seat.id}
                    checked={winnerRegistrationId === seat.id}
                    onChange={() => setWinnerRegistrationId(seat.id)}
                    className="accent-ember"
                  />
                  {seatLabel(seat)}
                </label>
              ))}
          </fieldset>

          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              placeholder="Placar A"
              value={scoreA}
              onChange={(event) => setScoreA(event.target.value)}
              className="w-1/2 bg-navy-dark px-2 py-1 text-xs font-mono outline-none focus:ring-1 focus:ring-ember"
            />
            <input
              type="number"
              min={0}
              placeholder="Placar B"
              value={scoreB}
              onChange={(event) => setScoreB(event.target.value)}
              className="w-1/2 bg-navy-dark px-2 py-1 text-xs font-mono outline-none focus:ring-1 focus:ring-ember"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!winnerRegistrationId || recordMatchResult.isPending}
              className="flex-1 bg-ember hover:bg-ember-glow disabled:opacity-60 disabled:cursor-not-allowed text-white font-mono text-[10px] uppercase tracking-widest py-2 transition-colors"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase tracking-widest py-2 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
