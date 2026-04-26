import { useState } from 'react';
import { Mic2, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { newId } from '../episode/shared';
import type {
  AudioCommission,
  AudioCommissionStatus,
  AudioCommissionType,
} from '../../types';
import { EditableText } from '../primitives/EditableText';

const TYPES: AudioCommissionType[] = [
  'verse-reading',
  'klapa-recording',
  'ambient-capture',
  'narration',
  'other',
];

const TYPE_LABEL: Record<AudioCommissionType, string> = {
  'verse-reading': 'Verse reading',
  'klapa-recording': 'Klapa recording',
  'ambient-capture': 'Ambient capture',
  narration: 'Narration',
  other: 'Other',
};

const STATUSES: AudioCommissionStatus[] = ['planned', 'recorded', 'edited', 'final'];
const STATUS_TONE: Record<AudioCommissionStatus, string> = {
  planned: 'text-[color:var(--color-on-paper-muted)]',
  recorded: 'text-[color:var(--color-brass-deep)]',
  edited: 'text-[color:var(--color-warn)]',
  final: 'text-[color:var(--color-success)]',
};

export function HektorovicAudio() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<AudioCommissionType | 'all'>('all');

  function add(type: AudioCommissionType) {
    const commission: AudioCommission = {
      id: newId('aud'),
      type,
      label: type === 'verse-reading' ? 'New verse reading' : 'New audio commission',
      status: 'planned',
    };
    dispatch({ type: 'ADD_AUDIO_COMMISSION', commission });
  }

  function patch(id: string, p: Partial<AudioCommission>) {
    dispatch({ type: 'UPDATE_AUDIO_COMMISSION', id, patch: p });
  }

  function cycleStatus(c: AudioCommission) {
    const idx = STATUSES.indexOf(c.status);
    patch(c.id, { status: STATUSES[(idx + 1) % STATUSES.length] });
  }

  /* Auto-create one verse reading per episode if none exist (helpful for demo) */
  function seedVerseReadings() {
    state.episodes.forEach((ep) => {
      const exists = state.audioCommissions.some(
        (c) => c.type === 'verse-reading' && c.episodeId === ep.id
      );
      if (exists) return;
      const commission: AudioCommission = {
        id: newId('aud'),
        type: 'verse-reading',
        label: `Hektorović verse · Ep ${ep.number}`,
        episodeId: ep.id,
        format: '24-bit 48k mono',
        status: 'planned',
      };
      dispatch({ type: 'ADD_AUDIO_COMMISSION', commission });
    });
  }

  const filtered =
    filter === 'all'
      ? state.audioCommissions
      : state.audioCommissions.filter((c) => c.type === filter);

  const counts: Record<AudioCommissionType | 'all', number> = {
    all: state.audioCommissions.length,
    'verse-reading': state.audioCommissions.filter((c) => c.type === 'verse-reading').length,
    'klapa-recording': state.audioCommissions.filter((c) => c.type === 'klapa-recording').length,
    'ambient-capture': state.audioCommissions.filter((c) => c.type === 'ambient-capture').length,
    narration: state.audioCommissions.filter((c) => c.type === 'narration').length,
    other: state.audioCommissions.filter((c) => c.type === 'other').length,
  };

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-baseline gap-3">
          <Mic2 size={13} className="text-[color:var(--color-brass-deep)]" />
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
            Hektorović audio · commissioning plan
          </h3>
        </div>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-1 max-w-[680px] leading-relaxed">
          Plan every voiced fragment that goes into the show — the 6 Hektorović verses,
          klapa recordings, ambient captures, narration. Per item: reader · format · location ·
          post-treatment · status.
        </p>
      </header>

      {/* Filter chips + actions */}
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="label-caps text-[color:var(--color-on-paper-faint)]">type</span>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            all · {counts.all}
          </FilterChip>
          {TYPES.map((t) => (
            <FilterChip
              key={t}
              active={filter === t}
              onClick={() => setFilter(t)}
            >
              {TYPE_LABEL[t]} · {counts[t]}
            </FilterChip>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {state.audioCommissions.filter((c) => c.type === 'verse-reading').length === 0 && (
            <button
              type="button"
              onClick={seedVerseReadings}
              className="label-caps text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-brass-deep)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] px-3 py-1.5 rounded-[2px] transition-colors"
            >
              seed 6 verse readings
            </button>
          )}
          <button
            type="button"
            onClick={() => add('verse-reading')}
            className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
          >
            <Plus size={11} />
            <span>add commission</span>
          </button>
        </div>
      </div>

      {/* Commission list */}
      {filtered.length === 0 ? (
        <div className="border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-7 py-10 text-center">
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] max-w-[480px] mx-auto">
            {state.audioCommissions.length === 0
              ? 'No audio commissions yet. Click "seed 6 verse readings" to pre-populate one per episode.'
              : `No commissions of type "${filter}".`}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4"
            >
              <div className="grid grid-cols-[120px_1fr_140px_110px_28px] gap-3 items-baseline mb-2">
                <select
                  value={c.type}
                  onChange={(e) =>
                    patch(c.id, { type: e.target.value as AudioCommissionType })
                  }
                  className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none label-caps text-[10px] tracking-[0.10em] text-[color:var(--color-brass-deep)] py-0.5"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
                <EditableText
                  value={c.label}
                  onChange={(v) => patch(c.id, { label: v })}
                  className="display-italic text-[15px] text-[color:var(--color-on-paper)]"
                />
                <select
                  value={c.episodeId ?? ''}
                  onChange={(e) =>
                    patch(c.id, { episodeId: e.target.value || undefined })
                  }
                  className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] py-0.5"
                >
                  <option value="">— general —</option>
                  {state.episodes.map((e) => (
                    <option key={e.id} value={e.id}>
                      Ep {e.number} · {e.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => cycleStatus(c)}
                  className={`label-caps tracking-[0.12em] text-[10px] py-0.5 px-1.5 rounded-[2px] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors text-left ${STATUS_TONE[c.status]}`}
                >
                  {c.status}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete "${c.label}"?`)) {
                      dispatch({ type: 'DELETE_AUDIO_COMMISSION', id: c.id });
                    }
                  }}
                  className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors justify-self-end"
                  aria-label="Delete commission"
                >
                  <Trash2 size={11} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                <div>
                  <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                    Reader / performer
                  </div>
                  <EditableText
                    value={c.reader ?? ''}
                    onChange={(v) => patch(c.id, { reader: v || undefined })}
                    placeholder="Ivan · Rene · professional · Tomo"
                    className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] block"
                  />
                </div>
                <div>
                  <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                    Format
                  </div>
                  <EditableText
                    value={c.format ?? ''}
                    onChange={(v) => patch(c.id, { format: v || undefined })}
                    placeholder="24-bit 48k mono"
                    className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] block"
                  />
                </div>
                <div>
                  <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                    Location · post
                  </div>
                  <EditableText
                    value={c.postTreatment ?? ''}
                    onChange={(v) => patch(c.id, { postTreatment: v || undefined })}
                    placeholder="quiet room · light reverb"
                    className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] block"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`label-caps tracking-[0.12em] text-[10px] px-2 py-0.5 rounded-[2px] transition-colors ${
        active
          ? 'bg-[color:var(--color-brass)]/30 text-[color:var(--color-on-paper)]'
          : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
      }`}
    >
      {children}
    </button>
  );
}
