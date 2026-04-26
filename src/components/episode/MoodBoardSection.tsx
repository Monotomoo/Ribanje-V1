import { useState } from 'react';
import { Palette, Plus, Trash2, Upload } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { ColorPalette } from '../../types';
import { newId } from './shared';
import {
  PaletteSwatchRow,
  extractPaletteFromFile,
} from '../primitives/PaletteExtractor';
import { EditableText } from '../primitives/EditableText';

interface Props {
  episodeId: string;
}

/* Mood board section — lives in Episode hub Story tab below Sketches.
   Drop reference images, auto-extract a 5-colour palette, label the mood,
   keep multiple boards per episode for different scenes/moods.
   Reuses the existing ColorPalette type — boards are episode-scoped palettes. */
export function MoodBoardSection({ episodeId }: Props) {
  const { state, dispatch } = useApp();
  const [busy, setBusy] = useState(false);

  const boards = state.colorPalettes.filter((p) => p.episodeId === episodeId);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const colors = await extractPaletteFromFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        const board: ColorPalette = {
          id: newId('mood'),
          episodeId,
          label: stripExt(file.name),
          colors,
          sourceImageBase64: String(reader.result),
          notes: '',
        };
        dispatch({ type: 'ADD_PALETTE', palette: board });
      };
      reader.readAsDataURL(file);
    } catch {
      /* swallow — user retries */
    } finally {
      setBusy(false);
    }
  }

  function patch(id: string, p: Partial<ColorPalette>) {
    dispatch({ type: 'UPDATE_PALETTE', id, patch: p });
  }

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-3">
          <Palette size={13} className="text-[color:var(--color-brass-deep)]" />
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
            Mood boards
          </h3>
          {boards.length > 0 && (
            <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
              {boards.length} for this episode
            </span>
          )}
        </div>
        <label className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors cursor-pointer">
          {busy ? (
            <>
              <span>extracting…</span>
            </>
          ) : (
            <>
              <Plus size={11} />
              <span>add reference</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {boards.length === 0 ? (
        <label className="block border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-7 py-10 text-center cursor-pointer hover:border-[color:var(--color-brass)] transition-colors">
          <Upload
            size={18}
            className="text-[color:var(--color-brass-deep)] mx-auto mb-3 opacity-80"
          />
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] max-w-[480px] mx-auto leading-relaxed">
            Drop a still — film reference, Tom's grade test, a Hektorović-period painting.
            We extract a 5-colour palette and you label the mood. Multiple boards per
            episode for scenes that need different looks.
          </p>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
        </label>
      ) : (
        <ul className="grid grid-cols-2 gap-4">
          {boards.map((b) => (
            <li
              key={b.id}
              className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden group relative"
            >
              {b.sourceImageBase64 && (
                <img
                  src={b.sourceImageBase64}
                  alt={b.label}
                  className="block w-full aspect-[16/9] object-cover bg-[color:var(--color-paper-card)]"
                />
              )}
              <div className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <EditableText
                    value={b.label}
                    onChange={(v) => patch(b.id, { label: v })}
                    placeholder="mood label"
                    className="display-italic text-[15px] text-[color:var(--color-on-paper)] flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete board "${b.label}"?`)) {
                        dispatch({ type: 'DELETE_PALETTE', id: b.id });
                      }
                    }}
                    className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Delete board"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                <PaletteSwatchRow colors={b.colors} height={18} showHex />
                <div className="mt-2.5 pt-2.5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                  <EditableText
                    value={b.notes ?? ''}
                    onChange={(v) => patch(b.id, { notes: v })}
                    placeholder="what's the feeling here · which scene"
                    className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] leading-relaxed block"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function stripExt(name: string): string {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(0, i) : name;
}
