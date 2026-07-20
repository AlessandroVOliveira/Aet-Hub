import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, StatusChip } from "@/components/layout/AppShell";
import { bracket, getTournament, type Match } from "@/lib/mock";

export const Route = createFileRoute("/tournaments/$id/bracket")({
  head: ({ params }) => ({
    meta: [
      { title: `Chave — ${getTournament(params.id).name}` },
      { name: "description", content: "Chave ao vivo com placares e status das partidas." },
    ],
  }),
  component: Bracket,
});

function Bracket() {
  const { id } = Route.useParams();
  const t = getTournament(id);

  return (
    <AppShell>
      <PageHeader
        eyebrow={t.name}
        title="CHAVE"
        accent="AO VIVO"
        description="Acompanhe placares e próximas partidas em tempo real."
        actions={
          <Link
            to="/tournaments/$id"
            params={{ id }}
            className="px-4 py-2 bg-navy-light ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-xs uppercase"
          >
            Voltar ao torneio
          </Link>
        }
      />

      <div className="p-4 md:p-8 grid grid-cols-1 xl:grid-cols-[1fr_20rem] gap-6">
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[900px] grid grid-cols-[1fr_1fr_1fr] gap-4">
            <Column title="WINNERS BRACKET" matches={bracket.winners} />
            <Column title="LOSERS BRACKET" matches={bracket.losers} />
            <Column title="GRAND FINAL" matches={bracket.grand} />
          </div>
        </div>

        <aside className="space-y-4">
          <section className="bg-navy-light ring-1 ring-ember/30 p-4">
            <p className="font-mono text-[10px] text-ember uppercase mb-1">SUA PRÓXIMA</p>
            <p className="font-display text-xl italic">GAUCHO_SLAYER vs REI_DA_LAN_99</p>
            <p className="font-mono text-xs text-silver-muted mt-1">Winners R2 • 20:15</p>
            <button className="mt-3 w-full bg-ember hover:bg-ember-glow text-white font-display py-2 tracking-widest uppercase italic transition">
              Reportar placar
            </button>
          </section>
          <section className="bg-navy-light ring-1 ring-silver/10">
            <header className="px-4 py-3 border-b border-silver/10">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-silver-muted">
                CHAT DA SALA
              </h3>
            </header>
            <ul className="p-4 space-y-3 text-xs">
              <li>
                <span className="text-ember font-mono">@aet_staff</span> boa sorte a todos.
              </li>
              <li>
                <span className="text-silver-muted font-mono">@sanhaco</span> partida da w2 finalizada.
              </li>
              <li>
                <span className="text-silver-muted font-mono">@rei_da_lan_99</span> bora, GS!
              </li>
            </ul>
            <div className="border-t border-silver/10 p-2 flex gap-2">
              <input
                placeholder="Mensagem..."
                className="flex-1 bg-navy-dark px-2 py-1 text-xs font-mono outline-none focus:ring-1 focus:ring-ember"
              />
              <button className="px-3 bg-ember text-white font-mono text-xs uppercase">
                Enviar
              </button>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function Column({ title, matches }: { title: string; matches: Match[] }) {
  return (
    <div>
      <h3 className="font-mono text-[10px] text-silver-muted uppercase tracking-widest mb-3">
        {title}
      </h3>
      <div className="space-y-4">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  return (
    <article
      className={`bg-navy-light ring-1 ${
        match.status === "live" ? "ring-ember/60" : "ring-silver/10"
      }`}
    >
      <header className="flex items-center justify-between px-3 py-1.5 border-b border-silver/10 font-mono text-[10px] uppercase">
        <span className="text-silver-muted">{match.round}</span>
        <StatusChip status={match.status} />
      </header>
      {[match.playerA, match.playerB].map((p, i) => (
        <div
          key={i}
          className={`flex items-center justify-between px-3 py-2 text-sm ${
            p.you ? "bg-ember/10" : ""
          } ${i === 0 ? "border-b border-silver/5" : ""}`}
        >
          <span className="font-mono truncate">
            {p.tag} {p.you && <span className="text-ember text-[10px]">(você)</span>}
          </span>
          <span className="font-display italic text-lg">{p.score}</span>
        </div>
      ))}
      {match.time && (
        <p className="px-3 py-1.5 font-mono text-[10px] text-silver-muted border-t border-silver/10">
          {match.time}
        </p>
      )}
    </article>
  );
}