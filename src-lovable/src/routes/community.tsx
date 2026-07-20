import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { communities, feed } from "@/lib/mock";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Comunidade — AET Hub" },
      { name: "description", content: "Feed regional, comunidades de jogos e conversa da cena." },
    ],
  }),
  component: Community,
});

function Community() {
  const [text, setText] = useState("");
  return (
    <AppShell>
      <PageHeader
        eyebrow="FEED_REGIONAL"
        title="COMUNIDADE"
        accent="AET"
        description="A voz da fronteira competitiva. Poste, comente, encontre time."
      />

      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-6">
        <div className="space-y-4">
          <div className="bg-navy-light ring-1 ring-silver/10 p-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="O que rolou no pampa hoje?"
              className="w-full bg-navy-dark p-3 text-sm font-mono outline-none focus:ring-1 focus:ring-ember resize-none"
            />
            <div className="mt-2 flex justify-between items-center">
              <span className="font-mono text-[10px] text-silver-muted">
                {text.length}/280
              </span>
              <button className="px-4 py-2 bg-ember text-white font-display italic tracking-widest uppercase text-xs">
                Publicar
              </button>
            </div>
          </div>

          {feed.map((p) => (
            <article
              key={p.id}
              className={`bg-navy-light ring-1 p-4 ${
                p.pinned ? "ring-ember/40" : "ring-silver/10"
              }`}
            >
              <header className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs">
                  <span className={p.author === "aet_staff" ? "text-ember" : "text-silver"}>
                    @{p.author}
                  </span>
                  <span className="text-silver-muted ml-2">{p.time}</span>
                </span>
                {p.pinned && (
                  <span className="font-mono text-[10px] text-ember uppercase">FIXADO</span>
                )}
              </header>
              <p className="text-sm text-silver text-pretty">{p.body}</p>
              <div className="mt-3 flex gap-4 font-mono text-[10px] text-silver-muted uppercase">
                <button className="hover:text-ember">Curtir</button>
                <button className="hover:text-ember">Comentar</button>
                <button className="hover:text-ember">Compartilhar</button>
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-4">
          <section className="bg-navy-light ring-1 ring-silver/10">
            <header className="px-4 py-3 border-b border-silver/10">
              <h3 className="font-mono text-[10px] uppercase text-silver-muted tracking-widest">
                COMUNIDADES
              </h3>
            </header>
            <ul className="divide-y divide-silver/5">
              {communities.map((c) => (
                <li key={c.id} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-display italic uppercase text-sm">{c.name}</p>
                    <p className="font-mono text-[10px] text-silver-muted">
                      {c.members} membros
                    </p>
                  </div>
                  <button className="px-3 py-1 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-[10px] uppercase">
                    Entrar
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-navy-light ring-1 ring-silver/10 p-4">
            <h3 className="font-mono text-[10px] uppercase text-silver-muted tracking-widest mb-3">
              REGRAS
            </h3>
            <ul className="text-xs text-silver-muted space-y-1 list-disc pl-4">
              <li>Sem toxicidade ou discurso de ódio.</li>
              <li>Nada de spoiler de partidas ao vivo.</li>
              <li>Publique em português.</li>
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}