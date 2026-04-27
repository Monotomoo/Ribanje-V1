import { useMemo } from 'react';
import { Anchor, Compass, Sun, Waves } from 'lucide-react';
import SunCalc from 'suncalc';
import { useApp } from '../../state/AppContext';
import type { Location } from '../../types';
import { EditableNumber } from '../primitives/EditableNumber';
import { EditableText } from '../primitives/EditableText';

/* Sun-arc + Tide Overlay — per anchorage × shoot date.
   Top-down compass view: boat at center oriented to bowHeading, sun positions
   plotted around the rim at sunrise/golden AM end/golden PM start/sunset.
   Right-side table: per-window framing advice (frontlit · sidelit-port ·
   backlit · sidelit-stbd) computed from sun-azimuth-vs-bow-heading.
   Plus: editable tide amplitude + low/high tide times per anchorage. */

const COMPASS_SIZE = 380;
const COMPASS_R = 150;
const COMPASS_CENTER = COMPASS_SIZE / 2;

interface LightWindow {
  key: string;
  label: string;
  time: Date | null;
  azimuth: number | null;     // compass deg (0=N, 90=E, 180=S, 270=W)
  altitude: number | null;    // deg above horizon
  color: string;
}

function azimuthToCompass(rad: number): number {
  /* SunCalc azimuth: 0 = south, positive = west. Convert to compass: 0 = N, clockwise. */
  let deg = (rad * 180) / Math.PI + 180;
  if (deg < 0) deg += 360;
  if (deg >= 360) deg -= 360;
  return deg;
}

interface FramingAdvice {
  label: string;
  hint: string;
  tone: 'success' | 'brass' | 'coral' | 'muted';
}

function framingFromRelative(relativeDeg: number): FramingAdvice {
  /* relativeDeg in 0..360 in boat coordinates: 0 = ahead, 90 = stbd, 180 = aft, 270 = port */
  const d = ((relativeDeg % 360) + 360) % 360;
  if (d <= 45 || d >= 315) {
    return {
      label: 'frontlit',
      hint: 'Sun ahead of bow · flat light · bright eyes but no edge',
      tone: 'muted',
    };
  }
  if (d > 45 && d < 135) {
    return {
      label: 'sidelit · starboard',
      hint: 'Sculptural rim on the right · classic character lighting',
      tone: 'brass',
    };
  }
  if (d >= 135 && d <= 225) {
    return {
      label: 'backlit',
      hint: 'Sun behind boat · golden silhouettes · the cinema move',
      tone: 'success',
    };
  }
  return {
    label: 'sidelit · port',
    hint: 'Sculptural rim on the left · works best with sunrise side',
    tone: 'brass',
  };
}

export function SunArcTideOverlay({
  locId,
  date,
}: {
  locId: string;
  date: string;
}) {
  const { state, dispatch } = useApp();
  const loc = state.locations.find((l) => l.id === locId);

  /* Compute light windows */
  const windows: LightWindow[] = useMemo(() => {
    if (!loc) return [];
    const dt = new Date(date + 'T12:00:00Z');
    const t = SunCalc.getTimes(dt, loc.lat, loc.lng);
    const events: { key: string; label: string; time: Date | null; color: string }[] = [
      { key: 'sunrise',     label: 'Sunrise',          time: t.sunrise,        color: 'var(--color-brass)' },
      { key: 'golden-am',   label: 'Golden AM end',    time: t.goldenHourEnd,  color: 'var(--color-brass-deep)' },
      { key: 'noon',        label: 'Solar noon',       time: t.solarNoon,      color: 'var(--color-on-paper-muted)' },
      { key: 'golden-pm',   label: 'Golden PM start',  time: t.goldenHour,     color: 'var(--color-brass-deep)' },
      { key: 'sunset',      label: 'Sunset',           time: t.sunset,         color: 'var(--color-coral)' },
    ];
    return events.map((e) => {
      if (!e.time || isNaN(e.time.getTime())) {
        return { ...e, azimuth: null, altitude: null };
      }
      const pos = SunCalc.getPosition(e.time, loc.lat, loc.lng);
      return {
        ...e,
        azimuth: azimuthToCompass(pos.azimuth),
        altitude: (pos.altitude * 180) / Math.PI,
      };
    });
  }, [loc, date]);

  if (!loc) {
    return (
      <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)]">
        Pick an anchorage to compute sun-relative-to-boat geometry.
      </p>
    );
  }

  const bowHeading = loc.bowHeadingDeg ?? 0;

  function patchLoc(p: Partial<Location>) {
    dispatch({ type: 'UPDATE_LOCATION', id: loc!.id, patch: p });
  }

  /* Helper: angle (compass deg) to SVG x/y on the rim */
  function rimXY(compassDeg: number, r: number = COMPASS_R) {
    /* North is up = -90° in atan2 terms. compass 0 = top, clockwise. */
    const rad = ((compassDeg - 90) * Math.PI) / 180;
    return {
      x: COMPASS_CENTER + Math.cos(rad) * r,
      y: COMPASS_CENTER + Math.sin(rad) * r,
    };
  }

  return (
    <section>
      <header className="flex items-baseline justify-between mb-3">
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] flex items-baseline gap-2">
          <Compass size={16} className="text-[color:var(--color-brass-deep)]" />
          Sun-arc + tide · {loc.label}
        </h3>
        <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] tabular-nums">
          {date}
        </span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4 lg:gap-5">
        {/* Top-down compass */}
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
          <svg viewBox={`0 0 ${COMPASS_SIZE} ${COMPASS_SIZE}`} className="w-full">
            {/* Outer compass ring */}
            <circle
              cx={COMPASS_CENTER}
              cy={COMPASS_CENTER}
              r={COMPASS_R}
              fill="none"
              stroke="rgba(14,30,54,0.30)"
              strokeWidth={0.75}
            />
            {/* Inner ring (horizon) */}
            <circle
              cx={COMPASS_CENTER}
              cy={COMPASS_CENTER}
              r={COMPASS_R * 0.92}
              fill="none"
              stroke="rgba(14,30,54,0.10)"
              strokeWidth={0.5}
              strokeDasharray="2 4"
            />

            {/* Cardinal markers */}
            {[
              { d: 0, l: 'N' },
              { d: 90, l: 'E' },
              { d: 180, l: 'S' },
              { d: 270, l: 'W' },
            ].map((c) => {
              const inner = rimXY(c.d, COMPASS_R - 8);
              const outer = rimXY(c.d, COMPASS_R + 16);
              return (
                <g key={c.l}>
                  <line
                    x1={inner.x}
                    y1={inner.y}
                    x2={rimXY(c.d, COMPASS_R + 4).x}
                    y2={rimXY(c.d, COMPASS_R + 4).y}
                    stroke="rgba(14,30,54,0.40)"
                    strokeWidth={1}
                  />
                  <text
                    x={outer.x}
                    y={outer.y + 4}
                    textAnchor="middle"
                    fontSize={11}
                    fontFamily="var(--font-sans)"
                    fontWeight={500}
                    letterSpacing="0.08em"
                    fill="rgba(14,30,54,0.55)"
                  >
                    {c.l}
                  </text>
                </g>
              );
            })}

            {/* Minor tick marks every 30° */}
            {Array.from({ length: 12 }).map((_, i) => {
              const d = i * 30;
              if (d % 90 === 0) return null;
              const a = rimXY(d, COMPASS_R);
              const b = rimXY(d, COMPASS_R - 5);
              return (
                <line
                  key={d}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="rgba(14,30,54,0.20)"
                  strokeWidth={0.5}
                />
              );
            })}

            {/* Sun arc — connect sunrise → noon → sunset on the rim with a dashed line */}
            {(() => {
              const valid = windows.filter((w) => w.azimuth !== null);
              if (valid.length < 2) return null;
              const path = valid
                .map((w, i) => {
                  const { x, y } = rimXY(w.azimuth!, COMPASS_R);
                  return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                })
                .join(' ');
              return (
                <path
                  d={path}
                  fill="none"
                  stroke="rgba(201,169,97,0.50)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              );
            })()}

            {/* Sun markers + labels */}
            {windows.map((w) => {
              if (w.azimuth === null) return null;
              const dot = rimXY(w.azimuth, COMPASS_R);
              const label = rimXY(w.azimuth, COMPASS_R - 22);
              const altPct = w.altitude !== null ? Math.max(0, w.altitude) / 90 : 0;
              return (
                <g key={w.key}>
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={5 + altPct * 4}
                    fill={w.color}
                    stroke="var(--color-paper-light)"
                    strokeWidth={1.5}
                  />
                  <text
                    x={label.x}
                    y={label.y + 3}
                    textAnchor="middle"
                    fontSize={9}
                    fontFamily="var(--font-sans)"
                    letterSpacing="0.06em"
                    fill="rgba(14,30,54,0.70)"
                  >
                    {w.time
                      ? w.time.toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </text>
                </g>
              );
            })}

            {/* Boat at center, oriented to bow heading */}
            <g transform={`translate(${COMPASS_CENTER} ${COMPASS_CENTER}) rotate(${bowHeading})`}>
              {/* Boat hull — pointed up = bow */}
              <path
                d="M 0 -22 L 7 -8 L 7 18 L -7 18 L -7 -8 Z"
                fill="rgba(14,30,54,0.85)"
                stroke="var(--color-brass)"
                strokeWidth={1}
              />
              {/* Bow arrow */}
              <path
                d="M 0 -28 L 4 -22 L -4 -22 Z"
                fill="var(--color-brass)"
              />
              {/* Mast / center mark */}
              <circle cx={0} cy={0} r={2} fill="var(--color-brass)" />
            </g>

            {/* Bow heading label */}
            <text
              x={COMPASS_CENTER}
              y={COMPASS_CENTER + COMPASS_R + 36}
              textAnchor="middle"
              fontSize={10}
              fontFamily="var(--font-sans)"
              letterSpacing="0.10em"
              fill="rgba(14,30,54,0.55)"
            >
              BOW HEADING · {bowHeading.toFixed(0)}°
            </text>
          </svg>

          {/* Bow heading slider */}
          <div className="mt-3 px-2">
            <div className="flex items-baseline justify-between mb-1">
              <span className="label-caps text-[color:var(--color-brass-deep)]">
                bow heading
              </span>
              <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums">
                {bowHeading.toFixed(0)}°
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={359}
              step={1}
              value={bowHeading}
              onChange={(e) =>
                patchLoc({ bowHeadingDeg: parseInt(e.target.value, 10) })
              }
              className="w-full"
            />
            <div className="flex justify-between prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-0.5">
              <span>0° N</span>
              <span>90° E</span>
              <span>180° S</span>
              <span>270° W</span>
            </div>
          </div>
        </div>

        {/* Right rail — windows + tide */}
        <div className="space-y-3">
          {/* Per-window framing table */}
          <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
            <header className="px-4 py-2 border-b-[0.5px] border-[color:var(--color-border-brass)]/40 grid grid-cols-[110px_70px_70px_120px_1fr] gap-3 label-caps text-[color:var(--color-on-paper-faint)]">
              <span>window</span>
              <span className="text-right">azimuth</span>
              <span className="text-right">altitude</span>
              <span>framing</span>
              <span>advice</span>
            </header>
            <ul>
              {windows.map((w) => {
                if (w.azimuth === null || w.altitude === null) {
                  return (
                    <li
                      key={w.key}
                      className="grid grid-cols-[110px_70px_70px_120px_1fr] gap-3 px-4 py-2 border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0 items-baseline opacity-50"
                    >
                      <span className="display-italic text-[13px] text-[color:var(--color-on-paper)]">
                        {w.label}
                      </span>
                      <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] text-right">—</span>
                      <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] text-right">—</span>
                      <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">no light</span>
                      <span></span>
                    </li>
                  );
                }
                const relative = (w.azimuth - bowHeading + 360) % 360;
                const advice = framingFromRelative(relative);
                const adviceColor =
                  advice.tone === 'success' ? 'text-[color:var(--color-success)]'
                  : advice.tone === 'brass' ? 'text-[color:var(--color-brass-deep)]'
                  : advice.tone === 'coral' ? 'text-[color:var(--color-coral-deep)]'
                  : 'text-[color:var(--color-on-paper-muted)]';
                return (
                  <li
                    key={w.key}
                    className="grid grid-cols-[110px_70px_70px_120px_1fr] gap-3 px-4 py-2 border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0 items-baseline"
                  >
                    <span className="display-italic text-[13px] text-[color:var(--color-on-paper)]">
                      {w.label}
                      <span className="ml-2 prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums">
                        {w.time?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                    <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums text-right">
                      {w.azimuth.toFixed(0)}°
                    </span>
                    <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums text-right">
                      {w.altitude.toFixed(0)}°
                    </span>
                    <span className={`label-caps tracking-[0.10em] text-[10px] ${adviceColor}`}>
                      {advice.label}
                    </span>
                    <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] leading-tight">
                      {advice.hint}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Tide info */}
          <div className="bg-[color:var(--color-paper-light)] border-l-2 border-[color:var(--color-dock)] px-4 py-3">
            <div className="flex items-baseline gap-2 mb-2">
              <Waves size={11} className="text-[color:var(--color-dock-deep)]" />
              <span className="label-caps text-[color:var(--color-dock-deep)]">
                tide · {loc.label}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mb-0.5">
                  amplitude (m)
                </div>
                <EditableNumber
                  value={loc.tideAmplitudeM ?? 0}
                  onChange={(v) => patchLoc({ tideAmplitudeM: v })}
                  size="sm"
                  align="left"
                  suffix="m"
                />
              </div>
              <div>
                <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mb-0.5">
                  low tide
                </div>
                <EditableText
                  value={loc.tideLowTime ?? ''}
                  onChange={(v) => patchLoc({ tideLowTime: v || undefined })}
                  placeholder="06:30"
                  className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums"
                />
              </div>
              <div>
                <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mb-0.5">
                  high tide
                </div>
                <EditableText
                  value={loc.tideHighTime ?? ''}
                  onChange={(v) => patchLoc({ tideHighTime: v || undefined })}
                  placeholder="13:15"
                  className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums"
                />
              </div>
            </div>
            {loc.tideAmplitudeM !== undefined && loc.tideAmplitudeM > 0 && (
              <TideWavePreview amplitude={loc.tideAmplitudeM} />
            )}
            <p className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-2 leading-tight">
              Adriatic tides are small (~30cm typical, up to ~1m at the head). Times are
              approximate and shift daily — record the local average when on-site.
            </p>
          </div>

          {/* Anchorage notes for the day */}
          <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-2.5">
            <div className="flex items-baseline gap-2 mb-1">
              <Anchor size={10} className="text-[color:var(--color-brass-deep)]" />
              <span className="label-caps text-[color:var(--color-brass-deep)]">
                golden hour notes
              </span>
            </div>
            <EditableText
              value={loc.goldenHourNotes ?? ''}
              onChange={(v) => patchLoc({ goldenHourNotes: v || undefined })}
              placeholder="What does the light do at this anchorage? Best windows? Tom's notes from scouting…"
              multiline
              rows={2}
              className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] block w-full leading-relaxed"
            />
          </div>
        </div>
      </div>

      <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] mt-3 leading-relaxed max-w-[800px]">
        Sun position from SunCalc · framing computed as <code className="font-sans not-italic">(sun_azimuth − bow_heading + 360) mod 360</code>
        {' '}in boat coordinates: 0° = ahead · 90° = starboard · 180° = aft (backlit) · 270° = port. Adjust bow heading to predict
        anchor swing for tomorrow's wind direction.
      </p>
    </section>
  );
}

function TideWavePreview({ amplitude }: { amplitude: number }) {
  const W = 320;
  const H = 40;
  const padX = 8;
  const padY = 6;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const points: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = padX + (i / 60) * innerW;
    /* 12-hour cycle approximation */
    const phase = (i / 60) * 2 * Math.PI;
    const y = padY + innerH / 2 + (Math.sin(phase) * innerH) / 2;
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  void amplitude; // not currently used in path math; just labeling
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-2" style={{ maxHeight: 50 }}>
      <line
        x1={padX}
        x2={W - padX}
        y1={H / 2}
        y2={H / 2}
        stroke="rgba(91,163,204,0.20)"
        strokeWidth={0.5}
      />
      <path d={points.join(' ')} fill="none" stroke="var(--color-dock)" strokeWidth={1.25} />
    </svg>
  );
}

/* unused-import hint */
export const _icons = { Sun };
