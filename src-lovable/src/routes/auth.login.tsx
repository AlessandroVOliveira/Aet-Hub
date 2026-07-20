import { createFileRoute, Link } from "@tanstack/react-router";
import aetLogo from "@/assets/aet-logo.asset.json";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Login — AET Hub" },
      { name: "description", content: "Entre na sua conta AET para acessar torneios, ranking e loja de pontos." },
    ],
  }),
  component: Login,
});

function Login() {
  return (
    <AuthLayout eyebrow="ACESSO_PLAYER" title="ENTRAR" accent="NO CONSOLE">
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="TAG OU EMAIL" placeholder="gaucho_slayer" />
        <Field label="SENHA" type="password" placeholder="••••••••" />
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-silver-muted">
            <input type="checkbox" className="accent-ember" /> Lembrar sessão
          </label>
          <Link to="/auth/recover" className="text-ember hover:underline font-mono uppercase">
            Esqueci senha
          </Link>
        </div>
        <button
          type="submit"
          className="w-full bg-ember hover:bg-ember-glow text-white font-display py-3 tracking-widest uppercase italic transition-colors"
        >
          ENTRAR
        </button>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button className="py-2 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-xs uppercase transition">
            Discord
          </button>
          <button className="py-2 bg-navy-dark ring-1 ring-silver/20 hover:ring-ember/40 font-mono text-xs uppercase transition">
            Google
          </button>
        </div>
        <p className="text-xs text-silver-muted text-center pt-4">
          Novo por aqui?{" "}
          <Link to="/auth/register" className="text-ember hover:underline font-bold uppercase">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export function AuthLayout({
  eyebrow,
  title,
  accent,
  children,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-navy-dark text-silver grid md:grid-cols-2">
      <div className="relative hidden md:flex flex-col justify-between p-10 bg-navy-light overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
          <div className="w-full h-1 bg-silver animate-scanline" />
        </div>
        <div className="flex items-center gap-3">
          <div className="size-10 bg-navy-dark ring-1 ring-silver/20 overflow-hidden">
            <img src={aetLogo.url} alt="AET" className="w-full h-full object-cover" />
          </div>
          <span className="font-display text-xl uppercase italic tracking-tighter">
            AET <span className="text-ember">HUB</span>
          </span>
        </div>
        <div className="relative">
          <p className="font-mono text-[10px] text-ember mb-2">// FRONTEIRA COMPETITIVA</p>
          <h2 className="font-display text-6xl tracking-tighter uppercase italic leading-[0.85]">
            ONDE O <br />
            <span className="text-ember">PAMPA</span> <br /> ARREBENTA.
          </h2>
          <p className="text-sm text-silver-muted mt-6 max-w-sm">
            Torneios oficiais, ranking regional, checkin com QR e uma cena de esports que
            respira Alegrete.
          </p>
        </div>
        <p className="font-mono text-[10px] text-silver-muted uppercase tracking-widest">
          EST. 2024 // ALEGRETE / RS
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 md:px-16 py-12">
        <div className="max-w-sm mx-auto w-full">
          <p className="font-mono text-[10px] text-ember mb-2">[ {eyebrow} ]</p>
          <h1 className="font-display text-5xl tracking-tighter uppercase italic mb-8 leading-none">
            {title} {accent && <span className="text-ember">{accent}</span>}
          </h1>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] text-silver-muted uppercase tracking-widest">
        {label}
      </span>
      <input
        {...props}
        className="mt-1 w-full bg-navy-light border-b-2 border-silver/20 focus:border-ember outline-none px-3 py-2 text-sm font-mono transition-colors"
      />
    </label>
  );
}