import { FUNDING_SOURCES } from '../../lib/seed';

interface Props {
  funding: Record<string, number>;
  rebate: number;
}

/*
  Editorial proportional stack — single horizontal bar with each funding source
  colored, plus a two-column legend below. Hover tooltip is the native title attribute.
*/
export function FundingStackChart({ funding, rebate }: Props) {
  const segments = FUNDING_SOURCES.map((s) => ({
    ...s,
    value: s.isCalculated ? rebate : funding[s.key] ?? 0,
  })).filter((s) => s.value > 0);

  const total = segments.reduce((sum, x) => sum + x.value, 0);
  if (total === 0) {
    return (
      <div className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
        No funding allocated yet.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
          Funding stack
        </h3>
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">
          {total}k total
        </span>
      </div>

      <div className="flex h-12 rounded-[2px] overflow-hidden border-[0.5px] border-[color:var(--color-border-paper)]">
        {segments.map((s) => (
          <div
            key={s.key}
            style={{
              width: `${(s.value / total) * 100}%`,
              background: s.color,
            }}
            title={`${s.label} · ${s.value}k`}
            className="hover:brightness-110 transition-all duration-150"
          />
        ))}
      </div>

      <ul className="grid grid-cols-2 gap-x-8 gap-y-1.5 mt-5">
        {segments.map((s) => (
          <li key={s.key} className="flex items-baseline gap-2.5">
            <span
              className="w-2 h-2 rounded-full shrink-0 translate-y-[-1px]"
              style={{ background: s.color }}
            />
            <span className="prose-body text-[13px] text-[color:var(--color-on-paper)] flex-1 truncate">
              {s.label}
            </span>
            <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums shrink-0">
              {s.value}
              <span className="text-[color:var(--color-on-paper-muted)] not-italic ml-0.5">k</span>
            </span>
            <span className="label-caps text-[color:var(--color-on-paper-faint)] w-9 text-right tabular-nums shrink-0">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
