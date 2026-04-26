import { COST_CATEGORIES } from '../../lib/seed';

interface Props {
  costs: Record<string, number>;
}

/*
  Sorted horizontal bars in brass, descending. Editorial type, hairline track.
*/
export function CostBreakdownChart({ costs }: Props) {
  const items = COST_CATEGORIES.map((c) => ({
    ...c,
    value: costs[c.key] ?? 0,
  }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = items.reduce((s, x) => s + x.value, 0);
  const max = Math.max(0, ...items.map((i) => i.value));

  if (max === 0) {
    return (
      <div className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
        No costs allocated yet.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
          Cost breakdown
        </h3>
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">
          sorted descending
        </span>
      </div>

      <ul className="space-y-2">
        {items.map((c) => {
          const pct = (c.value / max) * 100;
          const share = Math.round((c.value / total) * 100);
          return (
            <li
              key={c.key}
              className="grid grid-cols-[minmax(180px,260px)_1fr_56px_36px] items-center gap-4"
            >
              <span className="prose-body text-[13px] text-[color:var(--color-on-paper)] truncate">
                {c.label}
              </span>
              <div className="h-2 bg-[color:var(--color-paper-deep)]/55 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[color:var(--color-brass)] rounded-full transition-all duration-200"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="display-italic text-[15px] text-[color:var(--color-on-paper)] tabular-nums text-right">
                {c.value}
                <span className="text-[color:var(--color-on-paper-muted)] not-italic ml-0.5">k</span>
              </span>
              <span className="label-caps text-[color:var(--color-on-paper-faint)] tabular-nums text-right">
                {share}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
