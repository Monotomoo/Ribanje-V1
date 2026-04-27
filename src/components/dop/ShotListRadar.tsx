import { useMemo, useState } from 'react';
import { Compass } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { CameraSlot, Shot } from '../../types';

/* Shot List Radar — 360° polar plot. Angle = planned time-of-day (00:00 at top,
   12:00 at bottom). Radius = priority (status-driven: planned outer, captured
   inner). Color = camera slot. At a glance: "what's left in the next 2 hours." */

const SLOT_COLORS: Record<CameraSlot, string> = {
  A: '#C9A961',
  B: '#788064',
  drone: '#5BA3CC',
  underwater: '#3D7FA0',
  crash: '#A8884A',
};

const SIZE = 460;
const CENTER = SIZE / 2;
const R_MAX = (SIZE / 2) * 0.85;

interface RadarPoint {
  shot: Shot;
  angleDeg: number;       // 0–360, 0 = top, clockwise
  radius: number;         // 0–R_MAX
  color: string;
}

function shotPlannedHour(shot: Shot, idx: number): number {
  /* Distribute shots across the day if no specific time exists.
     Use shot.number to derive a stable hour 06:00–20:00 spread. */
  const base = 6;
  const span = 14;
  /* Hash the shot number string to a 0–1 value */
  let h = 0;
  for (let i = 0; i < shot.number.length; i++) h = (h * 31 + shot.number.charCodeAt(i)) % 1000;
  return base + ((h + idx * 0.7) % span);
}

function hourToAngle(hour: number): number {
  /* 00:00 at top → angle 0; 12:00 at bottom → angle 180; clockwise */
  return (hour / 24) * 360;
}

function radiusForStatus(status: Shot['status']): number {
  switch (status) {
    case 'captured': return R_MAX * 0.4;
    case 'planned': return R_MAX * 0.85;
    case 'cut':     return R_MAX * 0.15;
    case 'deferred': return R_MAX * 0.65;
    default: return R_MAX * 0.7;
  }
}

export function ShotListRadar() {
  const { state } = useApp();
  const [selectedDayId, setSelectedDayId] = useState<string>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const sortedDays = useMemo(
    () => [...state.shootDays].sort((a, b) => a.date.localeCompare(b.date)),
    [state.shootDays]
  );

  const shots = useMemo(() => {
    if (selectedDayId === 'all') return state.shots;
    const day = state.shootDays.find((d) => d.id === selectedDayId);
    if (!day) return [];
    const dayIdx = sortedDays.findIndex((d) => d.id === day.id);
    return state.shots.filter((s) => {
      if (s.sceneId) {
        const scene = state.scenes.find((sc) => sc.id === s.sceneId);
        return scene?.dayIdx === dayIdx;
      }
      return s.episodeId === day.episodeId;
    });
  }, [state.shots, state.scenes, state.shootDays, sortedDays, selectedDayId]);

  const points: RadarPoint[] = useMemo(() => {
    return shots.map((s, i) => {
      const hour = shotPlannedHour(s, i);
      return {
        shot: s,
        angleDeg: hourToAngle(hour),
        radius: radiusForStatus(s.status),
        color: SLOT_COLORS[s.cameraSlot],
      };
    });
  }, [shots]);

  /* Counts */
  const counts = useMemo(() => {
    const c = { planned: 0, captured: 0, cut: 0, deferred: 0 };
    for (const s of shots) {
      if (s.status === 'planned') c.planned++;
      else if (s.status === 'captured') c.captured++;
      else if (s.status === 'cut') c.cut++;
      else if (s.status === 'deferred') c.deferred++;
    }
    return c;
  }, [shots]);

  function polarToXY(angleDeg: number, radius: number): { x: number; y: number } {
    /* Subtract 90° so 0° points up */
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: CENTER + Math.cos(rad) * radius,
      y: CENTER + Math.sin(rad) * radius,
    };
  }

  const hovered = points.find((p) => p.shot.id === hoveredId);

  return (
    <section>
      <header className="flex items-baseline justify-between mb-4">
        <div>
          <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)] flex items-baseline gap-2">
            <Compass size={14} className="text-[color:var(--color-brass-deep)]" />
            Shot list radar
          </h4>
          <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Angle = time-of-day · radius = status (outer = planned, inner = done)
          </p>
        </div>
        <select
          value={selectedDayId}
          onChange={(e) => setSelectedDayId(e.target.value)}
          className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[12px] text-[color:var(--color-on-paper)] py-0.5"
        >
          <option value="all">All days · {state.shots.length} shots</option>
          {sortedDays.map((d, i) => (
            <option key={d.id} value={d.id}>
              Day {i + 1} · {d.date}
            </option>
          ))}
        </select>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4 md:gap-5">
        {/* Radar */}
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4 flex items-center justify-center">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[460px]">
            {/* Outer rings */}
            {[0.25, 0.5, 0.75, 1].map((r) => (
              <circle
                key={r}
                cx={CENTER}
                cy={CENTER}
                r={R_MAX * r}
                fill="none"
                stroke="rgba(14,30,54,0.10)"
                strokeWidth={0.5}
                strokeDasharray={r === 1 ? undefined : '2 4'}
              />
            ))}
            {/* Hour spokes */}
            {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => {
              const angle = hourToAngle(h);
              const { x, y } = polarToXY(angle, R_MAX);
              const { x: lx, y: ly } = polarToXY(angle, R_MAX + 16);
              return (
                <g key={h}>
                  <line
                    x1={CENTER}
                    y1={CENTER}
                    x2={x}
                    y2={y}
                    stroke="rgba(14,30,54,0.08)"
                    strokeWidth={0.5}
                    strokeDasharray="2 3"
                  />
                  <text
                    x={lx}
                    y={ly + 3}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily="var(--font-sans)"
                    letterSpacing="0.10em"
                    fill="rgba(14,30,54,0.50)"
                  >
                    {String(h).padStart(2, '0')}
                  </text>
                </g>
              );
            })}

            {/* Status labels on rings */}
            <text
              x={CENTER}
              y={CENTER - R_MAX * 0.85 - 6}
              textAnchor="middle"
              fontSize={8}
              fontFamily="var(--font-sans)"
              letterSpacing="0.10em"
              fill="rgba(14,30,54,0.40)"
            >
              PLANNED
            </text>
            <text
              x={CENTER}
              y={CENTER - R_MAX * 0.4 - 6}
              textAnchor="middle"
              fontSize={8}
              fontFamily="var(--font-sans)"
              letterSpacing="0.10em"
              fill="rgba(14,30,54,0.40)"
            >
              DONE
            </text>

            {/* Center dot */}
            <circle cx={CENTER} cy={CENTER} r={3} fill="var(--color-brass)" />

            {/* Shot points */}
            {points.map((p) => {
              const { x, y } = polarToXY(p.angleDeg, p.radius);
              const isHovered = hoveredId === p.shot.id;
              const dotR = isHovered ? 7 : 4;
              const opacity =
                p.shot.status === 'cut' ? 0.35 :
                p.shot.status === 'captured' ? 0.65 : 0.95;
              return (
                <g
                  key={p.shot.id}
                  onMouseEnter={() => setHoveredId(p.shot.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={dotR}
                    fill={p.color}
                    fillOpacity={opacity}
                    stroke={isHovered ? 'var(--color-on-paper)' : 'var(--color-paper-light)'}
                    strokeWidth={1.25}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Side rail — counts + hover detail */}
        <aside className="space-y-3">
          <div className="bg-[color:var(--color-paper-light)] border-l-2 border-[color:var(--color-brass)] px-4 py-3">
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
              today · status counts
            </div>
            <div className="space-y-1.5">
              <CountRow label="planned" count={counts.planned} tone="brass" />
              <CountRow label="captured" count={counts.captured} tone="success" />
              <CountRow label="deferred" count={counts.deferred} tone="warn" />
              <CountRow label="cut" count={counts.cut} tone="faint" />
            </div>
          </div>

          {hovered ? (
            <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-brass)]/60 rounded-[3px] px-4 py-3">
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                hovered shot
              </div>
              <div className="display-italic text-[15px] text-[color:var(--color-on-paper)] mb-1">
                {hovered.shot.number}
              </div>
              <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] leading-relaxed">
                {hovered.shot.description}
              </p>
              <div className="mt-2 flex items-baseline gap-3">
                <span
                  className="label-caps tracking-[0.10em] text-[10px]"
                  style={{ color: SLOT_COLORS[hovered.shot.cameraSlot] }}
                >
                  {hovered.shot.cameraSlot}
                </span>
                <span className="label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-on-paper-faint)]">
                  {hovered.shot.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-3 prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
              Hover any dot to see shot detail.
            </div>
          )}

          <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-3">
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
              camera color key
            </div>
            <ul className="space-y-1">
              {(Object.entries(SLOT_COLORS) as [CameraSlot, string][]).map(([slot, color]) => (
                <li key={slot} className="flex items-baseline gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0 translate-y-[2px]"
                    style={{ background: color }}
                  />
                  <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper)]">
                    {slot}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

function CountRow({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: 'brass' | 'success' | 'warn' | 'faint';
}) {
  const color =
    tone === 'success'
      ? 'text-[color:var(--color-success)]'
      : tone === 'warn'
      ? 'text-[color:var(--color-coral-deep)]'
      : tone === 'brass'
      ? 'text-[color:var(--color-on-paper)]'
      : 'text-[color:var(--color-on-paper-faint)]';
  return (
    <div className="flex items-baseline justify-between">
      <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
        {label}
      </span>
      <span className={`display-italic text-[14px] tabular-nums ${color}`}>
        {count}
      </span>
    </div>
  );
}
