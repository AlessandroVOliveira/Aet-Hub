import { Star } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import type { UserAchievementView } from '@/types/achievement';

interface AchievementsListProps {
  achievements: UserAchievementView[];
}

// Espelha src-lovable/src/routes/profile.tsx (borda/fundo por raridade),
// trocando o glifo ★ cru do mock pelo ícone lucide-react já usado no
// resto do app.
export function AchievementsList({ achievements }: AchievementsListProps) {
  return (
    <Panel title="Conquistas">
      {achievements.length === 0 ? (
        <p className="text-sm text-silver-muted">Nenhuma conquista desbloqueada ainda.</p>
      ) : (
        <ul className="space-y-2">
          {achievements.map((unlock) => {
            const isRare = unlock.achievement.rarity === 'RARE';
            return (
              <li
                key={unlock.id}
                className={`flex items-center gap-3 p-2 border-l-2 ${
                  isRare ? 'border-ember bg-ember/5' : 'border-silver/20 bg-navy-dark/40'
                }`}
              >
                <div
                  className={`size-8 grid place-items-center shrink-0 ${
                    isRare ? 'bg-ember/30 text-ember' : 'bg-navy-dark text-silver'
                  }`}
                >
                  <Star className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase">{unlock.achievement.name}</p>
                  <p className="text-xs text-silver-muted">{unlock.achievement.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
