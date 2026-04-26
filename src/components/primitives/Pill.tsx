import type { ReactNode } from 'react';

export type PillVariant =
  | 'default'
  | 'concept'
  | 'scripted'
  | 'shot'
  | 'cut'
  | 'locked'
  | 'prospect'
  | 'contacted'
  | 'pitched'
  | 'committed'
  | 'planned'
  | 'captured'
  | 'theme';

export type PillTone = 'paper' | 'chrome';

interface Props {
  children: ReactNode;
  variant?: PillVariant;
  tone?: PillTone;
  className?: string;
}

const PAPER: Record<PillVariant, string> = {
  default:   'border-[color:var(--color-border-paper-strong)] text-[color:var(--color-on-paper-muted)]',
  concept:   'border-[color:var(--color-border-paper-strong)] text-[color:var(--color-on-paper-muted)]',
  scripted:  'border-[color:var(--color-dock)] text-[color:var(--color-dock-deep)]',
  shot:      'border-[color:var(--color-brass)] text-[color:var(--color-brass-deep)]',
  cut:       'border-[color:var(--color-steel)] text-[color:var(--color-steel)]',
  locked:    'border-[color:var(--color-success)] text-[color:var(--color-success)]',
  prospect:  'border-[color:var(--color-border-paper-strong)] text-[color:var(--color-on-paper-muted)]',
  contacted: 'border-[color:var(--color-dock)] text-[color:var(--color-dock-deep)]',
  pitched:   'border-[color:var(--color-brass)] text-[color:var(--color-brass-deep)]',
  committed: 'border-[color:var(--color-success)] text-[color:var(--color-success)]',
  planned:   'border-[color:var(--color-border-paper-strong)] text-[color:var(--color-on-paper-muted)]',
  captured:  'border-[color:var(--color-success)] text-[color:var(--color-success)]',
  theme:     'border-[color:var(--color-brass)] text-[color:var(--color-brass-deep)] bg-[color:var(--color-paper-light)]',
};

const CHROME: Record<PillVariant, string> = {
  default:   'border-[color:var(--color-border-chrome-strong)] text-[color:var(--color-on-chrome-muted)]',
  concept:   'border-[color:var(--color-border-chrome-strong)] text-[color:var(--color-on-chrome-muted)]',
  scripted:  'border-[color:var(--color-dock)] text-[color:var(--color-dock)]',
  shot:      'border-[color:var(--color-brass)] text-[color:var(--color-brass)]',
  cut:       'border-[color:var(--color-steel-light)] text-[color:var(--color-steel-light)]',
  locked:    'border-[color:var(--color-success)] text-[color:var(--color-success)]',
  prospect:  'border-[color:var(--color-border-chrome-strong)] text-[color:var(--color-on-chrome-muted)]',
  contacted: 'border-[color:var(--color-dock)] text-[color:var(--color-dock)]',
  pitched:   'border-[color:var(--color-brass)] text-[color:var(--color-brass)]',
  committed: 'border-[color:var(--color-success)] text-[color:var(--color-success)]',
  planned:   'border-[color:var(--color-border-chrome-strong)] text-[color:var(--color-on-chrome-muted)]',
  captured:  'border-[color:var(--color-success)] text-[color:var(--color-success)]',
  theme:     'border-[color:var(--color-brass)] text-[color:var(--color-brass)]',
};

export function Pill({
  children,
  variant = 'default',
  tone = 'paper',
  className = '',
}: Props) {
  const styles = tone === 'chrome' ? CHROME[variant] : PAPER[variant];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-[2px] rounded-full border-[0.5px] font-sans text-[10.5px] font-medium uppercase tracking-[0.14em] ${styles} ${className}`}
    >
      {children}
    </span>
  );
}
