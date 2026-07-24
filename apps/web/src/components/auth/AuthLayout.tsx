import type { ReactNode } from 'react';
import logoIcon from '@/assets/brand/logo-icon.png';
import logoWordmark from '@/assets/brand/logo-wordmark.png';
import hexNeonBg from '@/assets/auth/hex-neon-bg.svg';

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  accent?: string;
  children: ReactNode;
}

export function AuthLayout({ eyebrow, title, accent, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-navy-dark text-silver grid md:grid-cols-2">
      <div className="relative hidden md:flex flex-col justify-between p-10 bg-navy-light overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: `url(${hexNeonBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden">
          <div className="w-full h-1 bg-silver animate-scanline" />
        </div>
        <div className="flex items-center gap-3">
          <img src={logoIcon} alt="AET Hub" className="size-10 object-contain shrink-0" />
          <img src={logoWordmark} alt="AET Hub" className="h-6 w-auto object-contain" />
        </div>
        <div className="relative">
          <p className="font-mono text-[10px] text-ember mb-2">// FRONTEIRA COMPETITIVA</p>
          <h2 className="font-display text-6xl tracking-tighter uppercase italic leading-[0.85]">
            ONDE O <br />
            <span className="text-ember">PAMPA</span> <br /> ARREBENTA.
          </h2>
          <p className="text-sm text-silver-muted mt-6 max-w-sm">
            Torneios oficiais da AET em Alegrete/RS — inscrição, checkin e chaveamento em tempo
            real.
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
