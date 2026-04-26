import { useEffect, useState } from 'react';
import {
  LongFormEditor,
  type LongFormSection,
} from '../primitives/LongFormEditor';
import { useApp } from '../../state/AppContext';
import { AssetGrid, AssetUploader } from '../primitives/AssetUploader';

const STORAGE_KEY = 'ribanje-presskit-v1';

const DEFAULT_SECTIONS: LongFormSection[] = [
  { id: 'pk-statement', label: "Director's statement", body: '' },
  { id: 'pk-bios', label: 'Crew bios', body: '' },
  { id: 'pk-qa', label: 'Interview Q&A', body: '' },
  { id: 'pk-credits', label: 'Credit block', body: '' },
];

export function PressKit() {
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

  const stills = state.assets.filter((a) => a.type === 'image' && !a.episodeId);

  return (
    <div className="space-y-9">
      <header>
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          Press kit / EPK
        </h3>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          Director's statement, crew bios, Q&amp;A, credit block, stills. Print to A4 via ⌘P.
        </p>
      </header>

      <section>
        <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-3 pb-2 border-b-[0.5px] border-[color:var(--color-border-brass)]">
          Stills
        </h4>
        <div className="space-y-3">
          <AssetUploader type="image" label="Drop a still — JPEG/PNG, compressed to 1024px max" />
          <AssetGrid assets={stills} emptyMessage="No stills yet." />
        </div>
      </section>

      <section>
        <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-3 pb-2 border-b-[0.5px] border-[color:var(--color-border-brass)]">
          Long-form copy
        </h4>
        <LongFormEditor sections={sections} onChange={setSections} printable />
      </section>
    </div>
  );
}
