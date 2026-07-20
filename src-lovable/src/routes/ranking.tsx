import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { ranking } from "@/lib/mock";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking — AET Hub" },
      { name: "description", content: "Ranking regional dos jogadores AET da fronteira." },
    ],
  }),
  component: Ranking,
});

const scopes = ["Geral", "Alegrete", "Fronteira Oeste", "Mês"];

function Ranking() {
  const [scope, setScope] = useState(scopes[0]);
  return (
    <AppShell>
      <PageHeader
        eyebrow="LEADERBOARD"
        title="RANKING"
        accent="REGIONAL"
        description="Pontuação acumulada em torneios, checkins e conquistas."
        actions={
          <div className="flex flex-wrap gap-1">
            {scopes.map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition ${
                  scope === s
                    ? "bg-ember text-white"
                    : "bg-navy-light ring-1 ring-silver/10 hover:ring-ember/30 text-silver-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        }
      />

      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
        <div className="bg-navy-light ring-1 ring-silver/10">
          <div className="grid grid-cols-[3rem_1fr_6rem_5rem_4rem] px-4 py-2 border-b border-silver/10 font-mono text-[10px] uppercase text-silver-muted">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Pontos</span>
            <span className="text-right">Cidade</span>
            <span className="text-right">Δ</span>
          </div>
          {ranking.map((r) => (
            <div
              key={r.pos}
              className={`grid grid-cols-[3rem_1fr_6rem_5rem_4rem] items-center px-4 py-3 border-b border-silver/5 text-sm ${
                r.you ? "bg-ember/10" : ""
              }`}
            >
              <span className="font-display italic text-lg">{r.pos}</span>
              <span className="font-mono truncate">
                {r.tag} {r.you && <span className="text-ember text-[10px]">(você)</span>}
              </span>
              <span className="text-right font-mono text-ember">{r.pts.toLocaleString()}</span>
              <span className="text-right font-mono text-[10px] text-silver-muted uppercase">
                {r.city}
              </span>
              <span
                className={`text-right font-mono text-xs ${
                  r.trend.startsWith("+")
                    ? "text-ember"
                    : r.trend.startsWith("-")
                      ? "text-silver-muted"
                      : "text-silver"
                }`}
              >
                {r.trend}
              </span>
            </div>
          ))}
        </div>

        <aside className="lg:w-72 space-y-4">
          <div className="bg-navy-light ring-1 ring-ember/30 p-4">
            <p className="font-mono text-[10px] text-ember uppercase mb-1">SUA POSIÇÃO</p>
            <p className="font-display text-5xl italic leading-none">#5</p>
            <p className="font-mono text-xs text-silver-muted mt-2">
              +3 posições esta semana
            </p>
          </div>
          <div className="bg-navy-light ring-1 ring-silver/10 p-4">
            <p className="font-mono text-[10px] uppercase text-silver-muted mb-3">
              PRÓXIMA META
            </p>
            <p className="text-sm mb-2">Top 3 — faltam 2.420 pts</p>
            <div className="h-1 bg-navy-dark">
              <div className="h-full bg-ember" style={{ width: "68%" }} />
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}