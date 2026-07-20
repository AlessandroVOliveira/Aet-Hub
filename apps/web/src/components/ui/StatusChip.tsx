export type ChipTone = 'accent' | 'live' | 'muted';

interface StatusChipProps {
  label: string;
  tone: ChipTone;
}

const TONE_CLASSES: Record<ChipTone, string> = {
  accent: 'bg-ember text-white',
  live: 'bg-ember/20 text-ember ring-1 ring-ember/40',
  muted: 'bg-navy-dark text-silver-muted ring-1 ring-silver/20',
};

export function StatusChip({ label, tone }: StatusChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${TONE_CLASSES[tone]}`}
    >
      {tone === 'live' && <span className="size-1.5 rounded-full bg-ember animate-ember-glow" />}
      {label}
    </span>
  );
}
