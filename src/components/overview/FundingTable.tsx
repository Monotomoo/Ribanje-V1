import { useApp } from '../../state/AppContext';
import { FUNDING_SOURCES } from '../../lib/seed';
import { EditableNumber } from '../primitives/EditableNumber';
import { totalFunding } from '../../lib/finance';

interface Props {
  rebate: number;
}

/*
  Editable funding sources table.
  Rebate row is calculated, not editable — shown dim with a small tag.
*/
export function FundingTable({ rebate }: Props) {
  const { state, dispatch } = useApp();
  const sc = state.scenarios[state.activeScenario];
  const total = totalFunding(sc.funding, rebate);

  return (
    <section>
      <header className="flex items-baseline justify-between mb-4">
        <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
          Funding sources
        </h2>
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">
          €k · click any value to edit
        </span>
      </header>

      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px]">
        {FUNDING_SOURCES.map((src, i) => {
          const isCalc = !!src.isCalculated;
          const value = isCalc ? rebate : sc.funding[src.key] ?? 0;
          return (
            <div
              key={src.key}
              className={`flex items-baseline px-5 py-3 gap-4 ${
                i > 0 ? 'border-t-[0.5px] border-[color:var(--color-border-paper)]' : ''
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: src.color }}
              />
              <span className="prose-body text-[14px] text-[color:var(--color-on-paper)] flex-1">
                {src.label}
              </span>
              <span
                className={`label-caps shrink-0 w-16 text-right ${
                  src.tag === 'state'
                    ? 'text-[color:var(--color-dock-deep)]'
                    : 'text-[color:var(--color-brass-deep)]'
                }`}
              >
                {src.tag}
              </span>
              <div className="w-24 shrink-0 text-right">
                {isCalc ? (
                  <span className="prose-body italic text-[18px] text-[color:var(--color-on-paper-muted)] tabular-nums">
                    {value}
                    <span className="text-[color:var(--color-on-paper-faint)] ml-0.5 not-italic">
                      k
                    </span>
                  </span>
                ) : (
                  <EditableNumber
                    value={value}
                    onChange={(v) =>
                      dispatch({
                        type: 'SET_FUNDING',
                        scenario: state.activeScenario,
                        key: src.key,
                        value: v,
                      })
                    }
                    suffix="k"
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Total row */}
        <div className="flex items-baseline px-5 py-4 gap-4 border-t-[0.5px] border-[color:var(--color-border-brass)] bg-[color:var(--color-paper-deep)]/30">
          <span className="w-2 shrink-0" />
          <span className="display-italic text-[18px] text-[color:var(--color-on-paper)] flex-1">
            Total funding
          </span>
          <span className="w-16 shrink-0" />
          <div className="w-24 shrink-0 text-right">
            <span className="display-italic text-[24px] text-[color:var(--color-on-paper)] tabular-nums">
              {total}
              <span className="text-[color:var(--color-on-paper-muted)] ml-1 not-italic">k</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
