import type { CashflowQuarter } from '../../types';
import { bridgeFinancingPeak } from '../../lib/finance';

interface Props {
  cashflow: CashflowQuarter[];
}

/*
  Live bridge financing banner.
  Shows when cumulative cash position dips below zero — flags peak shortfall and
  the quarter it occurs in. Rendered as an editorial advisory note.
*/
export function BridgeFinancingBanner({ cashflow }: Props) {
  const peak = bridgeFinancingPeak(cashflow);
  if (peak === 0) {
    return (
      <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-success)]/45 border-l-2 border-l-[color:var(--color-success)]/55 rounded-r-[3px] px-7 py-5">
        <div className="label-caps text-[color:var(--color-success)] mb-1.5">
          Cash position
        </div>
        <p className="prose-body italic text-[15px] text-[color:var(--color-on-paper)]">
          Cumulative cash flow stays positive across the schedule. No bridge
          financing required.
        </p>
      </section>
    );
  }

  /* Find the quarter where peak shortfall is reached. */
  let cumulative = 0;
  let worst = 0;
  let worstIdx = 0;
  cashflow.forEach((q, i) => {
    const inflow = Object.values(q.inflows).reduce((s, v) => s + v, 0);
    cumulative += inflow - q.outflow;
    if (cumulative < worst) {
      worst = cumulative;
      worstIdx = i;
    }
  });
  const worstQuarter = cashflow[worstIdx]?.quarter ?? '';

  /* Suggest a bridge size with 10% buffer, rounded to nearest 10k. */
  const suggested = Math.ceil((peak * 1.1) / 10) * 10;

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-l-2 border-l-[color:var(--color-coral)] border-y-[color:var(--color-border-paper)] border-r-[color:var(--color-border-paper)] rounded-r-[3px] px-7 py-5">
      <div className="flex items-baseline justify-between gap-8 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="label-caps text-[color:var(--color-coral-deep)] mb-1.5">
            Bridge financing
          </div>
          <p className="prose-body italic text-[16px] text-[color:var(--color-on-paper)]">
            Cumulative cash dips to <span className="not-italic font-medium">−{peak}k</span> by{' '}
            <span className="not-italic font-medium">{worstQuarter}</span>. A bridge
            facility of roughly{' '}
            <span className="not-italic font-medium">{suggested}k</span> covers the
            gap with a small buffer.
          </p>
        </div>

        <div className="flex items-baseline gap-7 shrink-0">
          <Stat label="Peak shortfall" value={`−${peak}k`} accent="coral" primary />
          <Stat label="Worst quarter" value={worstQuarter} accent="muted" />
          <Stat label="Suggested bridge" value={`${suggested}k`} accent="brass" />
        </div>
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
  accent: 'coral' | 'brass' | 'muted';
  primary?: boolean;
}) {
  const accentClass =
    accent === 'coral'
      ? 'text-[color:var(--color-coral-deep)]'
      : accent === 'brass'
      ? 'text-[color:var(--color-brass-deep)]'
      : 'text-[color:var(--color-on-paper-faint)]';
  return (
    <div className="flex flex-col items-end">
      <span className={`label-caps ${accentClass} mb-0.5`}>{label}</span>
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
