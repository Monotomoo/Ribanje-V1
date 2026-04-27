import { useMemo, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Reference } from '../../types';
import { newId } from '../episode/shared';
import { EditableText } from '../primitives/EditableText';

/* Shot reference library — image refs grouped by sceneTag.
   Tom's mood-and-framing memory bank. Filter by tag, browse by episode,
   upload more on the boat. The tags are the show's recurring beats. */

const SCENE_TAGS = [
  'interview',
  'catch',
  'sunset',
  'klapa',
  'stones',
  'meal',
  'departure',
  'homecoming',
  'drone-establish',
  'elder',
] as const;

type SceneTag = (typeof SCENE_TAGS)[number];
type FilterKey = 'all' | SceneTag | 'untagged';

const TAG_TONE: Record<SceneTag, string> = {
  interview: '#788064',
  catch: '#C26A4A',
  sunset: '#C9A961',
  klapa: '#A8884A',
  stones: '#5B5950',
  meal: '#7A6A4A',
  departure: '#5BA3CC',
  homecoming: '#3D7FA0',
  'drone-establish': '#6B9080',
  elder: '#876B4A',
};

export function ShotReferenceLibrary() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<FilterKey>('all');

  /* Image references only — film/quote/book lives elsewhere */
  const imageRefs = useMemo(
    () => state.references.filter((r) => r.type === 'image'),
    [state.references]
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return imageRefs;
    if (filter === 'untagged') return imageRefs.filter((r) => !r.sceneTag);
    return imageRefs.filter((r) => r.sceneTag === filter);
  }, [imageRefs, filter]);

  /* Counts per tag */
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: imageRefs.length, untagged: 0 };
    for (const t of SCENE_TAGS) c[t] = 0;
    for (const r of imageRefs) {
      if (!r.sceneTag) c.untagged++;
      else if (r.sceneTag in c) c[r.sceneTag]++;
    }
    return c;
  }, [imageRefs]);

  function addRef() {
    const ref: Reference = {
      id: newId('ref'),
      episodeId: 'general',
      type: 'image',
      title: 'New shot reference',
      whyItMatters: '',
      notes: '',
      sceneTag: filter !== 'all' && filter !== 'untagged' ? filter : undefined,
    };
    dispatch({ type: 'ADD_REFERENCE', reference: ref });
  }

  return (
    <section>
      <header className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] flex items-baseline gap-2">
            <ImageIcon size={16} className="text-[color:var(--color-brass-deep)]" />
            Shot reference library
          </h3>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Visual memory bank grouped by scene-type. Drop images on the boat, tag with the
            beat they support.
          </p>
        </div>
        <button
          type="button"
          onClick={addRef}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add reference</span>
        </button>
      </header>

      {/* Tag filter chips */}
      <div className="flex items-baseline flex-wrap gap-1.5 mb-4">
        <FilterChip
          label="All"
          count={counts.all}
          active={filter === 'all'}
          tone="#0E1E36"
          onClick={() => setFilter('all')}
        />
        {SCENE_TAGS.map((tag) => (
          <FilterChip
            key={tag}
            label={tag}
            count={counts[tag]}
            active={filter === tag}
            tone={TAG_TONE[tag]}
            onClick={() => setFilter(tag)}
          />
        ))}
        {counts.untagged > 0 && (
          <FilterChip
            label="untagged"
            count={counts.untagged}
            active={filter === 'untagged'}
            tone="#876B4A"
            onClick={() => setFilter('untagged')}
          />
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)] bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-5 py-10 text-center">
          {filter === 'all'
            ? 'No image references yet. Click "add reference" to start.'
            : `No references tagged "${filter}" yet.`}
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => (
            <RefCard key={r.id} reference={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FilterChip({
  label,
  count,
  active,
  tone,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`label-caps tracking-[0.10em] text-[10px] px-2 py-1 rounded-[2px] transition-colors border-[0.5px] ${
        active
          ? 'text-[color:var(--color-on-paper)]'
          : 'text-[color:var(--color-on-paper-faint)] border-[color:var(--color-border-paper)] hover:text-[color:var(--color-on-paper-muted)]'
      }`}
      style={{
        background: active ? `${tone}25` : undefined,
        borderColor: active ? tone : undefined,
      }}
    >
      {label} <span className="opacity-70 ml-1">{count}</span>
    </button>
  );
}

function RefCard({ reference: r }: { reference: Reference }) {
  const { state, dispatch } = useApp();
  const ep = state.episodes.find((e) => e.id === r.episodeId);

  function patch(p: Partial<Reference>) {
    dispatch({ type: 'UPDATE_REFERENCE', id: r.id, patch: p });
  }

  function pickFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          patch({ imageBase64: result });
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  return (
    <li className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden group">
      {/* Image area */}
      <div
        className="relative aspect-[16/10] bg-[color:var(--color-paper-deep)]/30 cursor-pointer"
        onClick={pickFile}
      >
        {r.imageBase64 ? (
          <img
            src={r.imageBase64}
            alt={r.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[color:var(--color-on-paper-faint)]">
            <ImageIcon size={20} />
            <span className="prose-body italic text-[11px]">
              click to upload
            </span>
          </div>
        )}
        {r.imageBase64 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              patch({ imageBase64: undefined });
            }}
            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-[color:var(--color-chrome)]/85 text-[color:var(--color-on-chrome)] rounded-full p-1 transition-opacity"
            aria-label="Clear image"
          >
            <X size={10} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 space-y-1.5">
        <EditableText
          value={r.title}
          onChange={(v) => patch({ title: v })}
          className="display-italic text-[13px] text-[color:var(--color-on-paper)] block leading-tight"
        />

        <div className="flex items-baseline gap-2">
          <select
            value={r.sceneTag ?? ''}
            onChange={(e) => patch({ sceneTag: (e.target.value as SceneTag) || undefined })}
            className="bg-transparent label-caps tracking-[0.10em] text-[10px] outline-none border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] py-0.5"
            style={{
              color:
                r.sceneTag && r.sceneTag in TAG_TONE
                  ? TAG_TONE[r.sceneTag as SceneTag]
                  : 'var(--color-on-paper-faint)',
            }}
          >
            <option value="">— tag —</option>
            {SCENE_TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={r.episodeId}
            onChange={(e) => patch({ episodeId: e.target.value })}
            className="bg-transparent label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-on-paper-muted)] outline-none border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] py-0.5"
          >
            <option value="general">all eps</option>
            {state.episodes.map((e) => (
              <option key={e.id} value={e.id}>
                Ep {e.number}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Delete "${r.title}"?`)) {
                dispatch({ type: 'DELETE_REFERENCE', id: r.id });
              }
            }}
            className="ml-auto text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors"
            aria-label="Delete reference"
          >
            <Trash2 size={11} />
          </button>
        </div>

        <EditableText
          value={r.whyItMatters}
          onChange={(v) => patch({ whyItMatters: v })}
          placeholder="Why it matters · what to steal"
          multiline
          rows={2}
          className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] block w-full leading-relaxed"
        />

        {ep && (
          <div className="prose-body italic text-[10px] text-[color:var(--color-brass-deep)] pt-1 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            Ep {ep.number} · {ep.title}
          </div>
        )}
      </div>
    </li>
  );
}
