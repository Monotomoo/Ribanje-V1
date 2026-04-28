import { useMemo, useState } from 'react';
import { Crown, GitCompare } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import type { Spark } from '../../types';
import { SparkCard } from './SparkCard';

/* ---------- SparkCompare (Phase 13) ----------
   Side-by-side compare of 2-4 sparks. Designed for the test-shot A/B/C
   reality: shoot 3 versions of an idea, decide which one wins later.

   The selection lives in the parent SparksView (lifted state via
   selectedIds prop). Click "mark winner" → patches comparePartnerIds
   on all selected to mark the winner relationship. */

interface Props {
  selectedIds: string[];
  onClearSelection?: () => void;
}

export function SparkCompare({ selectedIds, onClearSelection }: Props) {
  const { state, dispatch } = useApp();
  const t = useT();
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);

  const selected = useMemo<Spark[]>(() => {
    const sparkIds = new Set(selectedIds);
    return state.sparks.filter((s) => sparkIds.has(s.id));
  }, [state.sparks, selectedIds]);

  function markWinner(idx: number) {
    if (winnerIdx === idx) {
      setWinnerIdx(null);
      return;
    }
    setWinnerIdx(idx);
    /* Persist by patching all selected: winner gets rating=5, others
       remain. Also wire comparePartnerIds across the set. */
    const winnerSpark = selected[idx];
    if (!winnerSpark) return;
    selected.forEach((s, i) => {
      const patch: Partial<Spark> = {
        comparePartnerIds: selected.filter((p) => p.id !== s.id).map((p) => p.id),
      };
      if (i === idx) patch.rating = 5;
      dispatch({ type: 'UPDATE_SPARK', id: s.id, patch });
    });
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      <header className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] flex items-center gap-2">
            <GitCompare size={14} className="text-[color:var(--color-brass)]" />
            {t('spark.compare.title')}
          </h3>
          <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            {t('spark.compare.subtitle')}
          </p>
        </div>
        {selected.length > 0 && onClearSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-coral-deep)] transition-colors"
          >
            {t('common.cancel')}
          </button>
        )}
      </header>

      {/* Empty state */}
      {selected.length === 0 && (
        <div className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] text-center py-12 border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px]">
          {t('spark.compare.no.selection')}
        </div>
      )}

      {/* Side-by-side grid */}
      {selected.length > 0 && (
        <>
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums">
            {selected.length} {t('common.show').toLowerCase()} · {t('spark.compare.pick.partners')}
          </div>
          <div
            className={`grid gap-3 ${
              selected.length === 1
                ? 'grid-cols-1'
                : selected.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : selected.length === 3
                ? 'grid-cols-1 md:grid-cols-3'
                : 'grid-cols-2 md:grid-cols-4'
            }`}
          >
            {selected.map((spark, idx) => {
              const isWinner = winnerIdx === idx;
              const labels = ['A', 'B', 'C', 'D'];
              return (
                <div
                  key={spark.id}
                  className={`rounded-[3px] transition-all ${
                    isWinner
                      ? 'ring-2 ring-[color:var(--color-brass)] bg-[color:var(--color-brass)]/8 p-2'
                      : 'p-2'
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="display-italic text-[28px] text-[color:var(--color-brass-deep)] leading-none">
                      {labels[idx] ?? idx + 1}
                    </span>
                    {isWinner && (
                      <span className="flex items-center gap-1 label-caps text-[10px] text-[color:var(--color-brass-deep)]">
                        <Crown size={11} fill="currentColor" />
                        {t('spark.compare.winner')}
                      </span>
                    )}
                  </div>
                  <SparkCard spark={spark} compact />
                  <button
                    type="button"
                    onClick={() => markWinner(idx)}
                    className={`mt-2 w-full px-2 py-1 rounded-[2px] text-[11px] transition-colors ${
                      isWinner
                        ? 'bg-[color:var(--color-brass)] text-[color:var(--color-paper-light)]'
                        : 'bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] hover:bg-[color:var(--color-brass)]/15'
                    }`}
                  >
                    {isWinner
                      ? t('spark.compare.unmark')
                      : t('spark.compare.mark.winner')}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
