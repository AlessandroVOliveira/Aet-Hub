import type { ReactNode } from 'react';

interface BannerProps {
  variant: 'error' | 'success';
  children: ReactNode;
}

export function Banner({ variant, children }: BannerProps) {
  const classes =
    variant === 'error'
      ? 'text-ember ring-1 ring-ember/30 bg-ember/10'
      : 'text-silver ring-1 ring-silver/20 bg-navy-light';

  return (
    <p className={`mb-4 px-3 py-2 text-xs font-mono ${classes}`}>{children}</p>
  );
}
