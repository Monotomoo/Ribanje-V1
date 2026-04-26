import { useApp } from '../../state/AppContext';
import type { RiskCategory, ViewKey } from '../../types';
import { riskSummary } from '../../lib/selectors';

interface Props {
  onJump?: (view: ViewKey) => void;
}

const CATEGORY_COLOR: Record<RiskCategory, string> = {
  weather: '#3D7280',
  equipment: '#788064',
  talent: '#C9A961',
  regulatory: '#8C5C7A',
  financial: '#C26A4A',
  operational: '#2D4A6B',
  post: '#B86B58',
  health: '#6B9080',
  legal: '#4A6B91',
};

export function RiskProfile({ onJump }: Props) {
  const { state } = useApp();
  const sum = riskSummary(state);

  /* Bucket by category */
  const byCategory: Record<string, number> = {};
  for (const r of state.risks) {
    const c = r.category ?? 'operational';
    byCategory[c] = (byCategory[c] ?? 0) + 1;
  }

  /* 5×5 mini-matrix */
  const cells: number[][] = Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => 0)
  );
  for (const r of state.risks) {
    const p =
      (r.probabilityScale ?? (r.probability === 'high' ? 4 : 2)) - 1;
    const i = (r.impactScale ?? (r.impact === 'high' ? 4 : 2)) - 1;
    const pi = Math.max(0, Math.min(4, p));
    const ii = Math.max(0, Math.min(4, i));
    cells[pi][ii] += 1;
  }

  /* Reduction % from raw → residual */
  const reduction =
    sum.totalScore > 0
      ? Math.round(
          ((sum.totalScore - sum.residualScore) / sum.totalScore) * 100
        )
      : 0;

  return (
    <section className="grid grid-cols-3 gap-5">
      {/* Stats */}
      <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
        <header className="mb-4 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Risk profile
          </h3>
          <button
            type="button"
            onClick={() => onJump?.('risks')}
            className="label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)]"
          >
            open →
          </button>
        </header>
        <div className="grid grid-cols-2 gap-y-4">
          <Stat label="Total" value={`${sum.total}`} sub="logged risks" />
          <Stat
            label="Critical"
            value={`${sum.highHigh}`}
            sub="P≥4 × I≥4"
            tone={sum.highHigh > 0 ? 'coral' : 'success'}
          />
          <Stat
            label="Mitigated"
            value={`${sum.mitigated}`}
            sub={`of ${sum.total}`}
            tone="success"
          />
          <Stat
            label="Reduction"
            value={`${reduction}%`}
            sub="raw → residual score"
            tone={reduction >= 30 ? 'success' : 'brass'}
          />
        </div>
      </article>

      {/* 5×5 matrix */}
      <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
        <header className="mb-3 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            5 × 5 matrix
          </h3>
          <span className="label-caps text-[color:var(--color-on-paper-faint)]">
            P × I
          </span>
        </header>
        <div className="grid grid-cols-[20px_repeat(5,1fr)] gap-1">
          <div />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="label-caps text-center text-[color:var(--color-on-paper-faint)]"
            >
              I{i}
            </div>
          ))}
          {[5, 4, 3, 2, 1].map((p) => (
            <Row key={p} p={p} cells={cells} />
          ))}
        </div>
      </article>

      {/* By category */}
      <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
        <header className="mb-4 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            By category
          </h3>
        </header>
        <ul className="space-y-2">
          {Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => {
              const color =
                CATEGORY_COLOR[cat as RiskCategory] ?? 'var(--color-brass)';
              return (
                <li
                  key={cat}
                  className="grid grid-cols-[12px_1fr_30px] items-baseline gap-3"
                >
                  <span
                    className="w-2 h-2 rounded-full mt-1.5"
                    style={{ background: color }}
                  />
                  <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] capitalize">
                    {cat.replace('-', ' ')}
                  </span>
                  <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums text-right">
                    {count}
                  </span>
                </li>
              );
            })}
        </ul>
      </article>
    </section>
  );
}

function Row({ p, cells }: { p: number; cells: number[][] }) {
  return (
    <>
      <div className="label-caps text-right text-[color:var(--color-on-paper-faint)] pr-1 self-center">
        P{p}
      </div>
      {[1, 2, 3, 4, 5].map((i) => {
        const count = cells[p - 1][i - 1];
        const score = p * i;
        const bg =
          score >= 16
            ? 'rgba(194,106,74,0.20)'
            : score >= 9
            ? 'rgba(217,169,62,0.18)'
            : 'rgba(120,128,100,0.10)';
        return (
          <div
            key={i}
            className="aspect-square border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] flex items-center justify-center"
            style={{ background: bg }}
          >
            {count > 0 && (
              <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums">
                {count}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'success' | 'brass' | 'coral';
}) {
  const valueColor =
    tone === 'success'
      ? 'text-[color:var(--color-success)]'
      : tone === 'brass'
      ? 'text-[color:var(--color-brass-deep)]'
      : tone === 'coral'
      ? 'text-[color:var(--color-coral-deep)]'
      : 'text-[color:var(--color-on-paper)]';
  return (
    <div>
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
        {label}
      </div>
      <div className={`display-italic text-[20px] tabular-nums ${valueColor}`}>
        {value}
      </div>
      {sub && (
        <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}
