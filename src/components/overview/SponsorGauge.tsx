import { useApp } from '../../state/AppContext';
import { sponsorHealth } from '../../lib/selectors';
import type { ViewKey } from '../../types';

interface Props {
  onJump?: (view: ViewKey) => void;
}

export function SponsorGauge({ onJump }: Props) {
  const { state } = useApp();
  const health = sponsorHealth(state);

  /* Tier breakdown */
  const tier1 = state.sponsors.filter((s) => s.tier === 1);
  const tier2 = state.sponsors.filter((s) => s.tier === 2);
  const tier3 = state.sponsors.filter((s) => s.tier === 3);

  /* Status breakdown */
  const prospect = state.sponsors.filter((s) => s.status === 'prospect').length;
  const contacted = state.sponsors.filter((s) => s.status === 'contacted').length;
  const pitched = state.sponsors.filter((s) => s.status === 'pitched').length;
  const committed = state.sponsors.filter((s) => s.status === 'committed').length;

  /* Outreach activity */
  const recentOutreach = state.outreachContacts
    .filter((c) => {
      const t = new Date(c.date).getTime();
      return Date.now() - t < 30 * 24 * 60 * 60 * 1000;
    }).length;

  return (
    <section className="grid grid-cols-3 gap-5">
      {/* Goals gauge */}
      <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
        <header className="mb-4 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Sponsor goals
          </h3>
          <button
            type="button"
            onClick={() => onJump?.('sponsors')}
            className="label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)]"
          >
            open →
          </button>
        </header>

        <div className="grid grid-cols-2 gap-y-4">
          <Stat label="Target" value={`${health.target}k`} sub="€ pipeline" />
          <Stat
            label="Committed"
            value={`${health.committed}k`}
            sub={`${Math.round(health.pctToTarget)}% to target`}
            tone="success"
          />
          <Stat label="Pitched" value={`${health.pitched}k`} sub="awaiting" tone="brass" />
          <Stat
            label="Gap"
            value={`${health.gap}k`}
            sub="left to close"
            tone={health.gap === 0 ? 'success' : 'coral'}
          />
        </div>

        {health.target > 0 && (
          <div className="mt-4 pt-4 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            <div className="flex h-2 rounded-full overflow-hidden bg-[color:var(--color-paper-deep)]/40">
              <div
                style={{ width: `${(health.committed / health.target) * 100}%` }}
                className="bg-[color:var(--color-success)]"
              />
              <div
                style={{ width: `${(health.pitched / health.target) * 100}%` }}
                className="bg-[color:var(--color-brass)]"
              />
            </div>
            <div className="flex items-baseline justify-between mt-1 prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)]">
              <span>committed</span>
              <span>pitched</span>
              <span>gap</span>
            </div>
          </div>
        )}
      </article>

      {/* Pipeline funnel */}
      <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
        <header className="mb-4 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Pipeline funnel
          </h3>
        </header>
        <ul className="space-y-3">
          <FunnelRow label="Prospect" count={prospect} max={state.sponsors.length} color="rgba(14,30,54,0.35)" />
          <FunnelRow label="Contacted" count={contacted} max={state.sponsors.length} color="var(--color-dock)" />
          <FunnelRow label="Pitched" count={pitched} max={state.sponsors.length} color="var(--color-brass)" />
          <FunnelRow label="Committed" count={committed} max={state.sponsors.length} color="var(--color-success)" />
        </ul>
        <div className="mt-4 pt-4 border-t-[0.5px] border-[color:var(--color-border-paper)] prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          {recentOutreach > 0
            ? `${recentOutreach} outreach contact${recentOutreach === 1 ? '' : 's'} logged in the last 30 days`
            : 'no outreach logged this month'}
        </div>
      </article>

      {/* By tier */}
      <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
        <header className="mb-4 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            By tier
          </h3>
        </header>
        <ul className="space-y-3">
          <TierRow
            label="Tier I"
            sponsors={tier1}
            sub="institutional partners"
          />
          <TierRow
            label="Tier II"
            sponsors={tier2}
            sub="regional anchors"
          />
          <TierRow
            label="Tier III"
            sponsors={tier3}
            sub="equipment partners"
          />
        </ul>
      </article>
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

function FunnelRow({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  return (
    <li className="grid grid-cols-[100px_1fr_30px] items-baseline gap-3">
      <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
        {label}
      </span>
      <div className="h-1.5 bg-[color:var(--color-paper-deep)]/55 rounded-full overflow-hidden">
        <div
          style={{
            width: `${max > 0 ? (count / max) * 100 : 0}%`,
            background: color,
          }}
          className="h-full rounded-full transition-all duration-300"
        />
      </div>
      <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums text-right">
        {count}
      </span>
    </li>
  );
}

function TierRow({
  label,
  sponsors,
  sub,
}: {
  label: string;
  sponsors: { id: string; name: string; expectedAmount: number }[];
  sub: string;
}) {
  const total = sponsors.reduce((s, x) => s + x.expectedAmount, 0);
  return (
    <li>
      <div className="flex items-baseline justify-between mb-1">
        <span className="display-italic text-[15px] text-[color:var(--color-on-paper)]">
          {label}
        </span>
        <span className="display-italic text-[15px] text-[color:var(--color-brass-deep)] tabular-nums">
          {total}k
        </span>
      </div>
      <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
        {sponsors.length} sponsor{sponsors.length === 1 ? '' : 's'} · {sub}
      </div>
    </li>
  );
}
