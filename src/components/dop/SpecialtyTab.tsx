import { useState } from 'react';
import {
  Anchor,
  Battery,
  Boxes,
  Camera,
  Clock,
  Crosshair,
  Filter as FilterIcon,
  Plane,
  Plus,
  Sparkles,
  Trash2,
  Waves,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { newId } from '../episode/shared';
import type { DOPKitItem } from '../../types';
import { EditableText } from '../primitives/EditableText';
import { DOFCalculator } from './DOFCalculator';
import { FilterLibrary } from './FilterLibrary';
import { RigConfigurations } from './RigConfigurations';
import { CounterweightCalculator } from './CounterweightCalculator';

type SubKey = 'underwater' | 'drone' | 'stab' | 'rates' | 'dof' | 'filters' | 'rigs';

/* Specialty rigs + frame-rate library — Tom-facing depth.
   Underwater · Drone · Stab cards group existing DOPKit items by category and
   add per-rig prep notes. Frame-rate library is a curated reference table. */
export function SpecialtyTab() {
  const [sub, setSub] = useState<SubKey>('underwater');

  return (
    <div className="space-y-6">
      <nav
        role="tablist"
        className="flex items-baseline gap-1 border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] p-1 w-fit"
      >
        {(
          [
            { key: 'underwater', label: 'Underwater', icon: Waves },
            { key: 'drone', label: 'Drone', icon: Plane },
            { key: 'stab', label: 'Stab · Trinity', icon: Sparkles },
            { key: 'rates', label: 'Frame rate', icon: Clock },
            { key: 'dof', label: 'DOF + focus', icon: Crosshair },
            { key: 'filters', label: 'Filters', icon: FilterIcon },
            { key: 'rigs', label: 'Rigs', icon: Boxes },
          ] as { key: SubKey; label: string; icon: typeof Waves }[]
        ).map((t) => {
          const active = sub === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSub(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors rounded-[2px] ${
                active
                  ? 'bg-[color:var(--color-paper-deep)]/40 text-[color:var(--color-on-paper)]'
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              <Icon size={11} className="opacity-80" />
              <span
                className={
                  active
                    ? 'display-italic text-[14px]'
                    : 'font-sans text-[11px] tracking-[0.14em] uppercase'
                }
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>

      {sub === 'underwater' && <UnderwaterRig />}
      {sub === 'drone' && <DroneRig />}
      {sub === 'stab' && <StabRig />}
      {sub === 'rates' && <FrameRateLibrary />}
      {sub === 'dof' && <DOFCalculator />}
      {sub === 'filters' && <FilterLibrary />}
      {sub === 'rigs' && <RigConfigurations />}
    </div>
  );
}

/* ---------- shared rig wrapper ---------- */

interface RigShellProps {
  icon: typeof Waves;
  title: string;
  blurb: string;
  category: DOPKitItem['category'];
  prepChecklist: string[];
}

function RigShell({ icon: Icon, title, blurb, category, prepChecklist }: RigShellProps) {
  const { state, dispatch } = useApp();
  const items = state.dopKit.filter((k) => k.category === category);

  function addItem() {
    const item: DOPKitItem = {
      id: newId('kit'),
      category,
      label: `New ${title.toLowerCase()} item`,
    };
    dispatch({ type: 'ADD_DOP_KIT', item });
  }

  function patch(id: string, p: Partial<DOPKitItem>) {
    dispatch({ type: 'UPDATE_DOP_KIT', id, patch: p });
  }

  return (
    <div className="space-y-7 max-w-[1200px]">
      {/* Header */}
      <header className="flex items-start gap-5">
        <div className="w-12 h-12 rounded-full bg-[color:var(--color-paper-deep)]/40 flex items-center justify-center shrink-0">
          <Icon size={20} className="text-[color:var(--color-brass-deep)]" />
        </div>
        <div className="flex-1">
          <h2 className="display-italic text-[28px] text-[color:var(--color-on-paper)] leading-tight">
            {title}
          </h2>
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mt-1.5 leading-relaxed">
            {blurb}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[1fr_300px] gap-7">
        {/* Kit list */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
              Kit ({items.length})
            </h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
            >
              <Plus size={11} />
              <span>add item</span>
            </button>
          </div>
          {items.length === 0 ? (
            <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)]">
              No {category} items yet. Tom drops kit specs in the main Cinematography Kit
              tab; they'll appear here once tagged with this category.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((k) => (
                <li
                  key={k.id}
                  className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-3"
                >
                  <div className="grid grid-cols-[1fr_28px] gap-3 items-baseline">
                    <EditableText
                      value={k.label}
                      onChange={(v) => patch(k.id, { label: v })}
                      className="display-italic text-[15px] text-[color:var(--color-on-paper)] block"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete "${k.label}"?`)) {
                          dispatch({ type: 'DELETE_DOP_KIT', id: k.id });
                        }
                      }}
                      className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors justify-self-end"
                      aria-label="Delete kit item"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <EditableText
                    value={k.notes ?? ''}
                    onChange={(v) => patch(k.id, { notes: v || undefined })}
                    placeholder="specs · serial · seal date · notes"
                    className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] block mt-1.5"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pre-shoot checklist (static reference) */}
        <aside className="bg-[color:var(--color-paper-light)] border-l-2 border-[color:var(--color-brass)] px-5 py-5">
          <div className="label-caps text-[color:var(--color-brass-deep)] mb-3">
            Pre-shoot checklist
          </div>
          <ul className="space-y-2">
            {prepChecklist.map((item, i) => (
              <li
                key={i}
                className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] leading-relaxed flex items-baseline gap-2"
              >
                <span className="text-[color:var(--color-brass-deep)] tabular-nums shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Underwater ---------- */

function UnderwaterRig() {
  return (
    <RigShell
      icon={Waves}
      title="Underwater rig"
      blurb="The water-tight setup. Housing · ports · monitor · seal discipline. The most unforgiving of the specialty rigs — one missed o-ring is a flooded camera."
      category="underwater"
      prepChecklist={[
        'O-ring inspection · clean with isopropyl · re-grease with Nauticam silicone',
        'Pressure test the housing the day before · 30 min in shore-test bath',
        'Port choice · dome for wide / split shots · flat for macro · check no fingerprints',
        'Monitor housing seal · TRP cable check · battery insert + leak alarm',
        'Battery + media swap rehearsal on dry land before the dive',
        'Buddy system in water · no solo dives with the rig',
        'Fresh-water rinse immediately on surface · soak 30 min minimum',
      ]}
    />
  );
}

/* ---------- Drone ---------- */

function DroneRig() {
  return (
    <RigShell
      icon={Plane}
      title="Drone"
      blurb="Aerial coverage. DJI Inspire 3 / Mavic 3 Pro class. Croatian airspace + Adriatic sea-state both demand discipline — pre-flight check is non-negotiable."
      category="aerial"
      prepChecklist={[
        'Airspace check · Croatian Civil Aviation Agency portal · no-fly zones flagged',
        'National park permits — Mljet · Kornati · Brijuni · Lastovo all restricted',
        'Battery cycle log · 4 fresh + 1 reserve · don\'t fly below 25%',
        'Wind ceiling — abort above 12 m/s gusts even if drone rates higher',
        'Visual line of sight · spotter on deck · radio confirm pre-launch',
        'Marine launch from deck · check rotor clearance · use return-to-home set on the boat\'s GPS',
        'Memory + LUT settings synced with main A-cam grade',
      ]}
    />
  );
}

/* ---------- Stab ---------- */

function StabRig() {
  return (
    <div className="space-y-10">
      <RigShell
        icon={Sparkles}
        title="Stabilization · Trinity"
        blurb="Tom's flagship. ARRI Trinity (or comparable) for handheld floating shots — the look that made the show worth filming. Counterweight discipline is everything."
        category="stab"
        prepChecklist={[
          'Counterweight match camera + lens combo · update for each lens swap',
          'Bias-axis trim · check no drift in static hold',
          'Battery cycle · Trinity is power-hungry · 3 fresh per 4-hour shoot day',
          'Cable tie-down to avoid microphonic interference with audio',
          'Stiff knees · Tom\'s walking pattern is the mood · rehearse the path before the take',
          'Quick-release camera mount tested · Tom moves between Trinity and gimbal across same shoot',
          'Storage in padded case on boat · marine humidity is hard on motors',
        ]}
      />

      {/* Counterweight calculator — pick cam + lens + accessories, get balance */}
      <CounterweightCalculator />
    </div>
  );
}

/* ---------- Frame rate library ---------- */

interface FrameRate {
  fps: string;
  shutter: string;
  use: string;
  notes: string;
  intent: 'observational' | 'action' | 'slow-mo' | 'broadcast' | 'dream';
}

const FRAME_RATES: FrameRate[] = [
  {
    fps: '24p',
    shutter: '180° (1/48)',
    use: 'Cinematic baseline',
    notes: 'Festival + theatrical default. Most observational scenes. Hektorović verse + dialogue.',
    intent: 'observational',
  },
  {
    fps: '25p',
    shutter: '180° (1/50)',
    use: 'European broadcast',
    notes: 'HRT · ARTE · BBC delivery requirement. Match if broadcast is primary outlet.',
    intent: 'broadcast',
  },
  {
    fps: '23.976p',
    shutter: '180° (1/48)',
    use: 'US broadcast / streaming',
    notes: 'Apple TV+ · Netflix · POV PBS. Critical: never mix 23.976 with 24p in same edit.',
    intent: 'broadcast',
  },
  {
    fps: '48p',
    shutter: '180° (1/96)',
    use: 'Mild slow-mo · 50% playback',
    notes: 'Spray on the bow · net-pulling rhythm · light slow-down without dream effect.',
    intent: 'action',
  },
  {
    fps: '60p',
    shutter: '180° (1/120)',
    use: 'High-action moments',
    notes: 'Strike of a fish · sudden weather · deck action. Plays back in 24p edit at 40%.',
    intent: 'action',
  },
  {
    fps: '120p',
    shutter: '180° (1/240)',
    use: 'Dream slow-mo · 20% playback',
    notes: 'Hektorović verse fragments · meditative passages · the moment a fish is recognised.',
    intent: 'dream',
  },
  {
    fps: '240p',
    shutter: '210° (1/410)',
    use: 'Extreme slow-mo · 10% playback',
    notes: 'Sparingly — water droplets · fish in air · a stone thrown into the sea.',
    intent: 'dream',
  },
];

const INTENT_TONE: Record<FrameRate['intent'], string> = {
  observational: 'text-[color:var(--color-on-paper)]',
  action: 'text-[color:var(--color-coral-deep)]',
  'slow-mo': 'text-[color:var(--color-warn)]',
  broadcast: 'text-[color:var(--color-brass-deep)]',
  dream: 'text-[color:var(--color-olive)]',
};

function FrameRateLibrary() {
  return (
    <div className="space-y-7 max-w-[1200px]">
      <header className="flex items-start gap-5">
        <div className="w-12 h-12 rounded-full bg-[color:var(--color-paper-deep)]/40 flex items-center justify-center shrink-0">
          <Clock size={20} className="text-[color:var(--color-brass-deep)]" />
        </div>
        <div className="flex-1">
          <h2 className="display-italic text-[28px] text-[color:var(--color-on-paper)] leading-tight">
            Frame rate &amp; shutter library
          </h2>
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mt-1.5 leading-relaxed">
            Curated rates with use-cases for this show specifically. The 180° rule is the
            default for cinematic motion blur; deviations are intentional.
          </p>
        </div>
      </header>

      <ul className="space-y-2">
        {FRAME_RATES.map((r) => (
          <li
            key={r.fps}
            className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4 grid grid-cols-[80px_140px_180px_1fr_110px] gap-5 items-baseline"
          >
            <span className={`display-italic text-[24px] tabular-nums ${INTENT_TONE[r.intent]}`}>
              {r.fps}
            </span>
            <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] tabular-nums">
              {r.shutter}
            </span>
            <span className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
              {r.use}
            </span>
            <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] leading-relaxed">
              {r.notes}
            </span>
            <span className={`label-caps tracking-[0.14em] text-[10px] ${INTENT_TONE[r.intent]} text-right`}>
              {r.intent}
            </span>
          </li>
        ))}
      </ul>

      <section className="bg-[color:var(--color-paper-light)] border-l-2 border-[color:var(--color-brass)] px-6 py-5 max-w-[800px]">
        <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
          The 180° rule
        </div>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] leading-relaxed mb-2">
          Shutter angle = 180° ↔ shutter speed = 1 / (2 × fps). At 24p: 1/48. At 48p: 1/96.
          This gives natural motion blur; the eye reads it as cinematic.
        </p>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] leading-relaxed">
          Doubling the shutter (90°) sharpens motion — useful for fast-action where you want
          to feel the impact. Halving (360°) smears — surreal, dreamlike. Reach for these
          when the moment calls for it, not as default.
        </p>
      </section>
    </div>
  );
}

/* unused-import hint */
export const _icons = { Anchor, Battery, Camera };
