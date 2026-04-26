import { useMemo } from 'react';
import { TrendingDown, Wind } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Risk, RiskCategory } from '../../types';

const CATEGORY_ORDER: RiskCategory[] = [
  'weather',
  'equipment',
  'talent',
  'regulatory',
  'financial',
  'operational',
  'post',
  'health',
  'legal',
];

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

/* Risk burn-down — compares raw risk score (P × I) against residual score
   (post-mitigation). The "burn-down" is the gap. Per-category breakdown shows
   which axes have moved and which still need work. */
export function RiskBurnDown() {
  const { state } = useApp();

  const data = useMemo(() => {
    const byCat = new Map<RiskCategory, { raw: number; residual: number; count: number }>();
    for (const c of CATEGORY_ORDER) {
      byCat.set(c, { raw: 0, residual: 0, count: 0 });
    }
    let totalRaw = 0;
    let totalResidual = 0;
    for (const r of state.risks) {
      const raw = (r.probabilityScale ?? 0) * (r.impactScale ?? 0);
      const residual = (r.residualP ?? r.probabilityScale ?? 0) * (r.residualI ?? r.impactScale ?? 0);
      totalRaw += raw;
      totalResidual += residual;
      const cat = r.category ?? 'operational';
      const slot = byCat.get(cat) ?? { raw: 0, residual: 0, count: 0 };
      slot.raw += raw;
      slot.residual += residual;
      slot.count += 1;
      byCat.set(cat, slot);
    }
    return { byCat, totalRaw, totalResidual };
  }, [state.risks]);

  const burnDownPct = data.totalRaw === 0
    ? 0
    : Math.round(((data.totalRaw - data.totalResidual) / data.totalRaw) * 100);

  /* Weather-related risks for the weather pane */
  const weatherRisks = state.risks.filter((r) => r.category === 'weather');

  return (
    <section className="space-y-6">
      <header className="flex items-baseline gap-3">
        <TrendingDown size={13} className="text-[color:var(--color-brass-deep)]" />
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          Burn-down · raw vs residual
        </h3>
        <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          mitigation work paying off
        </span>
      </header>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-5">
        <Stat
          label="Total raw score"
          value={String(data.totalRaw)}
          sub={`${state.risks.length} risk${state.risks.length === 1 ? '' : 's'}`}
        />
        <Stat
          label="Residual score"
          value={String(data.totalResidual)}
          sub="after mitigation"
          tone="success"
        />
        <Stat
          label="Burn-down %"
          value={`${burnDownPct}%`}
          sub={burnDownPct > 50 ? 'strong mitigation' : 'more work needed'}
          tone={burnDownPct > 50 ? 'success' : 'warn'}
        />
      </div>

      {/* Per-category bar comparison */}
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4">
        <h4 className="display-italic text-[16px] text-[color:var(--color-on-paper)] mb-3">
          By category
        </h4>
        <ul className="space-y-3">
          {CATEGORY_ORDER.map((cat) => {
            const slot = data.byCat.get(cat);
            if (!slot || slot.count === 0) return null;
            const maxScale = Math.max(data.totalRaw / 3, 25);
            const rawW = (slot.raw / maxScale) * 100;
            const resW = (slot.residual / maxScale) * 100;
            return (
              <li key={cat} className="grid grid-cols-[120px_1fr_80px] items-center gap-4">
                <span className="display-italic text-[13px] text-[color:var(--color-on-paper)]">
                  {cat}
                  <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] ml-1.5">
                    {slot.count}
                  </span>
                </span>
                <div className="space-y-1">
                  <div className="relative h-2 bg-[color:var(--color-paper-deep)]/30 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full opacity-40"
                      style={{ width: `${Math.min(100, rawW)}%`, background: CATEGORY_COLOR[cat] }}
                    />
                  </div>
                  <div className="relative h-2 bg-[color:var(--color-paper-deep)]/30 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${Math.min(100, resW)}%`, background: CATEGORY_COLOR[cat] }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums">
                    {slot.residual}
                  </span>
                  <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] ml-1">
                    / {slot.raw}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline gap-4 mt-4 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)] prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
          <span className="flex items-baseline gap-1.5">
            <span className="inline-block w-3 h-1.5 rounded-full bg-[color:var(--color-brass-deep)]/40" />
            raw
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="inline-block w-3 h-1.5 rounded-full bg-[color:var(--color-brass-deep)]" />
            residual (post-mitigation)
          </span>
        </div>
      </div>

      {/* Weather pane */}
      <WeatherPane risks={weatherRisks} />
    </section>
  );
}

function WeatherPane({ risks }: { risks: Risk[] }) {
  const totalRaw = risks.reduce(
    (s, r) => s + (r.probabilityScale ?? 0) * (r.impactScale ?? 0),
    0
  );
  const totalResidual = risks.reduce(
    (s, r) =>
      s +
      (r.residualP ?? r.probabilityScale ?? 0) *
        (r.residualI ?? r.impactScale ?? 0),
    0
  );

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
      <header className="flex items-baseline justify-between mb-4 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
        <div className="flex items-baseline gap-3">
          <Wind size={13} className="text-[color:var(--color-brass-deep)]" />
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Weather pane
          </h3>
          <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
            October 2026 · the most volatile month
          </span>
        </div>
        <div className="flex items-baseline gap-4">
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
            raw <span className="display-italic text-[15px] text-[color:var(--color-on-paper)] tabular-nums ml-1">{totalRaw}</span>
          </span>
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
            residual <span className="display-italic text-[15px] text-[color:var(--color-success)] tabular-nums ml-1">{totalResidual}</span>
          </span>
        </div>
      </header>

      {risks.length === 0 ? (
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)]">
          No weather risks logged yet. Bura, jugo, autumn squalls all live here.
        </p>
      ) : (
        <ul className="space-y-2">
          {risks.map((r) => (
            <li
              key={r.id}
              className="grid grid-cols-[1fr_70px_70px_140px] items-baseline gap-4 py-1.5 border-b-[0.5px] border-[color:var(--color-border-paper)]/60 last:border-b-0"
            >
              <span className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
                {r.title}
              </span>
              <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] tabular-nums">
                P{r.probabilityScale ?? '—'} I{r.impactScale ?? '—'}
              </span>
              <span className="prose-body italic text-[12px] text-[color:var(--color-success)] tabular-nums">
                → P{r.residualP ?? '—'} I{r.residualI ?? '—'}
              </span>
              <span className="label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-brass-deep)]">
                {r.status ?? 'open'}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] mt-4 leading-relaxed">
        Forecast notes during shoot live in <strong className="font-normal not-italic text-[color:var(--color-brass-deep)]">Production / Boat ops</strong>.
        Risk mitigation log lives per-risk. This pane is the rollup.
      </p>
    </section>
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
  tone?: 'success' | 'warn';
}) {
  const valueColor =
    tone === 'success'
      ? 'text-[color:var(--color-success)]'
      : tone === 'warn'
      ? 'text-[color:var(--color-warn)]'
      : 'text-[color:var(--color-on-paper)]';
  return (
    <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4">
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">{label}</div>
      <div className={`display-italic text-[28px] tabular-nums leading-none ${valueColor}`}>
        {value}
      </div>
      {sub && (
        <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1">
          {sub}
        </div>
      )}
    </div>
  );
}
