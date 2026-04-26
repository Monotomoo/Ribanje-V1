import type { ReactNode } from 'react';

interface Props {
  episodeNum: number;
  title: string;
  right?: ReactNode;
}

/* Roman numeral helper (1–8 covers main + specials). */
const ROMANS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/*
  Editorial episode header.
  Roman numeral in italic serif on left, italic title in display serif center,
  status pill on right. Hairline brass underline beneath. No metallic gradient.
*/
export function SlateStrip({ episodeNum, title, right }: Props) {
  return (
    <header className="px-7 pt-6 pb-4 border-b-[0.5px] border-[color:var(--color-border-brass)]">
      <div className="flex items-baseline gap-5">
        <span className="display-italic text-[18px] text-[color:var(--color-brass)] tracking-tight w-9 shrink-0">
          {ROMANS[episodeNum] ?? episodeNum}.
        </span>
        <h3 className="display-italic text-[28px] text-[color:var(--color-on-paper)] leading-none flex-1 truncate">
          {title}
        </h3>
        <div className="shrink-0">{right}</div>
      </div>
    </header>
  );
}
