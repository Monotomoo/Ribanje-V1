import { useState } from 'react';
import { Layers } from 'lucide-react';

type Audience = 'general' | 'hrt' | 'eu-media' | 'sponsor' | 'festival';

interface AudienceProfile {
  key: Audience;
  label: string;
  hint: string;
  emphasis: string[];
  slideOrder: string[];
  warning?: string;
}

const AUDIENCES: AudienceProfile[] = [
  {
    key: 'general',
    label: 'General',
    hint: 'The default deck · master version',
    emphasis: [
      'Logline + theme',
      'Hektorović spine',
      'Episode arcs',
      'Visual identity',
      'Team',
      'Schedule',
      'Budget summary',
    ],
    slideOrder: [
      'Title · italic Fraunces',
      'Logline + 50-word synopsis',
      'Hektorović 1568 epigraph',
      '6 episodes · arc grid',
      'Visual identity stills',
      'Team · Tom\'s Trinity reel',
      'Schedule overview',
      'Budget summary',
      'Asks + contact',
    ],
  },
  {
    key: 'hrt',
    label: 'HRT',
    hint: 'Croatian national broadcaster · cultural mandate',
    emphasis: [
      'Croatian cultural heritage front-loaded',
      'Hektorović + Marulić scholarship',
      'Klapa + dialect preservation',
      'Local crew + locations · economic impact',
      'HRT funding line + timeline integration',
      'Drop pan-EU framing',
    ],
    slideOrder: [
      'Title with HRT slot framing',
      'Croatian cultural heritage statement',
      'Hektorović scholarship · Dalmatian humanism',
      'Klapa + dialect preservation argument',
      'Croatian crew + Croatian locations economic impact',
      '6 episodes · Croatian arc',
      'HRT timeline · funding integration',
      'Asks + HRT-specific reciprocity',
    ],
    warning: 'Lead with cultural mandate, not festival-circuit aspirations.',
  },
  {
    key: 'eu-media',
    label: 'EU MEDIA',
    hint: 'EU-wide cultural fund · pan-European resonance',
    emphasis: [
      'Pan-European theme · Mediterranean cultural arc',
      'Co-production potential · ARTE / 3sat partnership track',
      'Dalmatian humanism in European literary canon',
      'Festival circuit + cultural-policy angle',
      'EU MEDIA programme alignment criteria',
      'Cross-border cultural exchange',
    ],
    slideOrder: [
      'Title with EU framing',
      'Mediterranean cultural arc statement',
      'Hektorović as European literary figure',
      'Co-pro pipeline · ARTE / ZDF',
      'Pan-EU theme · slow living, food, sea, language',
      '6 episodes · European resonance',
      'EU MEDIA criteria checklist',
      'Asks + reciprocal value',
    ],
    warning: 'Emphasise pan-EU resonance — Croatian-only framing reads parochial.',
  },
  {
    key: 'sponsor',
    label: 'Sponsor',
    hint: 'Tier I/II partners · brand fit + integration',
    emphasis: [
      'Brand fit · cultural authenticity over rate-card',
      'Episode placement opportunities',
      'Behind-the-scenes social content',
      'Premiere + festival presence',
      'ROI calculation per episode reach',
      'Co-marketing potential',
    ],
    slideOrder: [
      'Title with sponsor logo placeholder',
      'Cultural authenticity proposition',
      'Episode-by-episode placement opportunities',
      'BTS social content schedule',
      'Premiere · festival · press circuit value',
      'ROI worksheet · CPM equivalent',
      'Co-marketing menu',
      'Asks + reciprocity',
    ],
    warning: 'Lead with brand fit and authentic integration; CPM math comes second.',
  },
  {
    key: 'festival',
    label: 'Festival',
    hint: 'Programmers · sales + festival circuit',
    emphasis: [
      'Logline · authorial vision',
      'Visual identity + sample reel front-loaded',
      'Director + DOP credentials',
      'Touchstone references',
      'Production stage clarity',
      'Sales agent + delivery readiness',
    ],
    slideOrder: [
      'Title · italic Fraunces · sample frame',
      'Logline + director\'s statement',
      'Sample reel · 90-second cut',
      'Visual identity stills',
      'Director + DOP credentials',
      'Touchstone references',
      'Production stage clarity · delivery date',
      'Sales agent contact',
    ],
    warning: 'Strip the budget; festival programmers don\'t care. Lead with vision and reel.',
  },
];

const KEY_TONE: Record<Audience, string> = {
  general: 'text-[color:var(--color-on-paper)]',
  hrt: 'text-[color:var(--color-brass-deep)]',
  'eu-media': 'text-[color:var(--color-dock)]',
  sponsor: 'text-[color:var(--color-coral-deep)]',
  festival: 'text-[color:var(--color-olive)]',
};

export function DeckVariants() {
  const [audience, setAudience] = useState<Audience>('general');
  const profile = AUDIENCES.find((p) => p.key === audience)!;

  return (
    <section>
      <header className="flex items-baseline gap-3 mb-4">
        <Layers size={13} className="text-[color:var(--color-brass-deep)]" />
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          Deck variants · per audience
        </h3>
        <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          same deck, re-emphasised for the room
        </span>
      </header>

      {/* Audience picker */}
      <nav
        role="tablist"
        className="flex items-baseline gap-1 border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] p-1 w-fit mb-5"
      >
        {AUDIENCES.map((a) => {
          const active = a.key === audience;
          return (
            <button
              key={a.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setAudience(a.key)}
              className={`px-3 py-1.5 rounded-[2px] transition-colors ${
                active
                  ? `bg-[color:var(--color-paper-deep)]/40 ${KEY_TONE[a.key]}`
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              <span
                className={
                  active
                    ? 'display-italic text-[15px]'
                    : 'font-sans text-[11px] tracking-[0.14em] uppercase'
                }
              >
                {a.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6">
        <header className="mb-5 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
          <h4 className={`display-italic text-[24px] leading-tight ${KEY_TONE[profile.key]}`}>
            {profile.label}
          </h4>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-1">
            {profile.hint}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">
          {/* Emphasis */}
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-3">
              Emphasis
            </div>
            <ul className="space-y-1.5">
              {profile.emphasis.map((e, i) => (
                <li
                  key={i}
                  className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed pl-3 relative"
                >
                  <span className="absolute left-0 top-[0.6em] w-1 h-1 rounded-full bg-[color:var(--color-brass)]" />
                  {e}
                </li>
              ))}
            </ul>
          </div>

          {/* Slide order */}
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-3">
              Slide order
            </div>
            <ol className="space-y-1.5">
              {profile.slideOrder.map((s, i) => (
                <li
                  key={i}
                  className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed grid grid-cols-[24px_1fr] gap-2"
                >
                  <span className="display-italic text-[12px] text-[color:var(--color-brass-deep)] tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {profile.warning && (
          <div className="mt-5 pt-4 border-t-[0.5px] border-[color:var(--color-border-paper)] flex items-baseline gap-3">
            <span className="label-caps text-[color:var(--color-coral-deep)]">⚠ tone</span>
            <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed">
              {profile.warning}
            </p>
          </div>
        )}
      </div>

      <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] mt-3 leading-relaxed">
        Reusable strategy guide · the master deck slides live in the Decks &amp; letters tab.
        Print the relevant variant before each pitch meeting.
      </p>
    </section>
  );
}
