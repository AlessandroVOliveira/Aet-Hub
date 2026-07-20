import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  children: ReactNode;
}

export function Panel({ title, children }: PanelProps) {
  return (
    <section className="bg-navy-light ring-1 ring-silver/10">
      <header className="px-4 py-3 border-b border-silver/10">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-silver-muted">
          {title}
        </h3>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
