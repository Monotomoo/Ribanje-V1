import { useApp } from '../../state/AppContext';
import { HEKTOROVIC_EPIGRAPH } from '../../lib/seed';

export interface Figures {
  cost: number;
  reb: number;
  fund: number;
  sa: number;
  mg: number;
}

export function PitchDeck({ figures }: { figures: Figures }) {
  const { state } = useApp();
  const sc = state.scenarios[state.activeScenario];

  return (
    <article className="space-y-12">
      {/* Page 1 — Title */}
      <Slide>
        <div className="text-center py-12">
          <p className="label-caps text-[color:var(--color-brass-deep)] mb-6">
            a six-episode documentary of the outer Adriatic
          </p>
          <h1 className="display-italic text-[80px] text-[color:var(--color-on-paper)] leading-none">
            Ribanje
          </h1>
          <div className="display-italic text-[20px] text-[color:var(--color-brass)] mt-4">
            ribanje i ribarsko prigovaranje
          </div>
          <div className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mt-2">
            {HEKTOROVIC_EPIGRAPH.line}
          </div>
          <div className="mt-16 grid grid-cols-3 gap-10 pt-10 border-t-[0.5px] border-[color:var(--color-border-brass)]">
            <Stat label="Total budget" value={`${figures.cost}k`} suffix="€" />
            <Stat label="Funding stack" value={`${figures.fund}k`} suffix="€" />
            <Stat label="State aid" value={`${Math.round((figures.sa / Math.max(figures.cost, 1)) * 100)}%`} suffix="cap 50%" />
          </div>
        </div>
      </Slide>

      {/* Page 2 — Logline */}
      <Slide>
        <PageHeader index="i." title="What it is" />
        <p className="prose-body text-[20px] text-[color:var(--color-on-paper)] leading-[1.55] mt-4 max-w-[720px]">
          Six episodes shot across Croatia's outer Adriatic islands in October 2026.
          A literal three-day fishing voyage, half a millennium after Petar
          Hektorović wrote one. Living, observational philosophy: no scripts on
          the boat, what the sea offers it offers.
        </p>
        <div className="grid grid-cols-3 gap-8 mt-12 pt-10 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          <Bullet
            label="Form"
            body="Observational, naturalistic. No voice-over outside Hektorović verse fragments."
          />
          <Bullet
            label="Length"
            body="6 × 50 minutes. Plus an optional special — Po Hektoroviću."
          />
          <Bullet
            label="Tongue"
            body="Croatian on camera (čakavian dialect preserved). English subtitles only."
          />
        </div>
      </Slide>

      {/* Page 3 — Episodes */}
      <Slide>
        <PageHeader index="ii." title="The voyages" />
        <div className="grid grid-cols-2 gap-x-10 gap-y-6 mt-6">
          {state.episodes.map((ep) => (
            <div
              key={ep.id}
              className="flex items-baseline gap-4 pb-4 border-b-[0.5px] border-[color:var(--color-border-paper)]"
            >
              <span className="display-italic text-[28px] text-[color:var(--color-brass)] w-12 shrink-0">
                {roman(ep.number)}.
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="display-italic text-[22px] text-[color:var(--color-on-paper)] leading-tight">
                  {ep.title}
                </h3>
                <p className="prose-body text-[13px] text-[color:var(--color-on-paper)] mt-1">
                  {ep.synopsis}
                </p>
                <div className="label-caps text-[color:var(--color-on-paper-faint)] mt-2">
                  {ep.anchor}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Slide>

      {/* Page 4 — Funding */}
      <Slide>
        <PageHeader index="iii." title="The numbers" />
        <div className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mb-6">
          {state.activeScenario} scenario · all figures in €k
        </div>
        <div className="grid grid-cols-2 gap-12">
          <div>
            <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-3">
              Funding stack
            </h4>
            <ul className="space-y-2">
              {Object.entries(sc.funding).map(([key, value]) => (
                <li
                  key={key}
                  className="flex items-baseline justify-between gap-4 prose-body text-[13px]"
                >
                  <span className="text-[color:var(--color-on-paper)]">
                    {fundingLabel(key)}
                  </span>
                  <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums">
                    {value}k
                  </span>
                </li>
              ))}
              <li className="flex items-baseline justify-between gap-4 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                <span className="prose-body italic text-[13px] text-[color:var(--color-brass-deep)]">
                  Filming-in-Croatia rebate
                </span>
                <span className="display-italic text-[14px] text-[color:var(--color-brass-deep)] tabular-nums">
                  {figures.reb}k
                </span>
              </li>
              <li className="flex items-baseline justify-between gap-4 pt-2 border-t-[0.5px] border-[color:var(--color-border-brass)]">
                <span className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
                  Total funding
                </span>
                <span className="display-italic text-[22px] text-[color:var(--color-on-paper)] tabular-nums">
                  {figures.fund}k €
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-3">
              Cost structure
            </h4>
            <div className="grid grid-cols-1 gap-y-1.5">
              {Object.entries(sc.costs).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-baseline justify-between gap-4 prose-body text-[13px]"
                >
                  <span className="text-[color:var(--color-on-paper)]">
                    {costLabel(key)}
                  </span>
                  <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums">
                    {value}k
                  </span>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 pt-2 mt-1 border-t-[0.5px] border-[color:var(--color-border-brass)]">
                <span className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
                  Total cost
                </span>
                <span className="display-italic text-[22px] text-[color:var(--color-on-paper)] tabular-nums">
                  {figures.cost}k €
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t-[0.5px] border-[color:var(--color-border-brass)] grid grid-cols-3 gap-10">
          <Stat label="Margin" value={`${figures.mg >= 0 ? '+' : ''}${figures.mg}k`} suffix="€" />
          <Stat
            label="State aid share"
            value={`${Math.round((figures.sa / Math.max(figures.cost, 1)) * 100)}%`}
            suffix={`of ${figures.cost}k cap 50%`}
          />
          <Stat label="Episodes" value={String(sc.episodes)} suffix={`× 50 min`} />
        </div>
      </Slide>

      {/* Page 5 — Schedule */}
      <Slide>
        <PageHeader index="iv." title="The arc" />
        <ul className="grid grid-cols-2 gap-x-10 gap-y-4 mt-6">
          {state.schedulePhases.map((p) => (
            <li
              key={p.id}
              className="flex items-baseline gap-4 pb-3 border-b-[0.5px] border-[color:var(--color-border-paper)]"
            >
              <span className="display-italic text-[18px] text-[color:var(--color-on-paper)] flex-1">
                {p.label}
              </span>
              <span className="label-caps text-[color:var(--color-on-paper-muted)] tabular-nums">
                {fmtDate(p.start)} → {fmtDate(p.end)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-3">
            Milestones
          </h4>
          <ul className="grid grid-cols-2 gap-x-10 gap-y-2">
            {state.milestones.map((m) => (
              <li
                key={m.id}
                className="flex items-baseline gap-3 prose-body text-[14px]"
              >
                <span className="text-[color:var(--color-brass)]">◆</span>
                <span className="flex-1 text-[color:var(--color-on-paper)]">{m.label}</span>
                <span className="label-caps text-[color:var(--color-on-paper-faint)] tabular-nums">
                  {fmtDate(m.date)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Slide>

      {/* Page 6 — Team */}
      <Slide>
        <PageHeader index="v." title="The hands" />
        <ul className="grid grid-cols-2 gap-x-10 gap-y-5 mt-6">
          {state.crew.map((m) => (
            <li
              key={m.id}
              className="flex items-baseline gap-4 pb-3 border-b-[0.5px] border-[color:var(--color-border-paper)]"
            >
              <div className="flex-1">
                <h4 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
                  {m.name}
                </h4>
                <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
                  {m.role}
                </p>
              </div>
              {m.rate && (
                <span className="label-caps text-[color:var(--color-brass-deep)]">
                  {m.rate}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Slide>

      {/* Page 7 — Risks */}
      <Slide>
        <PageHeader index="vi." title="What we know we don't know" />
        <ul className="space-y-3 mt-6">
          {state.risks
            .filter(
              (r) =>
                (r.probability === 'high' && r.impact === 'high') ||
                (r.probability === 'high' && r.impact === 'low') ||
                (r.probability === 'low' && r.impact === 'high')
            )
            .map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-[180px_1fr_1fr] gap-6 pb-3 border-b-[0.5px] border-[color:var(--color-border-paper)]"
              >
                <h4 className="display-italic text-[16px] text-[color:var(--color-on-paper)]">
                  {r.title}
                </h4>
                <p className="prose-body text-[13px] text-[color:var(--color-on-paper)]">
                  {r.description}
                </p>
                <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
                  {r.mitigation}
                </p>
              </li>
            ))}
        </ul>
      </Slide>

      {/* Page 8 — Closing */}
      <Slide>
        <div className="text-center py-16">
          <p className="display-italic text-[28px] text-[color:var(--color-on-paper)] leading-snug max-w-[640px] mx-auto">
            "What they catch they catch.
            <br />
            What the sea offers, the sea offers."
          </p>
          <div className="prose-body italic text-[14px] text-[color:var(--color-brass)] mt-10">
            Tomo · producer / director · terminimal
          </div>
        </div>
      </Slide>
    </article>
  );
}

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-[color:var(--color-paper-card)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-14 py-12 print-slide">
      {children}
    </section>
  );
}

function PageHeader({ index, title }: { index: string; title: string }) {
  return (
    <header className="flex items-baseline gap-4 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]">
      <span className="display-italic text-[24px] text-[color:var(--color-brass)]">
        {index}
      </span>
      <h2 className="display-italic text-[36px] text-[color:var(--color-on-paper)] flex-1">
        {title}
      </h2>
    </header>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div>
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
        {label}
      </div>
      <div className="display-italic text-[36px] text-[color:var(--color-on-paper)] leading-none tabular-nums">
        {value}
      </div>
      {suffix && (
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-1">
          {suffix}
        </div>
      )}
    </div>
  );
}

function Bullet({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
        {label}
      </div>
      <p className="prose-body text-[14px] text-[color:var(--color-on-paper)] leading-[1.55]">
        {body}
      </p>
    </div>
  );
}

function roman(n: number): string {
  return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][n] ?? String(n);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

const FUNDING_LABEL: Record<string, string> = {
  ivan: 'Ivan private investment',
  havcDev: 'HAVC development',
  havcProd: 'HAVC production',
  hrt: 'HRT co-production',
  rebate: 'Filming-in-Croatia rebate',
  tourism: 'Tourism boards',
  sponsors: 'Brand sponsors',
  euMedia: 'EU MEDIA',
  intl: 'International co-prod',
};
function fundingLabel(key: string): string {
  return FUNDING_LABEL[key] ?? key;
}

const COST_LABEL: Record<string, string> = {
  tom: "Tom's package",
  eq: 'Other equipment',
  crew: 'Crew',
  tal: 'Talent fees',
  fuel: 'Fuel + dockage',
  tf: 'Travel + accommodation',
  ins: 'Insurance + permits',
  pre: 'Pre-production',
  ed: 'Editor',
  col: 'Color grading',
  sm: 'Sound design + music',
  ai: 'AI tooling + VFX',
  mk: 'Marketing + festivals',
  ct: 'Contingency',
};
function costLabel(key: string): string {
  return COST_LABEL[key] ?? key;
}
