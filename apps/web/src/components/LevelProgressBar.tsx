import type { UserProgress } from '@/types/achievement';

interface LevelProgressBarProps {
  progress: UserProgress;
}

const SEGMENTS = 10;

// Visual espelha src-lovable/pixel-palette-pal-07/src/routes/profile.tsx:
// XP em destaque (font-display), "Próximo: LVL" em ember, barra de 10
// blocos preenchidos proporcionalmente ao XP dentro do nível atual. O
// número do nível em si não aparece aqui — já é mostrado no chip do card
// de perfil e no accent do PageHeader, mesmo padrão do mock.
export function LevelProgressBar({ progress }: LevelProgressBarProps) {
  const { level, xpIntoLevel, xpForNextLevel } = progress;
  const filledSegments = Math.round((xpIntoLevel / xpForNextLevel) * SEGMENTS);

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="font-mono text-[10px] text-silver-muted uppercase">Progresso</p>
          <p className="font-display text-3xl italic">
            {xpIntoLevel} <span className="text-silver-muted">/ {xpForNextLevel} XP</span>
          </p>
        </div>
        <p className="font-mono text-ember">Próximo: LVL {level + 1}</p>
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
    </div>
  );
}
