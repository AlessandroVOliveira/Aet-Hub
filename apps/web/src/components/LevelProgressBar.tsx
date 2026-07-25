import type { UserProgress } from '@/types/achievement';

interface LevelProgressBarProps {
  progress: UserProgress;
}

const SEGMENTS = 10;

// Visual espelha src-lovable/src/routes/profile.tsx: barra de 10 blocos,
// preenchidos proporcionalmente ao XP dentro do nível atual.
export function LevelProgressBar({ progress }: LevelProgressBarProps) {
  const { level, xpIntoLevel, xpForNextLevel } = progress;
  const filledSegments = Math.round((xpIntoLevel / xpForNextLevel) * SEGMENTS);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-silver-muted">
          Nível {level}
        </span>
        <span className="font-mono text-[10px] text-silver-muted">
          {xpIntoLevel} / {xpForNextLevel} XP
        </span>
      </div>
      <div className="flex gap-1 h-3">
        {Array.from({ length: SEGMENTS }, (_, index) => (
          <div
            key={index}
            className={
              index < filledSegments
                ? 'flex-1 bg-ember'
                : 'flex-1 bg-navy-dark ring-1 ring-silver/10'
            }
          />
        ))}
      </div>
      <p className="font-mono text-[10px] text-silver-muted mt-2">Próximo: Nível {level + 1}</p>
    </div>
  );
}
