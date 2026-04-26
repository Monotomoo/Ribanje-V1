import { useApp } from '../../state/AppContext';
import { upcomingMilestones } from '../../lib/selectors';

const LANE_TINT: Record<number, { fill: string; stroke: string }> = {
  0: { fill: 'rgba(120,128,100,0.22)', stroke: 'rgba(120,128,100,0.85)' },
  1: { fill: 'rgba(201,169,97,0.22)', stroke: 'rgba(168,136,74,0.85)' },
  2: { fill: 'rgba(61,114,128,0.22)', stroke: 'rgba(44,85,96,0.85)' },
};
const PHASE_OVERRIDE: Record<string, number> = {
  ph1: 0, ph2: 1, ph3: 0, ph4: 1, ph5: 0, ph6: 1, ph7: 2, ph8: 1,
};

const MONTHS_AHEAD = 4;

export function ScheduleSnapshot() {
  const { state } = useApp();
  const upcoming = upcomingMilestones(state, 3);

  /* Window: today → today + 4 months */
  const now = Date.now();
  const min = now;
  const max = now + MONTHS_AHEAD * 30 * 24 * 60 * 60 * 1000;
  const span = max - min;

  /* Geometry */
  const W = 1000;
  const H = 110;
  const padL = 10;
  const padR = 10;
  const padT = 22;
  const padB = 22;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const laneCount = 3;
  const laneH = (innerH - 8) / laneCount;

  const xFor = (iso: string) => {
    const t = new Date(iso).getTime();
    if (t < min) return padL;
    if (t > max) return padL + innerW;
    return padL + ((t - min) / span) * innerW;
  };
  const yForLane = (l: number) => padT + l * (laneH + 4);

  /* Visible phases (any phase that overlaps window) */
  const visible = state.schedulePhases.filter((p) => {
    const s = new Date(p.start).getTime();
    const e = new Date(p.end).getTime();
    return e >= min && s <= max;
  });

  /* Month gridlines */
  const months: { iso: string; label: string }[] = [];
  const mDate = new Date(now);
  mDate.setUTCDate(1);
  for (let i = 0; i <= MONTHS_AHEAD + 1; i++) {
    const d = new Date(mDate);
    d.setUTCMonth(mDate.getUTCMonth() + i);
    months.push({
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleString('en-US', { month: 'short' }),
    });
  }

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
      <header className="flex items-baseline justify-between mb-3">
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          Schedule snapshot
        </h3>
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">
          next {MONTHS_AHEAD} months
        </span>
      </header>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 130 }}>
        {/* Month labels + faint gridlines */}
        {months.map((m) => {
          const x = xFor(m.iso);
          if (x < padL + 4 || x > padL + innerW - 4) return null;
          return (
            <g key={m.iso}>
              <line
                x1={x}
                x2={x}
                y1={padT - 4}
                y2={H - padB + 4}
                stroke="rgba(14,30,54,0.08)"
                strokeWidth={0.5}
              />
              <text
                x={x + 2}
                y={padT - 8}
                fontFamily="Inter, sans-serif"
                fontSize={9}
                letterSpacing={1}
                fill="rgba(14,30,54,0.45)"
              >
                {m.label.toLowerCase()}
              </text>
            </g>
          );
        })}

        {/* Today line */}
        <line
          x1={padL}
          x2={padL}
          y1={padT - 4}
          y2={H - padB}
          stroke="var(--color-coral)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <text
          x={padL + 4}
          y={H - 6}
          fontFamily="Inter, sans-serif"
          fontSize={9}
          letterSpacing={1.4}
          fill="var(--color-coral-deep)"
        >
          TODAY
        </text>

        {/* Phase bars */}
        {visible.map((p) => {
          const lane = PHASE_OVERRIDE[p.id] ?? p.lane;
          const tint = LANE_TINT[lane];
          const x = xFor(p.start);
          const w = Math.max(2, xFor(p.end) - x);
          const y = yForLane(lane);
          return (
            <g key={p.id}>
              <rect
                x={x}
                y={y}
                width={w}
                height={laneH}
                rx={2}
                fill={tint.fill}
                stroke={tint.stroke}
                strokeWidth={0.5}
              />
              {w > 60 && (
                <text
                  x={x + 6}
                  y={y + laneH / 2 + 4}
                  fontFamily="Fraunces, serif"
                  fontStyle="italic"
                  fontSize={11}
                  fill="rgba(14,30,54,0.78)"
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Milestones */}
        {state.milestones.map((m) => {
          const t = new Date(m.date).getTime();
          if (t < min || t > max) return null;
          const x = xFor(m.date);
          const y = H - padB - 2;
          return (
            <g key={m.id}>
              <line
                x1={x}
                x2={x}
                y1={padT - 4}
                y2={y - 3}
                stroke="rgba(168,136,74,0.45)"
                strokeWidth={0.5}
                strokeDasharray="2 3"
              />
              <polygon
                points={`${x},${y - 4} ${x + 4},${y} ${x},${y + 4} ${x - 4},${y}`}
                fill="var(--color-brass)"
                stroke="var(--color-brass-deep)"
                strokeWidth={0.5}
              />
            </g>
          );
        })}
      </svg>

      {upcoming.length > 0 && (
        <div className="mt-4 pt-4 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
            Coming up
          </div>
          <ul className="grid grid-cols-3 gap-x-6 gap-y-1.5">
            {upcoming.map((u) => (
              <li
                key={u.milestone.id}
                className="flex items-baseline justify-between gap-3"
              >
                <span className="prose-body text-[13px] text-[color:var(--color-on-paper)] truncate">
                  {u.milestone.label}
                </span>
                <span className="display-italic text-[14px] text-[color:var(--color-brass-deep)] tabular-nums shrink-0">
                  {u.days}d
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

