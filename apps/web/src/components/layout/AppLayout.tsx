import { useState, type ComponentType } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Trophy,
  BarChart3,
  Store,
  Users,
  MessageSquare,
  Shield,
  Menu,
  X,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMyWallet } from '@/hooks/useMyWallet';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/perfil', label: 'Perfil', icon: UserCircle },
  { to: '/torneios', label: 'Torneios', icon: Trophy },
  { to: '/minhas-inscricoes', label: 'Minhas inscrições', icon: Trophy },
  { to: '/loja', label: 'Loja', icon: Store },
  { to: '/minhas-trocas', label: 'Minhas trocas', icon: Store },
  { to: '/ranking', label: 'Ranking', icon: BarChart3, comingSoon: true },
  { to: '/comunidade', label: 'Comunidade', icon: Users, comingSoon: true },
  { to: '/chat', label: 'Chat', icon: MessageSquare, comingSoon: true },
  { to: '/admin/torneios', label: 'Admin Torneios', icon: Shield, adminOnly: true },
  { to: '/admin/loja', label: 'Admin Loja', icon: Shield, adminOnly: true },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!user) {
    return <Outlet />;
  }

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user.role === 'ADMIN');

  return (
    <div className="min-h-screen bg-navy-dark text-silver flex">
      <aside className="hidden lg:flex flex-col w-56 border-r border-silver/10 bg-navy-light/40 sticky top-0 h-screen">
        <BrandBlock />
        <nav className="flex-1 py-4 space-y-0.5">
          {items.map((item) => (
            <NavLink key={item.to} item={item} />
          ))}
        </nav>
        <UserBlock onLogout={handleLogout} />
      </aside>

      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-navy-dark/80 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative w-64 bg-navy-light border-r border-silver/10 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-silver/10">
              <BrandBlock compact />
              <button onClick={() => setDrawerOpen(false)} aria-label="Fechar menu">
                <X className="size-5 text-silver-muted" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-0.5" onClick={() => setDrawerOpen(false)}>
              {items.map((item) => (
                <NavLink key={item.to} item={item} />
              ))}
            </nav>
            <UserBlock onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-40 bg-navy-dark/90 backdrop-blur border-b border-silver/10 flex items-center justify-between px-4 h-14">
          <button onClick={() => setDrawerOpen(true)} aria-label="Abrir menu">
            <Menu className="size-5" />
          </button>
          <span className="font-display italic tracking-tight uppercase">
            AET <span className="text-ember">HUB</span>
          </span>
          <PointsPill />
        </header>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function BrandBlock({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 p-4 border-b border-silver/10">
      <div className="size-10 bg-navy-dark ring-1 ring-silver/20 grid place-items-center font-display italic text-ember">
        AET
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

function NavLink({ item }: { item: NavItem }) {
  const { pathname } = useLocation();
  const active = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
  const Icon = item.icon;

  if (item.comingSoon) {
    return (
      <span
        className="flex items-center gap-3 px-4 py-2 font-mono text-xs uppercase tracking-widest border-l-2 border-transparent text-silver-muted/50 cursor-not-allowed"
        title="Em breve"
      >
        <Icon className="size-4" />
        <span className="flex-1">{item.label}</span>
        <span className="text-[9px] normal-case tracking-normal text-silver-muted/60">em breve</span>
      </span>
    );
  }

  return (
    <Link
      to={item.to}
      className={`flex items-center gap-3 px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all border-l-2 ${
        active
          ? 'border-ember bg-navy-dark text-silver'
          : 'border-transparent text-silver-muted hover:text-silver hover:bg-navy-dark/50'
      }`}
    >
      <Icon className="size-4" />
      <span>{item.label}</span>
    </Link>
  );
}

function PointsPill() {
  const { data } = useMyWallet();
  return (
    <div className="flex items-center gap-1.5 bg-navy-light ring-1 ring-ember/30 px-2 py-1">
      <div className="size-1.5 rounded-full bg-ember animate-ember-glow" />
      <span className="font-mono font-bold text-xs">{data?.balance ?? 0}</span>
    </div>
  );
}

function UserBlock({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  const { data } = useMyWallet();
  if (!user) return null;

  return (
    <div className="border-t border-silver/10 p-4 flex items-center gap-3">
      <Link to="/perfil" className="flex items-center gap-3 min-w-0 flex-1">
        <div className="size-9 bg-ember/20 ring-1 ring-ember/40 grid place-items-center font-display italic text-sm shrink-0">
          {user.displayName[0]?.toUpperCase() ?? user.username[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm truncate italic">{user.displayName || user.username}</p>
          <p className="font-mono text-[10px] text-silver-muted">{data?.balance ?? 0} PTS</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onLogout}
        className="font-mono text-[10px] uppercase text-silver-muted hover:text-ember transition-colors"
      >
        Sair
      </button>
    </div>
  );
}
