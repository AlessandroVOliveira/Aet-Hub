import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { getTournament, participants } from "@/lib/mock";

export const Route = createFileRoute("/tournaments/$id/checkin")({
  head: ({ params }) => ({
    meta: [
      { title: `Checkin — ${getTournament(params.id).name}` },
      { name: "description", content: "Faça checkin no torneio via QR code ou código manual." },
    ],
  }),
  component: Checkin,
});

function Checkin() {
  const { id } = Route.useParams();
  const t = getTournament(id);
  const done = participants.filter((p) => p.checkin).length;

  return (
    <AppShell>
      <PageHeader eyebrow={t.name} title="CHECKIN" accent="LIVE" />

      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8">
        <section className="bg-navy-light ring-1 ring-silver/10 p-6 flex flex-col items-center">
          <div className="size-64 bg-silver p-3">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "repeating-conic-gradient(#05080F 0% 25%, transparent 0% 50%)",
                backgroundSize: "14px 14px",
              }}
              aria-label="QR checkin"
            />
          </div>
          <p className="font-mono text-[10px] text-silver-muted uppercase mt-4">Código manual</p>
          <p className="font-display text-3xl italic text-ember tracking-widest">GS-8829-XP</p>
          <p className="font-mono text-xs text-silver-muted mt-4 text-center">
            Contagem: <span className="text-ember">02:47:12</span> até fechar checkin
          </p>
          <div className="mt-4 flex gap-2 w-full">
            <button className="flex-1 py-2 bg-navy-dark ring-1 ring-silver/20 font-mono text-xs uppercase hover:ring-ember/40">
              Baixar PNG
            </button>
            <button className="flex-1 py-2 bg-ember hover:bg-ember-glow text-white font-display italic tracking-widest uppercase">
              Confirmar
            </button>
          </div>
        </section>

        <section className="bg-navy-light ring-1 ring-silver/10">
          <header className="px-4 py-3 border-b border-silver/10 flex items-center justify-between">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-silver-muted">
              STATUS DOS PARTICIPANTES
            </h3>
            <span className="font-mono text-xs text-ember">
              {done}/{participants.length} confirmados
            </span>
          </header>
          <ul className="divide-y divide-silver/5">
            {participants.map((p) => (
              <li key={p.tag} className="px-4 py-3 flex items-center justify-between">
                <span className="flex items-center gap-3 font-mono text-sm">
                  <span className="text-ember text-[10px] w-6">#{p.seed}</span>
                  {p.tag}
                </span>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-1 ${
                    p.checkin
                      ? "bg-ember/20 text-ember ring-1 ring-ember/40"
                      : "bg-navy-dark text-silver-muted ring-1 ring-silver/20"
                  }`}
                >
                  {p.checkin ? "confirmado" : "pendente"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}