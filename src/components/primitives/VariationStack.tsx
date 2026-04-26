import { Plus, Star, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type {
  Variation,
  VariationAudience,
  VariationCategory,
} from '../../types';
import { EditableText } from './EditableText';
import { newId } from '../episode/shared';

interface Props {
  category: VariationCategory;
  audience?: VariationAudience;
  /* Optional binding to a specific entity (e.g., sponsor pitchmaker) */
  sponsorId?: string;
  emptyMessage?: string;
  rows?: number;
  /* Custom heading text (default: derived from category) */
  heading?: string;
  /* Optional placeholder for the body input */
  placeholder?: string;
}

const CATEGORY_LABEL: Record<VariationCategory, string> = {
  logline: 'Logline',
  title: 'Title',
  'synopsis-short': 'Short synopsis',
  'synopsis-medium': 'Medium synopsis',
  'synopsis-long': 'Long synopsis',
  'pitch-deck': 'Pitch deck variant',
  'sponsor-pitch': 'Sponsor pitch variant',
};

/* Editorial variation stack — store multiple drafts of the same content,
   mark one as canonical / current. */
export function VariationStack({
  category,
  audience,
  sponsorId,
  emptyMessage,
  rows = 2,
  heading,
  placeholder,
}: Props) {
  const { state, dispatch } = useApp();

  const variations = state.variations.filter(
    (v) =>
      v.category === category &&
      (v.audience ?? undefined) === (audience ?? undefined) &&
      (v.sponsorId ?? undefined) === (sponsorId ?? undefined)
  );

  function add() {
    const variation: Variation = {
      id: newId('var'),
      category,
      audience,
      sponsorId,
      body: '',
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_VARIATION', variation });
  }

  return (
    <section>
      <header className="flex items-baseline justify-between mb-3">
        <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
          {heading ?? CATEGORY_LABEL[category]}
        </h3>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] rounded-[2px] px-2.5 py-1 transition-colors"
        >
          <Plus size={11} />
          Add variant
        </button>
      </header>

      {variations.length === 0 && emptyMessage && (
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)] py-3">
          {emptyMessage}
        </p>
      )}

      <ul className="space-y-2">
        {variations.map((v) => (
          <VariationRow
            key={v.id}
            variation={v}
            rows={rows}
            placeholder={placeholder}
          />
        ))}
      </ul>
    </section>
  );
}

function VariationRow({
  variation,
  rows,
  placeholder,
}: {
  variation: Variation;
  rows: number;
  placeholder?: string;
}) {
  const { dispatch } = useApp();
  return (
    <li
      className={`flex items-start gap-3 px-4 py-3 rounded-[3px] border-[0.5px] ${
        variation.isCurrent
          ? 'border-[color:var(--color-brass)] bg-[color:var(--color-paper-light)]'
          : 'border-[color:var(--color-border-paper)] bg-[color:var(--color-paper-card)]'
      }`}
    >
      <button
        type="button"
        onClick={() =>
          dispatch({ type: 'SET_CURRENT_VARIATION', id: variation.id })
        }
        title={variation.isCurrent ? 'Canonical' : 'Mark canonical'}
        className={`mt-1 ${
          variation.isCurrent
            ? 'text-[color:var(--color-brass)]'
            : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-brass-deep)]'
        }`}
      >
        <Star
          size={13}
          fill={variation.isCurrent ? 'currentColor' : 'transparent'}
        />
      </button>
      <div className="flex-1 min-w-0">
        <EditableText
          value={variation.body}
          onChange={(v) =>
            dispatch({
              type: 'UPDATE_VARIATION',
              id: variation.id,
              patch: { body: v },
            })
          }
          multiline
          rows={rows}
          placeholder={placeholder ?? 'Write a variant…'}
          className="prose-body italic text-[14px] text-[color:var(--color-on-paper)] leading-[1.55]"
        />
      </div>
      <button
        type="button"
        onClick={() =>
          dispatch({ type: 'DELETE_VARIATION', id: variation.id })
        }
        aria-label="Delete variant"
        className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] p-1 mt-0.5"
      >
        <Trash2 size={12} />
      </button>
    </li>
  );
}
