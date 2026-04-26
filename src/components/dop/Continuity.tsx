import { useMemo, useState } from 'react';
import { ClipboardList, Filter as FilterIcon } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { CameraSlot, Shot } from '../../types';
import { EditableText } from '../primitives/EditableText';
import { ContinuityWarnings } from './ContinuityWarnings';

const SLOT_FILTER: Array<CameraSlot | 'all'> = ['all', 'A', 'B', 'drone', 'underwater', 'crash'];

const STATUS_TONE: Record<Shot['status'], string> = {
  planned: 'text-[color:var(--color-on-paper-muted)]',
  captured: 'text-[color:var(--color-success)]',
  cut: 'text-[color:var(--color-on-paper-faint)] line-through',
  deferred: 'text-[color:var(--color-coral-deep)]',
};

/* Continuity tracker — per-shot technical metadata for editor handoff.
   Reads from extended Shot type. Editable inline. The "what was the actual
   setup on scene 3 shot 2 cam B" question, answered. */
export function Continuity() {
  const { state, dispatch } = useApp();
  const allEpisodes = [...state.episodes, ...state.specials];
  const [activeEp, setActiveEp] = useState<string>(allEpisodes[0]?.id ?? '');
  const [slotFilter, setSlotFilter] = useState<CameraSlot | 'all'>('all');

  const epShots = useMemo(() => {
    return state.shots
      .filter((s) => s.episodeId === activeEp)
      .filter((s) => slotFilter === 'all' || s.cameraSlot === slotFilter);
  }, [state.shots, activeEp, slotFilter]);

  /* Group shots by scene. */
  const grouped = useMemo(() => {
    const out = new Map<string | '__none__', Shot[]>();
    for (const s of epShots) {
      const key = s.sceneId ?? '__none__';
      const arr = out.get(key) ?? [];
      arr.push(s);
      out.set(key, arr);
    }
    return Array.from(out.entries()).map(([sceneId, shots]) => ({
      sceneId,
      scene: sceneId === '__none__' ? null : state.scenes.find((sc) => sc.id === sceneId) ?? null,
      shots: shots.sort((a, b) => a.number.localeCompare(b.number)),
    }));
  }, [epShots, state.scenes]);

  function patch(id: string, p: Partial<Shot>) {
    dispatch({ type: 'UPDATE_SHOT', id, patch: p });
  }

  /* Roll-up stats */
  const totalShots = epShots.length;
  const documented = epShots.filter(
    (s) => s.lensId || s.isoValue || s.wbKelvin || s.filter || s.frameRate
  ).length;
  const completeness = totalShots > 0 ? Math.round((documented / totalShots) * 100) : 0;

  return (
    <div className="space-y-6 max-w-[1500px]">
      <header className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <ClipboardList size={14} className="text-[color:var(--color-brass-deep)]" />
          <h3 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
            Continuity
          </h3>
          <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
            per-shot technical metadata · for editor handoff
          </span>
        </div>
        <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] tabular-nums">
          {documented} / {totalShots} documented · {completeness}% complete
        </span>
      </header>

      {/* Auto-detected continuity warnings — exposure / WB / lens / metadata mismatches */}
      <ContinuityWarnings />

      {/* Episode tabs */}
      <nav className="flex items-baseline gap-1 flex-wrap">
        {allEpisodes.map((ep) => {
          const active = activeEp === ep.id;
          const count = state.shots.filter((s) => s.episodeId === ep.id).length;
          return (
            <button
              key={ep.id}
              type="button"
              onClick={() => setActiveEp(ep.id)}
              className={`px-3 py-1.5 rounded-[2px] transition-colors ${
                active
                  ? 'bg-[color:var(--color-paper-deep)]/40 text-[color:var(--color-on-paper)]'
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              <span
                className={
                  active
                    ? 'display-italic text-[14px]'
                    : 'font-sans text-[11px] tracking-[0.10em]'
                }
              >
                Ep {ep.number} · {ep.title}
              </span>
              {count > 0 && (
                <span className="ml-1.5 prose-body italic text-[10px] text-[color:var(--color-brass-deep)] tabular-nums">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Camera filter */}
      <div className="flex items-baseline gap-3">
        <FilterIcon size={11} className="text-[color:var(--color-on-paper-faint)]" />
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">camera</span>
        {SLOT_FILTER.map((s) => {
          const active = slotFilter === s;
          const c =
            s === 'all'
              ? state.shots.filter((sh) => sh.episodeId === activeEp).length
              : state.shots.filter((sh) => sh.episodeId === activeEp && sh.cameraSlot === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSlotFilter(s)}
              className={`label-caps tracking-[0.12em] text-[10px] px-2 py-0.5 rounded-[2px] transition-colors ${
                active
                  ? 'bg-[color:var(--color-brass)]/30 text-[color:var(--color-on-paper)]'
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              {s} · {c}
            </button>
          );
        })}
      </div>

      {/* Continuity table per scene */}
      {grouped.length === 0 ? (
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)]">
          No shots in this episode + filter combination.
        </p>
      ) : (
        <div className="space-y-5">
          {grouped.map((g) => (
            <section
              key={g.sceneId}
              className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden"
            >
              <header className="px-5 py-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
                <h4 className="display-italic text-[16px] text-[color:var(--color-on-paper)]">
                  {g.scene?.label ?? 'Loose shots'}
                </h4>
                {g.scene?.notes && (
                  <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
                    {g.scene.notes}
                  </p>
                )}
              </header>
              <div className="grid grid-cols-[40px_1fr_50px_140px_70px_70px_120px_70px_70px_70px] gap-2 px-4 py-2 bg-[color:var(--color-paper)] border-b-[0.5px] border-[color:var(--color-border-paper)] label-caps text-[color:var(--color-on-paper-faint)] text-[9px]">
                <span>#</span>
                <span>desc</span>
                <span>cam</span>
                <span>lens</span>
                <span>fps</span>
                <span>shutter</span>
                <span>filter</span>
                <span>iso</span>
                <span>wb K</span>
                <span>status</span>
              </div>
              <ul>
                {g.shots.map((sh) => (
                  <ContinuityRow key={sh.id} shot={sh} onPatch={(p) => patch(sh.id, p)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ContinuityRow({
  shot,
  onPatch,
}: {
  shot: Shot;
  onPatch: (p: Partial<Shot>) => void;
}) {
  const { state } = useApp();
  const lensOptions = state.dopKit.filter((k) => k.category === 'lens');

  return (
    <li className="grid grid-cols-[40px_1fr_50px_140px_70px_70px_120px_70px_70px_70px] gap-2 px-4 py-2 border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0 items-baseline">
      <span className="display-italic text-[12px] text-[color:var(--color-brass-deep)] tabular-nums">
        {shot.number}
      </span>
      <span className={`prose-body italic text-[12px] truncate ${STATUS_TONE[shot.status]}`}>
        {shot.description || '—'}
      </span>
      <span className="display-italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums">
        {shot.cameraSlot}
      </span>
      <select
        value={shot.lensId ?? ''}
        onChange={(e) => onPatch({ lensId: e.target.value || undefined })}
        className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[11px] text-[color:var(--color-on-paper)] py-0.5"
      >
        <option value="">—</option>
        {lensOptions.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
          </option>
        ))}
      </select>
      <EditableText
        value={shot.frameRate ?? ''}
        onChange={(v) => onPatch({ frameRate: v || undefined })}
        placeholder="—"
        className="prose-body italic text-[11px] text-[color:var(--color-on-paper)] tabular-nums"
      />
      <input
        type="number"
        value={shot.shutterAngle ?? ''}
        onChange={(e) =>
          onPatch({
            shutterAngle: e.target.value === '' ? undefined : parseFloat(e.target.value),
          })
        }
        placeholder="180"
        className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[11px] text-[color:var(--color-on-paper)] tabular-nums w-full py-0.5"
      />
      <EditableText
        value={shot.filter ?? ''}
        onChange={(v) => onPatch({ filter: v || undefined })}
        placeholder="—"
        className="prose-body italic text-[11px] text-[color:var(--color-on-paper)]"
      />
      <input
        type="number"
        value={shot.isoValue ?? ''}
        onChange={(e) =>
          onPatch({
            isoValue: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
          })
        }
        placeholder="—"
        className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[11px] text-[color:var(--color-on-paper)] tabular-nums w-full py-0.5"
      />
      <input
        type="number"
        value={shot.wbKelvin ?? ''}
        onChange={(e) =>
          onPatch({
            wbKelvin: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
          })
        }
        placeholder="—"
        className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[11px] text-[color:var(--color-on-paper)] tabular-nums w-full py-0.5"
      />
      <span className={`label-caps tracking-[0.10em] text-[9px] ${STATUS_TONE[shot.status]}`}>
        {shot.status}
      </span>
    </li>
  );
}
