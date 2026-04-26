import { useState } from 'react';
import { Pen, Plus, Trash2, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Sketch } from '../../types';
import { SketchCanvas } from '../primitives/SketchCanvas';
import { EditableText } from '../primitives/EditableText';
import { newId } from './shared';

interface Props {
  episodeId: string;
}

/* Sketch gallery — lives below References in the Story tab.
   Click "new sketch" → modal with SketchCanvas → save PNG → thumbnail card.
   Clicking an existing thumbnail re-opens the modal for re-edit. */
export function SketchSection({ episodeId }: Props) {
  const { state, dispatch } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const sketches = state.sketches.filter((s) => s.episodeId === episodeId);
  const editingSketch = editingId ? sketches.find((s) => s.id === editingId) : null;

  function newSketch() {
    setNewOpen(true);
  }

  function handleSave(pngBase64: string, label?: string) {
    if (editingSketch) {
      dispatch({
        type: 'UPDATE_SKETCH',
        id: editingSketch.id,
        patch: { pngBase64, label: label ?? editingSketch.label },
      });
      setEditingId(null);
    } else {
      const sketch: Sketch = {
        id: newId('sk'),
        episodeId,
        pngBase64,
        label,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_SKETCH', sketch });
      setNewOpen(false);
    }
  }

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-3">
          <Pen size={13} className="text-[color:var(--color-brass-deep)]" />
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
            Sketches
          </h3>
          {sketches.length > 0 && (
            <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
              {sketches.length} for this episode
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={newSketch}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>new sketch</span>
        </button>
      </div>

      {sketches.length === 0 ? (
        <div className="border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-7 py-10 text-center">
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] max-w-[480px] mx-auto leading-relaxed">
            Quick frame thumbnails for shots and beats. Pen-and-ink fast — over Marko's
            shoulder looking at the net · the lighthouse keeper at the door · the catch in
            the morning.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-4 gap-3">
          {sketches.map((s) => (
            <li
              key={s.id}
              className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden hover:border-[color:var(--color-brass)] transition-colors group relative"
            >
              <button
                type="button"
                onClick={() => setEditingId(s.id)}
                className="block w-full text-left"
                aria-label="Edit sketch"
              >
                <img
                  src={s.pngBase64}
                  alt={s.label ?? 'sketch'}
                  className="block w-full aspect-[5/3] object-contain bg-[color:var(--color-paper-card)]"
                />
                <div className="px-3 py-2">
                  <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] truncate">
                    {s.label || 'untitled'}
                  </div>
                  <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-0.5 tabular-nums">
                    {fmtCreated(s.createdAt)}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete sketch?')) {
                    dispatch({ type: 'DELETE_SKETCH', id: s.id });
                  }
                }}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-[color:var(--color-paper-card)]/95 text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete sketch"
              >
                <Trash2 size={11} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {(newOpen || editingSketch) && (
        <SketchModal
          initialPng={editingSketch?.pngBase64}
          initialLabel={editingSketch?.label}
          onSave={handleSave}
          onClose={() => {
            setNewOpen(false);
            setEditingId(null);
          }}
        />
      )}
    </section>
  );
}

interface ModalProps {
  initialPng?: string;
  initialLabel?: string;
  onSave: (pngBase64: string, label?: string) => void;
  onClose: () => void;
}

function SketchModal({ initialPng, initialLabel, onSave, onClose }: ModalProps) {
  const [label, setLabel] = useState(initialLabel ?? '');

  return (
    <div className="fixed inset-0 z-40 bg-[color:var(--color-chrome-deep)]/85 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper-strong)] rounded-[4px] p-7 w-full max-w-[1100px] shadow-[0_8px_32px_rgba(14,30,54,0.18)]">
          <header className="flex items-baseline justify-between mb-5 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
            <h2 className="display-italic text-[22px] text-[color:var(--color-on-paper)]">
              {initialPng ? 'Edit sketch' : 'New sketch'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper)] transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </header>

          <div className="mb-4">
            <EditableText
              value={label}
              onChange={setLabel}
              placeholder="label this sketch · e.g. Marko at the helm, sunset framing"
              className="display-italic text-[18px] text-[color:var(--color-on-paper)] block w-full"
            />
          </div>

          <SketchCanvas
            width={960}
            height={540}
            initialPng={initialPng}
            saveLabel="save sketch"
            onSave={(png) => onSave(png, label.trim() || undefined)}
          />

          <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] mt-4 leading-relaxed">
            Pen / eraser · 4 brand colours · 4 stroke sizes · 30-step undo · save to attach
            this sketch to the episode. Re-open any sketch to keep drawing.
          </p>
        </div>
      </div>
    </div>
  );
}

function fmtCreated(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
}
