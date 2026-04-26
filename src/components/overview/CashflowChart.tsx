import type { CashflowQuarter } from '../../types';

interface Props {
  cashflow: CashflowQuarter[];
}

interface Series {
  quarter: string;
  inflow: number;
  outflow: number;
  net: number;
  cumulative: number;
}

/*
  Quarterly cash flow — net per quarter as bar (brass / coral) plus cumulative
  position as a dock-blue line. Hand-rolled SVG for full editorial control.
*/
export function CashflowChart({ cashflow }: Props) {
  if (cashflow.length === 0) {
    return (
      <div className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
        No cash-flow quarters yet.
      </div>
    );
  }

  const series: Series[] = [];
  let cum = 0;
  for (const q of cashflow) {
    const inflow = Object.values(q.inflows).reduce((s, v) => s + v, 0);
    const net = inflow - q.outflow;
    cum += net;
    series.push({
      quarter: q.quarter,
      inflow,
      outflow: q.outflow,
      net,
      cumulative: cum,
    });
  }

  const allValues = series.flatMap((s) => [s.net, s.cumulative]);
  const yMaxRaw = Math.max(0, ...allValues);
  const yMinRaw = Math.min(0, ...allValues);
  const yPadding = (yMaxRaw - yMinRaw) * 0.12 || 1;
  const yMax = yMaxRaw + yPadding;
  const yMin = yMinRaw - yPadding;
  const ySpan = yMax - yMin || 1;

  /* Geometry */
  const W = 760;
  const H = 260;
  const padL = 56;
  const padR = 16;
  const padT = 18;
  const padB = 36;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const slot = innerW / series.length;
  const barW = slot * 0.46;

  const xCenter = (i: number) => padL + slot * (i + 0.5);
  const yPos = (v: number) => padT + innerH - ((v - yMin) / ySpan) * innerH;
  const zeroY = yPos(0);

  const linePath = series
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${xCenter(i).toFixed(1)} ${yPos(s.cumulative).toFixed(1)}`)
    .join(' ');

  /* 4 grid steps */
  const gridLines = [yMin, yMin + ySpan * 0.25, yMin + ySpan * 0.5, yMin + ySpan * 0.75, yMax];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
          Quarterly cash flow
        </h3>
        <div className="flex items-center gap-5 label-caps text-[color:var(--color-on-paper-faint)]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-[color:var(--color-brass)] rounded-[1px]" />
            net
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-[1.5px] bg-[color:var(--color-dock)]" />
            cumulative
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 280 }}>
        {/* Grid lines */}
        {gridLines.map((v, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={W - padR}
              y1={yPos(v)}
              y2={yPos(v)}
              stroke="rgba(14,30,54,0.08)"
              strokeWidth={0.5}
            />
            <text
              x={padL - 8}
              y={yPos(v) + 3.5}
              textAnchor="end"
              className="fill-[color:var(--color-on-paper-faint)]"
              fontFamily="Inter, system-ui, sans-serif"
              fontSize={9.5}
              letterSpacing={1.2}
            >
              {Math.round(v)}
            </text>
          </g>
        ))}

        {/* Zero baseline (slightly stronger) */}
        <line
          x1={padL}
          x2={W - padR}
          y1={zeroY}
          y2={zeroY}
          stroke="rgba(14,30,54,0.22)"
          strokeWidth={0.5}
        />

        {/* Net bars */}
        {series.map((s, i) => {
          const x = xCenter(i) - barW / 2;
          const top = Math.min(yPos(0), yPos(s.net));
          const h = Math.abs(yPos(s.net) - yPos(0));
          const fill = s.net >= 0 ? 'var(--color-brass)' : 'var(--color-coral)';
          return (
            <rect
              key={i}
              x={x}
              y={top}
              width={barW}
              height={Math.max(h, 0.5)}
              fill={fill}
              rx={1}
            >
              <title>
                {s.quarter} · net {s.net >= 0 ? '+' : ''}{s.net}k · in {s.inflow}k · out {s.outflow}k
              </title>
            </rect>
          );
        })}

        {/* Cumulative line */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-dock)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {series.map((s, i) => (
          <circle
            key={i}
            cx={xCenter(i)}
            cy={yPos(s.cumulative)}
            r={3}
            fill="var(--color-paper-light)"
            stroke="var(--color-dock)"
            strokeWidth={1.5}
          >
            <title>cumulative {s.cumulative >= 0 ? '+' : ''}{s.cumulative}k</title>
          </circle>
        ))}

        {/* Quarter labels */}
        {series.map((s, i) => (
          <text
            key={i}
            x={xCenter(i)}
            y={H - 14}
            textAnchor="middle"
            fontFamily="Inter, system-ui, sans-serif"
            fontSize={10}
            letterSpacing={1.6}
            className="fill-[color:var(--color-on-paper-muted)] uppercase"
          >
            {s.quarter}
          </text>
        ))}
      </svg>
    </div>
  );
}
