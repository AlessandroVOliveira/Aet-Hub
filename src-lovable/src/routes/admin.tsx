import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader, StatusChip } from "@/components/layout/AppShell";
import { adminKpis, tournaments } from "@/lib/mock";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — AET Hub" },
      { name: "description", content: "Painel administrativo AET: torneios, jogadores e loja." },
    ],
  }),
  component: Admin,
});

function Admin() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="STAFF_ONLY"
        title="ADMIN"
        accent="CONSOLE"
        description="Gestão de torneios, jogadores, chaves e loja de pontos."
        actions={
          <button className="px-4 py-2 bg-ember hover:bg-ember-glow text-white font-display italic uppercase text-xs tracking-widest">
            + Novo torneio
          </button>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {adminKpis.map((k) => (
            <div key={k.label} className="bg-navy-light ring-1 ring-silver/10 p-4">
              <p className="font-mono text-[10px] text-silver-muted uppercase">{k.label}</p>
              <p className="font-display text-3xl italic mt-1">{k.value}</p>
              <p className="font-mono text-xs text-ember mt-1">{k.delta}</p>
            </div>
          ))}
        </section>

        <section className="bg-navy-light ring-1 ring-silver/10">
          <header className="px-4 py-3 border-b border-silver/10 flex items-center justify-between">
            <h3 className="font-mono text-[10px] uppercase text-silver-muted tracking-widest">
              TORNEIOS
            </h3>
            <div className="flex gap-2 font-mono text-[10px] uppercase text-silver-muted">
              <button className="hover:text-ember">Exportar CSV</button>
              <button className="hover:text-ember">Filtrar</button>
            </div>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left font-mono text-[10px] uppercase text-silver-muted">
                <tr className="border-b border-silver/10">
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">Jogo</th>
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2">Inscritos</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((t) => (
                  <tr key={t.id} className="border-b border-silver/5">
                    <td className="px-4 py-3 font-display italic uppercase">{t.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{t.gameShort}</td>
                    <td className="px-4 py-3 font-mono text-xs text-silver-muted">{t.date}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {t.registered}/{t.slots}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Link
                          to="/tournaments/$id"
                          params={{ id: t.id }}
                          className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase"
                        >
                          Ver
                        </Link>
                        <button className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase">
                          Editar
                        </button>
                        <button className="px-2 py-1 bg-ember/20 ring-1 ring-ember/40 text-ember font-mono text-[10px] uppercase">
                          Chave
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-navy-light ring-1 ring-silver/10">
            <header className="px-4 py-3 border-b border-silver/10">
              <h3 className="font-mono text-[10px] uppercase text-silver-muted tracking-widest">
                MODERAÇÃO — FEED
              </h3>
            </header>
            <ul className="divide-y divide-silver/5">
              {[
                { author: "rato_de_lan", body: "post reportado 2x" },
                { author: "patrao_xy", body: "linguagem inadequada" },
                { author: "novato_00", body: "spam recorrente" },
              ].map((r) => (
                <li key={r.author} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs">@{r.author}</p>
                    <p className="text-[10px] text-silver-muted">{r.body}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase">
                      Ignorar
                    </button>
                    <button className="px-2 py-1 bg-ember text-white font-mono text-[10px] uppercase">
                      Remover
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-navy-light ring-1 ring-silver/10">
            <header className="px-4 py-3 border-b border-silver/10">
              <h3 className="font-mono text-[10px] uppercase text-silver-muted tracking-widest">
                LOG DE AÇÕES
              </h3>
            </header>
            <ul className="p-4 space-y-2 font-mono text-[10px] text-silver-muted">
              <li><span className="text-ember">20:12</span> checkin encerrado — Pampa Strike</li>
              <li><span className="text-ember">19:58</span> chave gerada — Gaúcho Cup</li>
              <li><span className="text-ember">19:40</span> novo staff: @sanhaco</li>
              <li><span className="text-ember">18:20</span> item adicionado à loja: Hoodie Fronteira</li>
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}