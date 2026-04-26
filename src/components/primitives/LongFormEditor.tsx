import { Plus, Trash2 } from 'lucide-react';
import { EditableText } from './EditableText';
import { newId } from '../episode/shared';

export interface LongFormSection {
  id: string;
  label: string;
  body: string;
}

interface Props {
  sections: LongFormSection[];
  onChange: (next: LongFormSection[]) => void;
  /* Use the print-slide class so each section breaks onto its own A4 page when printed. */
  printable?: boolean;
  emptyMessage?: string;
  /* Allow adding/removing sections. False locks structure. */
  editableStructure?: boolean;
  /* Section name placeholder when adding new */
  newSectionLabel?: string;
}

/* Editorial long-form text editor — sectioned. Sections each have a heading + body.
   Used by Pitch treatment writer, Director's statement, Application drafts. */
export function LongFormEditor({
  sections,
  onChange,
  printable = false,
  emptyMessage = 'No sections yet.',
  editableStructure = true,
  newSectionLabel = 'New section',
}: Props) {
  function patchSection(id: string, patch: Partial<LongFormSection>) {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function add() {
    onChange([
      ...sections,
      { id: newId('lf'), label: newSectionLabel, body: '' },
    ]);
  }

  function remove(id: string) {
    onChange(sections.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-6">
      {sections.length === 0 ? (
        <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] py-3">
          {emptyMessage}
        </p>
      ) : (
        sections.map((s) => (
          <section
            key={s.id}
            className={`bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6 ${
              printable ? 'print-slide' : ''
            }`}
          >
            <header className="flex items-baseline justify-between mb-3 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]">
              <h3 className="display-italic text-[24px] text-[color:var(--color-on-paper)] flex-1">
                <EditableText
                  value={s.label}
                  onChange={(v) => patchSection(s.id, { label: v })}
                  className="display-italic text-[24px] text-[color:var(--color-on-paper)]"
                />
              </h3>
              {editableStructure && (
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  aria-label="Remove section"
                  className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] no-print p-1"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </header>
            <EditableText
              value={s.body}
              onChange={(v) => patchSection(s.id, { body: v })}
              multiline
              rows={8}
              placeholder="Write…"
              className="prose-body text-[15px] text-[color:var(--color-on-paper)] leading-[1.65]"
            />
          </section>
        ))
      )}

      {editableStructure && (
        <button
          type="button"
          onClick={add}
          className="no-print w-full flex items-center justify-center gap-2 label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-dashed border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] rounded-[3px] py-3 transition-colors"
        >
          <Plus size={11} />
          Add section
        </button>
      )}
    </div>
  );
}
