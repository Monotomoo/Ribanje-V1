import type { ReactNode } from 'react';

export type TileTone = 'default' | 'success' | 'warn' | 'danger';

interface Props {
  label: string;
  value: ReactNode;
  tone?: TileTone;
  size?: 'sm' | 'md';
}

const LABEL_COLOR: Record<TileTone, string> = {
  default: 'text-[color:var(--color-brass-deep)]',
  success: 'text-[color:var(--color-success)]',
  warn: 'text-[color:var(--color-warn)]',
  danger: 'text-[color:var(--color-danger)]',
};

/* Editorial data tile — small caps label + italic serif value. */
export function Tile({ label, value, tone = 'default', size = 'md' }: Props) {
  const valueSize = size === 'sm' ? 'text-[22px]' : 'text-[28px]';
  const padding = size === 'sm' ? 'px-4 py-3' : 'px-5 py-4';
  return (
    <div
      className={`bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] ${padding}`}
    >
      <div className={`label-caps ${LABEL_COLOR[tone]}`}>{label}</div>
      <div
        className={`display-italic ${valueSize} text-[color:var(--color-on-paper)] mt-2 leading-none tabular-nums`}
      >
        {value}
      </div>
    </div>
  );
}
