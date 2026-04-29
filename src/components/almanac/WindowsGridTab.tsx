import { useMemo } from 'react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';

/* ---------- WindowsGridTab (Phase 14) ----------
   Big species × month heatmap.
   Cell color: in season (success), out of season (muted), peak month
   (brass — middle of monthsActive run).
   Current month column highlighted across all species. */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_HR = ['Sij', 'Vlj', 'Ožu', 'Tra', 'Svi', 'Lip', 'Srp', 'Kol', 'Ruj', 'Lis', 'Stu', 'Pro'];

export function WindowsGridTab() {
  const { state } = useApp();
  const t = useT();
  const currentMonth = new Date().getMonth() + 1;
  const monthLabels = state.locale === 'hr' ? MONTH_NAMES_HR : MONTH_NAMES;

  /* Sort species by category then nameCro for tidy grouping. */
  const sorted = useMemo(() => {
    const order: Record<string, number> = {
      pelagic: 0,
      demersal: 1,
      cephalopod: 2,
      crustacean: 3,
      shellfish: 4,
      other: 5,
    };
    return [...state.species].sort((a, b) => {
      if (order[a.category] !== order[b.category]) {
        return order[a.category] - order[b.category];
      }
      return a.nameCro.localeCompare(b.nameCro);
    });
  }, [state.species]);

  return (
    <div className="space-y-5">
      <header>
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] leading-tight">
          {t('almanac.windows.title')}
        </h3>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          {t('almanac.windows.subtitle')}
        </p>
      </header>

      {/* Legend */}
      <div className="flex items-center gap-4 prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
        <LegendDot color="var(--color-success)" label={t('almanac.windows.legend.in')} opacity={0.7} />
        <LegendDot color="var(--color-brass)" label={t('almanac.windows.legend.peak')} opacity={0.85} />
        <LegendDot color="var(--color-paper-deep)" label={t('almanac.windows.legend.out')} border />
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="text-[10px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-[color:var(--color-paper-light)] text-left py-2 pr-3 font-normal label-caps text-[color:var(--color-on-paper-faint)] z-10 min-w-[140px]">
                {t('almanac.species.title')}
              </th>
              {monthLabels.map((m, i) => (
                <th
                  key={m}
                  className={`px-1 py-2 text-center font-normal text-[10px] tabular-nums ${
                    i + 1 === currentMonth
                      ? 'text-[color:var(--color-brass-deep)] font-medium'
                      : 'text-[color:var(--color-on-paper-muted)]'
                  }`}
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((sp) => {
              const months = sp.monthsActive ?? [];
              /* Find peak (middle of consecutive run). */
              const peakMonth = computePeakMonth(months);
              return (
                <tr
                  key={sp.id}
                  className="border-t-[0.5px] border-[color:var(--color-border-paper)]/40 hover:bg-[color:var(--color-paper-deep)]/20"
                >
                  <td className="sticky left-0 bg-[color:var(--color-paper-light)] py-1 pr-3 z-10">
                    <div className="display-italic text-[13px] text-[color:var(--color-on-paper)] leading-tight">
                      {sp.nameCro}
                    </div>
                    <div className="prose-body italic text-[9px] text-[color:var(--color-on-paper-faint)] truncate">
                      {sp.scientific}
                    </div>
                  </td>
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthNum = i + 1;
                    const inSeason = months.includes(monthNum);
                    const isPeak = peakMonth === monthNum;
                    const isCurrent = monthNum === currentMonth;
                    return (
                      <td key={i} className="px-0.5 py-0.5 text-center">
                        <div
                          className="w-full h-5 rounded-[2px]"
                          style={{
                            background:
                              inSeason && isPeak
                                ? 'var(--color-brass)'
                                : inSeason
                                ? 'var(--color-success)'
                                : 'var(--color-paper-deep)',
                            opacity: inSeason && isPeak ? 0.85 : inSeason ? 0.5 : 0.3,
                            outline: isCurrent
                              ? '1.5px solid var(--color-on-paper)'
                              : 'none',
                            outlineOffset: '-1px',
                          }}
                          title={`${sp.nameCro} · ${monthLabels[i]} · ${
                            inSeason ? (isPeak ? 'peak' : 'in season') : 'off'
                          }`}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
        Current month column highlighted with a dark outline. Hover any cell for details.
      </div>
    </div>
  );
}

function LegendDot({ color, label, opacity, border }: { color: string; label: string; opacity?: number; border?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`w-3 h-3 rounded-[2px] ${
          border ? 'border-[0.5px] border-[color:var(--color-border-paper)]' : ''
        }`}
        style={{ background: color, opacity: opacity ?? 1 }}
      />
      <span>{label}</span>
    </span>
  );
}

/* Peak month = middle of the longest consecutive run in monthsActive. */
function computePeakMonth(months: number[]): number | null {
  if (months.length === 0) return null;
  if (months.length >= 11) return null; // year-round species — no peak
  /* Sort. Then walk to find longest run, treating Dec→Jan as adjacent. */
  const sorted = [...months].sort((a, b) => a - b);
  /* Build runs as arrays of consecutive months. */
  const runs: number[][] = [];
  let cur: number[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      cur.push(sorted[i]);
    } else {
      runs.push(cur);
      cur = [sorted[i]];
    }
  }
  runs.push(cur);
  /* Wrap-around: if first month is Jan and last is Dec, glue. */
  if (sorted.includes(1) && sorted.includes(12) && runs.length > 1) {
    const first = runs.shift()!;
    const last = runs.pop()!;
    runs.push([...last, ...first.map((m) => m + 12)]);
  }
  /* Pick longest. */
  const longest = runs.reduce((a, b) => (a.length >= b.length ? a : b));
  const mid = longest[Math.floor(longest.length / 2)];
  return ((mid - 1) % 12) + 1;
}
