import { useState } from 'react';
import { Filter as FilterIcon, Sparkles } from 'lucide-react';

interface FilterEntry {
  category: 'ND' | 'IRND' | 'Polarizer' | 'Grad ND' | 'Diffusion' | 'Specialty';
  name: string;
  strength: string;             // e.g. "0.6 / 2 stops"
  use: string;                  // when to reach for it
  marineNote?: string;          // boat-doc-specific guidance
}

const FILTERS: FilterEntry[] = [
  /* ND grades — daylight aperture control */
  { category: 'ND', name: 'ND 0.3',  strength: '1 stop',  use: 'Trim slight overexposure on clean digital sensors' },
  { category: 'ND', name: 'ND 0.6',  strength: '2 stops', use: 'Bright overcast · open up at 50mm wider' },
  { category: 'ND', name: 'ND 0.9',  strength: '3 stops', use: 'Hazy daylight · standard go-to for bright scenes' },
  { category: 'ND', name: 'ND 1.2',  strength: '4 stops', use: 'Bright daylight · keep T2.0 on 32mm Cooke for shallow DOF' },
  { category: 'ND', name: 'ND 1.5',  strength: '5 stops', use: 'Open beach midday · or mid-day water reflections' },
  { category: 'ND', name: 'ND 1.8',  strength: '6 stops', use: 'Heavy: midday sun on water · for slow-mo at wider apertures' },

  /* IRND — digital sensor IR contamination control */
  { category: 'IRND', name: 'IRND 0.6', strength: '2 stops', use: 'Required for digital sensors when ND > 0.9 to prevent IR shift', marineNote: 'Skin tones and synthetic fabrics on the boat go red without IRND beyond 3 stops.' },
  { category: 'IRND', name: 'IRND 0.9', strength: '3 stops', use: 'Default for digital · always pair when stacking ND', marineNote: 'Mandatory beyond ND 0.6 on Alexa 35.' },
  { category: 'IRND', name: 'IRND 1.2', strength: '4 stops', use: 'Bright daylight · digital-clean black levels' },
  { category: 'IRND', name: 'IRND 1.5', strength: '5 stops', use: 'Heavy IR-corrected · for slow-mo + wide aperture in sun' },
  { category: 'IRND', name: 'IRND 1.8', strength: '6 stops', use: 'Maximum stack · for extreme exposure control' },

  /* Polarizer — water + sky control */
  { category: 'Polarizer', name: 'Circular Polarizer', strength: '~1.5 stops', use: 'Cut water reflections · saturate sky · clear surface to see through', marineNote: 'Critical for falkuša scenes — kills the deck reflection AND lets you see through clear water onto fish below. Rotate to taste.' },
  { category: 'Polarizer', name: 'Circular Polarizer · variable', strength: '1-2 stops', use: 'Adjustable polarization · for mixed water + sky compositions' },

  /* Grad ND — sky/sea split */
  { category: 'Grad ND', name: 'Grad ND 0.6 hard', strength: '2 stops top → clear', use: 'Sky/sea split · horizon line straight', marineNote: 'Perfect for bright sky over dark water. Hard edge for clean horizons; soft edge if foreground breaks the line.' },
  { category: 'Grad ND', name: 'Grad ND 0.6 soft', strength: '2 stops gradient', use: 'Mixed-light scenes where horizon is broken (mast / sails / cliffs)' },
  { category: 'Grad ND', name: 'Grad ND 0.9 hard', strength: '3 stops top → clear', use: 'Dramatic sky control · sunset compositions' },

  /* Diffusion */
  { category: 'Diffusion', name: 'Black Pro-Mist 1/8', strength: 'subtle bloom', use: 'Take the digital edge off · barely visible · skin tones soften', marineNote: 'Light hand for elder interviews — the 85mm Cooke + 1/8 BPM is Tom\'s portrait recipe.' },
  { category: 'Diffusion', name: 'Black Pro-Mist 1/4', strength: 'medium bloom', use: 'Cinematic glow on highlights · golden hour seal' },
  { category: 'Diffusion', name: 'Black Pro-Mist 1/2', strength: 'strong bloom', use: 'Dreamy emphasis · for verse-fragment moments' },
  { category: 'Diffusion', name: 'Glimmerglass 1/4', strength: 'highlight glow', use: 'Halation around speculars · sun on water' },

  /* Specialty */
  { category: 'Specialty', name: 'Mist filter (Tiffen)', strength: 'flatten contrast', use: 'Soften extreme contrast · gentle look for harsh sun' },
  { category: 'Specialty', name: 'Hot Mirror', strength: 'IR cut only', use: 'Block far-red contamination from synthetic fabrics' },
  { category: 'Specialty', name: 'Streak filter (1.5×)', strength: 'horizontal flare', use: 'Anamorphic-flavour flares from point sources · use sparingly', marineNote: 'Sunsets behind the boat with streak filter = signature shot. Don\'t overdo.' },
];

interface SceneScenario {
  scene: string;
  conditions: string;
  recommendation: string;
  filters: string[];
}

const SCENARIOS: SceneScenario[] = [
  {
    scene: 'Falkuša on the bow · midday',
    conditions: 'Direct sun, water reflections everywhere, deck creates harsh white surface',
    recommendation: 'Polarizer + IRND',
    filters: ['Circular Polarizer', 'IRND 1.2'],
  },
  {
    scene: 'Sunset wide · golden hour',
    conditions: 'Low sun, dramatic sky, dark water, 30-min window',
    recommendation: 'Grad ND + light diffusion',
    filters: ['Grad ND 0.6 hard', 'Black Pro-Mist 1/4'],
  },
  {
    scene: 'Underwater catch · clear water',
    conditions: 'Diffuse light from above, blue-shift in water, particles',
    recommendation: 'Polarizer (CPL) for surface · clean for depth',
    filters: ['Circular Polarizer'],
  },
  {
    scene: 'Elder interview · interior',
    conditions: 'Window light, soft contrast, want skin tone',
    recommendation: '1/8 Black Pro-Mist · hot mirror if synthetic fabric',
    filters: ['Black Pro-Mist 1/8', 'Hot Mirror'],
  },
  {
    scene: 'Drone establish · open water',
    conditions: 'High sun, wide vista, clean horizon',
    recommendation: 'Polarizer (built into DJI X9-8K Air) · ND for shutter discipline',
    filters: ['Circular Polarizer', 'IRND 0.9'],
  },
  {
    scene: 'Klapa session · konoba terrace',
    conditions: 'Mixed natural + practical · ambient warmth',
    recommendation: 'Light diffusion · ND if afternoon sun',
    filters: ['Black Pro-Mist 1/4', 'IRND 0.6'],
  },
  {
    scene: 'Stone walls · drone descend',
    conditions: 'Cross-light texture, wide DOF, no water reflections',
    recommendation: 'Clean · or Polarizer for sky saturation',
    filters: ['Circular Polarizer'],
  },
  {
    scene: 'Hektorović verse fragment',
    conditions: 'Slow-mo subject, dreamy intent',
    recommendation: 'Heavier diffusion · Glimmerglass for highlight halation',
    filters: ['Black Pro-Mist 1/2', 'Glimmerglass 1/4'],
  },
];

const CATEGORY_TONE: Record<FilterEntry['category'], string> = {
  ND: 'text-[color:var(--color-on-paper)]',
  IRND: 'text-[color:var(--color-brass-deep)]',
  Polarizer: 'text-[color:var(--color-dock)]',
  'Grad ND': 'text-[color:var(--color-olive)]',
  Diffusion: 'text-[color:var(--color-coral-deep)]',
  Specialty: 'text-[color:var(--color-on-paper-muted)]',
};

const CATEGORIES: FilterEntry['category'][] = ['ND', 'IRND', 'Polarizer', 'Grad ND', 'Diffusion', 'Specialty'];

export function FilterLibrary() {
  const [filterCat, setFilterCat] = useState<FilterEntry['category'] | 'all'>('all');

  const visible = filterCat === 'all' ? FILTERS : FILTERS.filter((f) => f.category === filterCat);

  return (
    <div className="space-y-7 max-w-[1200px]">
      <header className="flex items-start gap-5">
        <div className="w-12 h-12 rounded-full bg-[color:var(--color-paper-deep)]/40 flex items-center justify-center shrink-0">
          <FilterIcon size={20} className="text-[color:var(--color-brass-deep)]" />
        </div>
        <div>
          <h2 className="display-italic text-[28px] text-[color:var(--color-on-paper)] leading-tight">
            Filter library
          </h2>
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mt-1.5 leading-relaxed">
            ND grades · IRND for digital · polarizers · graduated · diffusion · specialty.
            Marine-doc notes where the choice differs from generic narrative work.
          </p>
        </div>
      </header>

      {/* Category filter */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">category</span>
        <button
          type="button"
          onClick={() => setFilterCat('all')}
          className={`label-caps tracking-[0.12em] text-[10px] px-2 py-0.5 rounded-[2px] transition-colors ${
            filterCat === 'all'
              ? 'bg-[color:var(--color-brass)]/30 text-[color:var(--color-on-paper)]'
              : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
          }`}
        >
          all · {FILTERS.length}
        </button>
        {CATEGORIES.map((c) => {
          const count = FILTERS.filter((f) => f.category === c).length;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setFilterCat(c)}
              className={`label-caps tracking-[0.12em] text-[10px] px-2 py-0.5 rounded-[2px] transition-colors ${
                filterCat === c
                  ? `bg-[color:var(--color-brass)]/30 ${CATEGORY_TONE[c]}`
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              {c} · {count}
            </button>
          );
        })}
      </div>

      {/* Filter list */}
      <ul className="space-y-2">
        {visible.map((f) => (
          <li
            key={f.name}
            className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-3 flex flex-col md:grid md:grid-cols-[100px_220px_120px_1fr] gap-2 md:gap-4 md:items-baseline"
          >
            <span className={`label-caps tracking-[0.10em] text-[10px] ${CATEGORY_TONE[f.category]}`}>
              {f.category}
            </span>
            <span className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
              {f.name}
            </span>
            <span className="prose-body italic text-[12px] text-[color:var(--color-brass-deep)] tabular-nums">
              {f.strength}
            </span>
            <div>
              <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] leading-relaxed">
                {f.use}
              </p>
              {f.marineNote && (
                <p className="prose-body italic text-[11px] text-[color:var(--color-brass-deep)] mt-1 leading-relaxed">
                  ⚓ {f.marineNote}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Scene-recommender section */}
      <section className="pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        <header className="flex items-baseline gap-3 mb-4">
          <Sparkles size={13} className="text-[color:var(--color-brass-deep)]" />
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
            Scene recommender
          </h3>
          <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
            common scenes · suggested filter combinations
          </span>
        </header>

        <ul className="grid grid-cols-2 gap-3">
          {SCENARIOS.map((s) => (
            <li
              key={s.scene}
              className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4"
            >
              <div className="display-italic text-[15px] text-[color:var(--color-on-paper)] mb-1">
                {s.scene}
              </div>
              <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mb-2 leading-relaxed">
                {s.conditions}
              </p>
              <div className="prose-body italic text-[12px] text-[color:var(--color-brass-deep)] mb-2">
                → {s.recommendation}
              </div>
              <div className="flex items-baseline gap-1.5 flex-wrap pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                {s.filters.map((f) => (
                  <span
                    key={f}
                    className="label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-on-paper)] bg-[color:var(--color-paper-deep)]/30 rounded-[2px] px-2 py-0.5"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
