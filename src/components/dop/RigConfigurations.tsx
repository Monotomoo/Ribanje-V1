import { Boxes, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { newId } from '../episode/shared';
import type { CameraSlot, RigConfiguration } from '../../types';
import { EditableText } from '../primitives/EditableText';

const SLOT_OPTIONS: CameraSlot[] = ['A', 'B', 'drone', 'underwater', 'crash'];

export function RigConfigurations() {
  const { state, dispatch } = useApp();

  function add() {
    const config: RigConfiguration = {
      id: newId('rig'),
      name: 'New rig',
      kitItemIds: [],
    };
    dispatch({ type: 'ADD_RIG_CONFIG', config });
  }

  function patch(id: string, p: Partial<RigConfiguration>) {
    dispatch({ type: 'UPDATE_RIG_CONFIG', id, patch: p });
  }

  return (
    <div className="space-y-7 max-w-[1200px]">
      <header className="flex items-start gap-5">
        <div className="w-12 h-12 rounded-full bg-[color:var(--color-paper-deep)]/40 flex items-center justify-center shrink-0">
          <Boxes size={20} className="text-[color:var(--color-brass-deep)]" />
        </div>
        <div className="flex-1">
          <h2 className="display-italic text-[28px] text-[color:var(--color-on-paper)] leading-tight">
            Rig configurations
          </h2>
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mt-1.5 leading-relaxed">
            Saved rig setups in Tom's vocabulary. Recall a recipe instead of rebuilding the
            rig from parts. Each rig: camera + lens + audio + accessories + movement notes.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add rig</span>
        </button>
      </header>

      {state.rigConfigurations.length === 0 ? (
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)] bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-5 py-10 text-center">
          No rigs yet. Click "add rig" to start with the first.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4">
          {state.rigConfigurations.map((rig) => (
            <RigCard
              key={rig.id}
              rig={rig}
              onPatch={(p) => patch(rig.id, p)}
              onDelete={() => {
                if (window.confirm(`Delete rig "${rig.name}"?`)) {
                  dispatch({ type: 'DELETE_RIG_CONFIG', id: rig.id });
                }
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function RigCard({
  rig,
  onPatch,
  onDelete,
}: {
  rig: RigConfiguration;
  onPatch: (p: Partial<RigConfiguration>) => void;
  onDelete: () => void;
}) {
  const { state } = useApp();
  const linkedKit = rig.kitItemIds
    .map((id) => state.dopKit.find((k) => k.id === id))
    .filter((k): k is NonNullable<typeof k> => !!k);

  /* All available kit grouped by category for the picker */
  const availableKit = state.dopKit;
  const totalWeight = linkedKit.reduce((s, k) => s + (k.weightKg ?? 0), 0);
  const totalWh = linkedKit.reduce((s, k) => s + (k.wattsPerHour ?? 0), 0);

  function toggleKit(itemId: string) {
    const next = rig.kitItemIds.includes(itemId)
      ? rig.kitItemIds.filter((x) => x !== itemId)
      : [...rig.kitItemIds, itemId];
    onPatch({ kitItemIds: next });
  }

  return (
    <li className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
      <header className="px-5 py-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between gap-3">
        <div className="flex-1 min-w-0">
          <EditableText
            value={rig.name}
            onChange={(v) => onPatch({ name: v })}
            className="display-italic text-[18px] text-[color:var(--color-on-paper)] block"
          />
          {rig.cameraSlot && (
            <span className="label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-brass-deep)]">
              cam slot · {rig.cameraSlot}
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums">
            {totalWeight.toFixed(1)} kg
          </div>
          {totalWh > 0 && (
            <div className="prose-body italic text-[11px] text-[color:var(--color-brass-deep)] tabular-nums">
              {totalWh} W/h
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors"
          aria-label="Delete rig"
        >
          <Trash2 size={12} />
        </button>
      </header>

      <div className="px-5 py-4 space-y-3">
        <EditableText
          value={rig.description ?? ''}
          onChange={(v) => onPatch({ description: v || undefined })}
          placeholder="Description · when do you reach for this rig?"
          multiline
          rows={2}
          className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed block w-full"
        />

        <div className="grid grid-cols-2 gap-3 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
              Camera slot
            </div>
            <select
              value={rig.cameraSlot ?? ''}
              onChange={(e) =>
                onPatch({ cameraSlot: (e.target.value || undefined) as CameraSlot | undefined })
              }
              className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-0.5"
            >
              <option value="">—</option>
              {SLOT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
              Audio routing
            </div>
            <EditableText
              value={rig.audioRouting ?? ''}
              onChange={(v) => onPatch({ audioRouting: v || undefined })}
              placeholder="boom + lav · MOS · etc."
              className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] block w-full"
            />
          </div>
        </div>

        <div>
          <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
            Kit ({linkedKit.length})
          </div>
          {linkedKit.length === 0 ? (
            <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
              No kit linked. Toggle items below.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {linkedKit.map((k) => (
                <li
                  key={k.id}
                  className="prose-body italic text-[11px] text-[color:var(--color-on-paper)] bg-[color:var(--color-paper-deep)]/30 rounded-[2px] px-2 py-0.5"
                >
                  {k.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <details className="group">
          <summary className="cursor-pointer label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] transition-colors">
            <span className="group-open:hidden">+ pick kit items</span>
            <span className="hidden group-open:inline">− close kit picker</span>
          </summary>
          <ul className="mt-3 grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] p-2">
            {availableKit.map((k) => {
              const linked = rig.kitItemIds.includes(k.id);
              return (
                <li key={k.id}>
                  <button
                    type="button"
                    onClick={() => toggleKit(k.id)}
                    className={`w-full text-left px-2 py-1 rounded-[2px] transition-colors ${
                      linked
                        ? 'bg-[color:var(--color-brass)]/20'
                        : 'hover:bg-[color:var(--color-paper-deep)]/30'
                    }`}
                  >
                    <span
                      className={`inline-block w-3 h-3 rounded-[2px] border mr-2 align-middle ${
                        linked
                          ? 'bg-[color:var(--color-success)] border-[color:var(--color-success)]'
                          : 'border-[color:var(--color-border-paper-strong)]'
                      }`}
                    />
                    <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper)]">
                      {k.label}
                    </span>
                    <span className="label-caps text-[9px] text-[color:var(--color-on-paper-faint)] ml-1.5">
                      {k.category}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </details>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
              Lighting
            </div>
            <EditableText
              value={rig.lightingNotes ?? ''}
              onChange={(v) => onPatch({ lightingNotes: v || undefined })}
              placeholder="Available · bounce · LED · negative fill…"
              multiline
              rows={2}
              className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] leading-relaxed block w-full"
            />
          </div>
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
              Movement
            </div>
            <EditableText
              value={rig.movementNotes ?? ''}
              onChange={(v) => onPatch({ movementNotes: v || undefined })}
              placeholder="Pace · rhythm · walking pattern…"
              multiline
              rows={2}
              className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] leading-relaxed block w-full"
            />
          </div>
        </div>

        {rig.notes && (
          <p className="prose-body italic text-[11px] text-[color:var(--color-brass-deep)] pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)] leading-relaxed">
            {rig.notes}
          </p>
        )}
        <EditableText
          value={rig.notes ?? ''}
          onChange={(v) => onPatch({ notes: v || undefined })}
          placeholder="When/why · which episodes · special considerations"
          className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] block w-full pt-1"
        />
      </div>
    </li>
  );
}
