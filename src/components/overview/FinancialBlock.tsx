import { useApp } from '../../state/AppContext';
import {
  rebate,
  totalCost,
  totalFunding,
  stateAidTotal,
  bridgeFinancingPeak,
} from '../../lib/finance';
import { FUNDING_SOURCES } from '../../lib/seed';
import type { ViewKey } from '../../types';

interface Props {
  onJump?: (view: ViewKey) => void;
}

/* Condensed financial block for the Overview page.
   Mini funding stack + state-aid + bridge headlines.
   Detailed editable tables live on the same view further down (or via "open finance"). */
export function FinancialBlock({ onJump }: Props) {
  const { state } = useApp();
  const sc = state.scenarios[state.activeScenario];
  const cost = totalCost(sc.costs);
  const reb = rebate(cost, sc.qualifyingSpendPct, sc.blendedRebateRate);
  const fund = totalFunding(sc.funding, reb);
  const sa = stateAidTotal(sc.funding, reb, FUNDING_SOURCES);
  const peak = bridgeFinancingPeak(sc.cashflow);
  const saPct = cost > 0 ? Math.round((sa / cost) * 100) : 0;

  /* Mini funding stack — proportional bar segments */
  const segments = FUNDING_SOURCES.map((s) => ({
    ...s,
    value: s.isCalculated ? reb : sc.funding[s.key] ?? 0,
  })).filter((s) => s.value > 0);
  const total = segments.reduce((sum, x) => sum + x.value, 0);

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6">
      <header className="flex items-baseline justify-between mb-4">
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          Financial health
        </h3>
        <div className="flex items-baseline gap-3">
          <span className="label-caps text-[color:var(--color-on-paper-faint)]">
            {state.activeScenario}
          </span>
          {onJump && (
            <button
              type="button"
              onClick={() => onJump('overview')}
              className="hidden"
              aria-hidden="true"
            />
          )}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6 items-baseline">
        <div>
          <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
            Total budget
          </div>
          <div className="display-italic text-[28px] tabular-nums text-[color:var(--color-on-paper)]">
            {cost}k €
          </div>
        </div>
        <div>
          <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
            Total funding
          </div>
          <div className="display-italic text-[28px] tabular-nums text-[color:var(--color-on-paper)]">
            {fund}k €
          </div>
          <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-1">
            including rebate {reb}k
          </div>
        </div>
        <div>
          <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
            State aid
          </div>
          <div className="display-italic text-[28px] tabular-nums text-[color:var(--color-on-paper)]">
            {saPct}%
          </div>
          <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-1">
            {sa}k of {cost}k · cap 50%
          </div>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        <div className="flex items-baseline justify-between mb-2">
          <span className="label-caps text-[color:var(--color-brass-deep)]">
            Funding stack
          </span>
          <span className="label-caps text-[color:var(--color-on-paper-faint)]">
            {total}k total
          </span>
        </div>
        <div className="flex h-6 rounded-[2px] overflow-hidden border-[0.5px] border-[color:var(--color-border-paper)]">
          {segments.map((s) => (
            <div
              key={s.key}
              style={{
                width: `${(s.value / total) * 100}%`,
                background: s.color,
              }}
              title={`${s.label} · ${s.value}k`}
            />
          ))}
        </div>
      </div>

      {peak > 0 && (
        <div className="mt-4 pt-4 border-t-[0.5px] border-[color:var(--color-border-paper)] flex items-baseline justify-between gap-4">
          <div>
            <div className="label-caps text-[color:var(--color-coral-deep)]">
              Bridge financing
            </div>
            <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
              cumulative cash dips to −{peak}k · suggested bridge ≈
              {' '}{Math.ceil((peak * 1.1) / 10) * 10}k
            </p>
          </div>
          <span className="display-italic text-[24px] text-[color:var(--color-coral-deep)] tabular-nums shrink-0">
            −{peak}k
          </span>
        </div>
      )}
    </section>
  );
}
