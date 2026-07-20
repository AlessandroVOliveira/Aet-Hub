import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatusChip } from "@/components/layout/AppShell";
import { getTournament, participants } from "@/lib/mock";

export const Route = createFileRoute("/tournaments/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${getTournament(params.id).name} — AET Hub` },
      { name: "description", content: `Detalhes, regras e inscrição do torneio ${getTournament(params.id).name}.` },
    ],
  }),
  component: TournamentDetail,
});

function TournamentDetail() {
  const { id } = Route.useParams();
  const t = getTournament(id);

  return (
    <AppShell>
      <div className="relative border-b border-silver/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ember/30 via-navy-dark to-navy-light" />
        <div className="relative px-4 md:px-8 py-10">
          <div className="flex items-center gap-3 mb-4">
            <StatusChip status={t.status} />
            <span className="font-mono text-[10px] text-silver-muted uppercase">{t.game}</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl tracking-tighter uppercase italic leading-none">
            {t.name}
          </h1>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
            <Stat label="Data" value={t.date} />
            <Stat label="Prêmio" value={t.pot} accent />
            <Stat label="Vagas" value={`${t.registered}/${t.slots}`} />
            <Stat label="Formato" value={t.format} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {t.status === "open" && (
              <button className="bg-ember hover:bg-ember-glow text-white font-display py-3 px-6 tracking-widest uppercase italic transition-colors">
                Inscrever-se
              </button>
            )}
            <Link
              to="/tournaments/$id/checkin"
              params={{ id: t.id }}
              className="bg-navy-light ring-1 ring-silver/20 hover:ring-ember/40 font-display py-3 px-6 tracking-widest uppercase italic transition"
            >
              Checkin
            </Link>
            <Link
              to="/tournaments/$id/bracket"
              params={{ id: t.id }}
              className="bg-navy-light ring-1 ring-silver/20 hover:ring-ember/40 font-display py-3 px-6 tracking-widest uppercase italic transition"
            >
              Ver chave
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <Panel title="REGRAS">
            <ul className="space-y-2 text-sm text-silver-muted list-disc pl-5">
              <li>Checkin obrigatório até 30 minutos antes do início.</li>
              <li>Melhor de 3 na fase inicial, melhor de 5 nas finais.</li>
              <li>Não é permitido o uso de macros ou modificações.</li>
              <li>Decisões da organização AET são finais.</li>
            </ul>
          </Panel>
          <Panel title="CRONOGRAMA">
            <ol className="space-y-3">
              {[
                { time: "19:30", label: "Checkin & aquecimento" },
                { time: "20:00", label: "Sorteio de chaves" },
                { time: "20:30", label: "Início — Winners R1" },
                { time: "22:00", label: "Losers Bracket" },
                { time: "23:00", label: "Grand Final" },
              ].map((s) => (
                <li key={s.time} className="flex gap-4 border-l-2 border-ember/40 pl-3">
                  <span className="font-mono text-ember text-sm w-14">{s.time}</span>
                  <span className="text-sm text-silver">{s.label}</span>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="PATROCINADORES">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {["PAMPA GEAR", "LAN DO GAUCHO", "ROTA 87", "NEBLINA CO."].map((s) => (
                <div
                  key={s}
                  className="aspect-video bg-navy-dark ring-1 ring-silver/10 grid place-items-center font-display italic text-sm text-silver-muted uppercase"
                >
                  {s}
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <aside className="space-y-6">
          <Panel title={`INSCRITOS (${participants.length})`}>
            <ul className="divide-y divide-silver/5">
              {participants.map((p) => (
                <li key={p.tag} className="flex items-center justify-between py-2 text-sm">
                  <span className="flex items-center gap-2 font-mono">
                    <span className="text-ember text-[10px]">#{p.seed}</span>
                    {p.tag}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase ${
                      p.checkin ? "text-ember" : "text-silver-muted"
                    }`}
                  >
                    {p.checkin ? "OK" : "pendente"}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase text-silver-muted">{label}</p>
      <p className={`font-display text-2xl italic tracking-tight ${accent ? "text-ember" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-navy-light ring-1 ring-silver/10">
      <header className="px-4 py-3 border-b border-silver/10">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-silver-muted">
          {title}
        </h3>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}