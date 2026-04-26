import { useApp } from '../../state/AppContext';

const TEMPLATES: Record<1 | 2 | 3, { headline: string; body: string }> = {
  1: {
    headline: 'A six-episode home for {sponsor}',
    body: `{sponsor} fits {ribanje} where the show needs an institutional partner the audience already trusts.

We are filming {episodes_window} across Croatia's outer Adriatic islands — observational philosophy, three-day fishing voyages echoing Hektorović 1568. The pitch we're making is integration, not branding: {sponsor}'s presence on screen as the partner who made it possible to get to {category_anchor}.

Tier I expectation is {amount}k €, with on-screen presence in two episodes, end-credit thanks across all six, and access to all promotional materials. We're committing to a one-page brand-fit memo in advance of any shoot day where {sponsor} is on camera.`,
  },
  2: {
    headline: '{sponsor} as a regional anchor',
    body: `Ribanje needs partners with regional roots — {sponsor} brings exactly that.

We'd be honored to feature {sponsor} as a Tier II partner: on-screen presence in one episode, end-credit thanks across all six, and a shared piece of promotional material at launch. Tier II contribution is {amount}k €.

The show treats sponsors the way the 1568 voyage treated its hosts: with named credit, on-screen presence at human scale, and the clear intention that what {sponsor} stands for is part of the story, not a placement.`,
  },
  3: {
    headline: '{sponsor} as an equipment partner',
    body: `Ribanje is a 30-day production at sea. The kit will be visible — and credited.

We propose a Tier III equipment-partner relationship with {sponsor}: in-kind product credit valued at {amount}k €, on-screen kit presence where natural, end-credit equipment-partner card.

This is the format Sennheiser, SanDisk, Garmin and others use on observational documentaries. We'd love to add {sponsor} to that list.`,
  },
};

export function SponsorTemplates() {
  const { state } = useApp();
  const tiers: (1 | 2 | 3)[] = [1, 2, 3];

  return (
    <article className="space-y-10">
      {tiers.map((tier) => {
        const sponsors = state.sponsors.filter((s) => s.tier === tier);
        if (sponsors.length === 0) return null;
        return (
          <TierBlock
            key={tier}
            tier={tier}
            sponsorNames={sponsors.map((s) => s.name)}
          />
        );
      })}
    </article>
  );
}

function TierBlock({
  tier,
  sponsorNames,
}: {
  tier: 1 | 2 | 3;
  sponsorNames: string[];
}) {
  const t = TEMPLATES[tier];
  const sample = sponsorNames[0] ?? '{sponsor}';
  const fill = (s: string, sponsor: string, amount: number, category: string) =>
    s
      .replaceAll('{sponsor}', sponsor)
      .replaceAll('{ribanje}', 'Ribanje')
      .replaceAll('{episodes_window}', 'October 2026')
      .replaceAll('{category_anchor}', category)
      .replaceAll('{amount}', String(amount));

  const tierDefaults: Record<1 | 2 | 3, { amount: number; category: string }> = {
    1: { amount: 30, category: 'the islands' },
    2: { amount: 12, category: 'the region' },
    3: { amount: 5, category: 'the boat' },
  };
  const def = tierDefaults[tier];

  return (
    <section className="bg-[color:var(--color-paper-card)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-12 py-10 print-slide">
      <header className="flex items-baseline justify-between border-b-[0.5px] border-[color:var(--color-border-brass)] pb-4 mb-6">
        <div>
          <span className="label-caps text-[color:var(--color-brass-deep)] mb-1 block">
            Sponsor tier {tier === 1 ? 'I' : tier === 2 ? 'II' : 'III'}
          </span>
          <h2 className="display-italic text-[36px] text-[color:var(--color-on-paper)] leading-tight">
            {fill(t.headline, sample, def.amount, def.category)}
          </h2>
        </div>
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">
          {sponsorNames.length} prospects
        </span>
      </header>

      <pre className="prose-body text-[15px] text-[color:var(--color-on-paper)] leading-[1.7] whitespace-pre-wrap font-[var(--font-body)]">
        {fill(t.body, sample, def.amount, def.category)}
      </pre>

      <div className="mt-6 pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        <span className="label-caps text-[color:var(--color-brass-deep)] block mb-2">
          Pipeline ({sponsorNames.length})
        </span>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-1 prose-body text-[13px] text-[color:var(--color-on-paper)]">
          {sponsorNames.map((n) => (
            <li key={n} className="flex items-baseline gap-2">
              <span className="text-[color:var(--color-brass)]">·</span>
              {n}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
