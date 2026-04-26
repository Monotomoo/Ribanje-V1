import { useState } from 'react';
import { useApp } from '../../state/AppContext';
import type { Milestone, MilestoneCategory, SchedulePhase } from '../../types';

const LANE_TINT: Record<number, { fill: string; stroke: string }> = {
  0: { fill: 'rgba(120,128,100,0.22)', stroke: 'rgba(120,128,100,0.85)' },
  1: { fill: 'rgba(201,169,97,0.22)', stroke: 'rgba(168,136,74,0.85)' },
  2: { fill: 'rgba(61,114,128,0.22)', stroke: 'rgba(44,85,96,0.85)' },
};
const PHASE_OVERRIDE: Record<string, number> = {
  ph1: 0, ph2: 1, ph3: 0, ph4: 1, ph5: 0, ph6: 1, ph7: 2, ph8: 1,
};

const CATEGORY_COLOR: Record<MilestoneCategory, string> = {
  havc: '#8C5C7A',
  'eu-media': '#993556',
  hrt: '#3D7280',
  festival: '#D4537E',
  shoot: '#C9A961',
  post: '#788064',
  internal: 'rgba(168,136,74,0.55)',
};

export function ProductionGantt() {
  const { state } = useApp();
  const [hovered, setHovered] = useState<string | null>(null);

  const minISO = '2026-04-01';
  const maxISO = '2027-12-31';
  const min = new Date(minISO).getTime();
  const max = new Date(maxISO).getTime();
  const span = max - min;

  /* Geometry */
  const W = 1280;
  const H = 360;
  const padL = 8;
  const padR = 24;
  const padT = 60;
  const padB = 80;
  const innerW = W - padL - padR;
  const laneCount = 3;
  const laneH = 36;
  const laneGap = 10;

  const xFor = (iso: string) =>
    padL + ((new Date(iso).getTime() - min) / span) * innerW;
  const yForLane = (l: number) => padT + l * (laneH + laneGap);

  /* Months for grid */
  const months: { iso: string; label: string; major: boolean }[] = [];
  for (let y = 2026; y <= 2027; y++) {
    for (let m = 0; m < 12; m++) {
      const d = new Date(Date.UTC(y, m, 1));
      months.push({
        iso: d.toISOString().slice(0, 10),
        label: d.toLocaleString('en-US', { month: 'short' }),
        major: m === 0 || m === 6,
      });
    }
  }

  const todayMs = Date.now();
  const todayInRange = todayMs >= min && todayMs <= max;
  const todayX = padL + ((todayMs - min) / span) * innerW;

  /* Milestone label de-overlap: sort by date, then if a label's center is within
     MIN_GAP px of the previous, push it to a different vertical row. */
  const milestoneRowYBase = padT + laneCount * (laneH + laneGap) + 24;
  const sorted = [...state.milestones]
    .filter((m) => {
      const t = new Date(m.date).getTime();
      return t >= min && t <= max;
    })
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const MIN_GAP = 95;
  const milestoneLayout: Array<{
    milestone: Milestone;
    x: number;
    row: number;
  }> = [];
  let lastByRow: number[] = [-Infinity, -Infinity, -Infinity];
  for (const m of sorted) {
    const x = xFor(m.date);
    let row = 0;
    while (row < 3 && x - lastByRow[row] < MIN_GAP) row++;
    if (row >= 3) row = 0;
    lastByRow[row] = x;
    milestoneLayout.push({ milestone: m, x, row });
  }

  const phaseList = state.schedulePhases;

  return (
    <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 pt-4 pb-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 380 }}>
        {/* Year backgrounds */}
        <rect
          x={padL}
          y={padT - 4}
          width={xFor('2027-01-01') - padL}
          height={H - padT - padB + 4}
          fill="rgba(14,30,54,0.02)"
        />

        {/* Month gridlines */}
        {months.map((m) => {
          const x = xFor(m.iso);
          if (x < padL || x > padL + innerW) return null;
          return (
            <line
              key={m.iso}
              x1={x}
              x2={x}
              y1={padT - 4}
              y2={H - padB + 4}
              stroke={m.major ? 'rgba(14,30,54,0.18)' : 'rgba(14,30,54,0.06)'}
              strokeWidth={0.5}
            />
          );
        })}

        {/* Year labels */}
        <text
          x={xFor('2026-07-01')}
          y={28}
          textAnchor="middle"
          className="fill-[color:var(--color-brass-deep)]"
          fontFamily="Fraunces, Georgia, serif"
          fontStyle="italic"
          fontSize={20}
        >
          2026
        </text>
        <text
          x={xFor('2027-07-01')}
          y={28}
          textAnchor="middle"
          className="fill-[color:var(--color-brass-deep)]"
          fontFamily="Fraunces, Georgia, serif"
          fontStyle="italic"
          fontSize={20}
        >
          2027
        </text>

        {/* Month tick labels */}
        {months.map((m) => {
          const x = xFor(m.iso);
          if (x < padL + 4 || x > padL + innerW - 4) return null;
          return (
            <text
              key={m.iso + '-tick'}
              x={x + 2}
              y={padT - 8}
              className="fill-[color:var(--color-on-paper-faint)]"
              fontFamily="Inter, system-ui, sans-serif"
              fontSize={9}
              letterSpacing={0.8}
            >
              {m.label.toLowerCase()}
            </text>
          );
        })}

        {/* Phase bars + progress overlay */}
        {phaseList.map((p) => {
          const lane = PHASE_OVERRIDE[p.id] ?? p.lane;
          const tint = LANE_TINT[lane];
          const x = xFor(p.start);
          const w = Math.max(2, xFor(p.end) - x);
          const y = yForLane(lane);
          const isHover = hovered === p.id;

          /* Progress = fraction of phase elapsed */
          const startMs = new Date(p.start).getTime();
          const endMs = new Date(p.end).getTime();
          const phaseSpan = endMs - startMs || 1;
          const progress = Math.max(
            0,
            Math.min(1, (todayMs - startMs) / phaseSpan)
          );

          return (
            <g
              key={p.id}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x}
                y={y}
                width={w}
                height={laneH}
                rx={2}
                ry={2}
                fill={tint.fill}
                stroke={tint.stroke}
                strokeWidth={isHover ? 1 : 0.5}
              />
              {progress > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={w * progress}
                  height={laneH}
                  rx={2}
                  ry={2}
                  fill={tint.stroke}
                  opacity={0.32}
                />
              )}
              <text
                x={x + 10}
                y={y + laneH / 2 + 5}
                fontFamily="Fraunces, Georgia, serif"
                fontStyle="italic"
                fontSize={14}
                className="fill-[color:var(--color-on-paper)]"
              >
                {p.label}
              </text>
            </g>
          );
        })}

        {/* Milestones — staggered labels, color by category */}
        {milestoneLayout.map(({ milestone: m, x, row }) => {
          const color = m.category
            ? CATEGORY_COLOR[m.category]
            : 'rgba(168,136,74,0.55)';
          const labelY = milestoneRowYBase + row * 18;
          return (
            <g key={m.id}>
              <line
                x1={x}
                x2={x}
                y1={padT - 6}
                y2={labelY - 8}
                stroke={color}
                strokeOpacity={0.5}
                strokeWidth={0.5}
                strokeDasharray="2 3"
              />
              <Diamond x={x} y={milestoneRowYBase - 12} color={color} />
              <line
                x1={x}
                x2={x}
                y1={milestoneRowYBase - 6}
                y2={labelY - 6}
                stroke={color}
                strokeOpacity={0.4}
                strokeWidth={0.5}
              />
              <text
                x={x}
                y={labelY}
                textAnchor="middle"
                fontFamily="Inter, system-ui, sans-serif"
                fontSize={9.5}
                letterSpacing={0.6}
                className="fill-[color:var(--color-on-paper-muted)]"
              >
                {m.label}
              </text>
            </g>
          );
        })}

        {/* Today indicator */}
        {todayInRange && (
          <g>
            <line
              x1={todayX}
              x2={todayX}
              y1={padT - 12}
              y2={H - padB}
              stroke="var(--color-coral)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <text
              x={todayX + 5}
              y={padT - 16}
              className="fill-[color:var(--color-coral-deep)]"
              fontFamily="Inter, system-ui, sans-serif"
              fontSize={9}
              letterSpacing={1.5}
            >
              TODAY
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function Diamond({
  x,
  y,
  color,
}: {
  x: number;
  y: number;
  color: string;
}) {
  const s = 5;
  return (
    <polygon
      points={`${x},${y - s} ${x + s},${y} ${x},${y + s} ${x - s},${y}`}
      fill={color}
      stroke="rgba(14,30,54,0.5)"
      strokeWidth={0.5}
    />
  );
}

export function PhaseLegend({
  phases,
}: {
  phases: SchedulePhase[];
}) {
  return (
    <ul className="space-y-1.5">
      {phases.map((p) => (
        <li key={p.id} className="flex items-baseline gap-3">
          <span
            className="w-2.5 h-2.5 rounded-[2px] shrink-0 translate-y-[-1px]"
            style={{
              background: LANE_TINT[PHASE_OVERRIDE[p.id] ?? p.lane].stroke,
              opacity: 0.85,
            }}
          />
          <span className="prose-body text-[13px] text-[color:var(--color-on-paper)] flex-1">
            {p.label}
          </span>
          <span className="label-caps text-[color:var(--color-on-paper-faint)]">
            {fmt(p.start)} → {fmt(p.end)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function MilestoneLegend({
  milestones,
}: {
  milestones: Milestone[];
}) {
  return (
    <ul className="space-y-1.5">
      {milestones.map((m) => {
        const color = m.category
          ? CATEGORY_COLOR[m.category]
          : 'rgba(168,136,74,0.55)';
        return (
          <li key={m.id} className="flex items-baseline gap-3">
            <span
              className="w-2.5 h-2.5 shrink-0 translate-y-[1px]"
              style={{
                background: color,
                clipPath:
                  'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              }}
            />
            <span className="prose-body text-[13px] text-[color:var(--color-on-paper)] flex-1">
              {m.label}
            </span>
            <span className="label-caps text-[color:var(--color-on-paper-faint)]">
              {fmt(m.date)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function fmt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export { CATEGORY_COLOR as MILESTONE_CATEGORY_COLOR };
