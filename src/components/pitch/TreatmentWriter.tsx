import { useState, useEffect } from 'react';
import {
  LongFormEditor,
  type LongFormSection,
} from '../primitives/LongFormEditor';
import { useApp } from '../../state/AppContext';

const STORAGE_KEY = 'ribanje-treatment-v1';

const DEFAULT_SECTIONS: LongFormSection[] = [
  { id: 'tr-premise', label: 'Premise', body: '' },
  { id: 'tr-characters', label: 'Characters', body: '' },
  { id: 'tr-structure', label: 'Structure', body: '' },
  { id: 'tr-visual', label: 'Visual style', body: '' },
  { id: 'tr-sound', label: 'Sound design', body: '' },
  { id: 'tr-comparables', label: 'Comparable films', body: '' },
  { id: 'tr-approach', label: 'Production approach', body: '' },
];

/* Treatment lives in localStorage outside the main reducer because it's a
   single-document long-form, not a CRUD list. Reads on mount, writes on change. */
export function TreatmentWriter() {
  const { state } = useApp();
  const [sections, setSections] = useState<LongFormSection[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as LongFormSection[];
    } catch {
      /* fall through */
    }
    return DEFAULT_SECTIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
    } catch {
      /* swallow */
    }
  }, [sections]);

  const wordCount = sections
    .map((s) => s.body.trim().split(/\s+/).filter(Boolean).length)
    .reduce((a, b) => a + b, 0);

  const sc = state.scenarios[state.activeScenario];
  void sc;

  return (
    <div className="space-y-7">
      <header className="flex items-baseline justify-between">
        <div>
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
            Treatment
          </h3>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Long-form treatment document. Sections print one per A4 page via ⌘P.
          </p>
        </div>
        <span className="label-caps text-[color:var(--color-on-paper-faint)] tabular-nums">
          {wordCount} words
        </span>
      </header>

      <LongFormEditor sections={sections} onChange={setSections} printable />
    </div>
  );
}
