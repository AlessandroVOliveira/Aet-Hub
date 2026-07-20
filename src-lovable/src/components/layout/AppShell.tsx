import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Trophy,
  BarChart3,
  Store,
  Users,
  MessageSquare,
  User,
  Settings,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import aetLogo from "@/assets/aet-logo.asset.json";
import { currentUser } from "@/lib/mock";

const nav = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/tournaments", label: "Torneios", icon: Trophy },
  { to: "/ranking", label: "Ranking", icon: BarChart3 },
  { to: "/shop", label: "Loja", icon: Store },
  { to: "/community", label: "Comunidade", icon: Users },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/profile", label: "Perfil", icon: User },
  { to: "/profile/settings", label: "Ajustes", icon: Settings },
  { to: "/admin", label: "Admin", icon: Shield },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-navy-dark text-silver flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-silver/10 bg-navy-light/40 sticky top-0 h-screen">
        <BrandBlock />
        <nav className="flex-1 py-4 space-y-0.5">
          {nav.map((item) => (
            <NavLink key={item.to} item={item} pathname={pathname} />
          ))}
        </nav>
        <UserBlock />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-navy-dark/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="relative w-64 bg-navy-light border-r border-silver/10 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-silver/10">
              <BrandBlock compact />
              <button onClick={() => setOpen(false)} aria-label="Fechar menu">
                <X className="size-5 text-silver-muted" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-0.5" onClick={() => setOpen(false)}>
              {nav.map((item) => (
                <NavLink key={item.to} item={item} pathname={pathname} />
              ))}
            </nav>
            <UserBlock />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-40 bg-navy-dark/90 backdrop-blur border-b border-silver/10 flex items-center justify-between px-4 h-14">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="size-7 bg-navy-light ring-1 ring-silver/20 overflow-hidden">
              <img src={aetLogo.url} alt="AET" className="w-full h-full object-cover" />
            </div>
            <span className="font-display italic tracking-tight uppercase">
              AET <span className="text-ember">HUB</span>
            </span>
          </div>
          <div className="flex items-center gap-1 bg-navy-light ring-1 ring-ember/30 px-2 py-1">
            <div className="size-1.5 rounded-full bg-ember animate-ember-glow" />
            <span className="font-mono font-bold text-xs">{currentUser.points}</span>
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function BrandBlock({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 p-4 border-b border-silver/10">
      <div className="size-10 bg-navy-dark ring-1 ring-silver/20 overflow-hidden">
        <img src={aetLogo.url} alt="AET" className="w-full h-full object-cover" />
      </div>
      {!compact && (
        <div>
          <p className="font-display text-lg tracking-tighter uppercase italic leading-none">
            AET <span className="text-ember">HUB</span>
          </p>
          <p className="font-mono text-[9px] text-silver-muted mt-1">CONSOLE // V.01</p>
        </div>
      )}
    </Link>
  );
}

function NavLink({
  item,
  pathname,
}: {
  item: (typeof nav)[number];
  pathname: string;
}) {
  const active =
    item.to === "/"
      ? pathname === "/"
      : pathname === item.to || pathname.startsWith(item.to + "/");
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={`flex items-center gap-3 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all border-l-2 ${
        active
          ? "border-ember bg-navy-dark text-silver"
          : "border-transparent text-silver-muted hover:text-silver hover:bg-navy-dark/50"
      }`}
    >
      <Icon className="size-4" />
      <span>{item.label}</span>
    </Link>
  );
}

function UserBlock() {
  return (
    <div className="border-t border-silver/10 p-4 flex items-center gap-3">
      <div className="size-9 bg-ember/20 ring-1 ring-ember/40 grid place-items-center font-display italic text-sm">
        {currentUser.tag[0]}
      </div>
      <div className="min-w-0">
        <p className="font-display text-sm truncate italic">{currentUser.tag}</p>
        <p className="font-mono text-[10px] text-silver-muted">
          LVL {currentUser.level} • {currentUser.points} PTS
        </p>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  accent,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="border-b border-silver/10 px-4 md:px-8 py-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="font-mono text-[10px] text-ember mb-2 uppercase tracking-widest">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-4xl md:text-5xl tracking-tighter uppercase italic leading-none">
          {title} {accent && <span className="text-ember">{accent}</span>}
        </h1>
        {description && (
          <p className="text-sm text-silver-muted mt-2 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function StatusChip({
  status,
}: {
  status: "open" | "live" | "closed" | "scheduled" | "done";
}) {
  const map = {
    open: { label: "INSCRIÇÕES ABERTAS", cls: "bg-ember text-white" },
    live: { label: "AO VIVO", cls: "bg-ember/20 text-ember ring-1 ring-ember/40" },
    closed: { label: "ENCERRADO", cls: "bg-navy-dark text-silver-muted ring-1 ring-silver/20" },
    scheduled: { label: "AGENDADO", cls: "bg-navy-dark text-silver-muted ring-1 ring-silver/20" },
    done: { label: "FINALIZADO", cls: "bg-navy-dark text-silver ring-1 ring-silver/20" },
  } as const;
  const cfg = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${cfg.cls}`}
    >
      {status === "live" && <span className="size-1.5 rounded-full bg-ember animate-ember-glow" />}
      {cfg.label}
    </span>
  );
}