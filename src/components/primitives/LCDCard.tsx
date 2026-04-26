import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  sub?: string;
  trend?: 'up' | 'down' | 'flat';
  className?: string;
}

/*
  Editorial KPI block.
  Hairline border, generous padding, label in tracked Inter small caps,
  value in italic Fraunces serif at display size. No frames, no brackets.
*/
export function LCDCard({ label, value, sub, trend, className = '' }: Props) {
  return (
    <div
      className={`relative bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6 ${className}`}
    >
      <div className="label-caps text-[color:var(--color-brass-deep)]">{label}</div>
      <div className="display-italic text-[56px] text-[color:var(--color-on-paper)] mt-3 leading-[0.95] tabular-nums">
        {value}
      </div>
      {sub && (
        <div className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-3 flex items-center gap-1.5">
          {trend === 'up' && (
            <span className="text-[color:var(--color-success)] not-italic">↑</span>
          )}
          {trend === 'down' && (
            <span className="text-[color:var(--color-danger)] not-italic">↓</span>
          )}
          {sub}
        </div>
      )}
    </div>
  );
}
