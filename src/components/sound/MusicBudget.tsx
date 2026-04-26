import { useMemo } from 'react';
import { Coins } from 'lucide-react';
import { useApp } from '../../state/AppContext';

interface BudgetLine {
  label: string;
  amount: number;
  color: string;
  notes?: string;
}

/* Music budget breakdown — derived from existing klapa fee estimates,
   plus broad category lines (sound design, mix, composer if commissioning).
   Visualised as a stacked bar so the proportions read at a glance. */
export function MusicBudget() {
  const { state } = useApp();

  const lines = useMemo<BudgetLine[]>(() => {
    const klapaFees = state.klapa.reduce((s, k) => s + (k.feeEstimateK ?? 0), 0);
    const cueLicensing = state.cueSheet
      .filter((c) => c.rightsStatus === 'pending' || c.rightsStatus === 'unknown').length * 2;

    /* Assumed lines based on Croatian cultural-doc benchmarks */
    return [
      {
        label: 'Klapa licensing',
        amount: klapaFees,
        color: '#C9A961',
        notes: `${state.klapa.length} song${state.klapa.length === 1 ? '' : 's'} in pipeline · sum of fee estimates`,
      },
      {
        label: 'Additional cue licensing',
        amount: cueLicensing,
        color: '#A8884A',
        notes: `${cueLicensing} buffer · pending or unknown rights cues`,
      },
      {
        label: 'Sound design + mix',
        amount: 18,
        color: '#788064',
        notes: '~3k per episode for mix; design across delivery; estimate refines once mix studio booked',
      },
      {
        label: 'Composer (commissioned)',
        amount: 8,
        color: '#3D7280',
        notes: 'For original Hektorović verse settings if commissioned',
      },
      {
        label: 'Sound studio + facility',
        amount: 4,
        color: '#8C5C7A',
        notes: 'Mix-stage rental for 5.1 + stereo + M&E delivery',
      },
    ];
  }, [state.klapa, state.cueSheet]);

  const total = lines.reduce((s, l) => s + l.amount, 0);
  /* Get budget line `sm` from current scenario costs */
  const sc = state.scenarios[state.activeScenario];
  const allocated = sc?.costs?.sm ?? 0;
  const variance = total - allocated;

  return (
    <section>
      <header className="flex items-baseline justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <Coins size={13} className="text-[color:var(--color-brass-deep)]" />
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
            Music budget breakdown
          </h3>
        </div>
        <div className="flex items-baseline gap-5">
          <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
            estimate{' '}
            <span className="display-italic text-[18px] text-[color:var(--color-on-paper)] tabular-nums ml-1">
              {total}k €
            </span>
          </span>
          <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
            allocated{' '}
            <span className="display-italic text-[18px] text-[color:var(--color-on-paper)] tabular-nums ml-1">
              {allocated}k €
            </span>
          </span>
          <span
            className={`prose-body italic text-[12px] ${
              variance > 0
                ? 'text-[color:var(--color-coral-deep)]'
                : 'text-[color:var(--color-success)]'
            }`}
          >
            variance{' '}
            <span className="display-italic text-[18px] tabular-nums ml-1">
              {variance > 0 ? '+' : ''}
              {variance}k
            </span>
          </span>
        </div>
      </header>

      {/* Stacked bar */}
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-5">
        <div className="flex h-3 rounded-full overflow-hidden bg-[color:var(--color-paper-deep)]/30">
          {lines.map((l) => {
            const pct = total > 0 ? (l.amount / total) * 100 : 0;
            return (
              <div
                key={l.label}
                style={{ width: `${pct}%`, background: l.color }}
                className="h-full"
                title={`${l.label} · ${l.amount}k €`}
              />
            );
          })}
        </div>

        <ul className="mt-4 space-y-2">
          {lines.map((l) => (
            <li
              key={l.label}
              className="grid grid-cols-[16px_180px_60px_1fr] gap-3 items-baseline"
            >
              <span
                className="inline-block w-3 h-3 rounded-[2px] mt-0.5"
                style={{ background: l.color }}
              />
              <span className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
                {l.label}
              </span>
              <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums">
                {l.amount}k €
              </span>
              <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] leading-relaxed">
                {l.notes}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] mt-3 leading-relaxed max-w-[700px]">
        Klapa licensing draws from the rights-status fees you log in the Klapa &amp; rights tab.
        The other lines are working benchmarks for a Croatian-language cultural doc — refine
        as the mix studio + composer get booked. The variance compares against the{' '}
        <code className="font-sans not-italic">sm</code> cost line in the current scenario.
      </p>
    </section>
  );
}
