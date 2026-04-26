import { useMemo, useState } from 'react';
import SunCalc from 'suncalc';
import { useApp } from '../../state/AppContext';
import { GoldenHourPanel } from './GoldenHourPanel';
import { LightStressTimeline } from './LightStressTimeline';

function fmt(d: Date | null | undefined): string {
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function TimeAndLight() {
  const { state } = useApp();
  const [date, setDate] = useState('2026-10-15');
  const [locId, setLocId] = useState<string>(
    state.locations.find((l) => l.episodeId === 'ep1')?.id ??
      state.locations[0]?.id ??
      ''
  );

  return (
    <div className="space-y-10">
      <GoldenHourPanel />

      <SunArc locId={locId} date={date} />

      {/* 30-day light stress timeline — every shoot day's golden/blue windows */}
      <LightStressTimeline />

      <BestWindowsTable
        date={date}
        setDate={setDate}
        locId={locId}
        setLocId={setLocId}
      />
    </div>
  );
}

function SunArc({ locId, date }: { locId: string; date: string }) {
  const { state } = useApp();
  const loc = state.locations.find((l) => l.id === locId);

  const points = useMemo(() => {
    if (!loc) return [];
    const arr: { hour: number; alt: number; az: number }[] = [];
    /* Sample altitude every 15 minutes through the day. */
    const base = new Date(date + 'T00:00:00Z');
    for (let m = 0; m < 24 * 60; m += 15) {
      const d = new Date(base.getTime() + m * 60 * 1000);
      const p = SunCalc.getPosition(d, loc.lat, loc.lng);
      arr.push({
        hour: m / 60,
        alt: p.altitude, // radians
        az: p.azimuth,
      });
    }
    return arr;
  }, [date, loc]);

  if (!loc) return null;

  const W = 760;
  const H = 220;
  const padL = 40;
  const padR = 16;
  const padT = 24;
  const padB = 36;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  /* X axis: hour 0–24. Y axis: altitude in radians; 0 = horizon, π/2 = zenith. */
  const xFor = (h: number) => padL + (h / 24) * innerW;
  const yFor = (alt: number) => {
    /* Map altitude [-π/2, π/2] → [innerH, 0] (so positive alt above the line). */
    const norm = (alt + Math.PI / 2) / Math.PI;
    return padT + innerH - norm * innerH;
  };
  const horizonY = yFor(0);

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.hour).toFixed(1)} ${yFor(p.alt).toFixed(1)}`)
    .join(' ');

  /* Mark sunrise / solar noon / sunset */
  const baseDate = new Date(date + 'T12:00:00Z');
  const t = SunCalc.getTimes(baseDate, loc.lat, loc.lng);
  const events: { label: string; time: Date | null; color: string }[] = [
    { label: 'Sunrise', time: t.sunrise, color: 'var(--color-brass)' },
    { label: 'Noon', time: t.solarNoon, color: 'var(--color-on-paper-muted)' },
    { label: 'Sunset', time: t.sunset, color: 'var(--color-coral)' },
  ];

  return (
    <section>
      <header className="flex items-baseline justify-between mb-3">
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          Sun arc · {loc.label}
        </h3>
        <span className="label-caps text-[color:var(--color-on-paper-faint)] tabular-nums">
          {date}
        </span>
      </header>
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 240 }}>
          {/* Horizon line */}
          <line
            x1={padL}
            x2={padL + innerW}
            y1={horizonY}
            y2={horizonY}
            stroke="rgba(14,30,54,0.3)"
            strokeWidth={0.5}
            strokeDasharray="4 4"
          />
          <text
            x={padL - 6}
            y={horizonY + 3}
            textAnchor="end"
            fontFamily="Inter, sans-serif"
            fontSize={9}
            letterSpacing={1}
            fill="rgba(14,30,54,0.5)"
          >
            horizon
          </text>

          {/* Sun arc */}
          <path
            d={path}
            stroke="var(--color-brass)"
            strokeWidth={1.4}
            fill="none"
          />

          {/* Hour ticks */}
          {[0, 6, 12, 18, 24].map((h) => (
            <g key={h}>
              <line
                x1={xFor(h)}
                x2={xFor(h)}
                y1={padT}
                y2={H - padB}
                stroke="rgba(14,30,54,0.07)"
                strokeWidth={0.5}
              />
              <text
                x={xFor(h)}
                y={H - 14}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize={9}
                letterSpacing={1}
                fill="rgba(14,30,54,0.5)"
              >
                {String(h).padStart(2, '0')}:00
              </text>
            </g>
          ))}

          {/* Events */}
          {events.map((e) => {
            if (!e.time || isNaN(e.time.getTime())) return null;
            const hour =
              e.time.getUTCHours() + e.time.getUTCMinutes() / 60;
            const x = xFor(hour);
            const p = SunCalc.getPosition(e.time, loc.lat, loc.lng);
            const y = yFor(p.altitude);
            return (
              <g key={e.label}>
                <circle cx={x} cy={y} r={3} fill={e.color} />
                <text
                  x={x}
                  y={y - 8}
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize={9}
                  letterSpacing={1}
                  fill="rgba(14,30,54,0.7)"
                >
                  {e.label} · {fmt(e.time)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function BestWindowsTable({
  date,
  setDate,
  locId,
  setLocId,
}: {
  date: string;
  setDate: (s: string) => void;
  locId: string;
  setLocId: (s: string) => void;
}) {
  const { state } = useApp();

  /* For each shoot day, compute golden hour windows for the selected location. */
  const rows = useMemo(() => {
    const loc = state.locations.find((l) => l.id === locId);
    if (!loc) return [];
    return state.shootDays.map((d) => {
      const dt = new Date(d.date + 'T12:00:00Z');
      const t = SunCalc.getTimes(dt, loc.lat, loc.lng);
      return {
        day: d,
        sunrise: t.sunrise,
        goldenEnd: t.goldenHourEnd,
        goldenStart: t.goldenHour,
        sunset: t.sunset,
      };
    });
  }, [state.shootDays, state.locations, locId]);

  return (
    <section>
      <header className="flex items-baseline justify-between mb-3">
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          Best shooting windows · October 2026
        </h3>
        <div className="flex items-baseline gap-3">
          <select
            value={locId}
            onChange={(e) => setLocId(e.target.value)}
            className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-0.5"
          >
            {state.locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-0.5"
          />
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)]">
          Pick an anchorage to compute windows for each shoot day.
        </p>
      ) : (
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
          <header className="grid grid-cols-[100px_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b-[0.5px] border-[color:var(--color-border-paper)] label-caps text-[color:var(--color-on-paper-faint)]">
            <span>Day</span>
            <span>Sunrise</span>
            <span>Golden ends</span>
            <span>Golden starts</span>
            <span>Sunset</span>
          </header>
          {rows.map(({ day, sunrise, goldenEnd, goldenStart, sunset }) => (
            <div
              key={day.id}
              className="grid grid-cols-[100px_1fr_1fr_1fr_1fr] gap-4 px-5 py-2 border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0"
            >
              <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] tabular-nums">
                {fmtDay(day.date)}
              </span>
              <span className="display-italic text-[14px] text-[color:var(--color-brass-deep)] tabular-nums">
                {fmt(sunrise)}
              </span>
              <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] tabular-nums">
                {fmt(goldenEnd)}
              </span>
              <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] tabular-nums">
                {fmt(goldenStart)}
              </span>
              <span className="display-italic text-[14px] text-[color:var(--color-coral-deep)] tabular-nums">
                {fmt(sunset)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function fmtDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
