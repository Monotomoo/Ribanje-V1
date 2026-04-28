import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Filter, Sparkles } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import type { Spark, SparkKind, SparkStatus } from '../../types';
import { SparkCard } from './SparkCard';
import { SparkCaptureModal } from './SparkCaptureModal';
import { promoteSpark } from './sparkPromote';
import { SPARK_KINDS, SPARK_STATUSES } from './sparkKinds';

/* ---------- SparkWall (Phase 13) ----------
   The 3-column draggable board: Raw / Brewing / Promoted.
   Parked sparks live behind a toggle.

   Filters:
     • by kind (multi-select chips)
     • by date range (today / week / trip / all)
     • by location, episode (later — keep MVP tight)

   HTML5 drag-and-drop between columns; tap-to-cycle as touch fallback. */

type DateRange = 'today' | 'week' | 'trip' | 'all';

interface Props {
  selectedForCompareIds?: Set<string>;
  onToggleCompareSelection?: (s: Spark) => void;
}

export function SparkWall({ selectedForCompareIds, onToggleCompareSelection }: Props) {
  const { state, dispatch } = useApp();
  const t = useT();
  const [captureOpen, setCaptureOpen] = useState(false);
  const [showParked, setShowParked] = useState(false);
  const [kindFilter, setKindFilter] = useState<Set<SparkKind>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<SparkStatus | null>(null);

  const filtered = useMemo<Spark[]>(() => {
    return state.sparks.filter((s) => {
      if (kindFilter.size > 0 && !kindFilter.has(s.kind)) return false;
      if (dateRange !== 'all') {
        const captured = new Date(s.capturedAt).getTime();
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;
        if (dateRange === 'today' && now - captured > day) return false;
        if (dateRange === 'week' && now - captured > 7 * day) return false;
        if (dateRange === 'trip' && now - captured > 3 * day) return false;
      }
      return true;
    });
  }, [state.sparks, kindFilter, dateRange]);

  const byColumn = useMemo<Record<SparkStatus, Spark[]>>(() => {
    const empty: Record<SparkStatus, Spark[]> = {
      raw: [],
      brewing: [],
      promoted: [],
      parked: [],
    };
    filtered.forEach((s) => empty[s.status].push(s));
    /* Sort each column by capturedAt DESC. */
    (Object.keys(empty) as SparkStatus[]).forEach((status) => {
      empty[status].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
    });
    return empty;
  }, [filtered]);

  function toggleKindFilter(kind: SparkKind) {
    const next = new Set(kindFilter);
    if (next.has(kind)) next.delete(kind);
    else next.add(kind);
    setKindFilter(next);
  }

  function onDragStart(e: React.DragEvent, sparkId: string) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sparkId);
    setDraggedId(sparkId);
  }

  function onDragOver(e: React.DragEvent, column: SparkStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverColumn(column);
  }

  function onDrop(e: React.DragEvent, column: SparkStatus) {
    e.preventDefault();
    const sparkId = e.dataTransfer.getData('text/plain') || draggedId;
    if (!sparkId) return;
    dispatch({ type: 'SET_SPARK_STATUS', id: sparkId, status: column });
    setDraggedId(null);
    setOverColumn(null);
  }

  function handlePromote(spark: Spark) {
    promoteSpark(spark, state, dispatch, 'beat');
  }

  const visibleColumns: SparkStatus[] = showParked
    ? ['raw', 'brewing', 'promoted', 'parked']
    : ['raw', 'brewing', 'promoted'];

  return (
    <div className="space-y-4">
      {/* Capture button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setCaptureOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-[3px] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] text-[color:var(--color-paper-light)] transition-colors group shrink-0"
        >
          <Sparkles
            size={18}
            className="group-hover:rotate-12 transition-transform"
          />
          <span className="display-italic text-[20px]">
            {t('spark.capture.button')}
          </span>
          <span className="prose-body italic text-[11px] opacity-70">
            ({t('spark.capture.button.hint')})
          </span>
        </button>

        {/* Stats */}
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] tabular-nums flex items-baseline gap-3">
          <span>
            <span className="text-[color:var(--color-on-paper)] tabular-nums">
              {state.sparks.length}
            </span>
            {' '}{t('spark.demo.captured')}
          </span>
          {state.sparks.filter((s) => s.status === 'promoted').length > 0 && (
            <span className="text-[color:var(--color-success)]">
              · {state.sparks.filter((s) => s.status === 'promoted').length} {t('spark.status.promoted')}
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={12} className="text-[color:var(--color-on-paper-muted)]" />
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as DateRange)}
          className="px-2 py-1 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[11px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
        >
          <option value="all">{t('spark.filter.date.all')}</option>
          <option value="today">{t('spark.filter.date.today')}</option>
          <option value="week">{t('spark.filter.date.week')}</option>
          <option value="trip">{t('spark.filter.date.trip')}</option>
        </select>

        <div className="flex flex-wrap gap-1">
          {SPARK_KINDS.map((meta) => {
            const Icon = meta.Icon;
            const active = kindFilter.has(meta.kind);
            return (
              <button
                key={meta.kind}
                type="button"
                onClick={() => toggleKindFilter(meta.kind)}
                className={`p-1.5 rounded-[3px] transition-colors ${
                  active
                    ? 'bg-[color:var(--color-brass)] text-[color:var(--color-paper-light)]'
                    : 'bg-[color:var(--color-paper-light)] text-[color:var(--color-on-paper-muted)] hover:bg-[color:var(--color-brass)]/15'
                }`}
                title={t(meta.labelKey)}
              >
                <Icon size={11} />
              </button>
            );
          })}
        </div>

        {kindFilter.size > 0 && (
          <button
            type="button"
            onClick={() => setKindFilter(new Set())}
            className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-coral-deep)] transition-colors"
          >
            {t('common.all')}
          </button>
        )}
      </div>

      {/* Empty state */}
      {state.sparks.length === 0 && (
        <div className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] text-center py-12 border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px]">
          {t('spark.empty.wall')}
        </div>
      )}

      {/* Columns */}
      {state.sparks.length > 0 && (
        <div
          className={`grid gap-3 ${
            showParked ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 lg:grid-cols-3'
          }`}
        >
          {visibleColumns.map((status) => {
            const meta = SPARK_STATUSES.find((s) => s.status === status)!;
            const sparks = byColumn[status];
            const isOver = overColumn === status && draggedId;
            return (
              <div
                key={status}
                onDragOver={(e) => onDragOver(e, status)}
                onDrop={(e) => onDrop(e, status)}
                className={`rounded-[3px] p-3 transition-colors min-h-[300px] ${
                  isOver
                    ? 'bg-[color:var(--color-brass)]/10 border-[1px] border-dashed border-[color:var(--color-brass)]'
                    : 'bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)]'
                }`}
                style={{ borderTop: `2px solid ${meta.tone}` }}
              >
                <header className="flex items-baseline justify-between mb-3 pb-2 border-b-[0.5px] border-[color:var(--color-border-paper)]">
                  <div>
                    <div
                      className="display-italic text-[14px]"
                      style={{ color: meta.tone }}
                    >
                      {t(meta.labelKey)}
                    </div>
                    <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] leading-tight">
                      {t(`spark.column.${status}.hint` as never)}
                    </div>
                  </div>
                  <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums">
                    {sparks.length}
                  </span>
                </header>

                <div className="space-y-2">
                  {sparks.length === 0 ? (
                    <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] text-center py-6">
                      {t('spark.empty.column')}
                    </div>
                  ) : (
                    sparks.map((spark) => (
                      <SparkCard
                        key={spark.id}
                        spark={spark}
                        draggable
                        onDragStart={(e) => onDragStart(e, spark.id)}
                        onDragEnd={() => {
                          setDraggedId(null);
                          setOverColumn(null);
                        }}
                        onPromote={handlePromote}
                        onSelectForCompare={onToggleCompareSelection}
                        isSelectedForCompare={selectedForCompareIds?.has(spark.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show parked toggle */}
      {state.sparks.length > 0 && byColumn.parked.length > 0 && (
        <button
          type="button"
          onClick={() => setShowParked(!showParked)}
          className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] flex items-center gap-1 transition-colors"
        >
          {showParked ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {showParked ? t('common.hide') : t('spark.column.show.parked')}
          <span className="tabular-nums">({byColumn.parked.length})</span>
        </button>
      )}

      <SparkCaptureModal
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
      />
    </div>
  );
}
