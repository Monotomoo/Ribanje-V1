import { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Battery,
  Camera,
  Clapperboard,
  HardDrive,
  Radio,
  Sparkles,
  Users,
  Wind,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import {
  countShotStatus,
  resolveShootDay,
  shotsForShootDay,
} from './productionSelectors';

/* ---------- Production Pulse (Phase 12) ----------

   The "is the day going OK?" breath. A grid of small tiles that aggregate
   every live signal so the producer can scan in 2 seconds and know:

     • shots progress
     • takes today
     • cameras at red flag (low battery, full card)
     • timecode sync issues
     • risk triggers
     • crew on station
     • surprises captured today
     • peak wind / sea today

   Each tile clickable to drill into the source surface (where applicable —
   we wire navigation in a later pass).

   Used in:
     · Production · Today                 prominent at top of body
     · ShowDayShell                          banner-adjacent
     · Overview                              optional embed (later) */

interface Props {
  date?: string;            // override date if needed; defaults to active shoot day
  compact?: boolean;
}

export function ProductionPulse({ date: dateOverride, compact = false }: Props) {
  const { state } = useApp();
  const t = useT();
  const resolved = resolveShootDay(state, dateOverride);
  const date = dateOverride ?? resolved?.day.date;

  const metrics = useMemo(() => {
    if (!date) return null;
    return computePulse(state, date, resolved);
  }, [state, date, resolved]);

  if (!metrics) {
    return (
      <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          No active shoot day. Production pulse needs at least one shoot day.
        </div>
      </section>
    );
  }

  /* Heart-rate analogy: 0–100 health score from the worst-case tiles. */
  const health = computeHealth(metrics);

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
      <header className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="display-italic text-[16px] text-[color:var(--color-on-paper)] leading-tight flex items-center gap-2">
            <Activity
              size={14}
              className={
                health >= 80
                  ? 'text-[color:var(--color-success)]'
                  : health >= 60
                  ? 'text-[color:var(--color-brass)]'
                  : 'text-[color:var(--color-coral-deep)]'
              }
            />
            {t('pulse.title')}
          </h3>
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            {t('pulse.subtitle')}
          </div>
        </div>
        <HealthGauge health={health} />
      </header>

      <div
        className={`grid gap-2 ${
          compact
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8'
        }`}
      >
        <Tile
          label={t('pulse.shots')}
          Icon={Clapperboard}
          value={`${metrics.shotsCaptured}/${metrics.shotsTotal}`}
          subtitle={metrics.shotsTotal > 0 ? `${Math.round((metrics.shotsCaptured / metrics.shotsTotal) * 100)}%` : '—'}
          tone={
            metrics.shotsTotal === 0
              ? 'muted'
              : metrics.shotsCaptured >= metrics.shotsTotal * 0.8
              ? 'ok'
              : metrics.shotsCaptured >= metrics.shotsTotal * 0.5
              ? 'warn'
              : 'critical'
          }
        />
        <Tile
          label={t('pulse.takes')}
          Icon={Camera}
          value={String(metrics.takesToday)}
          subtitle={`${metrics.takesPrint} ${t('pulse.tile.print')}`}
          tone={metrics.takesToday > 0 ? 'ok' : 'muted'}
        />
        <Tile
          label={t('pulse.batteries')}
          Icon={Battery}
          value={metrics.batteryRedFlags > 0 ? `${metrics.batteryRedFlags}` : t('pulse.tile.ok')}
          subtitle={metrics.batteryRedFlags > 0 ? t('pulse.tile.red.flags') : t('pulse.tile.all.green')}
          tone={
            metrics.batteryRedFlags === 0
              ? 'ok'
              : metrics.batteryRedFlags <= 1
              ? 'warn'
              : 'critical'
          }
        />
        <Tile
          label={t('pulse.cards')}
          Icon={HardDrive}
          value={metrics.cardRedFlags > 0 ? `${metrics.cardRedFlags}` : t('pulse.tile.ok')}
          subtitle={metrics.cardRedFlags > 0 ? t('pulse.tile.over.full') : t('pulse.tile.all.green')}
          tone={
            metrics.cardRedFlags === 0
              ? 'ok'
              : metrics.cardRedFlags <= 1
              ? 'warn'
              : 'critical'
          }
        />
        <Tile
          label={t('pulse.sync')}
          Icon={Radio}
          value={metrics.syncIssues > 0 ? `${metrics.syncIssues}` : t('pulse.tile.ok')}
          subtitle={metrics.syncIssues > 0 ? t('pulse.tile.tc.drift') : t('pulse.tile.all.synced')}
          tone={
            metrics.syncIssues === 0
              ? 'ok'
              : metrics.syncIssues <= 1
              ? 'warn'
              : 'critical'
          }
        />
        <Tile
          label={t('pulse.risks')}
          Icon={AlertTriangle}
          value={metrics.risksTriggered > 0 ? `${metrics.risksTriggered}` : t('pulse.tile.ok')}
          subtitle={
            metrics.risksTriggered > 0
              ? t('pulse.tile.triggered')
              : metrics.risksWatch > 0
              ? `${metrics.risksWatch} ${t('pulse.tile.watch.suffix')}`
              : t('pulse.tile.dormant')
          }
          tone={
            metrics.risksTriggered > 0
              ? 'critical'
              : metrics.risksWatch > 0
              ? 'warn'
              : 'ok'
          }
        />
        <Tile
          label={t('pulse.crew')}
          Icon={Users}
          value={`${metrics.crewPlaced}/${metrics.crewTotal}`}
          subtitle={t('pulse.tile.placed')}
          tone={
            metrics.crewTotal > 0 && metrics.crewPlaced >= metrics.crewTotal
              ? 'ok'
              : metrics.crewPlaced > 0
              ? 'warn'
              : 'muted'
          }
        />
        <Tile
          label={t('pulse.surprises')}
          Icon={Sparkles}
          value={String(metrics.surprises)}
          subtitle={metrics.surprises > 0 ? t('pulse.tile.today') : '—'}
          tone={metrics.surprises > 0 ? 'ok' : 'muted'}
        />
      </div>

      {!compact && (metrics.peakWind > 0 || metrics.peakSea > 0) && (
        <div className="mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)] flex items-center gap-4 prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums">
          <span className="flex items-center gap-1.5">
            <Wind size={11} />
            {t('pulse.peak.wind')}: {metrics.peakWind ? `${metrics.peakWind} kn` : '—'}
          </span>
          {metrics.peakSea > 0 && (
            <span className="flex items-center gap-1.5">
              · {t('pulse.peak.sea')}: {metrics.peakSea.toFixed(1)} m
            </span>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------- Tile ---------- */

const TONE_BG: Record<string, string> = {
  ok: 'bg-[color:var(--color-success)]/15',
  warn: 'bg-[color:var(--color-brass)]/20',
  critical: 'bg-[color:var(--color-coral-deep)]/20',
  muted: 'bg-[color:var(--color-paper-deep)]/40',
};

const TONE_FG: Record<string, string> = {
  ok: 'text-[color:var(--color-on-paper)]',
  warn: 'text-[color:var(--color-on-paper)]',
  critical: 'text-[color:var(--color-coral-deep)]',
  muted: 'text-[color:var(--color-on-paper-faint)]',
};

function Tile({
  label,
  Icon,
  value,
  subtitle,
  tone,
}: {
  label: string;
  Icon: typeof Activity;
  value: string;
  subtitle: string;
  tone: 'ok' | 'warn' | 'critical' | 'muted';
}) {
  return (
    <div className={`rounded-[3px] p-2.5 ${TONE_BG[tone]}`}>
      <div className="flex items-center gap-1 mb-1">
        <Icon size={11} className={TONE_FG[tone]} />
        <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
          {label}
        </span>
      </div>
      <div
        className={`display-italic text-[18px] tabular-nums leading-none ${TONE_FG[tone]}`}
      >
        {value}
      </div>
      <div className="prose-body italic text-[9px] text-[color:var(--color-on-paper-muted)] mt-0.5 leading-tight">
        {subtitle}
      </div>
    </div>
  );
}

/* ---------- Health gauge ---------- */

function HealthGauge({ health }: { health: number }) {
  const tone =
    health >= 80
      ? 'var(--color-success)'
      : health >= 60
      ? 'var(--color-brass)'
      : 'var(--color-coral-deep)';
  const label =
    health >= 80
      ? 'green'
      : health >= 60
      ? 'amber'
      : 'red';
  return (
    <div className="flex items-center gap-2">
      <div className="display-italic text-[20px] tabular-nums" style={{ color: tone }}>
        {health}
      </div>
      <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] leading-tight">
        / 100
        <br />
        {label}
      </div>
    </div>
  );
}

/* ---------- Pulse computation ---------- */

interface PulseMetrics {
  shotsCaptured: number;
  shotsTotal: number;
  takesToday: number;
  takesPrint: number;
  batteryRedFlags: number;
  cardRedFlags: number;
  syncIssues: number;
  risksTriggered: number;
  risksWatch: number;
  crewPlaced: number;
  crewTotal: number;
  surprises: number;
  peakWind: number;
  peakSea: number;
}

function computePulse(
  state: ReturnType<typeof useApp>['state'],
  date: string,
  resolved: ReturnType<typeof resolveShootDay>
): PulseMetrics {
  const shots = resolved ? shotsForShootDay(state, resolved.day) : [];
  const counts = countShotStatus(shots);
  const todayTakes = state.takes.filter((t) => {
    if (!t.startedAt) return false;
    return t.startedAt.startsWith(date);
  });
  const printedToday = todayTakes.filter((t) => t.status === 'PRINT').length;

  const todayCameraStatuses = state.cameraStatuses.filter((c) => c.date === date);
  const batteryRedFlags = todayCameraStatuses.filter(
    (c) => c.batteryPct != null && c.batteryPct <= 20
  ).length;
  const cardRedFlags = todayCameraStatuses.filter(
    (c) => c.cardPct != null && c.cardPct >= 80
  ).length;
  const syncIssues = todayCameraStatuses.filter(
    (c) => c.syncStatus === 'drift' || c.syncStatus === 'offline'
  ).length;

  /* Risks: triggered if any active wind/sea/precip etc. exceed thresholds. */
  const todayForecasts = state.conditionsForecasts.filter((f) => f.date === date);
  let risksTriggered = 0;
  let risksWatch = 0;
  const peakWind = todayForecasts.reduce(
    (m, f) => Math.max(m, f.windKnots ?? 0, f.gustKnots ?? 0),
    0
  );
  const peakSea = todayForecasts.reduce(
    (m, f) => Math.max(m, f.seaStateM ?? 0),
    0
  );
  const peakPrecip = todayForecasts.reduce(
    (m, f) => Math.max(m, f.precipChance ?? 0),
    0
  );
  const matched = state.risks.filter((r) => {
    const haystack = `${r.title} ${r.description ?? ''} ${r.triggerConditions ?? ''}`.toLowerCase();
    if (
      (peakWind >= 22 && /\b(wind|bura|jugo)\b/.test(haystack)) ||
      (peakSea >= 1.5 && /\b(sea|swell|wave)\b/.test(haystack)) ||
      (peakPrecip >= 70 && /\b(rain|storm|shower)\b/.test(haystack))
    ) {
      return true;
    }
    return false;
  });
  risksTriggered = matched.length;
  risksWatch = state.risks.filter((r) => {
    const haystack = `${r.title} ${r.description ?? ''} ${r.triggerConditions ?? ''}`.toLowerCase();
    if (
      (peakWind >= 16 && peakWind < 22 && /\b(wind|bura|jugo)\b/.test(haystack)) ||
      (peakSea >= 1.0 && peakSea < 1.5 && /\b(sea|swell|wave)\b/.test(haystack)) ||
      (peakPrecip >= 50 && peakPrecip < 70 && /\b(rain|storm|shower)\b/.test(haystack))
    ) {
      return true;
    }
    return false;
  }).length;

  /* Crew positions */
  const todayPositions = state.crewPositions.filter((p) => p.date === date);
  const crewPlaced = new Set(todayPositions.map((p) => p.crewId)).size;
  const crewTotal = state.crew.length;

  /* Surprises today */
  const surprises = state.antiScriptMoments.filter(
    (m) => m.isSurprise && (m.capturedAt ?? '').startsWith(date)
  ).length;

  return {
    shotsCaptured: counts.captured,
    shotsTotal: counts.total,
    takesToday: todayTakes.length,
    takesPrint: printedToday,
    batteryRedFlags,
    cardRedFlags,
    syncIssues,
    risksTriggered,
    risksWatch,
    crewPlaced,
    crewTotal,
    surprises,
    peakWind,
    peakSea,
  };
}

function computeHealth(m: PulseMetrics): number {
  let score = 100;
  /* Each red flag knocks points off. */
  score -= m.batteryRedFlags * 8;
  score -= m.cardRedFlags * 8;
  score -= m.syncIssues * 6;
  score -= m.risksTriggered * 12;
  score -= m.risksWatch * 4;
  /* Underperforming shot capture. */
  if (m.shotsTotal > 0) {
    const ratio = m.shotsCaptured / m.shotsTotal;
    if (ratio < 0.5) score -= 10;
    else if (ratio < 0.8) score -= 5;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}
