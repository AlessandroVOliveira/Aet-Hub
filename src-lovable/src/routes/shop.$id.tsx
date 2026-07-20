import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { currentUser, getShopItem, shop } from "@/lib/mock";

export const Route = createFileRoute("/shop/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${getShopItem(params.id).name} — Loja AET` },
      { name: "description", content: `Detalhes e resgate do item ${getShopItem(params.id).name}.` },
    ],
  }),
  component: ShopItemPage,
});

function ShopItemPage() {
  const { id } = Route.useParams();
  const item = getShopItem(id);
  const canAfford = currentUser.points >= item.price;
  const related = shop.filter((s) => s.category === item.category && s.id !== item.id).slice(0, 3);

  return (
    <AppShell>
      <div className="p-4 md:p-8">
        <Link
          to="/shop"
          className="font-mono text-[10px] text-silver-muted uppercase hover:text-ember"
        >
          ← Voltar à loja
        </Link>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-navy-light ring-1 ring-silver/10 grid place-items-center bg-gradient-to-br from-navy-dark via-navy-light to-ember/20">
            <span className="font-display italic text-9xl text-silver/20 uppercase">
              {item.name[0]}
            </span>
          </div>
          <div>
            <p className="font-mono text-[10px] text-ember uppercase">{item.category}</p>
            <h1 className="font-display text-5xl uppercase italic tracking-tight mt-2 leading-none">
              {item.name}
            </h1>
            <p className="text-sm text-silver-muted mt-4 max-w-md">
              Produto oficial da AET, limitado à comunidade. Retirada no próximo evento em
              Alegrete/RS ou entrega digital.
            </p>

            <div className="mt-8 bg-navy-light ring-1 ring-silver/10 p-6">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] text-silver-muted uppercase">Preço</span>
                <span className="font-display italic text-4xl text-ember">
                  {item.price.toLocaleString()} PTS
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between text-sm">
                <span className="text-silver-muted font-mono uppercase text-[10px]">Você tem</span>
                <span className="font-mono">{currentUser.points.toLocaleString()} PTS</span>
              </div>
              <button
                disabled={!canAfford}
                className="mt-6 w-full bg-ember hover:bg-ember-glow text-white font-display py-3 tracking-widest uppercase italic transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {canAfford ? "Resgatar agora" : "Pontos insuficientes"}
              </button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-12">
            <h3 className="font-mono text-[10px] uppercase text-silver-muted tracking-widest mb-4">
              RELACIONADOS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to="/shop/$id"
                  params={{ id: r.id }}
                  className="p-4 bg-navy-light ring-1 ring-silver/10 hover:ring-ember/40 transition"
                >
                  <p className="font-display italic uppercase">{r.name}</p>
                  <p className="font-mono text-ember text-xs mt-1">
                    {r.price.toLocaleString()} PTS
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}