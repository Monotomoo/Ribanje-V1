import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type {
  KlapaEntry,
  KlapaRegion,
  RightsStatus,
} from '../../types';
import { EditableText } from '../primitives/EditableText';
import { EditableNumber } from '../primitives/EditableNumber';
import { LCDCard } from '../primitives/LCDCard';
import { newId } from '../episode/shared';
import { BoatLogistics } from '../sound/BoatLogistics';
import { HektorovicAudio } from '../sound/HektorovicAudio';
import { MusicBudget } from '../sound/MusicBudget';

const REGIONS: { key: KlapaRegion; label: string }[] = [
  { key: 'south-dalmatia', label: 'South Dalmatia' },
  { key: 'central-dalmatia', label: 'Central Dalmatia' },
  { key: 'north-dalmatia', label: 'North Dalmatia' },
  { key: 'kvarner', label: 'Kvarner' },
  { key: 'istria', label: 'Istria' },
];

const RIGHTS: RightsStatus[] = [
  'public-domain',
  'arranged-needs-clearance',
  'commissioned',
  'unknown',
];
const RIGHTS_LABEL: Record<RightsStatus, string> = {
  'public-domain': 'public domain',
  'arranged-needs-clearance': 'needs clearance',
  commissioned: 'commissioned',
  unknown: 'unknown',
};
const RIGHTS_TONE: Record<RightsStatus, string> = {
  'public-domain': 'text-[color:var(--color-success)]',
  'arranged-needs-clearance': 'text-[color:var(--color-warn)]',
  commissioned: 'text-[color:var(--color-brass-deep)]',
  unknown: 'text-[color:var(--color-coral-deep)]',
};

const TABS = [
  'Klapa & rights',
  'Boat logistics',
  'Per-episode briefs',
  'Hektorović audio',
  'Music budget',
  'Philosophy',
] as const;
type Tab = (typeof TABS)[number];

export function SoundView() {
  const { state } = useApp();
  const [tab, setTab] = useState<Tab>('Klapa & rights');

  const totalFee = state.klapa.reduce(
    (s, k) => s + (k.feeEstimateK ?? 0),
    0
  );
  const needsClearance = state.klapa.filter(
    (k) => k.rightsStatus === 'arranged-needs-clearance' || k.rightsStatus === 'unknown'
  ).length;

  return (
    <div className="space-y-7 max-w-[1400px]">
      <div>
        <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
          Sound
        </h2>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          Klapa map · boat logistics · per-episode briefs · sound design philosophy.
        </p>
      </div>

      {/* Stats strip */}
      <section className="grid grid-cols-4 gap-5">
        <LCDCard label="Songs in pipeline" value={`${state.klapa.length}`} />
        <LCDCard
          label="Need clearance"
          value={`${needsClearance}`}
          sub="risk #5 territory"
          trend={needsClearance > 0 ? 'down' : 'up'}
        />
        <LCDCard
          label="Music budget est."
          value={`${totalFee}k`}
          sub="€ · sum of fee estimates"
        />
        <LCDCard
          label="Mic placements"
          value={`${state.micPlacements.length}`}
          sub="planned channels"
        />
      </section>

      <div className="flex items-baseline gap-1 border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] p-1 w-fit max-w-full overflow-x-auto">
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 transition-colors rounded-[2px] ${
                active
                  ? 'bg-[color:var(--color-paper-deep)]/40 text-[color:var(--color-on-paper)]'
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
                {t}
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'Klapa & rights' && <KlapaTab />}
      {tab === 'Boat logistics' && <BoatLogistics />}
      {tab === 'Per-episode briefs' && <PerEpisodeBriefs />}
      {tab === 'Hektorović audio' && <HektorovicAudio />}
      {tab === 'Music budget' && <MusicBudget />}
      {tab === 'Philosophy' && <Philosophy />}
    </div>
  );
}

function KlapaTab() {
  const { state, dispatch } = useApp();
  function add(region: KlapaRegion) {
    const entry: KlapaEntry = {
      id: newId('kl'),
      region,
      songTitle: 'New song',
      rightsStatus: 'unknown',
      notes: '',
    };
    dispatch({ type: 'ADD_KLAPA', entry });
  }
  return (
    <div className="space-y-5">
      {REGIONS.map((r) => (
        <RegionBlock
          key={r.key}
          label={r.label}
          entries={state.klapa.filter((k) => k.region === r.key)}
          onAdd={() => add(r.key)}
        />
      ))}
    </div>
  );
}

function RegionBlock({
  label,
  entries,
  onAdd,
}: {
  label: string;
  entries: KlapaEntry[];
  onAdd: () => void;
}) {
  return (
    <div>
      <header className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-3">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            {label}
          </h3>
          <span className="label-caps text-[color:var(--color-on-paper-faint)]">
            {entries.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add song to ${label}`}
          className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-brass-deep)] p-1"
        >
          <Plus size={13} />
        </button>
      </header>
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] divide-y-[0.5px] divide-[color:var(--color-border-paper)]">
        {entries.length === 0 && (
          <div className="px-5 py-3 prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)]">
            no songs logged
          </div>
        )}
        {entries.map((k) => (
          <KlapaRow key={k.id} entry={k} />
        ))}
      </div>
    </div>
  );
}

function KlapaRow({ entry }: { entry: KlapaEntry }) {
  const { dispatch } = useApp();
  function patch(p: Partial<KlapaEntry>) {
    dispatch({ type: 'UPDATE_KLAPA', id: entry.id, patch: p });
  }
  function cycleRights() {
    const i = RIGHTS.indexOf(entry.rightsStatus);
    patch({ rightsStatus: RIGHTS[(i + 1) % RIGHTS.length] });
  }
  return (
    <div className="px-5 py-3 group grid grid-cols-[2fr_1fr_120px_140px_120px_30px] items-baseline gap-4">
      <div>
        <EditableText
          value={entry.songTitle}
          onChange={(v) => patch({ songTitle: v })}
          className="display-italic text-[16px] text-[color:var(--color-on-paper)]"
        />
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          <EditableText
            value={entry.klapaName ?? ''}
            onChange={(v) => patch({ klapaName: v })}
            placeholder="Klapa / arranger"
          />
        </div>
      </div>
      <EditableText
        value={entry.rightsHolderContact ?? ''}
        onChange={(v) => patch({ rightsHolderContact: v })}
        placeholder="rights contact"
        className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
      />
      <div>
        <span className="label-caps text-[color:var(--color-on-paper-faint)] block mb-0.5">fee est.</span>
        <EditableNumber
          value={entry.feeEstimateK ?? 0}
          onChange={(v) => patch({ feeEstimateK: v })}
          suffix=" k"
          size="sm"
          align="left"
        />
      </div>
      <EditableText
        value={entry.notes}
        onChange={(v) => patch({ notes: v })}
        placeholder="Notes"
        className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
      />
      <button
        type="button"
        onClick={cycleRights}
        className={`label-caps border-[0.5px] rounded-full px-2.5 py-[2px] hover:opacity-80 transition-opacity ${RIGHTS_TONE[entry.rightsStatus]} border-current justify-self-start`}
        title="cycle rights status"
      >
        {RIGHTS_LABEL[entry.rightsStatus]}
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: 'DELETE_KLAPA', id: entry.id })}
        aria-label="Delete song"
        className="opacity-0 group-hover:opacity-100 text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] transition-all p-1"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function PerEpisodeBriefs() {
  const { state, dispatch } = useApp();
  return (
    <div className="space-y-4">
      <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
        Each episode's sound brief lives on its Craft tab. Quick edit here.
      </p>
      <div className="space-y-3">
        {state.episodes.map((ep) => {
          const ex = state.episodeExtras[ep.id];
          return (
            <article
              key={ep.id}
              className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5"
            >
              <header className="flex items-baseline justify-between mb-3 pb-2 border-b-[0.5px] border-[color:var(--color-border-paper)]">
                <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
                  Ep {ep.number} · {ep.title}
                </h3>
                <span className="label-caps text-[color:var(--color-brass-deep)]">
                  {ep.theme}
                </span>
              </header>
              <EditableText
                value={ex?.soundNotes ?? ''}
                onChange={(v) =>
                  dispatch({
                    type: 'UPDATE_EPISODE_EXTRAS',
                    episodeId: ep.id,
                    patch: { soundNotes: v },
                  })
                }
                multiline
                rows={3}
                placeholder="Music · ambient · dialogue · klapa song · Hektorović verse"
                className="prose-body text-[14px] text-[color:var(--color-on-paper)] leading-[1.6]"
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Philosophy() {
  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6">
      <div className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mb-4">
        A standing reminder of the sonic register the show holds.
      </div>
      <ul className="space-y-2 prose-body text-[14px] text-[color:var(--color-on-paper)] leading-[1.55] list-disc pl-5">
        <li>Ambient first — boat, sea, wind, hull, rope. Dialogue lives inside that bed.</li>
        <li>Klapa as score, never as wallpaper. One song per episode, placed deliberately.</li>
        <li>Hektorović verse fragments allowed in voice-over only when the visual carries them. No translation overlap.</li>
        <li>Croatian dialect (čakavian, bodulski) preserved on camera; English subs only.</li>
        <li>Silence is a tool. The show breathes.</li>
      </ul>
    </section>
  );
}
