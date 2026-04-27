import { useMemo } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckSquare,
  Coins,
  FileText,
  Film,
  Handshake,
  Users,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { ViewKey } from '../../types';
import {
  rebate,
  totalCost,
  totalFunding,
} from '../../lib/finance';

/* Cockpit Gauges — 8 production health instruments in a 4×2 grid.
   Mixed visualization styles per metric (donut · LCD · progress bar · count
   with severity color). Each click jumps to the source module. */

interface GaugeProps {
  label: string;
  icon: typeof Camera;
  onJump?: () => void;
}

interface GaugeJumpProps {
  onJump: (view: ViewKey) => void;
}

export function CockpitGauges({ onJump }: GaugeJumpProps) {
  const { state } = useApp();
  const sc = state.scenarios[state.activeScenario];

  /* ------- Compute all 8 metrics ------- */
  const cost = totalCost(sc.costs);
  const reb = rebate(cost, sc.qualifyingSpendPct, sc.blendedRebateRate);
  const fundingTotal = totalFunding(sc.funding, reb);
  const fundingTarget = cost;
  const fundingPct = Math.min(100, Math.round((fundingTotal / fundingTarget) * 100));

  const crewTotal = state.crew.length;
  const crewTarget = 6;

  const episodesTotal = state.episodes.length;
  const episodesLocked = state.episodes.filter((e) => e.status === 'locked' || e.status === 'cut').length;

  const shotsTotal = state.shots.length;
  const shotsCaptured = state.shots.filter((s) => s.status === 'captured').length;

  const contractsTotal = state.contracts.length;
  const contractsSigned = state.contracts.filter((c) => c.status === 'signed').length;

  const sponsorsCommittedRecords = state.sponsors.filter((s) => s.status === 'committed');
  const sponsorsCommittedAmount = sponsorsCommittedRecords.reduce(
    (sum, s) => sum + (s.expectedAmount ?? 0),
    0
  );

  const risksOpen = state.risks.filter((r) => {
    const status = r.status ?? 'open';
    return status === 'open' || status === 'mitigating';
  });
  const risksCritical = risksOpen.filter((r) => {
    const score = (r.probabilityScale ?? 3) * (r.impactScale ?? 3);
    return score >= 16 || (r.probability === 'high' && r.impact === 'high');
  });

  /* Tasks due in next 7 days */
  const today = useMemo(() => new Date(), []);
  const sevenDaysFromNow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return d;
  }, [today]);
  const tasksDueWeek = state.tasks.filter((t) => {
    if (t.status === 'done') return false;
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    return due <= sevenDaysFromNow;
  });
  const tasksOverdue = tasksDueWeek.filter((t) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate).getTime() < today.getTime();
  });

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <span className="label-caps tracking-[0.14em] text-[color:var(--color-brass-deep)]">
          cockpit · production health
        </span>
        <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
          click any gauge to drill in
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Funding — donut */}
        <DonutGauge
          label="Funding raised"
          icon={Coins}
          pct={fundingPct}
          centerValue={`${fundingPct}%`}
          subValue={`${Math.round(fundingTotal)}k / ${Math.round(fundingTarget)}k €`}
          onJump={() => onJump('overview')}
        />
        {/* Crew confirmed — LCD */}
        <LcdGauge
          label="Crew on board"
          icon={Users}
          value={`${crewTotal}`}
          subValue={`of ${crewTarget} target`}
          tone={crewTotal >= crewTarget ? 'success' : 'brass'}
          onJump={() => onJump('crew')}
        />
        {/* Episodes locked — progress bar */}
        <ProgressGauge
          label="Episodes locked"
          icon={Film}
          numerator={episodesLocked}
          denominator={episodesTotal}
          onJump={() => onJump('episodes')}
        />
        {/* Shots captured — progress bar */}
        <ProgressGauge
          label="Shots captured"
          icon={Camera}
          numerator={shotsCaptured}
          denominator={shotsTotal}
          onJump={() => onJump('production')}
          emptyHint="No shots planned yet"
        />
        {/* Contracts signed — progress bar */}
        <ProgressGauge
          label="Contracts signed"
          icon={FileText}
          numerator={contractsSigned}
          denominator={contractsTotal}
          onJump={() => onJump('contracts')}
          emptyHint="No contracts yet"
        />
        {/* Sponsors committed — LCD */}
        <LcdGauge
          label="Sponsors committed"
          icon={Handshake}
          value={`${sponsorsCommittedRecords.length}`}
          subValue={`${sponsorsCommittedAmount}k €`}
          tone="brass"
          onJump={() => onJump('sponsors')}
        />
        {/* Risks open — severity-colored count */}
        <SeverityGauge
          label="Risks open"
          icon={AlertTriangle}
          value={risksOpen.length}
          critical={risksCritical.length}
          onJump={() => onJump('risks')}
        />
        {/* Tasks due — count with overdue indicator */}
        <SeverityGauge
          label="Tasks · 7d"
          icon={CheckSquare}
          value={tasksDueWeek.length}
          critical={tasksOverdue.length}
          criticalLabel="overdue"
          onJump={() => onJump('crew')}
        />
      </div>
    </section>
  );
}

/* ---------- Donut gauge ---------- */

function DonutGauge({
  label,
  icon: Icon,
  pct,
  centerValue,
  subValue,
  onJump,
}: GaugeProps & {
  pct: number;
  centerValue: string;
  subValue: string;
}) {
  const size = 72;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);
  const tone =
    pct >= 80 ? 'var(--color-success)' :
    pct >= 50 ? 'var(--color-brass)' :
    'var(--color-coral-deep)';

  return (
    <GaugeShell label={label} icon={Icon} onJump={onJump}>
      <div className="flex items-center gap-3">
        <svg width={size} height={size} className="shrink-0">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(14,30,54,0.10)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={tone}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 400ms ease-out' }}
          />
          <text
            x={size / 2}
            y={size / 2 + 4}
            textAnchor="middle"
            fontSize={14}
            fontFamily="var(--font-fraunces)"
            fontStyle="italic"
            fill="var(--color-on-paper)"
          >
            {centerValue}
          </text>
        </svg>
        <div className="min-w-0">
          <div className="display-italic text-[13px] text-[color:var(--color-on-paper)] tabular-nums leading-tight">
            {subValue}
          </div>
        </div>
      </div>
    </GaugeShell>
  );
}

/* ---------- LCD gauge ---------- */

function LcdGauge({
  label,
  icon: Icon,
  value,
  subValue,
  tone,
  onJump,
}: GaugeProps & {
  value: string;
  subValue?: string;
  tone?: 'brass' | 'success' | 'coral';
}) {
  const valueColor =
    tone === 'success'
      ? 'text-[color:var(--color-success)]'
      : tone === 'coral'
      ? 'text-[color:var(--color-coral-deep)]'
      : 'text-[color:var(--color-on-paper)]';
  return (
    <GaugeShell label={label} icon={Icon} onJump={onJump}>
      <div className="flex items-baseline gap-2">
        <span className={`display-italic text-[36px] tabular-nums leading-none ${valueColor}`}>
          {value}
        </span>
        {subValue && (
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums">
            {subValue}
          </span>
        )}
      </div>
    </GaugeShell>
  );
}

/* ---------- Progress bar gauge ---------- */

function ProgressGauge({
  label,
  icon: Icon,
  numerator,
  denominator,
  onJump,
  emptyHint,
}: GaugeProps & {
  numerator: number;
  denominator: number;
  emptyHint?: string;
}) {
  const pct = denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);
  return (
    <GaugeShell label={label} icon={Icon} onJump={onJump}>
      <div>
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="display-italic text-[24px] text-[color:var(--color-on-paper)] tabular-nums leading-none">
            {numerator}
          </span>
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums">
            / {denominator}
          </span>
          <span className="prose-body italic text-[11px] text-[color:var(--color-brass-deep)] tabular-nums ml-auto">
            {pct}%
          </span>
        </div>
        <div className="h-[3px] bg-[color:var(--color-paper-deep)]/40 rounded-full overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${pct}%`,
              background:
                pct >= 80
                  ? 'var(--color-success)'
                  : pct >= 30
                  ? 'var(--color-brass)'
                  : 'var(--color-coral-deep)',
            }}
          />
        </div>
        {denominator === 0 && emptyHint && (
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-1">
            {emptyHint}
          </div>
        )}
      </div>
    </GaugeShell>
  );
}

/* ---------- Severity-colored count ---------- */

function SeverityGauge({
  label,
  icon: Icon,
  value,
  critical,
  criticalLabel = 'critical',
  onJump,
}: GaugeProps & {
  value: number;
  critical: number;
  criticalLabel?: string;
}) {
  const tone =
    critical > 0
      ? 'text-[color:var(--color-coral-deep)]'
      : value > 0
      ? 'text-[color:var(--color-brass-deep)]'
      : 'text-[color:var(--color-success)]';
  return (
    <GaugeShell label={label} icon={Icon} onJump={onJump}>
      <div>
        <div className="flex items-baseline gap-2">
          <span className={`display-italic text-[36px] tabular-nums leading-none ${tone}`}>
            {value}
          </span>
          {critical > 0 && (
            <span className="label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-coral-deep)]">
              {critical} {criticalLabel}
            </span>
          )}
        </div>
        {value === 0 && (
          <div className="prose-body italic text-[10px] text-[color:var(--color-success)] mt-1">
            ✓ all clear
          </div>
        )}
      </div>
    </GaugeShell>
  );
}

/* ---------- Shared shell ---------- */

function GaugeShell({
  label,
  icon: Icon,
  onJump,
  children,
}: GaugeProps & { children: React.ReactNode }) {
  return (
    <article
      className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-3 transition-colors hover:border-[color:var(--color-border-brass)] cursor-pointer"
      onClick={onJump}
    >
      <header className="flex items-baseline gap-1.5 mb-2.5">
        <Icon size={11} className="text-[color:var(--color-brass-deep)]" />
        <span className="label-caps tracking-[0.10em] text-[color:var(--color-on-paper-muted)]">
          {label}
        </span>
      </header>
      {children}
    </article>
  );
}
