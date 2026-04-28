import { useEffect, useMemo, useState } from 'react';
import { Sun, Wind, Waves, Droplets, Cloud, RefreshCcw, Plus } from 'lucide-react';
import SunCalc from 'suncalc';
import { useApp } from '../../state/AppContext';
import type { ConditionsForecast, Location } from '../../types';

/* ---------- Live Conditions Feed (Phase 12) ----------

   THE shoot-day surface. Horizontal hourly strip 04:00 → 22:00 with five
   readable lanes:

     • Sun arc       elevation curve + golden-hour bands (computed from lat/lng)
     • Wind          knots + direction per hour (manual or pre-cached forecast)
     • Tide          metre curve + low/high markers (from Location seed)
     • Sea state     wave height
     • Cloud / rain  cloud cover + precip chance

   A vertical brass "now" cursor ticks across the strip during the day so
   you can see at-a-glance: where the light is, where the sea is.

   Empty state: a one-click "compute sun-only" button auto-seeds the sun
   lane (since lat/lng + date is enough). Wind/tide/sea are paste-in or
   per-hour edit. All cached locally so it works offline at sea.

   Used in:
     · DailyPlan         top-of-day strip for the active shoot day
     · LocationDrawer    per-location detail
     · LiveRollCockpit   compact mode (sun + tide only) */

const HOURS = Array.from({ length: 19 }, (_, i) => i + 4); // 04..22
const COL_WIDTH = 36;
const STRIP_HEIGHT = 60;
const PADDING_LEFT = 84;

interface Props {
  date: string;          // ISO YYYY-MM-DD
  locationId?: string;
  compact?: boolean;     // hide cloud + sea-state lanes if true
}

export function LiveConditionsFeed({ date, locationId, compact = false }: Props) {
  const { state, dispatch } = useApp();
  const [now, setNow] = useState<Date>(new Date());

  /* Tick the "now" cursor every minute. */
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const location = useMemo<Location | undefined>(
    () => (locationId ? state.locations.find((l) => l.id === locationId) : undefined),
    [state.locations, locationId]
  );

  const forecasts = useMemo<ConditionsForecast[]>(
    () =>
      state.conditionsForecasts.filter(
        (c) => c.date === date && (!locationId || c.locationId === locationId)
      ),
    [state.conditionsForecasts, date, locationId]
  );

  /* Build a per-hour map for fast lookup. */
  const byHour = useMemo(() => {
    const m = new Map<number, ConditionsForecast>();
    forecasts.forEach((f) => m.set(f.hour, f));
    return m;
  }, [forecasts]);

  /* Sun arc computed from location lat/lng on the displayed date. */
  const sunData = useMemo(() => {
    if (!location) return null;
    const baseDate = parseISODate(date);
    return HOURS.map((h) => {
      const d = new Date(baseDate);
      d.setHours(h, 0, 0, 0);
      const pos = SunCalc.getPosition(d, location.lat, location.lng);
      const altDeg = (pos.altitude * 180) / Math.PI;
      const azDeg = ((pos.azimuth * 180) / Math.PI + 180 + 360) % 360;
      return { hour: h, altDeg, azDeg };
    });
  }, [location, date]);

  /* Tide curve — sinusoidal interpolation between high & low tide. */
  const tideData = useMemo(() => {
    if (!location) return null;
    const amp = location.tideAmplitudeM ?? 0.3;
    const lowH = parseHHMM(location.tideLowTime);
    const highH = parseHHMM(location.tideHighTime);
    if (lowH === null || highH === null) return null;
    /* Half-period in hours = |high - low| (taking shortest direction). */
    const diff = Math.abs(highH - lowH);
    const halfPeriod = Math.min(diff, 12 - diff) || 6;
    const fullPeriod = halfPeriod * 2;
    return HOURS.map((h) => {
      /* Distance from low tide in hours, modulo full period. */
      const fromLow = ((h - lowH) % fullPeriod + fullPeriod) % fullPeriod;
      /* 0 at low, +amp at high (halfPeriod hours later), back to 0 at fullPeriod. */
      const phase = (fromLow / fullPeriod) * 2 * Math.PI;
      const tideM = (amp / 2) * (1 - Math.cos(phase));
      return { hour: h, tideM };
    });
  }, [location]);

  const isToday = isoDateMatchesNow(date, now);
  const nowFloat = isToday ? now.getHours() + now.getMinutes() / 60 : null;

  function generateSunForecasts() {
    if (!locationId || !sunData) return;
    const generated: ConditionsForecast[] = sunData.map((s) => ({
      id: `cf-${date}-${locationId}-${s.hour}`,
      date,
      locationId,
      hour: s.hour,
      cloudPct: undefined,
      windKnots: undefined,
      tideM: tideData?.find((t) => t.hour === s.hour)?.tideM,
      source: 'manual',
      fetchedAt: new Date().toISOString(),
    }));
    dispatch({
      type: 'BULK_UPSERT_CONDITIONS',
      date,
      locationId,
      forecasts: generated,
    });
  }

  function patchHour(hour: number, patch: Partial<ConditionsForecast>) {
    if (!locationId) return;
    const existing = byHour.get(hour);
    if (existing) {
      dispatch({ type: 'UPDATE_CONDITIONS', id: existing.id, patch });
    } else {
      dispatch({
        type: 'ADD_CONDITIONS',
        forecast: {
          id: `cf-${date}-${locationId}-${hour}-${Math.random().toString(36).slice(2, 6)}`,
          date,
          locationId,
          hour,
          source: 'manual',
          fetchedAt: new Date().toISOString(),
          ...patch,
        },
      });
    }
  }

  if (!location && locationId) {
    return (
      <ConditionsCard
        title="Live conditions"
        subtitle="No location selected"
        empty
      />
    );
  }

  const hasAny = forecasts.length > 0;
  const lanes = compact
    ? (['sun', 'wind', 'tide'] as const)
    : (['sun', 'wind', 'tide', 'sea', 'cloud'] as const);

  const stripWidth = PADDING_LEFT + HOURS.length * COL_WIDTH + 12;

  return (
    <ConditionsCard
      title="Live conditions"
      subtitle={
        location
          ? `${location.label} · ${formatDate(date)}`
          : formatDate(date)
      }
      action={
        !hasAny && locationId && sunData ? (
          <button
            type="button"
            onClick={generateSunForecasts}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[color:var(--color-brass)] text-[color:var(--color-paper)] text-[11px] hover:bg-[color:var(--color-brass-deep)] transition-colors"
          >
            <RefreshCcw size={11} />
            <span className="prose-body italic">seed sun + tide</span>
          </button>
        ) : null
      }
    >
      <div className="overflow-x-auto -mx-2 px-2">
        <svg
          width={stripWidth}
          height={lanes.length * STRIP_HEIGHT + 28}
          className="block min-w-full"
        >
          {/* hour headers */}
          {HOURS.map((h, i) => {
            const x = PADDING_LEFT + i * COL_WIDTH + COL_WIDTH / 2;
            return (
              <text
                key={`hh-${h}`}
                x={x}
                y={14}
                textAnchor="middle"
                className="text-[9px] tabular-nums fill-[color:var(--color-on-paper-muted)]"
              >
                {h.toString().padStart(2, '0')}
              </text>
            );
          })}

          {/* lanes */}
          {lanes.map((lane, laneIdx) => {
            const yTop = 24 + laneIdx * STRIP_HEIGHT;
            return (
              <g key={lane}>
                {/* lane label */}
                <foreignObject x={4} y={yTop + 4} width={PADDING_LEFT - 12} height={STRIP_HEIGHT - 8}>
                  <div className="flex items-start gap-1.5 pt-1">
                    <LaneIcon lane={lane} />
                    <div className="display-italic text-[12px] text-[color:var(--color-on-paper)] leading-tight">
                      {LANE_LABELS[lane]}
                    </div>
                  </div>
                </foreignObject>

                {/* lane background */}
                <rect
                  x={PADDING_LEFT}
                  y={yTop}
                  width={HOURS.length * COL_WIDTH}
                  height={STRIP_HEIGHT - 8}
                  fill="var(--color-paper-deep)"
                  opacity={0.4}
                />

                {/* hour gridlines */}
                {HOURS.map((_, i) => (
                  <line
                    key={`g-${lane}-${i}`}
                    x1={PADDING_LEFT + i * COL_WIDTH}
                    x2={PADDING_LEFT + i * COL_WIDTH}
                    y1={yTop}
                    y2={yTop + STRIP_HEIGHT - 8}
                    stroke="var(--color-border-paper)"
                    strokeWidth={0.5}
                    opacity={0.5}
                  />
                ))}

                {/* lane content */}
                {lane === 'sun' && sunData && (
                  <SunLane data={sunData} yTop={yTop} />
                )}
                {lane === 'wind' && (
                  <WindLane forecasts={forecasts} byHour={byHour} yTop={yTop} />
                )}
                {lane === 'tide' && tideData && (
                  <TideLane data={tideData} yTop={yTop} amp={location?.tideAmplitudeM ?? 0.3} />
                )}
                {lane === 'sea' && (
                  <SeaLane byHour={byHour} yTop={yTop} />
                )}
                {lane === 'cloud' && (
                  <CloudLane byHour={byHour} yTop={yTop} />
                )}
              </g>
            );
          })}

          {/* now cursor */}
          {nowFloat !== null && nowFloat >= 4 && nowFloat <= 22 && (
            <g>
              <line
                x1={PADDING_LEFT + (nowFloat - 4) * COL_WIDTH}
                x2={PADDING_LEFT + (nowFloat - 4) * COL_WIDTH}
                y1={20}
                y2={24 + lanes.length * STRIP_HEIGHT - 8}
                stroke="var(--color-brass)"
                strokeWidth={1.5}
              />
              <text
                x={PADDING_LEFT + (nowFloat - 4) * COL_WIDTH}
                y={18}
                textAnchor="middle"
                className="text-[9px] fill-[color:var(--color-brass)] tabular-nums display-italic"
              >
                now
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Quick edit row — visible only when not compact */}
      {!compact && hasAny && locationId && (
        <QuickEditGrid
          forecasts={forecasts}
          onPatch={patchHour}
        />
      )}

      {!hasAny && (
        <div className="mt-3 prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          Empty forecast.
          {locationId && sunData
            ? ' Click "seed sun + tide" to compute the light + tide curves from this location.'
            : ' Select a location to compute sun + tide automatically.'}
        </div>
      )}
    </ConditionsCard>
  );
}

/* ---------- Lane renderers ---------- */

const LANE_LABELS = {
  sun: 'sun arc',
  wind: 'wind',
  tide: 'tide',
  sea: 'sea',
  cloud: 'cloud · rain',
} as const;

function LaneIcon({ lane }: { lane: keyof typeof LANE_LABELS }) {
  const props = { size: 12, className: 'text-[color:var(--color-on-paper-muted)] mt-1 shrink-0' };
  switch (lane) {
    case 'sun':   return <Sun {...props} />;
    case 'wind':  return <Wind {...props} />;
    case 'tide':  return <Waves {...props} />;
    case 'sea':   return <Droplets {...props} />;
    case 'cloud': return <Cloud {...props} />;
  }
}

function SunLane({
  data,
  yTop,
}: {
  data: { hour: number; altDeg: number; azDeg: number }[];
  yTop: number;
}) {
  const laneH = STRIP_HEIGHT - 8;
  /* Map alt: -10°..90° → bottom..top */
  const yFor = (alt: number) => yTop + laneH - ((Math.max(-10, Math.min(90, alt)) + 10) / 100) * laneH;
  const points = data.map((d, i) => {
    const x = PADDING_LEFT + i * COL_WIDTH + COL_WIDTH / 2;
    return `${x},${yFor(d.altDeg)}`;
  });
  /* Golden bands: 0–6° altitude. */
  const goldenIndices = data
    .map((d, i) => (d.altDeg >= -2 && d.altDeg <= 7 ? i : -1))
    .filter((i) => i !== -1);
  return (
    <g>
      {/* horizon line */}
      <line
        x1={PADDING_LEFT}
        x2={PADDING_LEFT + HOURS.length * COL_WIDTH}
        y1={yFor(0)}
        y2={yFor(0)}
        stroke="var(--color-border-paper)"
        strokeWidth={0.5}
        strokeDasharray="2 2"
      />
      {/* golden hour bands */}
      {goldenIndices.map((i) => (
        <rect
          key={`gh-${i}`}
          x={PADDING_LEFT + i * COL_WIDTH}
          y={yTop}
          width={COL_WIDTH}
          height={laneH}
          fill="var(--color-brass)"
          opacity={0.18}
        />
      ))}
      {/* sun curve */}
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="var(--color-brass-deep)"
        strokeWidth={1.5}
      />
      {/* sun dots */}
      {data.map((d, i) => (
        <circle
          key={`sd-${i}`}
          cx={PADDING_LEFT + i * COL_WIDTH + COL_WIDTH / 2}
          cy={yFor(d.altDeg)}
          r={d.altDeg > 0 ? 2 : 1}
          fill={d.altDeg > 0 ? 'var(--color-brass-deep)' : 'var(--color-on-paper-muted)'}
          opacity={d.altDeg > -10 ? 1 : 0.3}
        />
      ))}
    </g>
  );
}

function WindLane({
  forecasts,
  byHour,
  yTop,
}: {
  forecasts: ConditionsForecast[];
  byHour: Map<number, ConditionsForecast>;
  yTop: number;
}) {
  const laneH = STRIP_HEIGHT - 8;
  const max = Math.max(20, ...forecasts.map((f) => f.windKnots ?? 0).concat(forecasts.map((f) => f.gustKnots ?? 0)));
  return (
    <g>
      {HOURS.map((h, i) => {
        const f = byHour.get(h);
        const wind = f?.windKnots;
        const gust = f?.gustKnots;
        const x = PADDING_LEFT + i * COL_WIDTH;
        if (wind == null) {
          return null;
        }
        const barH = (wind / max) * laneH;
        const gustH = gust ? (gust / max) * laneH : 0;
        const tone =
          wind >= 22 ? 'var(--color-coral-deep)' :
          wind >= 14 ? 'var(--color-brass-deep)' :
          'var(--color-on-paper)';
        return (
          <g key={`w-${h}`}>
            {gust && gust > wind && (
              <rect
                x={x + 4}
                y={yTop + laneH - gustH}
                width={COL_WIDTH - 8}
                height={gustH}
                fill={tone}
                opacity={0.2}
              />
            )}
            <rect
              x={x + 6}
              y={yTop + laneH - barH}
              width={COL_WIDTH - 12}
              height={barH}
              fill={tone}
              opacity={0.7}
            />
            <text
              x={x + COL_WIDTH / 2}
              y={yTop + laneH - barH - 2}
              textAnchor="middle"
              className="text-[9px] tabular-nums fill-[color:var(--color-on-paper)]"
            >
              {Math.round(wind)}
            </text>
            {f?.windDir && (
              <text
                x={x + COL_WIDTH / 2}
                y={yTop + laneH - 3}
                textAnchor="middle"
                className="text-[8px] fill-[color:var(--color-on-paper-muted)]"
              >
                {f.windDir}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function TideLane({
  data,
  yTop,
  amp,
}: {
  data: { hour: number; tideM: number }[];
  yTop: number;
  amp: number;
}) {
  const laneH = STRIP_HEIGHT - 8;
  const yFor = (m: number) => yTop + laneH - (m / amp) * (laneH - 6) - 3;
  const points = data.map((d, i) => {
    const x = PADDING_LEFT + i * COL_WIDTH + COL_WIDTH / 2;
    return `${x},${yFor(d.tideM)}`;
  });
  /* Find local extrema for low/high markers. */
  const markers: { hour: number; kind: 'high' | 'low'; m: number }[] = [];
  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1].tideM;
    const cur = data[i].tideM;
    const nxt = data[i + 1].tideM;
    if (cur > prev && cur > nxt) markers.push({ hour: data[i].hour, kind: 'high', m: cur });
    if (cur < prev && cur < nxt) markers.push({ hour: data[i].hour, kind: 'low', m: cur });
  }
  return (
    <g>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="var(--color-on-paper)"
        strokeWidth={1.2}
        opacity={0.7}
      />
      {markers.map((m, idx) => {
        const i = HOURS.indexOf(m.hour);
        if (i < 0) return null;
        const x = PADDING_LEFT + i * COL_WIDTH + COL_WIDTH / 2;
        return (
          <g key={`tm-${idx}`}>
            <circle
              cx={x}
              cy={yFor(m.m)}
              r={3}
              fill={m.kind === 'high' ? 'var(--color-on-paper)' : 'var(--color-on-paper-muted)'}
            />
            <text
              x={x}
              y={yFor(m.m) + (m.kind === 'high' ? -7 : 12)}
              textAnchor="middle"
              className="text-[8px] fill-[color:var(--color-on-paper-muted)] display-italic"
            >
              {m.kind} · {m.m.toFixed(1)}m
            </text>
          </g>
        );
      })}
    </g>
  );
}

function SeaLane({
  byHour,
  yTop,
}: {
  byHour: Map<number, ConditionsForecast>;
  yTop: number;
}) {
  const laneH = STRIP_HEIGHT - 8;
  const max = Math.max(2, ...Array.from(byHour.values()).map((f) => f.seaStateM ?? 0));
  return (
    <g>
      {HOURS.map((h, i) => {
        const sea = byHour.get(h)?.seaStateM;
        if (sea == null) return null;
        const x = PADDING_LEFT + i * COL_WIDTH;
        const barH = (sea / max) * laneH;
        const tone =
          sea >= 1.5 ? 'var(--color-coral-deep)' :
          sea >= 0.8 ? 'var(--color-brass-deep)' :
          'var(--color-on-paper)';
        return (
          <g key={`s-${h}`}>
            <rect
              x={x + 4}
              y={yTop + laneH - barH}
              width={COL_WIDTH - 8}
              height={barH}
              fill={tone}
              opacity={0.5}
            />
            <text
              x={x + COL_WIDTH / 2}
              y={yTop + laneH - 3}
              textAnchor="middle"
              className="text-[9px] tabular-nums fill-[color:var(--color-on-paper)]"
            >
              {sea.toFixed(1)}m
            </text>
          </g>
        );
      })}
    </g>
  );
}

function CloudLane({
  byHour,
  yTop,
}: {
  byHour: Map<number, ConditionsForecast>;
  yTop: number;
}) {
  const laneH = STRIP_HEIGHT - 8;
  return (
    <g>
      {HOURS.map((h, i) => {
        const f = byHour.get(h);
        if (!f) return null;
        const cloud = f.cloudPct;
        const precip = f.precipChance;
        const x = PADDING_LEFT + i * COL_WIDTH;
        return (
          <g key={`c-${h}`}>
            {cloud != null && (
              <rect
                x={x + 4}
                y={yTop}
                width={COL_WIDTH - 8}
                height={(cloud / 100) * laneH}
                fill="var(--color-on-paper-muted)"
                opacity={0.3}
              />
            )}
            {precip != null && precip > 0 && (
              <rect
                x={x + 6}
                y={yTop + laneH - (precip / 100) * laneH}
                width={COL_WIDTH - 12}
                height={(precip / 100) * laneH}
                fill="var(--color-coral-deep)"
                opacity={0.4}
              />
            )}
            {(cloud != null || precip != null) && (
              <text
                x={x + COL_WIDTH / 2}
                y={yTop + laneH - 3}
                textAnchor="middle"
                className="text-[8px] tabular-nums fill-[color:var(--color-on-paper)]"
              >
                {cloud != null ? `${cloud}%` : ''}
                {precip ? ` · ${precip}` : ''}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/* ---------- Quick-edit grid ---------- */

function QuickEditGrid({
  forecasts,
  onPatch,
}: {
  forecasts: ConditionsForecast[];
  onPatch: (hour: number, patch: Partial<ConditionsForecast>) => void;
}) {
  const [openHour, setOpenHour] = useState<number | null>(null);
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-1.5">
        {HOURS.map((h) => {
          const f = forecasts.find((c) => c.hour === h);
          const filled = f && (f.windKnots != null || f.seaStateM != null || f.cloudPct != null);
          return (
            <button
              key={h}
              type="button"
              onClick={() => setOpenHour(openHour === h ? null : h)}
              className={`px-2 py-1 rounded-[3px] text-[10px] tabular-nums display-italic transition-colors ${
                filled
                  ? 'bg-[color:var(--color-brass)]/15 text-[color:var(--color-on-paper)]'
                  : 'bg-[color:var(--color-paper-deep)] text-[color:var(--color-on-paper-muted)]'
              } ${openHour === h ? 'ring-1 ring-[color:var(--color-brass)]' : ''}`}
            >
              {h.toString().padStart(2, '0')}
            </button>
          );
        })}
      </div>
      {openHour != null && (
        <HourEditor
          hour={openHour}
          forecast={forecasts.find((f) => f.hour === openHour)}
          onPatch={(patch) => onPatch(openHour, patch)}
        />
      )}
    </div>
  );
}

function HourEditor({
  hour,
  forecast,
  onPatch,
}: {
  hour: number;
  forecast?: ConditionsForecast;
  onPatch: (patch: Partial<ConditionsForecast>) => void;
}) {
  return (
    <div className="mt-2 p-3 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)]">
      <div className="display-italic text-[13px] text-[color:var(--color-on-paper)] mb-2">
        {hour.toString().padStart(2, '0')}:00
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <NumField
          label="wind kn"
          value={forecast?.windKnots}
          onChange={(v) => onPatch({ windKnots: v })}
        />
        <TextField
          label="wind dir"
          value={forecast?.windDir}
          onChange={(v) => onPatch({ windDir: v })}
          placeholder="WSW"
        />
        <NumField
          label="gust kn"
          value={forecast?.gustKnots}
          onChange={(v) => onPatch({ gustKnots: v })}
        />
        <NumField
          label="sea m"
          value={forecast?.seaStateM}
          onChange={(v) => onPatch({ seaStateM: v })}
          step={0.1}
        />
        <NumField
          label="cloud %"
          value={forecast?.cloudPct}
          onChange={(v) => onPatch({ cloudPct: v })}
        />
        <NumField
          label="precip %"
          value={forecast?.precipChance}
          onChange={(v) => onPatch({ precipChance: v })}
        />
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  step?: number;
}) {
  return (
    <label className="block">
      <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
        {label}
      </div>
      <input
        type="number"
        step={step}
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? undefined : Number(v));
        }}
        className="w-full px-2 py-1 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
        {label}
      </div>
      <input
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? undefined : v);
        }}
        className="w-full px-2 py-1 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
      />
    </label>
  );
}

/* ---------- Card chrome ---------- */

function ConditionsCard({
  title,
  subtitle,
  action,
  children,
  empty,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
      <header className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="display-italic text-[16px] text-[color:var(--color-on-paper)] leading-tight">
            {title}
          </h3>
          {subtitle && (
            <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
        {action}
      </header>
      {empty ? (
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] py-2">
          Pick a location to load conditions.
        </div>
      ) : (
        children
      )}
    </section>
  );
}

/* ---------- helpers ---------- */

function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

function parseHHMM(s?: string): number | null {
  if (!s) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  return h + min / 60;
}

function isoDateMatchesNow(iso: string, now: Date): boolean {
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  return iso === `${y}-${m}-${d}`;
}

function formatDate(iso: string): string {
  const d = parseISODate(iso);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const _unusedPlus = Plus; /* reserved for future quick-add hour entry */
/* eslint-enable @typescript-eslint/no-unused-vars */
