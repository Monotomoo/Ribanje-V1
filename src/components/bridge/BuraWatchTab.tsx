import { useMemo } from 'react';
import { AlertTriangle, ShieldCheck, Wind } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import type { Location } from '../../types';

/* ---------- BuraWatchTab (Phase 15) ----------

   Cross-references the live ConditionsForecast against per-location
   wind atlases to surface "wind is coming → here are your shelter
   candidates" decisions.

   Detection rules:
     • Peak wind ≥ 22 kn → ALERT
     • Peak wind 16-22 kn → WATCH
     • <16 kn → quiet

   For each ALERT/WATCH event, suggests locations whose windAtlas
   marks the dominant wind as 'shelter'.

   Wind direction → wind name approximation:
     N (350-10°)        tramontana
     NE (20-70°)        bura
     E (80-100°)        levanat
     SE (110-160°)      jugo
     S (170-190°)       ošter
     SW (200-250°)      lebić
     W (260-280°)       pulenat
     NW (290-340°)      maestral */

interface WindEvent {
  date: string;
  startHour: number;
  endHour: number;
  peakKn: number;
  windDir?: string;
  bearing: number;
  windName: 'tramontana' | 'bura' | 'levanat' | 'jugo' | 'ošter' | 'lebić' | 'pulenat' | 'maestral';
  level: 'alert' | 'watch';
}

export function BuraWatchTab() {
  const { state } = useApp();
  const t = useT();

  const events = useMemo<WindEvent[]>(() => {
    return detectWindEvents(state.conditionsForecasts);
  }, [state.conditionsForecasts]);

  return (
    <div className="space-y-5">
      <header>
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] leading-tight">
          {t('bridge.bura.title')}
        </h3>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          {t('bridge.bura.subtitle')}
        </p>
      </header>

      {events.length === 0 ? (
        <div className="rounded-[3px] bg-[color:var(--color-success)]/10 border-[0.5px] border-[color:var(--color-success)]/40 p-5 flex items-center gap-3">
          <ShieldCheck size={16} className="text-[color:var(--color-success)] shrink-0" />
          <div>
            <div className="display-italic text-[15px] text-[color:var(--color-on-paper)]">
              {t('bridge.bura.no.alert')}
            </div>
            <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-0.5">
              load forecasts in Conditions Feed for early warning
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e, idx) => (
            <WindEventCard
              key={idx}
              event={e}
              locations={state.locations}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WindEventCard({
  event,
  locations,
  t,
}: {
  event: WindEvent;
  locations: Location[];
  t: ReturnType<typeof useT>;
}) {
  /* Find shelter candidates: locations whose windAtlas marks the wind as 'shelter'. */
  const candidates = locations.filter((l) =>
    l.windAtlas?.some((a) => a.wind === event.windName && a.shelter === 'shelter')
  );
  const exposed = locations.filter((l) =>
    l.windAtlas?.some((a) => a.wind === event.windName && a.shelter === 'expose')
  );
  const accentColor =
    event.level === 'alert'
      ? 'var(--color-coral-deep)'
      : 'var(--color-brass)';
  return (
    <article
      className="rounded-[3px] p-4 border-l-[3px]"
      style={{
        borderLeftColor: accentColor,
        background: `color-mix(in oklab, ${accentColor} 8%, transparent)`,
      }}
    >
      <header className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-baseline gap-3">
          <AlertTriangle size={14} style={{ color: accentColor }} />
          <div>
            <div className="display-italic text-[18px] text-[color:var(--color-on-paper)] leading-tight">
              {event.windName} · {event.peakKn} kn {t('bridge.bura.peak')}
            </div>
            <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums">
              {event.date} · {event.startHour}:00 → {event.endHour}:00
              {event.windDir && ` · ${event.windDir}`}
            </div>
          </div>
        </div>
        <span
          className="label-caps text-[9px] tabular-nums px-1.5 py-0.5 rounded-[2px]"
          style={{
            color: accentColor,
            background: `color-mix(in oklab, ${accentColor} 18%, transparent)`,
          }}
        >
          {event.level === 'alert' ? t('bridge.bura.alert') : 'watch'}
        </span>
      </header>

      {/* Action verdict */}
      {candidates.length > 0 ? (
        <div className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-snug mb-3">
          → {t('bridge.bura.action.move')} ·{' '}
          <span className="text-[color:var(--color-success)]">
            {candidates.length} {t('bridge.bura.shelter.candidates')}
          </span>
        </div>
      ) : (
        <div className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] leading-snug mb-3">
          → {t('bridge.bura.action.stay')} (no audited shelters yet · check Wind Atlas)
        </div>
      )}

      {/* Shelter candidates */}
      {candidates.length > 0 && (
        <div>
          <div className="label-caps text-[9px] text-[color:var(--color-success)] mb-1.5">
            ✓ {t('bridge.bura.shelter.candidates')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {candidates.map((l) => (
              <span
                key={l.id}
                className="px-2 py-0.5 rounded-[2px] text-[11px] display-italic bg-[color:var(--color-success)]/15 text-[color:var(--color-on-paper)]"
              >
                {l.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Exposed warning */}
      {exposed.length > 0 && (
        <div className="mt-3">
          <div className="label-caps text-[9px] text-[color:var(--color-coral-deep)] mb-1.5">
            ✗ avoid · exposed
          </div>
          <div className="flex flex-wrap gap-1.5">
            {exposed.map((l) => (
              <span
                key={l.id}
                className="px-2 py-0.5 rounded-[2px] text-[11px] display-italic bg-[color:var(--color-coral-deep)]/15 text-[color:var(--color-coral-deep)]"
              >
                {l.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

/* ---------- detection ---------- */

function detectWindEvents(
  forecasts: { date: string; hour: number; windKnots?: number; gustKnots?: number; windDir?: string }[]
): WindEvent[] {
  /* Group by date, find runs of high wind. */
  const byDate = new Map<string, typeof forecasts>();
  forecasts.forEach((f) => {
    if (!byDate.has(f.date)) byDate.set(f.date, []);
    byDate.get(f.date)?.push(f);
  });
  const events: WindEvent[] = [];
  byDate.forEach((dayForecasts, date) => {
    const sorted = [...dayForecasts].sort((a, b) => a.hour - b.hour);
    let runStart: number | null = null;
    let runPeak = 0;
    let runDir: string | undefined;
    for (let i = 0; i <= sorted.length; i++) {
      const f = sorted[i];
      const wind = f?.windKnots ?? 0;
      const gust = f?.gustKnots ?? 0;
      const peak = Math.max(wind, gust);
      const isAlert = peak >= 16;
      if (isAlert && runStart === null) {
        runStart = f.hour;
        runPeak = peak;
        runDir = f.windDir;
      } else if (isAlert && runStart !== null) {
        runPeak = Math.max(runPeak, peak);
        if (f.windDir && !runDir) runDir = f.windDir;
      } else if (!isAlert && runStart !== null) {
        const endHour = sorted[i - 1]?.hour ?? runStart;
        events.push({
          date,
          startHour: runStart,
          endHour,
          peakKn: runPeak,
          windDir: runDir,
          bearing: dirToBearing(runDir),
          windName: bearingToWindName(dirToBearing(runDir)),
          level: runPeak >= 22 ? 'alert' : 'watch',
        });
        runStart = null;
        runPeak = 0;
        runDir = undefined;
      }
    }
  });
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour);
}

function dirToBearing(dir?: string): number {
  if (!dir) return 45; // default to NE (bura) when unknown
  /* Try to parse "270°", "NE", "WSW" etc. */
  const num = parseFloat(dir.replace(/[^\d.]/g, ''));
  if (!Number.isNaN(num)) return num;
  const compass: Record<string, number> = {
    N: 0, NNE: 22, NE: 45, ENE: 68,
    E: 90, ESE: 112, SE: 135, SSE: 158,
    S: 180, SSW: 202, SW: 225, WSW: 248,
    W: 270, WNW: 292, NW: 315, NNW: 338,
  };
  return compass[dir.toUpperCase()] ?? 45;
}

function bearingToWindName(bearing: number): WindEvent['windName'] {
  /* 8-sector mapping. Each sector spans 45° centered on the cardinal/intercardinal. */
  const b = ((bearing % 360) + 360) % 360;
  if (b < 22.5 || b >= 337.5) return 'tramontana';
  if (b < 67.5)  return 'bura';
  if (b < 112.5) return 'levanat';
  if (b < 157.5) return 'jugo';
  if (b < 202.5) return 'ošter';
  if (b < 247.5) return 'lebić';
  if (b < 292.5) return 'pulenat';
  return 'maestral';
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const _unused = { Wind };
/* eslint-enable @typescript-eslint/no-unused-vars */
