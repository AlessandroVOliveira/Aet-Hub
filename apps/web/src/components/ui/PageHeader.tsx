import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  accent?: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, accent, description, actions }: PageHeaderProps) {
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
        {description && <p className="text-sm text-silver-muted mt-2 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
