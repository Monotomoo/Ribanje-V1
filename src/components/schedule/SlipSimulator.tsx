import { useMemo, useState } from 'react';
import { ChevronRight, Clock, Sparkles } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { SchedulePhase } from '../../types';

/* Slip Simulator — pick a phase, drag a slider for "slip days," see the
   cascading impact on downstream phases (anything that starts after the
   selected phase's original end gets pushed by N days).

   Tomo's "what-if" tool. Apply → commits the cascade as UPDATE_PHASE actions. */

const MS_PER_DAY = 86_400_000;

export function SlipSimulator() {
  const { state, dispatch } = useApp();
  const sortedPhases = useMemo(
    () => [...state.schedulePhases].sort((a, b) => a.start.localeCompare(b.start)),
    [state.schedulePhases]
  );

  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(
    sortedPhases[0]?.id ?? ''
  );
  const [slipDays, setSlipDays] = useState(7);
  const [cascadeMode, setCascadeMode] = useState<'this-only' | 'cascade'>('cascade');

  const selectedPhase = sortedPhases.find((p) => p.id === selectedPhaseId);

  /* Compute the impact preview */
  const preview = useMemo(() => {
    if (!selectedPhase) return [];
    const sel = selectedPhase;
    const selEndMs = new Date(sel.end).getTime();
    const slipMs = slipDays * MS_PER_DAY;

    return sortedPhases.map((p) => {
      let newStart = new Date(p.start).getTime();
      let newEnd = new Date(p.end).getTime();
      let affected = false;
      if (p.id === sel.id) {
        /* Always affects the picked phase */
        newStart = newStart + slipMs;
        newEnd = newEnd + slipMs;
        affected = true;
      } else if (cascadeMode === 'cascade') {
        const pStartMs = new Date(p.start).getTime();
        if (pStartMs >= selEndMs) {
          /* Downstream — gets pushed */
          newStart = newStart + slipMs;
          newEnd = newEnd + slipMs;
          affected = true;
        }
      }
      return {
        phase: p,
        newStartIso: new Date(newStart).toISOString().slice(0, 10),
        newEndIso: new Date(newEnd).toISOString().slice(0, 10),
        affected,
      };
    });
  }, [selectedPhase, sortedPhases, slipDays, cascadeMode]);

  const affectedCount = preview.filter((r) => r.affected).length;

  function applySlip() {
    if (!selectedPhase) return;
    if (slipDays === 0) return;
    const verb = slipDays > 0 ? 'push' : 'pull';
    const confirm = window.confirm(
      `${verb} ${affectedCount} phase${affectedCount === 1 ? '' : 's'} by ${Math.abs(slipDays)} day${Math.abs(slipDays) === 1 ? '' : 's'}?`
    );
    if (!confirm) return;
    for (const r of preview) {
      if (r.affected) {
        dispatch({
          type: 'UPDATE_PHASE',
          id: r.phase.id,
          patch: { start: r.newStartIso, end: r.newEndIso },
        });
      }
    }
    setSlipDays(0);
  }

  if (!selectedPhase) {
    return (
      <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
        Add a phase to enable the slip simulator.
      </p>
    );
  }

  return (
    <section>
      <header className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)] flex items-baseline gap-2">
            <Clock size={14} className="text-[color:var(--color-brass-deep)]" />
            Slip simulator
          </h3>
          <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            What if a phase slips? See cascading impact before committing.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 md:gap-5">
        {/* Controls */}
        <aside className="bg-[color:var(--color-paper-light)] border-l-2 border-[color:var(--color-brass)] px-4 py-4 space-y-4">
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">phase</div>
            <select
              value={selectedPhaseId}
              onChange={(e) => setSelectedPhaseId(e.target.value)}
              className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-0.5"
            >
              {sortedPhases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} · {p.start} → {p.end}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="label-caps text-[color:var(--color-brass-deep)]">slip</span>
              <span
                className={`display-italic text-[18px] tabular-nums ${
                  slipDays > 0
                    ? 'text-[color:var(--color-coral-deep)]'
                    : slipDays < 0
                    ? 'text-[color:var(--color-success)]'
                    : 'text-[color:var(--color-on-paper)]'
                }`}
              >
                {slipDays > 0 ? '+' : ''}
                {slipDays}d
              </span>
            </div>
            <input
              type="range"
              min={-30}
              max={60}
              step={1}
              value={slipDays}
              onChange={(e) => setSlipDays(parseInt(e.target.value, 10))}
              className="w-full"
            />
            <div className="flex justify-between prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-0.5">
              <span>−30d (early)</span>
              <span>+60d (late)</span>
            </div>
          </div>

          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">mode</div>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setCascadeMode('this-only')}
                className={`label-caps tracking-[0.10em] text-[10px] py-1.5 rounded-[2px] transition-colors border-[0.5px] ${
                  cascadeMode === 'this-only'
                    ? 'bg-[color:var(--color-brass)] text-[color:var(--color-paper)] border-[color:var(--color-brass)]'
                    : 'text-[color:var(--color-on-paper-muted)] border-[color:var(--color-border-paper)]'
                }`}
              >
                this only
              </button>
              <button
                type="button"
                onClick={() => setCascadeMode('cascade')}
                className={`label-caps tracking-[0.10em] text-[10px] py-1.5 rounded-[2px] transition-colors border-[0.5px] ${
                  cascadeMode === 'cascade'
                    ? 'bg-[color:var(--color-brass)] text-[color:var(--color-paper)] border-[color:var(--color-brass)]'
                    : 'text-[color:var(--color-on-paper-muted)] border-[color:var(--color-border-paper)]'
                }`}
              >
                cascade
              </button>
            </div>
            <p className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-1.5 leading-tight">
              {cascadeMode === 'cascade'
                ? 'Push all downstream phases by the same amount.'
                : 'Move only this phase, leave others untouched.'}
            </p>
          </div>

          <div className="pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] mb-2">
              <span className="display-italic text-[16px]">{affectedCount}</span>{' '}
              phase{affectedCount === 1 ? '' : 's'} would shift
            </div>
            <button
              type="button"
              onClick={applySlip}
              disabled={slipDays === 0 || affectedCount === 0}
              className="w-full flex items-baseline justify-center gap-1.5 label-caps tracking-[0.14em] text-[11px] text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2 rounded-[2px] transition-colors"
            >
              <Sparkles size={11} />
              apply slip
            </button>
          </div>
        </aside>

        {/* Preview list */}
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
          <header className="px-5 py-2 bg-[color:var(--color-paper)] border-b-[0.5px] border-[color:var(--color-border-paper)] hidden md:grid md:grid-cols-[1fr_180px_180px] gap-3 label-caps text-[color:var(--color-on-paper-faint)]">
            <span>phase</span>
            <span>current</span>
            <span>after slip</span>
          </header>
          <ul>
            {preview.map((r) => (
              <SlipRow key={r.phase.id} row={r} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function SlipRow({
  row,
}: {
  row: { phase: SchedulePhase; newStartIso: string; newEndIso: string; affected: boolean };
}) {
  const dim = !row.affected;
  return (
    <li
      className={`grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-1 md:gap-3 px-5 py-2 border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0 md:items-baseline transition-opacity ${
        dim ? 'opacity-40' : ''
      }`}
    >
      <span className="display-italic text-[13px] text-[color:var(--color-on-paper)] flex items-baseline gap-2">
        {row.affected && (
          <ChevronRight size={9} className="text-[color:var(--color-brass-deep)] shrink-0" />
        )}
        {row.phase.label}
      </span>
      <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] tabular-nums">
        {row.phase.start} → {row.phase.end}
      </span>
      <span
        className={`prose-body italic text-[12px] tabular-nums ${
          row.affected
            ? 'text-[color:var(--color-coral-deep)]'
            : 'text-[color:var(--color-on-paper-faint)]'
        }`}
      >
        {row.newStartIso} → {row.newEndIso}
      </span>
    </li>
  );
}
