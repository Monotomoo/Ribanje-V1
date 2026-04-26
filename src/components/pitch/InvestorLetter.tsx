import { useApp } from '../../state/AppContext';
import type { Figures } from './PitchDeck';

export function InvestorLetter({ figures }: { figures: Figures }) {
  const { state } = useApp();
  const sc = state.scenarios[state.activeScenario];
  const ivan = sc.funding.ivan ?? 0;
  const others = figures.fund - ivan;

  return (
    <article className="bg-[color:var(--color-paper-card)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-16 py-14 max-w-[820px] mx-auto space-y-10 print-slide">
      <header className="border-b-[0.5px] border-[color:var(--color-border-brass)] pb-6">
        <p className="label-caps text-[color:var(--color-brass-deep)] mb-3">
          Investor letter · {state.activeScenario} scenario
        </p>
        <h1 className="display-italic text-[52px] text-[color:var(--color-on-paper)] leading-none">
          Ribanje
        </h1>
        <p className="display-italic text-[18px] text-[color:var(--color-brass)] mt-2">
          a six-episode documentary of the outer Adriatic
        </p>
      </header>

      <section>
        <p className="prose-body text-[16px] text-[color:var(--color-on-paper)] leading-[1.65]">
          Ivane,
        </p>
        <p className="prose-body text-[16px] text-[color:var(--color-on-paper)] leading-[1.65] mt-4">
          Below is the production envelope for <em>Ribanje</em> at the{' '}
          <span className="not-italic display-italic text-[color:var(--color-brass-deep)]">
            {state.activeScenario}
          </span>{' '}
          scenario, all figures in thousands of euros.
        </p>
      </section>

      <section className="grid grid-cols-3 gap-10">
        <Field label="Total cost" value={`${figures.cost}k €`} />
        <Field label="Total funding" value={`${figures.fund}k €`} />
        <Field
          label="Margin"
          value={`${figures.mg >= 0 ? '+' : ''}${figures.mg}k €`}
          tone={figures.mg >= 0 ? 'success' : 'coral'}
        />
      </section>

      <section className="border-t-[0.5px] border-[color:var(--color-border-paper)] pt-6">
        <h2 className="display-italic text-[22px] text-[color:var(--color-on-paper)] mb-4">
          Capital structure
        </h2>
        <ul className="space-y-2">
          <Row
            label={`Your private investment`}
            value={`${ivan}k`}
            italic="anchor capital"
          />
          <Row
            label="Croatian funding stack"
            value={`${others - figures.reb}k`}
            italic="HAVC dev + production · HRT co-production · tourism boards · brand sponsors · EU"
          />
          <Row
            label="Filming-in-Croatia rebate"
            value={`${figures.reb}k`}
            italic={`${sc.qualifyingSpendPct}% qualifying spend × ${sc.blendedRebateRate}% blended rate`}
          />
          <Row
            label="Total"
            value={`${figures.fund}k`}
            bold
          />
        </ul>
      </section>

      <section className="border-t-[0.5px] border-[color:var(--color-border-paper)] pt-6">
        <h2 className="display-italic text-[22px] text-[color:var(--color-on-paper)] mb-3">
          State aid compliance
        </h2>
        <p className="prose-body text-[15px] text-[color:var(--color-on-paper)] leading-[1.6]">
          Croatian regulation caps state aid at 50 percent of total budget.{' '}
          <span className="not-italic display-italic text-[color:var(--color-brass-deep)]">
            {Math.round((figures.sa / Math.max(figures.cost, 1)) * 100)}%
          </span>{' '}
          of this scenario qualifies as state aid ({figures.sa}k of {figures.cost}k).
        </p>
      </section>

      <section className="border-t-[0.5px] border-[color:var(--color-border-paper)] pt-6">
        <h2 className="display-italic text-[22px] text-[color:var(--color-on-paper)] mb-3">
          What you'd be backing
        </h2>
        <p className="prose-body text-[15px] text-[color:var(--color-on-paper)] leading-[1.65]">
          Six episodes shot across Croatia's outer Adriatic in October 2026 —
          Dubrovnik to Istria. Observational philosophy, no scripts on the boat,
          built around your craft as a sailor and Rene's encyclopedic palate.
          Tom Lebarić shoots, Marko cuts. The DNA traces back to Hektorović's
          1568 fishing voyage; the cast is the show.
        </p>
        <p className="prose-body text-[15px] text-[color:var(--color-on-paper)] leading-[1.65] mt-3">
          Per-diem and back-end equity for both you and Rene. Tomo bridges
          creative and execution; the producer's instrument you're reading is
          his vouch that the production is sound.
        </p>
      </section>

      <footer className="pt-6 border-t-[0.5px] border-[color:var(--color-border-brass)]">
        <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
          With salt and patience,
        </p>
        <p className="display-italic text-[24px] text-[color:var(--color-on-paper)] mt-2">
          Tomo
        </p>
        <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-1">
          producer · director · terminimal
        </p>
      </footer>
    </article>
  );
}

function Field({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'coral';
}) {
  const valueColor =
    tone === 'success'
      ? 'text-[color:var(--color-success)]'
      : tone === 'coral'
      ? 'text-[color:var(--color-coral-deep)]'
      : 'text-[color:var(--color-on-paper)]';
  return (
    <div>
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
        {label}
      </div>
      <div
        className={`display-italic text-[36px] leading-none tabular-nums ${valueColor}`}
      >
        {value}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  italic,
  bold,
}: {
  label: string;
  value: string;
  italic?: string;
  bold?: boolean;
}) {
  return (
    <li className="flex items-baseline gap-4 pb-2 border-b-[0.5px] border-[color:var(--color-border-paper)]">
      <div className="flex-1">
        <span
          className={`prose-body text-[15px] text-[color:var(--color-on-paper)] ${
            bold ? 'display-italic text-[18px]' : ''
          }`}
        >
          {label}
        </span>
        {italic && (
          <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            {italic}
          </p>
        )}
      </div>
      <span
        className={`display-italic text-[color:var(--color-on-paper)] tabular-nums ${
          bold ? 'text-[24px]' : 'text-[18px]'
        }`}
      >
        {value}
      </span>
    </li>
  );
}
