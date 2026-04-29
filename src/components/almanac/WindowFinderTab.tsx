import { useMemo, useState } from 'react';
import SunCalc from 'suncalc';
import { Compass, Moon, Sun, Wind, Waves } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT, useI18n } from '../../i18n';
import type { SpeciesCard } from '../../types';

/* ---------- WindowFinderTab (Phase 14) ----------

   For a picked species + location, render a 48-hour fishing-window
   forecast. Five factors compose the verdict per hour:

     • Season  — is current month in species.monthsActive
     • Time-of-day — does sun elevation match species.bestTimeOfDay
     • Moon — illumination favours night species (low) or pelagic (high)
     • Tide — moving water > slack water for most species
     • Wind — light/no wind > strong wind for shoot-day fishing

   Composite 0–100 score per hour. Verdict:
     ≥ 70  GO
     ≥ 50  MAYBE
     <  50 WAIT

   Best 4-hour window across the 48h horizon highlighted in brass. */

const HOURS_AHEAD = 48;

interface HourScore {
  ts: number;                  // Date.getTime()
  hour: number;                // 0-23
  date: string;                // ISO YYYY-MM-DD
  factors: {
    season: number;             // 0–100
    time: number;
    moon: number;
    tide: number;
    wind: number;
  };
  total: number;                // weighted 0–100
  verdict: 'GO' | 'MAYBE' | 'WAIT';
}

export function WindowFinderTab() {
  const { state } = useApp();
  const t = useT();
  const { fmtDate } = useI18n();

  const [speciesId, setSpeciesId] = useState<string>(state.species[0]?.id ?? '');
  const [locationId, setLocationId] = useState<string>(() => {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    const todayShoot = state.shootDays.find((d) => d.date === todayIso);
    return todayShoot?.anchorageId ?? state.locations[0]?.id ?? '';
  });

  const species = state.species.find((s) => s.id === speciesId);
  const location = state.locations.find((l) => l.id === locationId);

  const hourly = useMemo<HourScore[]>(() => {
    if (!species || !location) return [];
    return computeWindow(species, location, state.conditionsForecasts);
  }, [species, location, state.conditionsForecasts]);

  /* Find the best 4-hour window. */
  const bestWindowStart = useMemo(() => {
    if (hourly.length < 4) return null;
    let bestStart = 0;
    let bestSum = 0;
    for (let i = 0; i <= hourly.length - 4; i++) {
      const sum = hourly.slice(i, i + 4).reduce((a, h) => a + h.total, 0);
      if (sum > bestSum) {
        bestSum = sum;
        bestStart = i;
      }
    }
    return bestStart;
  }, [hourly]);

  return (
    <div className="space-y-5">
      <header>
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] leading-tight">
          {t('almanac.finder.title')}
        </h3>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          {t('almanac.finder.subtitle')}
        </p>
      </header>

      {/* Picker row */}
      <div className="flex items-center gap-3 flex-wrap">
        <label>
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
            {t('almanac.finder.pick.species')}
          </div>
          <select
            value={speciesId}
            onChange={(e) => setSpeciesId(e.target.value)}
            className="px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)] min-w-[180px]"
          >
            {state.species.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.nameCro}
              </option>
            ))}
          </select>
        </label>

        <label>
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
            {t('almanac.catch.location')}
          </div>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)] min-w-[180px]"
          >
            {state.locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!species || !location ? (
        <div className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] py-12 text-center border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px]">
          {t('almanac.finder.no.location')}
        </div>
      ) : (
        <>
          {/* Best-window summary */}
          {bestWindowStart !== null && hourly[bestWindowStart] && (
            <BestWindowSummary
              best={hourly.slice(bestWindowStart, bestWindowStart + 4)}
              species={species}
              t={t}
            />
          )}

          {/* 48-hour strip */}
          <div className="overflow-x-auto -mx-2 px-2">
            <div className="inline-flex flex-col gap-1 min-w-full">
              {/* Day labels */}
              <DayLabelRow hourly={hourly} fmtDate={fmtDate} />
              {/* Verdict cells */}
              <VerdictRow hourly={hourly} bestWindowStart={bestWindowStart} />
              {/* Hour labels */}
              <HourLabelRow hourly={hourly} />
            </div>
          </div>

          {/* Factor legend */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
            <FactorPill icon={Compass} label={t('almanac.finder.factor.season')} />
            <FactorPill icon={Sun} label={t('almanac.finder.factor.sun')} />
            <FactorPill icon={Moon} label={t('almanac.finder.factor.moon')} />
            <FactorPill icon={Waves} label={t('almanac.finder.factor.tide')} />
            <FactorPill icon={Wind} label={t('almanac.finder.factor.wind')} />
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

function BestWindowSummary({
  best,
  species,
  t,
}: {
  best: HourScore[];
  species: SpeciesCard;
  t: ReturnType<typeof useT>;
}) {
  const start = new Date(best[0].ts);
  const end = new Date(best[best.length - 1].ts);
  const avgScore = Math.round(best.reduce((a, h) => a + h.total, 0) / best.length);
  const tone = avgScore >= 70 ? 'success' : avgScore >= 50 ? 'brass' : 'coral';
  return (
    <div
      className="rounded-[3px] p-4 border-l-[3px]"
      style={{
        borderLeftColor: `var(--color-${tone === 'success' ? 'success' : tone === 'brass' ? 'brass' : 'coral-deep'})`,
        background: `color-mix(in oklab, var(--color-${tone === 'success' ? 'success' : tone === 'brass' ? 'brass' : 'coral-deep'}) 8%, transparent)`,
      }}
    >
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <div className="label-caps text-[10px] text-[color:var(--color-brass-deep)] mb-1">
            best 4-hour window for {species.nameCro}
          </div>
          <h4 className="display-italic text-[28px] text-[color:var(--color-on-paper)] leading-tight tabular-nums">
            {fmtHour(start)} – {fmtHour(end)}
          </h4>
          <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-1 tabular-nums">
            {fmtDayLabel(start)}
          </div>
        </div>
        <div className="text-right">
          <div
            className="display-italic text-[36px] tabular-nums leading-none"
            style={{
              color: `var(--color-${tone === 'success' ? 'success' : tone === 'brass' ? 'brass-deep' : 'coral-deep'})`,
            }}
          >
            {avgScore}
          </div>
          <div className="label-caps text-[10px] text-[color:var(--color-on-paper-muted)] mt-1">
            {avgScore >= 70 ? t('almanac.finder.go') : avgScore >= 50 ? t('almanac.finder.maybe') : t('almanac.finder.wait')}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayLabelRow({ hourly, fmtDate }: { hourly: HourScore[]; fmtDate: (iso: string) => string }) {
  /* Group cells by date for header span. */
  const groups: { date: string; count: number }[] = [];
  hourly.forEach((h) => {
    const last = groups[groups.length - 1];
    if (last && last.date === h.date) last.count++;
    else groups.push({ date: h.date, count: 1 });
  });
  return (
    <div className="flex gap-px">
      {groups.map((g) => (
        <div
          key={g.date}
          className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums px-1"
          style={{ flex: g.count }}
        >
          {fmtDate(g.date)}
        </div>
      ))}
    </div>
  );
}

function VerdictRow({
  hourly,
  bestWindowStart,
}: {
  hourly: HourScore[];
  bestWindowStart: number | null;
}) {
  return (
    <div className="flex gap-px">
      {hourly.map((h, idx) => {
        const inBest =
          bestWindowStart !== null && idx >= bestWindowStart && idx < bestWindowStart + 4;
        const bg =
          h.verdict === 'GO'
            ? 'var(--color-success)'
            : h.verdict === 'MAYBE'
            ? 'var(--color-brass)'
            : 'var(--color-paper-deep)';
        const opacity = h.verdict === 'GO' ? 0.65 : h.verdict === 'MAYBE' ? 0.55 : 0.4;
        return (
          <div
            key={idx}
            title={`${h.hour}:00 · ${h.verdict} · ${h.total}`}
            className="flex-1 rounded-[1px] flex items-center justify-center text-[8px] font-medium"
            style={{
              background: bg,
              opacity,
              minWidth: '14px',
              height: 32,
              outline: inBest ? '1.5px solid var(--color-on-paper)' : 'none',
              outlineOffset: '-1px',
              color: h.verdict === 'WAIT' ? 'var(--color-on-paper-faint)' : 'var(--color-on-paper)',
            }}
          >
            {h.total >= 70 ? '●' : h.total >= 50 ? '○' : ''}
          </div>
        );
      })}
    </div>
  );
}

function HourLabelRow({ hourly }: { hourly: HourScore[] }) {
  return (
    <div className="flex gap-px">
      {hourly.map((h, idx) => (
        <div
          key={idx}
          className="flex-1 text-center text-[8px] tabular-nums text-[color:var(--color-on-paper-faint)]"
          style={{ minWidth: '14px' }}
        >
          {idx % 6 === 0 ? h.hour.toString().padStart(2, '0') : ''}
        </div>
      ))}
    </div>
  );
}

function FactorPill({
  icon: Icon,
  label,
}: {
  icon: typeof Wind;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-[color:var(--color-paper-deep)]/30">
      <Icon size={11} className="text-[color:var(--color-brass-deep)]" />
      <span>{label}</span>
    </span>
  );
}

/* ---------- Computation ---------- */

function computeWindow(
  species: SpeciesCard,
  location: { lat: number; lng: number; tideAmplitudeM?: number; tideLowTime?: string; tideHighTime?: string },
  forecasts: { date: string; hour: number; locationId?: string; windKnots?: number; gustKnots?: number }[]
): HourScore[] {
  const result: HourScore[] = [];
  const start = new Date();
  start.setMinutes(0, 0, 0);

  for (let i = 0; i < HOURS_AHEAD; i++) {
    const t = new Date(start);
    t.setHours(start.getHours() + i);
    const hour = t.getHours();
    const month = t.getMonth() + 1;
    const dateIso = `${t.getFullYear()}-${(t.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${t.getDate().toString().padStart(2, '0')}`;

    /* Season: 100 if month is in monthsActive, else 0 (or 30 if year-round close call). */
    const season =
      species.monthsActive && species.monthsActive.length > 0
        ? species.monthsActive.includes(month)
          ? 100
          : 20
        : 60;

    /* Time-of-day from sun elevation. */
    const sunPos = SunCalc.getPosition(t, location.lat, location.lng);
    const sunAlt = (sunPos.altitude * 180) / Math.PI;
    const tod = sunToTod(sunAlt);
    const todMatch = species.bestTimeOfDay
      ? species.bestTimeOfDay.includes(tod) || species.bestTimeOfDay.includes('all')
      : true;
    const time = todMatch ? 100 : sunAlt > 0 && tod === 'midday' ? 50 : 30;

    /* Sun: peak at golden hour, low at midday/midnight. */
    const sunScore =
      sunAlt > -2 && sunAlt < 8
        ? 100
        : sunAlt > 30
        ? 40
        : sunAlt < -10
        ? 50
        : 60;

    /* Moon: depends on species. Night-active species like ugor/lignja love
       darker moons; pelagic predators sometimes prefer full moon. */
    const moonIll = SunCalc.getMoonIllumination(t).fraction; // 0-1
    const moonAlt =
      ((SunCalc.getMoonPosition(t, location.lat, location.lng).altitude * 180) /
        Math.PI);
    let moon = 60;
    const isNight = sunAlt < -6;
    if (isNight) {
      const isNightSpecies = species.bestTimeOfDay?.includes('night');
      if (isNightSpecies) {
        /* Less moonlight → better for squid jigging, eel, etc. */
        moon = Math.round(100 - moonIll * 60); // 100 (new) → 40 (full)
        if (moonAlt < 0) moon = Math.min(100, moon + 15); // moon below horizon — extra dark
      } else {
        moon = 50;
      }
    } else {
      moon = 50; // moon doesn't matter much in daylight
    }

    /* Tide: use sinusoidal estimate from location's low/high time. */
    let tide = 60;
    if (location.tideLowTime && location.tideHighTime) {
      const lowH = parseHHMM(location.tideLowTime);
      const highH = parseHHMM(location.tideHighTime);
      if (lowH != null && highH != null) {
        /* Distance from low or high marks slack (low score), middle marks max flow. */
        const hourFloat = hour + t.getMinutes() / 60;
        const distLow = Math.min(
          Math.abs(hourFloat - lowH),
          24 - Math.abs(hourFloat - lowH)
        );
        const distHigh = Math.min(
          Math.abs(hourFloat - highH),
          24 - Math.abs(hourFloat - highH)
        );
        const minDist = Math.min(distLow, distHigh);
        /* Slack = 0.5h from extreme = bad. Mid-flow = ~3h = good. */
        tide = minDist < 0.75 ? 35 : minDist > 2 ? 85 : 65;
      }
    }

    /* Wind: pulled from forecasts if available, else neutral. */
    let wind = 60;
    const f = forecasts.find(
      (x) => x.date === dateIso && x.hour === hour && (!x.locationId || true)
    );
    if (f && f.windKnots != null) {
      const w = f.windKnots;
      wind = w < 8 ? 90 : w < 14 ? 70 : w < 22 ? 45 : 25;
    }

    /* Composite weighted average. */
    const total = Math.round(
      season * 0.25 +
        time * 0.2 +
        sunScore * 0.1 +
        moon * 0.15 +
        tide * 0.15 +
        wind * 0.15
    );
    const verdict = total >= 70 ? 'GO' : total >= 50 ? 'MAYBE' : 'WAIT';

    result.push({
      ts: t.getTime(),
      hour,
      date: dateIso,
      factors: { season, time, moon, tide, wind },
      total,
      verdict,
    });
  }
  return result;
}

function sunToTod(altDeg: number): 'dawn' | 'midday' | 'dusk' | 'night' {
  if (altDeg > 30) return 'midday';
  if (altDeg > 0) return 'dawn'; // also dusk — function maps to either
  if (altDeg > -6) return 'dusk';
  return 'night';
}

function parseHHMM(s?: string): number | null {
  if (!s) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(s.trim());
  if (!m) return null;
  return Number(m[1]) + Number(m[2]) / 60;
}

function fmtHour(d: Date): string {
  return `${d.getHours().toString().padStart(2, '0')}:00`;
}

function fmtDayLabel(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}
