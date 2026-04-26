import { useMemo } from 'react';
import { Sun } from 'lucide-react';
import SunCalc from 'suncalc';
import { useApp } from '../../state/AppContext';
import { EPISODE_COLORS } from '../map/AdriaticChart';

/* 30-day Light Stress Timeline — every shoot day's golden/blue/sun windows
   on a single horizontal stripe. Tom can scan: which days have what light,
   and where the must-shoot scenes should fit. Each day → mini sun-arc bar. */

interface DayLightData {
  dayIdx: number;
  date: string;
  episodeId?: string;
  anchorageLabel: string;
  sunriseHour: number | null;
  goldenAmEndHour: number | null;
  sunsetHour: number | null;
  goldenPmStartHour: number | null;
  blueEveningEndHour: number | null;
  blueMorningStartHour: number | null;
  totalDaylightHours: number;
}

const STRIPE_W = 1100;
const ROW_H = 36;
const HOUR_LABELS = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

function hoursOfDay(d: Date | null | undefined): number | null {
  if (!d || isNaN(d.getTime())) return null;
  return d.getUTCHours() + d.getUTCMinutes() / 60;
}

export function LightStressTimeline() {
  const { state } = useApp();

  const sortedDays = useMemo(
    () => [...state.shootDays].sort((a, b) => a.date.localeCompare(b.date)),
    [state.shootDays]
  );

  const lightData: DayLightData[] = useMemo(() => {
    return sortedDays.map((d, idx) => {
      const loc = d.anchorageId
        ? state.locations.find((l) => l.id === d.anchorageId)
        : state.locations[0];
      if (!loc) {
        return {
          dayIdx: idx,
          date: d.date,
          episodeId: d.episodeId,
          anchorageLabel: '—',
          sunriseHour: null,
          goldenAmEndHour: null,
          sunsetHour: null,
          goldenPmStartHour: null,
          blueEveningEndHour: null,
          blueMorningStartHour: null,
          totalDaylightHours: 0,
        };
      }
      const dt = new Date(d.date + 'T12:00:00Z');
      const t = SunCalc.getTimes(dt, loc.lat, loc.lng);
      const sunriseH = hoursOfDay(t.sunrise);
      const sunsetH = hoursOfDay(t.sunset);
      const goldenEndH = hoursOfDay(t.goldenHourEnd);
      const goldenStartH = hoursOfDay(t.goldenHour);
      const dawnH = hoursOfDay(t.dawn);
      const duskH = hoursOfDay(t.dusk);
      return {
        dayIdx: idx,
        date: d.date,
        episodeId: d.episodeId,
        anchorageLabel: loc.label,
        sunriseHour: sunriseH,
        goldenAmEndHour: goldenEndH,
        sunsetHour: sunsetH,
        goldenPmStartHour: goldenStartH,
        blueEveningEndHour: duskH,
        blueMorningStartHour: dawnH,
        totalDaylightHours: sunriseH !== null && sunsetH !== null ? sunsetH - sunriseH : 0,
      };
    });
  }, [sortedDays, state.locations]);

  if (lightData.length === 0) {
    return null;
  }

  /* Find the absolute earliest dawn and latest dusk to size axis */
  const dayMin = 4;
  const dayMax = 22;

  return (
    <section>
      <header className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] flex items-baseline gap-2">
            <Sun size={16} className="text-[color:var(--color-brass-deep)]" />
            Light stress timeline · {lightData.length} shoot days
          </h3>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Every shoot day's blue · golden · daylight windows in one stripe. Plan must-shoots
            against the light you'll actually have.
          </p>
        </div>
        <div className="flex items-baseline gap-3 prose-body italic text-[10px]">
          <LegendChip color="rgba(91,163,204,0.40)" label="blue hour" />
          <LegendChip color="rgba(201,169,97,0.55)" label="golden" />
          <LegendChip color="rgba(244,241,234,0.85)" label="daylight" />
        </div>
      </header>

      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
        {/* Hour axis */}
        <div className="relative h-[28px] px-[112px] border-b-[0.5px] border-[color:var(--color-border-paper)] bg-[color:var(--color-paper)]">
          {HOUR_LABELS.map((h) => {
            const xPct = ((h - dayMin) / (dayMax - dayMin)) * 100;
            return (
              <span
                key={h}
                className="absolute top-1.5 label-caps tracking-[0.10em] text-[9px] text-[color:var(--color-on-paper-faint)] tabular-nums"
                style={{ left: `${xPct}%` }}
              >
                {String(h).padStart(2, '0')}:00
              </span>
            );
          })}
        </div>

        {/* Day rows */}
        <ul>
          {lightData.map((d) => (
            <DayRow key={d.dayIdx} data={d} dayMin={dayMin} dayMax={dayMax} />
          ))}
        </ul>
      </div>

      <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] mt-3 leading-relaxed max-w-[800px]">
        Computed from anchorage GPS + date via SunCalc. The narrowest daylight window of the
        shoot is your tightest constraint — anchor the must-shoot golden-hour scenes there.
        Days with anchorages near the same latitude have nearly identical light geometry.
      </p>
    </section>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-baseline gap-1 text-[color:var(--color-on-paper-muted)]">
      <span
        className="inline-block w-3 h-2 rounded-[1px]"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function DayRow({
  data: d,
  dayMin,
  dayMax,
}: {
  data: DayLightData;
  dayMin: number;
  dayMax: number;
}) {
  const epColor = d.episodeId
    ? EPISODE_COLORS[d.episodeId] ?? 'rgba(14,30,54,0.45)'
    : 'rgba(14,30,54,0.25)';

  function pct(h: number | null): number {
    if (h === null) return 0;
    return ((h - dayMin) / (dayMax - dayMin)) * 100;
  }

  return (
    <li
      className="flex items-stretch border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0"
      style={{ height: ROW_H }}
    >
      {/* Day label cell */}
      <div className="w-[112px] shrink-0 border-r-[0.5px] border-[color:var(--color-border-paper)] px-3 py-1.5 flex items-baseline gap-2">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 translate-y-[5px]"
          style={{ background: epColor }}
        />
        <div className="min-w-0">
          <div className="display-italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums leading-tight">
            Day {d.dayIdx + 1}
          </div>
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] truncate">
            {d.anchorageLabel}
          </div>
        </div>
      </div>

      {/* Light bar cell */}
      <div className="flex-1 relative">
        {/* Blue hour morning */}
        {d.blueMorningStartHour !== null && d.sunriseHour !== null && (
          <BarSegment
            left={pct(d.blueMorningStartHour)}
            right={pct(d.sunriseHour)}
            color="rgba(91,163,204,0.40)"
            label="blue"
          />
        )}
        {/* Golden hour AM */}
        {d.sunriseHour !== null && d.goldenAmEndHour !== null && (
          <BarSegment
            left={pct(d.sunriseHour)}
            right={pct(d.goldenAmEndHour)}
            color="rgba(201,169,97,0.65)"
            label="golden AM"
          />
        )}
        {/* Daylight (full sun) */}
        {d.goldenAmEndHour !== null && d.goldenPmStartHour !== null && (
          <BarSegment
            left={pct(d.goldenAmEndHour)}
            right={pct(d.goldenPmStartHour)}
            color="rgba(244,241,234,0.85)"
            label="daylight"
          />
        )}
        {/* Golden hour PM */}
        {d.goldenPmStartHour !== null && d.sunsetHour !== null && (
          <BarSegment
            left={pct(d.goldenPmStartHour)}
            right={pct(d.sunsetHour)}
            color="rgba(201,169,97,0.65)"
            label="golden PM"
          />
        )}
        {/* Blue hour evening */}
        {d.sunsetHour !== null && d.blueEveningEndHour !== null && (
          <BarSegment
            left={pct(d.sunsetHour)}
            right={pct(d.blueEveningEndHour)}
            color="rgba(91,163,204,0.40)"
            label="blue"
          />
        )}
      </div>

      {/* Daylight count */}
      <div className="w-[60px] shrink-0 border-l-[0.5px] border-[color:var(--color-border-paper)] px-2 flex items-center justify-end">
        <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums">
          {d.totalDaylightHours.toFixed(1)}h
        </span>
      </div>
    </li>
  );
}

function BarSegment({
  left,
  right,
  color,
  label,
}: {
  left: number;
  right: number;
  color: string;
  label: string;
}) {
  return (
    <div
      className="absolute inset-y-1.5"
      style={{
        left: `${left}%`,
        width: `${right - left}%`,
        background: color,
      }}
      title={label}
    />
  );
}
