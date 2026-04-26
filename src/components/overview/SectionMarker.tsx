import type { ReactNode } from 'react';

interface Props {
  label: string;
  hint?: ReactNode;
  /* Small ornament before the label — italic asterisk in brass. */
  ornament?: boolean;
}

/* Slim section divider — brass small-caps label and a hairline rule.
   Used to pace Overview into chapters. */
export function SectionMarker({ label, hint, ornament = false }: Props) {
  return (
    <header className="flex items-baseline gap-4 pt-1 mb-2">
      {ornament && (
        <span
          aria-hidden
          className="font-[var(--font-serif)] italic text-[16px] text-[color:var(--color-brass)] leading-none"
        >
          *
        </span>
      )}
      <span className="label-caps text-[color:var(--color-brass-deep)] tracking-[0.2em]">
        {label}
      </span>
      <div className="flex-1 h-px bg-[color:var(--color-border-brass)]/55" />
      {hint && (
        <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          {hint}
        </span>
      )}
    </header>
  );
}
