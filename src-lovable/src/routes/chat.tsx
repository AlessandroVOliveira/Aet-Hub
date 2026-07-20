import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { chatMessages, chats } from "@/lib/mock";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat — AET Hub" },
      { name: "description", content: "Converse com jogadores, times e salas dos torneios AET." },
    ],
  }),
  component: Chat,
});

function Chat() {
  const [selected, setSelected] = useState(chats[0].id);
  const [text, setText] = useState("");
  const active = chats.find((c) => c.id === selected) ?? chats[0];

  return (
    <AppShell>
      <div className="h-[calc(100vh-3.5rem)] lg:h-screen grid grid-cols-1 md:grid-cols-[16rem_1fr]">
        <aside className="border-r border-silver/10 bg-navy-light/30 overflow-y-auto">
          <header className="px-4 py-3 border-b border-silver/10">
            <h2 className="font-display uppercase italic tracking-tight text-lg">
              CHAT <span className="text-ember">/</span>
            </h2>
          </header>
          <ul>
            {chats.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelected(c.id)}
                  className={`w-full text-left px-4 py-3 border-b border-silver/5 flex items-center gap-3 hover:bg-navy-dark/50 ${
                    selected === c.id ? "bg-navy-dark" : ""
                  }`}
                >
                  <span className="size-8 bg-ember/20 ring-1 ring-ember/30 grid place-items-center font-display italic text-xs">
                    {c.name[0]}
                  </span>
                  <span className="flex-1 min-w-0">
                    <p className="font-mono text-xs truncate flex items-center gap-2">
                      {c.name}
                      <span className="text-[9px] text-silver-muted uppercase">{c.kind}</span>
                    </p>
                    <p className="text-[10px] text-silver-muted truncate">{c.last}</p>
                  </span>
                  {c.unread > 0 && (
                    <span className="bg-ember text-white text-[10px] px-1.5 rounded font-mono">
                      {c.unread}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex flex-col min-h-0">
          <header className="px-4 py-3 border-b border-silver/10 flex items-center gap-3">
            <span className="size-8 bg-ember/20 ring-1 ring-ember/30 grid place-items-center font-display italic text-xs">
              {active.name[0]}
            </span>
            <div>
              <p className="font-display italic uppercase">{active.name}</p>
              <p className="font-mono text-[10px] text-silver-muted">
                {active.kind === "dm" ? "online" : `${active.kind} • ativo`}
              </p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-navy-dark/50">
            {chatMessages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] px-3 py-2 text-sm ${
                    m.mine
                      ? "bg-ember text-white"
                      : "bg-navy-light ring-1 ring-silver/10"
                  }`}
                >
                  <p>{m.body}</p>
                  <p
                    className={`text-[9px] font-mono mt-1 ${
                      m.mine ? "text-white/70" : "text-silver-muted"
                    }`}
                  >
                    {m.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setText("");
            }}
            className="border-t border-silver/10 p-3 flex gap-2"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Mensagem..."
              className="flex-1 bg-navy-light px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-ember"
            />
            <button className="px-4 bg-ember text-white font-display italic tracking-widest uppercase text-xs">
              Enviar
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}