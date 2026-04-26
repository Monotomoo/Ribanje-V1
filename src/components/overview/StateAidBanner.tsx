import { stateAidStatus, type StateAidStatus } from '../../lib/finance';

interface Props {
  stateAid: number;
  totalBudget: number;
  rebate: number;
}

const COPY: Record<StateAidStatus, { headline: string; tone: string }> = {
  ok: {
    headline: 'State aid is comfortably below the 50 percent cap',
    tone: 'success',
  },
  'at-cap': {
    headline: 'State aid is at the cap — within €5k of the limit',
    tone: 'warn',
  },
  'over-cap': {
    headline: 'State aid exceeds the 50 percent cap and must be rebalanced',
    tone: 'danger',
  },
};

const TONE_CLASSES = {
  success: {
    border: 'border-[color:var(--color-success)]/55',
    bg: 'bg-[color:var(--color-paper-light)]',
    accent: 'text-[color:var(--color-success)]',
  },
  warn: {
    border: 'border-[color:var(--color-warn)]/55',
    bg: 'bg-[color:var(--color-paper-light)]',
    accent: 'text-[color:var(--color-warn)]',
  },
  danger: {
    border: 'border-[color:var(--color-danger)]',
    bg: 'bg-[color:var(--color-paper-light)]',
    accent: 'text-[color:var(--color-danger)]',
  },
};

export function StateAidBanner({ stateAid, totalBudget, rebate }: Props) {
  const status = stateAidStatus(stateAid, totalBudget);
  const cap = Math.round(totalBudget * 0.5);
  const pct = totalBudget > 0 ? (stateAid / totalBudget) * 100 : 0;
  const headroom = cap - stateAid;
  const c = COPY[status];
  const t = TONE_CLASSES[c.tone as keyof typeof TONE_CLASSES];

  return (
    <section
      className={`relative ${t.bg} border-l-2 ${t.border} border-y-[0.5px] border-r-[0.5px] border-y-[color:var(--color-border-paper)] border-r-[color:var(--color-border-paper)] rounded-r-[3px] px-7 py-5`}
    >
      <div className="flex items-baseline justify-between gap-8 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className={`label-caps ${t.accent} mb-1.5`}>State aid compliance</div>
          <p className="prose-body italic text-[16px] text-[color:var(--color-on-paper)]">
            {c.headline}.
          </p>
        </div>

        <div className="flex items-baseline gap-7 shrink-0">
          <Stat label="State aid" value={`${stateAid}k`} accent={t.accent} primary />
          <Stat label="Cap (50%)" value={`${cap}k`} accent={t.accent} />
          <Stat
            label={status === 'over-cap' ? 'Over by' : 'Headroom'}
            value={`${Math.abs(headroom)}k`}
            accent={status === 'over-cap' ? 'text-[color:var(--color-danger)]' : t.accent}
          />
          <Stat
            label="Share of budget"
            value={`${pct.toFixed(1)}%`}
            accent={t.accent}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="label-caps text-[color:var(--color-on-paper-faint)] w-20 shrink-0">
          incl. rebate
        </span>
        <div className="flex-1 h-[3px] bg-[color:var(--color-paper-deep)] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              status === 'over-cap'
                ? 'bg-[color:var(--color-danger)]'
                : status === 'at-cap'
                ? 'bg-[color:var(--color-warn)]'
                : 'bg-[color:var(--color-success)]'
            }`}
            style={{ width: `${Math.min(100, pct * 2)}%` }}
          />
          <div className="absolute" style={{ width: 1, height: 6, marginTop: -6 }} />
        </div>
        <span className="label-caps text-[color:var(--color-on-paper-faint)] shrink-0">
          rebate {rebate}k
        </span>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
  primary,
}: {
  label: string;
  value: string;
  accent: string;
  primary?: boolean;
}) {
  return (
    <div className="flex flex-col items-end">
      <span className={`label-caps ${accent} mb-0.5`}>{label}</span>
      <span
        className={`display-italic tabular-nums text-[color:var(--color-on-paper)] ${
          primary ? 'text-[28px]' : 'text-[20px]'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
