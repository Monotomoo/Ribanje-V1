import { useMemo } from 'react';
import { TrendingDown } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { EditMilestonePhase } from '../../types';

const PHASE_ORDER: EditMilestonePhase[] = [
  'assembly',
  'rough-cut',
  'fine-cut',
  'picture-lock',
  'online',
  'color',
  'sound-mix',
  'print-master',
];

const PHASE_LABEL: Record<EditMilestonePhase, string> = {
  assembly: 'Assembly',
  'rough-cut': 'Rough cut',
  'fine-cut': 'Fine cut',
  'picture-lock': 'Picture lock',
  online: 'Online',
  color: 'Color',
  'sound-mix': 'Sound mix',
  'print-master': 'Print master',
};

const SHOOT_START = new Date('2026-10-01T00:00:00Z').getTime();
const SHOOT_END = new Date('2026-10-31T23:59:59Z').getTime();

/* Schedule burn-down — shoot days remaining + post-prod arc projection.
   Combines the shoot countdown with the editorial milestone calendar so
   Tomo can see the full Oct 2026 → mid-2027 arc in one chart. */
export function ScheduleBurnDown() {
  const { state } = useApp();

  const data = useMemo(() => {
    const now = Date.now();
    const shootDuration = SHOOT_END - SHOOT_START;
    const totalDays = state.shootDays.length;
    const shotInOct = state.shootDays.filter((d) => {
      const t = new Date(d.date + 'T00:00:00Z').getTime();
      return t < now;
    }).length;
    const shootDaysLeft = Math.max(0, totalDays - shotInOct);

    /* Pre-shoot countdown */
    const daysToShoot = Math.max(
      0,
      Math.ceil((SHOOT_START - now) / (1000 * 60 * 60 * 24))
    );

    /* Post-prod milestones — sort by phase order */
    const postMilestones = [...state.editMilestones]
      .filter((m) => m.targetDate)
      .sort((a, b) => {
        const ai = PHASE_ORDER.indexOf(a.phase);
        const bi = PHASE_ORDER.indexOf(b.phase);
        return ai - bi;
      });

    return {
      totalDays,
      shotInOct,
      shootDaysLeft,
      daysToShoot,
      shootDuration,
      postMilestones,
    };
  }, [state.shootDays, state.editMilestones]);

  /* Visual range — April 2026 → August 2027 */
  const minMs = new Date('2026-04-01T00:00:00Z').getTime();
  const maxMs = new Date('2027-08-31T23:59:59Z').getTime();
  const span = maxMs - minMs;
  const W = 1000;
  const H = 200;
  const padL = 60;
  const padR = 24;
  const padT = 24;
  const padB = 36;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const xFor = (ms: number) => padL + ((ms - minMs) / span) * innerW;
  const todayX = xFor(Date.now());

  return (
    <section>
      <header className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-3">
          <TrendingDown size={13} className="text-[color:var(--color-brass-deep)]" />
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
            Burn-down · shoot → post-production arc
          </h3>
        </div>
        <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          Apr 2026 → Aug 2027
        </span>
      </header>

      {/* Stat row */}
      <div className="grid grid-cols-4 gap-5 mb-4">
        <Stat
          label="Days to shoot"
          value={String(data.daysToShoot)}
          sub={data.daysToShoot > 0 ? 'pre-production' : 'in-shoot or wrapped'}
        />
        <Stat
          label="Shoot days left"
          value={`${data.shootDaysLeft} / ${data.totalDays}`}
          sub={data.shotInOct > 0 ? `${data.shotInOct} captured` : 'not yet started'}
          tone={data.shootDaysLeft === 0 ? 'success' : undefined}
        />
        <Stat
          label="Post milestones"
          value={String(data.postMilestones.length)}
          sub="editorial arc"
        />
        <Stat
          label="Print master target"
          value={data.postMilestones.find((m) => m.phase === 'print-master')?.targetDate?.slice(0, 7) ?? '—'}
          sub="all deliverables"
        />
      </div>

      {/* Burn-down chart */}
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }}>
          {/* Quarter grid */}
          {[
            ['2026-Q2', '2026-04-01'],
            ['2026-Q3', '2026-07-01'],
            ['2026-Q4', '2026-10-01'],
            ['2027-Q1', '2027-01-01'],
            ['2027-Q2', '2027-04-01'],
            ['2027-Q3', '2027-07-01'],
          ].map(([label, iso]) => {
            const x = xFor(new Date(iso + 'T00:00:00Z').getTime());
            return (
              <g key={iso}>
                <line
                  x1={x}
                  x2={x}
                  y1={padT}
                  y2={H - padB}
                  stroke="rgba(14,30,54,0.08)"
                  strokeWidth={0.5}
                />
                <text
                  x={x}
                  y={H - 14}
                  textAnchor="start"
                  fontFamily="Inter, sans-serif"
                  fontSize={9}
                  letterSpacing={1.2}
                  fill="rgba(14,30,54,0.5)"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Shoot block */}
          <rect
            x={xFor(SHOOT_START)}
            y={padT + 18}
            width={xFor(SHOOT_END) - xFor(SHOOT_START)}
            height={28}
            fill="rgba(201,169,97,0.35)"
            stroke="var(--color-brass-deep)"
            strokeWidth={0.5}
          />
          <text
            x={xFor(SHOOT_START) + 6}
            y={padT + 36}
            fontFamily="Fraunces, serif"
            fontStyle="italic"
            fontSize={12}
            fill="var(--color-on-paper)"
          >
            Shoot · 30 days
          </text>

          {/* Post-prod milestones */}
          {data.postMilestones.map((m, i) => {
            if (!m.targetDate) return null;
            const x = xFor(new Date(m.targetDate + 'T00:00:00Z').getTime());
            const y = padT + 64 + (i % 4) * 18;
            return (
              <g key={m.id}>
                <line
                  x1={x}
                  x2={x}
                  y1={padT + 50}
                  y2={y}
                  stroke="var(--color-olive)"
                  strokeWidth={0.5}
                  strokeDasharray="2 2"
                />
                <circle cx={x} cy={padT + 50} r={3} fill="var(--color-olive)" />
                <text
                  x={x + 5}
                  y={y + 3}
                  fontFamily="Fraunces, serif"
                  fontStyle="italic"
                  fontSize={10}
                  fill="rgba(14,30,54,0.7)"
                >
                  {PHASE_LABEL[m.phase]}
                </text>
              </g>
            );
          })}

          {/* Today line */}
          {Date.now() >= minMs && Date.now() <= maxMs && (
            <g>
              <line
                x1={todayX}
                x2={todayX}
                y1={padT}
                y2={H - padB}
                stroke="var(--color-coral-deep)"
                strokeWidth={1}
              />
              <text
                x={todayX + 4}
                y={padT + 10}
                fontFamily="Inter, sans-serif"
                fontSize={9}
                fontWeight={500}
                letterSpacing={1.2}
                fill="var(--color-coral-deep)"
              >
                TODAY
              </text>
            </g>
          )}
        </svg>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'success';
}) {
  const valueColor =
    tone === 'success'
      ? 'text-[color:var(--color-success)]'
      : 'text-[color:var(--color-on-paper)]';
  return (
    <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-3">
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">{label}</div>
      <div className={`display-italic text-[24px] tabular-nums leading-none ${valueColor}`}>
        {value}
      </div>
      {sub && (
        <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1">
          {sub}
        </div>
      )}
    </div>
  );
}
