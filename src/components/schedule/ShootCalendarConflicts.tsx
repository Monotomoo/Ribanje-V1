import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { ShootDay } from '../../types';

/* Shoot Calendar Conflicts — auto-detects issues across the shoot month
   that Tomo + Tom should know about before stepping on the boat:
   - Shoot day with no anchorage assigned
   - Shoot day with no episode assigned
   - Adverse weather (bura/storm) on days with drone-heavy episodes
   - Jugo + underwater scenes (poor viz)
   - Same anchorage 3+ days in a row (rotation feels stale)
   - No same-day light-of-day overlap with golden-hour-dependent scenes
   - Crew gap (no skipper or DOP listed for a shoot day) — currently we
     don't track per-day crew assignment, so this is informational only.
*/

type Severity = 'critical' | 'warn' | 'info';

interface Conflict {
  id: string;
  severity: Severity;
  category: string;
  message: string;
  dayId?: string;
  dayDate?: string;
}

const SEV_TONE: Record<Severity, { bg: string; fg: string; label: string }> = {
  critical: { bg: 'rgba(194,106,74,0.12)', fg: 'rgb(140,60,40)',  label: 'critical' },
  warn:     { bg: 'rgba(217,169,62,0.12)', fg: 'rgb(140,100,30)', label: 'warn' },
  info:     { bg: 'rgba(91,163,204,0.12)', fg: 'rgb(60,120,160)', label: 'info' },
};

function detectConflicts(days: ShootDay[]): Conflict[] {
  const out: Conflict[] = [];
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  /* 1. Days without anchorage / episode */
  for (const d of sorted) {
    if (!d.anchorageId) {
      out.push({
        id: `no-anchor-${d.id}`,
        severity: 'warn',
        category: 'No anchorage',
        message: `Day ${d.date} has no anchorage assigned — golden hour math + boat ops can't compute.`,
        dayId: d.id,
        dayDate: d.date,
      });
    }
    if (!d.episodeId) {
      out.push({
        id: `no-ep-${d.id}`,
        severity: 'info',
        category: 'No episode',
        message: `Day ${d.date} has no episode assigned — coverage strategy unclear.`,
        dayId: d.id,
        dayDate: d.date,
      });
    }
  }

  /* 2. Adverse weather windows */
  for (const d of sorted) {
    if (d.weatherWindow === 'bura' || d.weatherWindow === 'storm') {
      out.push({
        id: `adverse-${d.id}`,
        severity: 'critical',
        category: 'Adverse weather',
        message: `Day ${d.date} forecast ${d.weatherWindow} · drone grounded · UW abort · Trinity dicey.`,
        dayId: d.id,
        dayDate: d.date,
      });
    } else if (d.weatherWindow === 'jugo') {
      out.push({
        id: `jugo-${d.id}`,
        severity: 'warn',
        category: 'Jugo wind',
        message: `Day ${d.date} forecast jugo · sea murky for underwater · plan deck-only that day.`,
        dayId: d.id,
        dayDate: d.date,
      });
    }
  }

  /* 3. Same anchorage 3+ days in a row */
  for (let i = 0; i < sorted.length - 2; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const c = sorted[i + 2];
    if (
      a.anchorageId &&
      a.anchorageId === b.anchorageId &&
      a.anchorageId === c.anchorageId
    ) {
      out.push({
        id: `stale-${a.id}`,
        severity: 'info',
        category: 'Anchorage rotation',
        message: `${a.date}–${c.date} all at same anchorage — visual variety risk · consider breaking up.`,
        dayId: a.id,
        dayDate: a.date,
      });
    }
  }

  /* 4. Episode-day distribution check — episodes with only 1-2 days might be undercovered */
  const epDayCounts: Record<string, number> = {};
  for (const d of sorted) {
    if (d.episodeId) {
      epDayCounts[d.episodeId] = (epDayCounts[d.episodeId] ?? 0) + 1;
    }
  }
  for (const [epId, count] of Object.entries(epDayCounts)) {
    if (count === 1) {
      out.push({
        id: `light-cov-${epId}`,
        severity: 'warn',
        category: 'Light coverage',
        message: `Episode ${epId} gets only 1 shoot day — bare minimum, no buffer for weather.`,
      });
    }
  }

  /* 5. Days with weather + clean = optimistic flag (info) */
  const clearCount = sorted.filter((d) => d.weatherWindow === 'clear').length;
  if (clearCount >= sorted.length * 0.6 && sorted.length > 5) {
    out.push({
      id: 'optimistic-weather',
      severity: 'info',
      category: 'Weather optimism',
      message: `${clearCount}/${sorted.length} days forecast clear. Croatian Adriatic in October is rarely that lucky — set a fallback day.`,
    });
  }

  /* Sort by severity */
  const order: Record<Severity, number> = { critical: 0, warn: 1, info: 2 };
  out.sort((a, b) => order[a.severity] - order[b.severity]);

  return out;
}

export function ShootCalendarConflicts() {
  const { state } = useApp();
  const conflicts = useMemo(() => detectConflicts(state.shootDays), [state.shootDays]);
  const counts = useMemo(() => {
    const c = { critical: 0, warn: 0, info: 0 };
    for (const x of conflicts) c[x.severity]++;
    return c;
  }, [conflicts]);

  if (conflicts.length === 0) {
    return (
      <section className="bg-[color:var(--color-success)]/10 border-l-2 border-[color:var(--color-success)] px-5 py-3">
        <div className="flex items-baseline gap-2">
          <CheckCircle2 size={13} className="text-[color:var(--color-success)] shrink-0 translate-y-[2px]" />
          <h4 className="display-italic text-[16px] text-[color:var(--color-on-paper)]">
            Shoot calendar clean
          </h4>
        </div>
        <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-0.5 leading-relaxed">
          No conflicts detected across {state.shootDays.length} shoot day
          {state.shootDays.length === 1 ? '' : 's'}.
        </p>
      </section>
    );
  }

  return (
    <section>
      <header className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <AlertTriangle size={14} className="text-[color:var(--color-coral-deep)]" />
          <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Calendar conflicts
          </h4>
        </div>
        <div className="flex items-baseline gap-3 prose-body italic text-[11px]">
          {counts.critical > 0 && (
            <span className="text-[color:var(--color-coral-deep)]">
              {counts.critical} critical
            </span>
          )}
          {counts.warn > 0 && (
            <span className="text-[color:var(--color-warn)]">{counts.warn} warn</span>
          )}
          {counts.info > 0 && (
            <span className="text-[color:var(--color-on-paper-muted)]">
              {counts.info} info
            </span>
          )}
        </div>
      </header>

      <ul className="space-y-1.5">
        {conflicts.map((c) => (
          <ConflictRow key={c.id} conflict={c} />
        ))}
      </ul>
    </section>
  );
}

function ConflictRow({ conflict: c }: { conflict: Conflict }) {
  const tone = SEV_TONE[c.severity];
  return (
    <li
      className="rounded-[2px] px-4 py-2.5 border-l-2"
      style={{ background: tone.bg, borderLeftColor: tone.fg }}
    >
      <div className="flex items-baseline gap-2">
        <span
          className="label-caps tracking-[0.10em] text-[10px]"
          style={{ color: tone.fg }}
        >
          {tone.label} · {c.category}
        </span>
        {c.dayDate && (
          <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] tabular-nums">
            {c.dayDate}
          </span>
        )}
        <ChevronRight size={9} className="ml-auto text-[color:var(--color-on-paper-faint)]" />
      </div>
      <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] mt-0.5 leading-relaxed">
        {c.message}
      </p>
    </li>
  );
}
