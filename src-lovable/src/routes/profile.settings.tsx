import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { Field } from "./auth.login";
import { currentUser } from "@/lib/mock";

export const Route = createFileRoute("/profile/settings")({
  head: () => ({
    meta: [
      { title: "Ajustes — AET Hub" },
      { name: "description", content: "Ajustes de conta, notificações e privacidade." },
    ],
  }),
  component: Settings,
});

function Settings() {
  return (
    <div>
      <PageHeader eyebrow="CONFIG" title="AJUSTES" accent="DA CONTA" />

      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        <section className="bg-navy-light ring-1 ring-silver/10 p-6 space-y-4">
          <h3 className="font-mono text-[10px] uppercase text-silver-muted tracking-widest">
            DADOS
          </h3>
          <Field label="GAMER TAG" defaultValue={currentUser.tag} />
          <Field label="NOME" defaultValue={currentUser.name} />
          <Field label="CIDADE" defaultValue={currentUser.city} />
          <Field label="EMAIL" defaultValue="voce@aet.gg" />
          <button className="mt-2 px-4 py-2 bg-ember hover:bg-ember-glow text-white font-display italic uppercase text-xs tracking-widest">
            Salvar
          </button>
        </section>

        <section className="bg-navy-light ring-1 ring-silver/10 p-6 space-y-3">
          <h3 className="font-mono text-[10px] uppercase text-silver-muted tracking-widest">
            NOTIFICAÇÕES
          </h3>
          {[
            "Novos torneios abertos",
            "Início de partidas suas",
            "Mensagens diretas",
            "Recompensas na loja",
            "Comunicados AET Staff",
          ].map((n) => (
            <label
              key={n}
              className="flex items-center justify-between text-sm py-2 border-b border-silver/5"
            >
              <span>{n}</span>
              <input type="checkbox" defaultChecked className="accent-ember size-4" />
            </label>
          ))}
        </section>

        <section className="bg-navy-light ring-1 ring-silver/10 p-6 space-y-4">
          <h3 className="font-mono text-[10px] uppercase text-silver-muted tracking-widest">
            SEGURANÇA
          </h3>
          <Field label="SENHA ATUAL" type="password" />
          <Field label="NOVA SENHA" type="password" />
          <Field label="CONFIRMAR" type="password" />
          <button className="mt-2 px-4 py-2 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-xs uppercase">
            Atualizar senha
          </button>
        </section>

        <section className="bg-navy-light ring-1 ring-ember/30 p-6">
          <h3 className="font-mono text-[10px] uppercase text-ember tracking-widest mb-3">
            ZONA DE PERIGO
          </h3>
          <p className="text-xs text-silver-muted mb-4">
            Encerrar a conta remove seu histórico, XP e pontos AET.
          </p>
          <button className="px-4 py-2 bg-ember hover:bg-ember-glow text-white font-display italic uppercase text-xs tracking-widest">
            Excluir conta
          </button>
        </section>
      </div>
    </div>
  );
}