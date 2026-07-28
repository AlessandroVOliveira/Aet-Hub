import { useState, type FormEvent } from 'react';
import { useRecordMatchResult, useCorrectMatchResult } from '@/hooks/useMatchMutations';
import { ApiError } from '@/services/http';
import { Banner } from '@/components/ui/Banner';
import { PlayerBadge } from '@/components/PlayerBadge';
import type { RegistrationSeat } from '@/types/bracket';
import type { BracketPairing } from '@/utils/build-bracket-columns';

const MIN_REASON_LENGTH = 5;
const MAX_REASON_LENGTH = 500;

interface BracketMatchCardProps {
  pairing: BracketPairing;
  tournamentId: string;
  canRecordResult: boolean;
}

function seatName(seat: RegistrationSeat | null): string {
  if (!seat) return 'A definir';
  return seat.user.profile?.displayName ?? seat.user.username;
}

// Armário cosmético (fatia 2 borda/título; fatia 3 fonte): vindos do mesmo
// select de profile já usado pra displayName — visibilidade continua sendo
// a de colega de torneio, nenhuma leitura nova. Sem mascote de propósito
// (PlayerBadge é um avatar de 24px, escala pequena demais pro emoji).
function SeatLabel({ seat }: { seat: RegistrationSeat | null }) {
  const name = seatName(seat);
  if (!seat) {
    return <span className="font-mono truncate">{name}</span>;
  }
  return (
    <span className="font-mono truncate flex items-center gap-2 min-w-0">
      <PlayerBadge
        initial={name[0] ?? '?'}
        frameClassName={seat.user.profile?.equippedFrame?.className}
        titleName={seat.user.profile?.equippedTitle?.name}
        titleRarity={seat.user.profile?.equippedTitle?.rarity}
      />
      <span className={`truncate ${seat.user.profile?.equippedFont?.className ?? ''}`}>
        {name}
      </span>
    </span>
  );
}

// Compartilhado pelos dois forms inline (registrar/corrigir) — mesmos
// campos, prefixo de name diferente pra não colidir os radios quando os
// dois acabam existindo ao mesmo tempo no DOM (não acontece hoje, já que
// um só aparece por status, mas evita a armadilha se isso mudar).
function ResultFields({
  namePrefix,
  seatA,
  seatB,
  winnerRegistrationId,
  onWinnerChange,
  scoreA,
  onScoreAChange,
  scoreB,
  onScoreBChange,
}: {
  namePrefix: string;
  seatA: RegistrationSeat | null;
  seatB: RegistrationSeat | null;
  winnerRegistrationId: string | null;
  onWinnerChange: (id: string) => void;
  scoreA: string;
  onScoreAChange: (value: string) => void;
  scoreB: string;
  onScoreBChange: (value: string) => void;
}) {
  return (
    <>
      <fieldset className="space-y-1">
        <legend className="font-mono text-[10px] uppercase text-silver-muted mb-1">Vencedor</legend>
        {[seatA, seatB]
          .filter((seat): seat is RegistrationSeat => seat !== null)
          .map((seat) => (
            <label key={seat.id} className="flex items-center gap-2 font-mono text-xs text-silver-muted">
              <input
                type="radio"
                name={namePrefix}
                value={seat.id}
                checked={winnerRegistrationId === seat.id}
                onChange={() => onWinnerChange(seat.id)}
                className="accent-ember"
              />
              <SeatLabel seat={seat} />
            </label>
          ))}
      </fieldset>

      <div className="flex gap-2">
        <input
          type="number"
          min={0}
          placeholder="Placar A"
          value={scoreA}
          onChange={(event) => onScoreAChange(event.target.value)}
          className="w-1/2 bg-navy-dark px-2 py-1 text-xs font-mono outline-none focus:ring-1 focus:ring-ember"
        />
        <input
          type="number"
          min={0}
          placeholder="Placar B"
          value={scoreB}
          onChange={(event) => onScoreBChange(event.target.value)}
          className="w-1/2 bg-navy-dark px-2 py-1 text-xs font-mono outline-none focus:ring-1 focus:ring-ember"
        />
      </div>
    </>
  );
}

export function BracketMatchCard({ pairing, tournamentId, canRecordResult }: BracketMatchCardProps) {
  const { match, seatA, seatB, isBye } = pairing;
  const recordMatchResult = useRecordMatchResult(tournamentId);
  const correctMatchResult = useCorrectMatchResult(tournamentId);

  const [isEditing, setIsEditing] = useState(false);
  const [winnerRegistrationId, setWinnerRegistrationId] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [isCorrecting, setIsCorrecting] = useState(false);
  const [correctionWinnerId, setCorrectionWinnerId] = useState<string | null>(null);
  const [correctionScoreA, setCorrectionScoreA] = useState('');
  const [correctionScoreB, setCorrectionScoreB] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  const canShowForm = canRecordResult && match?.status === 'SCHEDULED';
  const canShowCorrection = canRecordResult && match?.status === 'COMPLETED';
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

  function openCorrection() {
    if (!match) return;
    setCorrectionWinnerId(match.winnerRegistrationId);
    setCorrectionScoreA(match.scoreA !== null ? String(match.scoreA) : '');
    setCorrectionScoreB(match.scoreB !== null ? String(match.scoreB) : '');
    setCorrectionReason('');
    setCorrectionError(null);
    setIsCorrecting(true);
  }

  const trimmedReason = correctionReason.trim();
  const canSubmitCorrection =
    !!correctionWinnerId && trimmedReason.length >= MIN_REASON_LENGTH && !correctMatchResult.isPending;

  function handleCorrectionSubmit(event: FormEvent) {
    event.preventDefault();
    if (!match || !canSubmitCorrection || !correctionWinnerId) return;
    setCorrectionError(null);
    correctMatchResult.mutate(
      {
        matchId: match.id,
        payload: {
          winnerRegistrationId: correctionWinnerId,
          scoreA: correctionScoreA.trim() ? Number(correctionScoreA) : undefined,
          scoreB: correctionScoreB.trim() ? Number(correctionScoreB) : undefined,
          reason: trimmedReason,
        },
      },
      {
        onSuccess: () => setIsCorrecting(false),
        onError: (mutationError) => {
          setCorrectionError(
            mutationError instanceof ApiError ? mutationError.message : 'Erro inesperado',
          );
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
          <SeatLabel seat={seat} />
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

          <ResultFields
            namePrefix={`winner-${match.id}`}
            seatA={seatA}
            seatB={seatB}
            winnerRegistrationId={winnerRegistrationId}
            onWinnerChange={setWinnerRegistrationId}
            scoreA={scoreA}
            onScoreAChange={setScoreA}
            scoreB={scoreB}
            onScoreBChange={setScoreB}
          />

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

      {canShowCorrection && !isCorrecting && (
        <button
          type="button"
          onClick={openCorrection}
          className="w-full py-2 border-t border-silver/10 font-mono text-[10px] uppercase tracking-widest text-silver-muted hover:text-ember transition"
        >
          Corrigir resultado
        </button>
      )}

      {canShowCorrection && isCorrecting && match && (
        <form className="border-t border-silver/10 p-3 space-y-2" onSubmit={handleCorrectionSubmit}>
          {correctionError && <Banner variant="error">{correctionError}</Banner>}

          <ResultFields
            namePrefix={`correction-winner-${match.id}`}
            seatA={seatA}
            seatB={seatB}
            winnerRegistrationId={correctionWinnerId}
            onWinnerChange={setCorrectionWinnerId}
            scoreA={correctionScoreA}
            onScoreAChange={setCorrectionScoreA}
            scoreB={correctionScoreB}
            onScoreBChange={setCorrectionScoreB}
          />

          <div>
            <textarea
              value={correctionReason}
              onChange={(event) => setCorrectionReason(event.target.value)}
              rows={2}
              maxLength={MAX_REASON_LENGTH}
              placeholder="Justifique a correção..."
              className="w-full bg-navy-dark p-2 text-xs font-mono text-silver outline-none focus:ring-1 focus:ring-ember resize-none"
            />
            <p className="mt-1 font-mono text-[10px] text-silver-muted">
              {correctionReason.length}/{MAX_REASON_LENGTH}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!canSubmitCorrection}
              className="flex-1 bg-ember hover:bg-ember-glow disabled:opacity-60 disabled:cursor-not-allowed text-white font-mono text-[10px] uppercase tracking-widest py-2 transition-colors"
            >
              Confirmar correção
            </button>
            <button
              type="button"
              onClick={() => setIsCorrecting(false)}
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
