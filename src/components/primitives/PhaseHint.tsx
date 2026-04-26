interface Props {
  phase: number;
  text: string;
}

/* Phase-1 placeholder card — editorial italic, no brackets, no mono. */
export function PhaseHint({ phase, text }: Props) {
  return (
    <div className="border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-8 py-12 text-center">
      <div className="display-italic text-[16px] text-[color:var(--color-brass-deep)] mb-3">
        Phase {phase}
      </div>
      <div className="prose-body text-[14px] italic text-[color:var(--color-on-paper-muted)] leading-relaxed max-w-2xl mx-auto">
        {text}
      </div>
    </div>
  );
}
