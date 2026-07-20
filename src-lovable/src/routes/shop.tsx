import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { currentUser, shop } from "@/lib/mock";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Loja de Pontos — AET Hub" },
      { name: "description", content: "Troque seus pontos AET por vestuário, periféricos e experiências." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const cats = ["Todos", ...Array.from(new Set(shop.map((s) => s.category)))];
  const [cat, setCat] = useState("Todos");
  const list = shop.filter((s) => cat === "Todos" || s.category === cat);

  return (
    <AppShell>
      <PageHeader
        eyebrow="LOJA_PONTOS"
        title="STORE"
        accent="AET"
        description="Troque seus pontos por recompensas exclusivas da comunidade."
        actions={
          <div className="flex items-center gap-3 bg-navy-light ring-1 ring-ember/30 px-4 py-2">
            <div className="size-2 rounded-full bg-ember animate-ember-glow" />
            <span className="font-mono font-bold text-lg italic">
              {currentUser.points.toLocaleString()}{" "}
              <span className="text-xs text-ember/70">PTS</span>
            </span>
          </div>
        }
      />

      <div className="px-4 md:px-8 py-4 flex flex-wrap gap-1 border-b border-silver/10">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition ${
              cat === c
                ? "bg-ember text-white"
                : "bg-navy-light ring-1 ring-silver/10 hover:ring-ember/30 text-silver-muted"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="p-4 md:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.map((item) => {
          const canAfford = currentUser.points >= item.price;
          return (
            <Link
              key={item.id}
              to="/shop/$id"
              params={{ id: item.id }}
              className="group bg-navy-light ring-1 ring-silver/10 hover:ring-ember/50 transition flex flex-col"
            >
              <div className="aspect-square bg-gradient-to-br from-navy-dark via-navy-light to-ember/20 grid place-items-center">
                <span className="font-display italic text-5xl text-silver/20 uppercase">
                  {item.name[0]}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="font-mono text-[10px] text-silver-muted mb-1 uppercase">
                  {item.category}
                </p>
                <h3 className="font-display text-lg italic uppercase tracking-tight mb-3 group-hover:text-ember transition">
                  {item.name}
                </h3>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-mono text-ember font-bold">
                    {item.price.toLocaleString()} PTS
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase ${
                      canAfford ? "text-silver" : "text-silver-muted"
                    }`}
                  >
                    {item.stock > 100 ? "∞" : `${item.stock} un.`}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}