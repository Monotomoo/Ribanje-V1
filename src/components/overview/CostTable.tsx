import { useApp } from '../../state/AppContext';
import { COST_CATEGORIES } from '../../lib/seed';
import { EditableNumber } from '../primitives/EditableNumber';
import { totalCost, rebate as calcRebate } from '../../lib/finance';

/*
  Editable cost categories table + rebate parameters panel.
  Rebate is auto-derived from total cost × qsPct × rate.
*/
export function CostTable() {
  const { state, dispatch } = useApp();
  const sc = state.scenarios[state.activeScenario];
  const total = totalCost(sc.costs);
  const reb = calcRebate(total, sc.qualifyingSpendPct, sc.blendedRebateRate);

  return (
    <section>
      <header className="flex items-baseline justify-between mb-4">
        <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
          Cost structure
        </h2>
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">
          €k · click any value to edit
        </span>
      </header>

      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px]">
        {COST_CATEGORIES.map((cat, i) => (
          <div
            key={cat.key}
            className={`flex items-baseline px-5 py-3 gap-4 ${
              i > 0 ? 'border-t-[0.5px] border-[color:var(--color-border-paper)]' : ''
            }`}
          >
            <span className="prose-body text-[14px] text-[color:var(--color-on-paper)] flex-1">
              {cat.label}
            </span>
            <div className="w-24 shrink-0 text-right">
              <EditableNumber
                value={sc.costs[cat.key] ?? 0}
                onChange={(v) =>
                  dispatch({
                    type: 'SET_COST',
                    scenario: state.activeScenario,
                    key: cat.key,
                    value: v,
                  })
                }
                suffix="k"
              />
            </div>
          </div>
        ))}

        {/* Total row */}
        <div className="flex items-baseline px-5 py-4 gap-4 border-t-[0.5px] border-[color:var(--color-border-brass)] bg-[color:var(--color-paper-deep)]/30">
          <span className="display-italic text-[18px] text-[color:var(--color-on-paper)] flex-1">
            Total cost
          </span>
          <div className="w-24 shrink-0 text-right">
            <span className="display-italic text-[24px] text-[color:var(--color-on-paper)] tabular-nums">
              {total}
              <span className="text-[color:var(--color-on-paper-muted)] ml-1 not-italic">k</span>
            </span>
          </div>
        </div>
      </div>

      {/* Rebate parameters panel */}
      <div className="mt-4 bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4">
        <div className="label-caps text-[color:var(--color-brass-deep)] mb-3">
          Filming-in-Croatia rebate
        </div>
        <div className="grid grid-cols-3 gap-6 items-baseline">
          <div className="flex items-baseline justify-between gap-3">
            <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
              qualifying spend
            </span>
            <div className="text-right">
              <EditableNumber
                value={sc.qualifyingSpendPct}
                onChange={(v) =>
                  dispatch({
                    type: 'SET_QS_PCT',
                    scenario: state.activeScenario,
                    value: v,
                  })
                }
                suffix="%"
                min={0}
                max={100}
                size="sm"
              />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
              blended rate
            </span>
            <div className="text-right">
              <EditableNumber
                value={sc.blendedRebateRate}
                onChange={(v) =>
                  dispatch({
                    type: 'SET_REBATE_RATE',
                    scenario: state.activeScenario,
                    value: v,
                  })
                }
                suffix="%"
                min={0}
                max={50}
                size="sm"
              />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-l-[0.5px] border-[color:var(--color-border-paper)] pl-6">
            <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
              rebate
            </span>
            <span className="display-italic text-[20px] text-[color:var(--color-brass-deep)] tabular-nums">
              {reb}
              <span className="not-italic ml-0.5">k</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
