import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader, StatusChip } from "@/components/layout/AppShell";
import { tournaments, type TournamentStatus } from "@/lib/mock";

export const Route = createFileRoute("/tournaments/")({
  head: () => ({
    meta: [
      { title: "Torneios — AET Hub" },
      { name: "description", content: "Explore todos os torneios oficiais da AET: inscrições abertas, ao vivo e encerrados." },
    ],
  }),
  component: TournamentsList,
});

const filters: { id: TournamentStatus | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "open", label: "Abertos" },
  { id: "live", label: "Ao vivo" },
  { id: "closed", label: "Encerrados" },
];

function TournamentsList() {
  const [filter, setFilter] = useState<TournamentStatus | "all">("all");
  const [game, setGame] = useState("all");
  const games = ["all", ...Array.from(new Set(tournaments.map((t) => t.gameShort)))];
  const list = tournaments.filter(
    (t) => (filter === "all" || t.status === filter) && (game === "all" || t.gameShort === game),
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="ARENA"
        title="TORNEIOS"
        accent="AET"
        description="Encontre a próxima disputa. Filtre por jogo e status."
      />
      <div className="px-4 md:px-8 py-4 flex flex-col md:flex-row gap-4 md:items-center border-b border-silver/10">
        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition ${
                filter === f.id
                  ? "bg-ember text-white"
                  : "bg-navy-light ring-1 ring-silver/10 hover:ring-ember/30 text-silver-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 md:ml-auto">
          {games.map((g) => (
            <button
              key={g}
              onClick={() => setGame(g)}
              className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition ${
                game === g
                  ? "bg-silver text-navy-dark"
                  : "bg-navy-light ring-1 ring-silver/10 hover:ring-ember/30 text-silver-muted"
              }`}
            >
              {g === "all" ? "Todos jogos" : g}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((t) => (
          <Link
            key={t.id}
            to="/tournaments/$id"
            params={{ id: t.id }}
            className="group bg-navy-light ring-1 ring-silver/10 hover:ring-ember/50 transition overflow-hidden flex flex-col"
          >
            <div className="relative aspect-video bg-navy-dark overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-ember/40 via-navy-dark to-navy-light" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="font-display text-6xl italic tracking-tighter text-silver/20">
                  {t.gameShort}
                </span>
              </div>
              <div className="absolute top-3 left-3">
                <StatusChip status={t.status} />
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <p className="font-mono text-[10px] text-silver-muted mb-1">{t.game}</p>
              <h3 className="font-display text-xl uppercase italic tracking-tight mb-3 group-hover:text-ember transition">
                {t.name}
              </h3>
              <dl className="grid grid-cols-2 gap-2 font-mono text-[10px] text-silver-muted">
                <div>
                  <dt>DATA</dt>
                  <dd className="text-silver">{t.date}</dd>
                </div>
                <div>
                  <dt>PRÊMIO</dt>
                  <dd className="text-ember">{t.pot}</dd>
                </div>
                <div>
                  <dt>VAGAS</dt>
                  <dd className="text-silver">
                    {t.registered}/{t.slots}
                  </dd>
                </div>
                <div>
                  <dt>FORMATO</dt>
                  <dd className="text-silver">{t.format}</dd>
                </div>
              </dl>
              <div className="mt-4 h-1 bg-navy-dark">
                <div
                  className="h-full bg-ember"
                  style={{ width: `${(t.registered / t.slots) * 100}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}