import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Eye,
  ShieldAlert,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type {
  ConditionsForecast,
  Risk,
  RiskStatus,
} from '../../types';

/* ---------- Risk Trigger Watch (Phase 12) ----------

   Cross-references the live Conditions Feed against the Risk register.
   When a risk's trigger conditions match the forecast/now, the risk
   gets escalated visually to TRIGGERED. The producer (Tom) can scan
   the watch and know what's hot before it's burning.

   Trigger detection is keyword-based against:
     • Risk.triggerConditions free text
     • Risk.title + description
     • Forecast: windKnots, gustKnots, seaStateM, precipChance, cloudPct
     • Static thresholds (configurable later):
        wind ≥ 22 knots                → triggers "wind / bura / jugo"
        gust ≥ 30 knots                → triggers "gust"
        seaStateM ≥ 1.5                → triggers "sea / swell / wave"
        precipChance ≥ 70              → triggers "rain / storm / shower"
        cloudPct ≥ 90                  → triggers "overcast / dark / cloud"

   Three buckets in the UI:
     1. TRIGGERED   conditions are matching now — red ring
     2. WATCH        conditions could match within next 4 hours — brass ring
     3. DORMANT      green check, collapsed by default

   Used in:
     · Production · Today                  compact embed
     · ShowDayShell                          stays collapsed-by-status
     · ProductionPulse                        feeds the trigger count tile */

interface Props {
  date: string;          // ISO YYYY-MM-DD
  compact?: boolean;
}

interface TriggeredRisk {
  risk: Risk;
  matchedHours: number[];          // hours where condition trips
  matchedKeywords: string[];        // which keywords matched
  bucket: 'triggered' | 'watch' | 'dormant';
}

export function RiskTriggerWatch({ date, compact = false }: Props) {
  const { state, dispatch } = useApp();
  const [expanded, setExpanded] = useState(false);

  const triggered = useMemo(
    () => evaluateRisks(state.risks, state.conditionsForecasts, date),
    [state.risks, state.conditionsForecasts, date]
  );

  const buckets = useMemo(() => {
    const t = triggered.filter((r) => r.bucket === 'triggered');
    const w = triggered.filter((r) => r.bucket === 'watch');
    const d = triggered.filter((r) => r.bucket === 'dormant');
    return { triggered: t, watch: w, dormant: d };
  }, [triggered]);

  function setStatus(id: string, status: RiskStatus) {
    dispatch({ type: 'UPDATE_RISK', id, patch: { status } });
  }

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
      <header className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="display-italic text-[16px] text-[color:var(--color-on-paper)] leading-tight flex items-center gap-2">
            <ShieldAlert
              size={14}
              className={
                buckets.triggered.length
                  ? 'text-[color:var(--color-coral-deep)]'
                  : buckets.watch.length
                  ? 'text-[color:var(--color-brass)]'
                  : 'text-[color:var(--color-success)]'
              }
            />
            Risk trigger watch
          </h3>
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5 tabular-nums">
            {buckets.triggered.length} triggered · {buckets.watch.length} watch · {buckets.dormant.length} dormant
          </div>
        </div>
      </header>

      {/* Triggered always shown */}
      {buckets.triggered.length > 0 && (
        <div className="mb-3 space-y-2">
          {buckets.triggered.map((r) => (
            <RiskRow
              key={r.risk.id}
              entry={r}
              onSetStatus={(s) => setStatus(r.risk.id, s)}
              tone="triggered"
            />
          ))}
        </div>
      )}

      {/* Watch always shown if non-empty */}
      {buckets.watch.length > 0 && (
        <div className="mb-3 space-y-2">
          {buckets.watch.map((r) => (
            <RiskRow
              key={r.risk.id}
              entry={r}
              onSetStatus={(s) => setStatus(r.risk.id, s)}
              tone="watch"
            />
          ))}
        </div>
      )}

      {/* Empty case — all dormant */}
      {buckets.triggered.length === 0 && buckets.watch.length === 0 && (
        <div className="flex items-center gap-2 prose-body italic text-[12px] text-[color:var(--color-success)]">
          <CheckCircle2 size={12} />
          <span>
            All risks dormant. {state.risks.length === 0 ? 'No risks logged yet.' : 'Conditions look fine for the day.'}
          </span>
        </div>
      )}

      {/* Dormant collapsed by default */}
      {!compact && buckets.dormant.length > 0 && (
        <div className="mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] flex items-center gap-1 transition-colors"
          >
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {expanded ? 'hide dormant' : `show ${buckets.dormant.length} dormant`}
          </button>
          {expanded && (
            <div className="mt-2 space-y-1.5">
              {buckets.dormant.map((r) => (
                <RiskRow
                  key={r.risk.id}
                  entry={r}
                  onSetStatus={(s) => setStatus(r.risk.id, s)}
                  tone="dormant"
                  compact
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------- Risk row ---------- */

function RiskRow({
  entry,
  onSetStatus,
  tone,
  compact = false,
}: {
  entry: TriggeredRisk;
  onSetStatus: (s: RiskStatus) => void;
  tone: 'triggered' | 'watch' | 'dormant';
  compact?: boolean;
}) {
  const { risk, matchedHours, matchedKeywords } = entry;
  const { state } = useApp();
  const owner = risk.ownerId
    ? state.crew.find((c) => c.id === risk.ownerId)
    : null;
  const accentColor =
    tone === 'triggered'
      ? 'var(--color-coral-deep)'
      : tone === 'watch'
      ? 'var(--color-brass)'
      : 'var(--color-success)';
  const Icon =
    tone === 'triggered'
      ? AlertTriangle
      : tone === 'watch'
      ? Eye
      : ShieldCheck;
  const status = risk.status ?? 'open';

  if (compact) {
    return (
      <div className="flex items-center gap-2 prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
        <Icon size={10} style={{ color: accentColor }} />
        <span className="truncate">{risk.title}</span>
        <span className="ml-auto label-caps text-[9px] tabular-nums">
          {status}
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-[3px] p-3"
      style={{
        background: `${accentColor}10`,
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <div className="flex items-start gap-2 mb-1.5">
        <Icon size={14} style={{ color: accentColor }} className="mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="display-italic text-[14px] text-[color:var(--color-on-paper)] leading-tight">
            {risk.title}
          </div>
          {matchedKeywords.length > 0 && (
            <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mt-0.5">
              triggered by: {matchedKeywords.join(' · ')}
              {matchedHours.length > 0 && (
                <>
                  {' · hours: '}
                  <span className="tabular-nums">
                    {matchedHours.join(',')}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <span
          className="label-caps text-[9px] tabular-nums"
          style={{ color: accentColor }}
        >
          {status}
        </span>
      </div>

      {risk.responsePlan && (
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] leading-snug mb-2">
          {risk.responsePlan}
        </div>
      )}
      {risk.mitigation && !risk.responsePlan && (
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] leading-snug mb-2">
          {risk.mitigation}
        </div>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]/60">
        <div className="flex items-center gap-2 prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
          {owner && (
            <span className="flex items-center gap-1">
              <User size={9} />
              {owner.name}
            </span>
          )}
          {risk.category && <span>· {risk.category}</span>}
        </div>
        <div className="flex items-center gap-1">
          {(['mitigating', 'mitigated', 'accepted', 'closed'] as RiskStatus[]).map(
            (s) => {
              const active = status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSetStatus(s)}
                  className={`label-caps text-[9px] px-1.5 py-0.5 rounded-[2px] transition-colors ${
                    active
                      ? 'bg-[color:var(--color-on-paper)] text-[color:var(--color-paper-light)]'
                      : 'text-[color:var(--color-on-paper-muted)] hover:bg-[color:var(--color-paper-deep)]'
                  }`}
                >
                  {s}
                </button>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Trigger detection ---------- */

const KEYWORD_MAP: Record<string, RegExp> = {
  wind: /\b(wind|bura|jugo|maestral|nevera)\b/i,
  gust: /\b(gust|squall)\b/i,
  sea: /\b(sea|swell|wave|chop|rough)\b/i,
  rain: /\b(rain|storm|shower|precip)\b/i,
  cloud: /\b(cloud|overcast|dark)\b/i,
  tide: /\b(tide|tidal|low water|high water)\b/i,
};

const STATIC_TRIGGERS = {
  windCritical: 22,
  windWatch: 16,
  gustCritical: 30,
  seaCritical: 1.5,
  seaWatch: 1.0,
  precipCritical: 70,
  precipWatch: 50,
  cloudCritical: 90,
  cloudWatch: 75,
};

function evaluateRisks(
  risks: Risk[],
  forecasts: ConditionsForecast[],
  date: string
): TriggeredRisk[] {
  const todayForecasts = forecasts.filter((f) => f.date === date);

  /* Determine if any forecast hour trips a global keyword. */
  const tripped: Record<string, number[]> = {
    wind: [],
    gust: [],
    sea: [],
    rain: [],
    cloud: [],
  };

  todayForecasts.forEach((f) => {
    if (f.windKnots && f.windKnots >= STATIC_TRIGGERS.windCritical) {
      tripped.wind.push(f.hour);
    }
    if (f.gustKnots && f.gustKnots >= STATIC_TRIGGERS.gustCritical) {
      tripped.gust.push(f.hour);
    }
    if (f.seaStateM && f.seaStateM >= STATIC_TRIGGERS.seaCritical) {
      tripped.sea.push(f.hour);
    }
    if (f.precipChance && f.precipChance >= STATIC_TRIGGERS.precipCritical) {
      tripped.rain.push(f.hour);
    }
    if (f.cloudPct && f.cloudPct >= STATIC_TRIGGERS.cloudCritical) {
      tripped.cloud.push(f.hour);
    }
  });

  /* Watch (lower thresholds, only mark in 'watch' bucket if not already triggered) */
  const watchTripped: Record<string, number[]> = {
    wind: [],
    sea: [],
    rain: [],
    cloud: [],
  };

  todayForecasts.forEach((f) => {
    if (
      f.windKnots &&
      f.windKnots >= STATIC_TRIGGERS.windWatch &&
      f.windKnots < STATIC_TRIGGERS.windCritical
    ) {
      watchTripped.wind.push(f.hour);
    }
    if (
      f.seaStateM &&
      f.seaStateM >= STATIC_TRIGGERS.seaWatch &&
      f.seaStateM < STATIC_TRIGGERS.seaCritical
    ) {
      watchTripped.sea.push(f.hour);
    }
    if (
      f.precipChance &&
      f.precipChance >= STATIC_TRIGGERS.precipWatch &&
      f.precipChance < STATIC_TRIGGERS.precipCritical
    ) {
      watchTripped.rain.push(f.hour);
    }
    if (
      f.cloudPct &&
      f.cloudPct >= STATIC_TRIGGERS.cloudWatch &&
      f.cloudPct < STATIC_TRIGGERS.cloudCritical
    ) {
      watchTripped.cloud.push(f.hour);
    }
  });

  return risks.map((r) => {
    const haystack = `${r.title} ${r.description ?? ''} ${r.triggerConditions ?? ''}`;
    const matchedKeywords: string[] = [];
    const matchedHours: number[] = [];

    for (const [kw, regex] of Object.entries(KEYWORD_MAP)) {
      if (regex.test(haystack)) {
        if (tripped[kw] && tripped[kw].length > 0) {
          matchedKeywords.push(kw);
          tripped[kw].forEach((h) => {
            if (!matchedHours.includes(h)) matchedHours.push(h);
          });
        }
      }
    }

    if (matchedKeywords.length > 0) {
      return {
        risk: r,
        matchedHours: matchedHours.sort((a, b) => a - b),
        matchedKeywords,
        bucket: 'triggered',
      };
    }

    /* Watch bucket */
    const watchMatched: string[] = [];
    const watchHours: number[] = [];
    for (const [kw, regex] of Object.entries(KEYWORD_MAP)) {
      if (regex.test(haystack)) {
        if (watchTripped[kw] && watchTripped[kw].length > 0) {
          watchMatched.push(kw);
          watchTripped[kw].forEach((h) => {
            if (!watchHours.includes(h)) watchHours.push(h);
          });
        }
      }
    }
    if (watchMatched.length > 0) {
      return {
        risk: r,
        matchedHours: watchHours.sort((a, b) => a - b),
        matchedKeywords: watchMatched,
        bucket: 'watch',
      };
    }

    return {
      risk: r,
      matchedHours: [],
      matchedKeywords: [],
      bucket: 'dormant',
    };
  });
}

/* ---------- Re-export so unused imports are kept happy ---------- */
/* eslint-disable @typescript-eslint/no-unused-vars */
const _unused = Circle;
/* eslint-enable @typescript-eslint/no-unused-vars */
