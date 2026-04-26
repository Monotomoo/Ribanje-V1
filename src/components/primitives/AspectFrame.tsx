import type { ReactNode } from 'react';

type Ratio = '16:9' | '21:9' | '4:3' | '1:1' | '2.39:1';

const RATIOS: Record<Ratio, string> = {
  '16:9': '16 / 9',
  '21:9': '21 / 9',
  '4:3': '4 / 3',
  '1:1': '1 / 1',
  '2.39:1': '2.39 / 1',
};

interface Props {
  ratio?: Ratio;
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}

export function AspectFrame({
  ratio = '16:9',
  children,
  className = '',
  bordered = true,
}: Props) {
  return (
    <div
      className={`relative overflow-hidden ${
        bordered ? 'ring-[0.5px] ring-[color:var(--color-border-brass)]' : ''
      } ${className}`}
      style={{ aspectRatio: RATIOS[ratio] }}
    >
      {children}
    </div>
  );
}
