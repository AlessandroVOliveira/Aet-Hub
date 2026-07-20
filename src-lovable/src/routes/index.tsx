import { createFileRoute } from "@tanstack/react-router";
import aetLogo from "@/assets/aet-logo.asset.json";
import tournamentHero from "@/assets/tournament-hero.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-navy-dark text-silver selection:bg-ember selection:text-white p-4 md:p-6 overflow-x-hidden">
      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.04] overflow-hidden">
        <div className="w-full h-1 bg-silver animate-scanline" />
      </div>

      {/* Header */}
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-8 border-b border-silver/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-navy-light ring-1 ring-silver/20 flex items-center justify-center overflow-hidden">
            <img src={aetLogo.url} alt="AET" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-display text-2xl tracking-tighter uppercase leading-none italic">
              AET <span className="text-ember">HUB</span>
            </h1>
            <p className="font-mono text-[10px] text-silver-muted">PLAYER_DASHBOARD // V.01</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="font-mono text-[10px] text-silver-muted">ACTIVE_USER</p>
            <p className="font-bold text-sm">GAUCHO_SLAYER</p>
          </div>
          <div className="flex items-center gap-3 bg-navy-light ring-1 ring-ember/30 px-4 py-2">
            <div className="size-2 rounded-full bg-ember animate-ember-glow" />
            <span className="font-mono font-bold text-lg italic">
              8.450 <span className="text-xs text-ember/70">PTS</span>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Hero tournament */}
          <section className="relative group overflow-hidden bg-navy-light ring-1 ring-silver/10">
            <div className="absolute top-0 right-0 p-4 z-20">
              <span className="bg-ember text-white px-3 py-1 font-display text-sm tracking-widest italic">
                INSCRIÇÕES ABERTAS
              </span>
            </div>

            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 aspect-video md:aspect-auto overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                <img
                  src={tournamentHero}
                  alt="Pampa Strike 2026"
                  width={1024}
                  height={1024}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="md:w-1/2 p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-silver/10">
                <div>
                  <p className="font-mono text-ember text-xs mb-2">[ PRÓXIMO TORNEIO ]</p>
                  <h2 className="font-display text-5xl md:text-6xl tracking-tighter uppercase italic leading-[0.9] text-balance mb-4">
                    PAMPA STRIKE <span className="text-ember">2026</span>
                  </h2>
                  <div className="space-y-1 font-mono text-sm text-silver-muted">
                    <p><span className="text-silver">JOGO:</span> STREET FIGHTER 6</p>
                    <p><span className="text-silver">DATA:</span> 24 NOV — 20:00 BRT</p>
                    <p><span className="text-silver">POT:</span> R$ 2.500,00 + AET COINS</p>
                    <p><span className="text-silver">CHECKIN:</span> ATÉ 19:30</p>
                  </div>
                </div>

                <button className="mt-8 w-full bg-ember hover:bg-ember-glow text-white font-display py-4 tracking-widest uppercase italic transition-colors relative overflow-hidden group/btn">
                  <span className="relative z-10">INSCREVER-SE AGORA</span>
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500" />
                </button>
              </div>
            </div>
          </section>

          {/* Next dispute */}
          <section className="bg-navy-light/50 border-l-4 border-ember p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-2xl tracking-tight uppercase italic">
                MINHA PRÓXIMA DISPUTA
              </h3>
              <div className="font-mono text-xs text-ember">LIVE_READY // 14:00</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="flex items-center gap-4">
                <div className="size-14 bg-silver/10 ring-1 ring-silver/20 grid place-items-center">
                  <span className="text-[10px] italic text-silver/40">VOCÊ</span>
                </div>
                <div>
                  <p className="text-xs text-silver-muted uppercase font-bold">AET.PLAYER</p>
                  <p className="font-display text-xl">GAUCHO_SLAYER</p>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="font-display text-3xl italic text-ember/50">VS</span>
                <span className="font-mono text-[10px] text-silver-muted uppercase">
                  Winners Bracket R3
                </span>
              </div>

              <div className="flex items-center gap-4 justify-end">
                <div className="text-right">
                  <p className="text-xs text-silver-muted uppercase font-bold">ADVERSÁRIO</p>
                  <p className="font-display text-xl">REI_DA_LAN_99</p>
                </div>
                <div className="size-14 bg-ember/10 ring-1 ring-ember/30 grid place-items-center">
                  <span className="text-[10px] italic text-ember/60">RIVAL</span>
                </div>
              </div>
            </div>
          </section>

          {/* QR checkin */}
          <section className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 bg-navy-light ring-1 ring-silver/10 p-6">
            <div className="size-36 bg-silver p-2">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    "repeating-conic-gradient(#05080F 0% 25%, transparent 0% 50%)",
                  backgroundSize: "12px 12px",
                }}
                aria-label="QR code de checkin"
              />
            </div>
            <div className="flex flex-col justify-center">
              <p className="font-mono text-[10px] text-silver-muted mb-1">CHECKIN_PESSOAL</p>
              <h4 className="font-display text-2xl uppercase italic mb-2">
                SEU QR DE ENTRADA
              </h4>
              <p className="text-sm text-silver-muted max-w-md mb-4">
                Apresente este código na mesa da AET no dia do evento. Alternativa manual:{" "}
                <span className="font-mono text-ember">GS-8829-XP</span>.
              </p>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-navy-dark ring-1 ring-silver/20 text-xs font-mono uppercase hover:ring-ember/50 transition">
                  Baixar PNG
                </button>
                <button className="px-4 py-2 bg-navy-dark ring-1 ring-silver/20 text-xs font-mono uppercase hover:ring-ember/50 transition">
                  Copiar código
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right column */}
        <aside className="lg:col-span-4 space-y-6">
          {/* XP & achievements */}
          <div className="bg-navy-light p-6 ring-1 ring-silver/10">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-[10px] font-mono text-silver-muted">PLAYER_LEVEL</p>
                <p className="font-display text-4xl italic leading-none">LVL 42</p>
              </div>
              <p className="font-mono text-xs">1250 / 2000 XP</p>
            </div>

            <div className="flex gap-1 h-3 mb-6">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${i < 4 ? "bg-ember" : "bg-navy-dark ring-1 ring-silver/10"}`}
                />
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-mono text-silver-muted uppercase tracking-widest">
                CONQUISTAS_RECENTES
              </p>
              <div className="flex items-center gap-3 bg-navy-dark/50 p-2 border-r-2 border-silver/20">
                <div className="size-2 bg-silver" />
                <span className="text-xs uppercase font-bold">Primeiro Strike</span>
              </div>
              <div className="flex items-center gap-3 bg-navy-dark/50 p-2 border-r-2 border-ember/50">
                <div className="size-2 bg-ember" />
                <span className="text-xs uppercase font-bold">Maratona LAN</span>
              </div>
              <div className="flex items-center gap-3 bg-navy-dark/50 p-2 border-r-2 border-ember/50">
                <div className="size-2 bg-ember" />
                <span className="text-xs uppercase font-bold">Finalista Regional x3</span>
              </div>
            </div>
          </div>

          {/* Shortcut grid */}
          <div className="grid grid-cols-2 gap-2 font-display uppercase italic text-sm">
            {[
              "Chave Vivo",
              "Loja Pontos",
              "Comunidades",
              "Chat",
              "Ranking",
              "Meu Perfil",
            ].map((label) => (
              <a
                key={label}
                href="#"
                className="p-4 bg-navy-light ring-1 ring-silver/5 hover:ring-ember/50 hover:bg-navy-dark transition-all text-center"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Mini feed */}
          <div className="bg-navy-light/30 ring-1 ring-silver/5">
            <div className="p-4 border-b border-silver/5">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-silver-muted">
                FEED_REGIONAL
              </h4>
            </div>
            <div className="divide-y divide-silver/5">
              <div className="p-4">
                <p className="text-[10px] text-ember mb-1 italic">@aet_staff</p>
                <p className="text-xs text-pretty">
                  Preparem-se para as chaves de hoje. O sorteio acontece em 30min.
                </p>
              </div>
              <div className="p-4">
                <p className="text-[10px] text-silver-muted mb-1 italic">@dark_knight_pampa</p>
                <p className="text-xs text-pretty">
                  Procurando dupla para o torneio de sexta. Chama no privado!
                </p>
              </div>
              <div className="p-4">
                <p className="text-[10px] text-silver-muted mb-1 italic">@rato_de_lan</p>
                <p className="text-xs text-pretty">
                  Alguém confirma se o lobby de SCVI tá liberado?
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="max-w-7xl mx-auto mt-12 py-8 border-t border-silver/5 flex flex-col md:flex-row justify-between items-center gap-4 opacity-50 hover:opacity-100 transition">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em]">
          ALEGRETE E-SPORTS TOURNAMENTS // EST. 2024
        </p>
        <div className="flex gap-6 text-[10px] font-mono uppercase">
          <a href="#" className="hover:text-ember">Regulamento</a>
          <a href="#" className="hover:text-ember">Suporte</a>
          <a href="#" className="hover:text-ember">Patrocinadores</a>
        </div>
      </footer>
    </div>
  );
}
