import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { LUT } from '../../types';
import { EditableText } from '../primitives/EditableText';
import { newId } from '../episode/shared';
import { ColorPaletteStudio } from './ColorPaletteStudio';
import { TouchstoneGraph } from './TouchstoneGraph';
import { ColorScript } from './ColorScript';
import { FrameLineComposer } from './FrameLineComposer';
import { ShotReferenceLibrary } from './ShotReferenceLibrary';
import { WaveformVectorscope } from './WaveformVectorscope';
import { ReferenceFilmMimicry } from './ReferenceFilmMimicry';

export function ColorAndLook() {
  const { state, dispatch } = useApp();

  function addLut() {
    const lut: LUT = {
      id: newId('lut'),
      name: 'New LUT',
      episodeId: 'general',
      sourceColorspace: '',
      targetColorspace: '',
      notes: '',
    };
    dispatch({ type: 'ADD_LUT', lut });
  }

  return (
    <div className="space-y-10">
      <ColorPaletteStudio />

      {/* Cinematic touchstone graph */}
      <TouchstoneGraph />

      {/* Frame-line composer — pre-shoot framing tool */}
      <FrameLineComposer />

      {/* Waveform + vectorscope — DP power tool, paste a still */}
      <WaveformVectorscope />

      {/* Reference film mimicry — quantified palette/exposure/framing match scores */}
      <ReferenceFilmMimicry />

      {/* Color script per episode */}
      <ColorScript />

      {/* Shot reference library — visual memory bank by sceneTag */}
      <ShotReferenceLibrary />

      {/* LUTs */}
      <section>
        <header className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
              LUTs &amp; color management
            </h3>
            <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
              Source → target color spaces. One per episode if needed.
            </p>
          </div>
          <button
            type="button"
            onClick={addLut}
            className="flex items-center gap-1.5 label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] rounded-[2px] px-2.5 py-1 transition-colors"
          >
            <Plus size={11} />
            Add LUT
          </button>
        </header>

        {state.luts.length === 0 ? (
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)]">
            No LUTs defined yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {state.luts.map((lut) => (
              <LutRow key={lut.id} lut={lut} />
            ))}
          </ul>
        )}
      </section>

      {/* Reference films linked from general references */}
      <section>
        <header className="mb-3">
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
            Reference films
          </h3>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Manage the master library on the Cinematography view footer or via Episodes.
          </p>
        </header>
        <ul className="grid grid-cols-2 gap-3">
          {state.references
            .filter((r) => r.type === 'film' && r.episodeId === 'general')
            .map((r) => (
              <li
                key={r.id}
                className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4"
              >
                <h4 className="display-italic text-[16px] text-[color:var(--color-on-paper)]">
                  {r.title}
                </h4>
                <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-0.5">
                  {[r.director, r.year].filter(Boolean).join(' · ')}
                </div>
                {r.whyItMatters && (
                  <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] mt-2 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                    {r.whyItMatters}
                  </p>
                )}
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

function LutRow({ lut }: { lut: LUT }) {
  const { state, dispatch } = useApp();
  function patch(p: Partial<LUT>) {
    dispatch({ type: 'UPDATE_LUT', id: lut.id, patch: p });
  }
  return (
    <li className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4 group">
      <div className="flex items-baseline gap-3">
        <div className="flex-1 min-w-0">
          <EditableText
            value={lut.name}
            onChange={(v) => patch({ name: v })}
            className="display-italic text-[18px] text-[color:var(--color-on-paper)]"
          />
        </div>
        <select
          value={lut.episodeId ?? 'general'}
          onChange={(e) => patch({ episodeId: e.target.value })}
          className="bg-transparent label-caps text-[color:var(--color-brass-deep)] outline-none"
        >
          <option value="general">All episodes</option>
          {state.episodes.map((ep) => (
            <option key={ep.id} value={ep.id}>
              Ep {ep.number} · {ep.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => dispatch({ type: 'DELETE_LUT', id: lut.id })}
          className="opacity-0 group-hover:opacity-100 text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] transition-all p-1"
          aria-label="Delete LUT"
        >
          <Trash2 size={11} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        <Field label="Source colorspace">
          <EditableText
            value={lut.sourceColorspace}
            onChange={(v) => patch({ sourceColorspace: v })}
            placeholder="ARRI LogC3"
            className="prose-body text-[13px] text-[color:var(--color-on-paper)]"
          />
        </Field>
        <Field label="Target colorspace">
          <EditableText
            value={lut.targetColorspace}
            onChange={(v) => patch({ targetColorspace: v })}
            placeholder="Rec.709 BT.1886"
            className="prose-body text-[13px] text-[color:var(--color-on-paper)]"
          />
        </Field>
      </div>
      <div className="mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        <Field label="Notes">
          <EditableText
            value={lut.notes}
            onChange={(v) => patch({ notes: v })}
            multiline
            rows={2}
            placeholder="When to apply, color intent, etc."
            className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]"
          />
        </Field>
      </div>
    </li>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}
