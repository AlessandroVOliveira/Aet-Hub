import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { achievements, currentUser, history } from "@/lib/mock";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Perfil — AET Hub" },
      { name: "description", content: "Seu perfil AET: XP, conquistas, histórico e ajustes." },
    ],
  }),
  component: ProfileLayout,
});

function ProfileLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isSettings = pathname.startsWith("/profile/settings");
  if (isSettings) {
    return (
      <AppShell>
        <Outlet />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="MEU_PERFIL"
        title={currentUser.tag}
        accent={`LVL ${currentUser.level}`}
        description={`${currentUser.name} • ${currentUser.city}`}
        actions={
          <Link
            to="/profile/settings"
            className="px-4 py-2 bg-navy-light ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-xs uppercase"
          >
            Ajustes
          </Link>
        }
      />

      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-navy-light ring-1 ring-silver/10 p-6">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="font-mono text-[10px] text-silver-muted uppercase">Progresso</p>
                <p className="font-display text-3xl italic">
                  {currentUser.xp} <span className="text-silver-muted">/ {currentUser.xpMax} XP</span>
                </p>
              </div>
              <p className="font-mono text-ember">
                Próximo: LVL {currentUser.level + 1}
              </p>
            </div>
            <div className="flex gap-1 h-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${
                    i < Math.round((currentUser.xp / currentUser.xpMax) * 10)
                      ? "bg-ember"
                      : "bg-navy-dark ring-1 ring-silver/10"
                  }`}
                />
              ))}
            </div>
          </div>

          <section className="bg-navy-light ring-1 ring-silver/10">
            <header className="px-4 py-3 border-b border-silver/10">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-silver-muted">
                HISTÓRICO
              </h3>
            </header>
            <ul className="divide-y divide-silver/5">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="px-4 py-3 grid grid-cols-[1fr_auto_auto_auto] items-center gap-4"
                >
                  <div>
                    <p className="font-display italic uppercase">{h.tournament}</p>
                    <p className="font-mono text-[10px] text-silver-muted">{h.date}</p>
                  </div>
                  <span className="font-mono text-xs">{h.place}</span>
                  <span className="font-mono text-ember text-xs">+{h.xp} XP</span>
                  <span className="font-mono text-silver text-xs">+{h.pts} PTS</span>
                </li>
              ))}
            </ul>
          </section>
        </section>

        <aside className="space-y-6">
          <section className="bg-navy-light ring-1 ring-silver/10">
            <header className="px-4 py-3 border-b border-silver/10">
              <h3 className="font-mono text-[10px] uppercase text-silver-muted tracking-widest">
                CONQUISTAS
              </h3>
            </header>
            <ul className="p-4 space-y-2">
              {achievements.map((a) => (
                <li
                  key={a.id}
                  className={`flex items-center gap-3 p-2 border-l-2 ${
                    a.rare ? "border-ember bg-ember/5" : "border-silver/20 bg-navy-dark/40"
                  }`}
                >
                  <div
                    className={`size-8 grid place-items-center font-display italic text-sm ${
                      a.rare ? "bg-ember/30 text-ember" : "bg-navy-dark text-silver"
                    }`}
                  >
                    ★
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase">{a.name}</p>
                    <p className="text-[10px] text-silver-muted">{a.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}