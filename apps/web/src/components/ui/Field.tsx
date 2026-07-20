import type { InputHTMLAttributes } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Field({ label, error, id, className, ...props }: FieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="font-mono text-[10px] text-silver-muted uppercase tracking-widest">
        {label}
      </span>
      <input
        id={id}
        {...props}
        className={`mt-1 w-full bg-navy-light border-b-2 border-silver/20 focus:border-ember outline-none px-3 py-2 text-sm font-mono transition-colors disabled:opacity-60 read-only:opacity-70 ${className ?? ''}`}
      />
      {error && <span className="block mt-1 text-xs font-mono text-ember">{error}</span>}
    </label>
  );
}
