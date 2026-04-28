import { useMemo, useState } from 'react';
import { Grid3x3, Layers } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Episode, ShootDay, Shot } from '../../types';

/* ---------- Production Heatmap (Phase 12) ----------

   Day × scene grid. Each cell is the status mix of shots assigned to
   that day for that scene:

     • all captured       → success green
     • mostly captured    → brass
     • mostly planned     → muted paper
     • all cut/deferred   → coral
     • no shots planned   → very faint paper

   Click a cell to see the shots in detail (a popover). The heatmap
   answers "which scenes are healthy, which are bleeding, where are the
   coverage gaps?"

   Used in:
     · ProductionView (its own surface or in Today tab — wired into
       Today as a deeper-look surface) */

interface Props {
  groupBy?: 'scene' | 'episode';
  compact?: boolean;
}

interface Cell {
  dayId: string;
  groupKey: string;          // sceneId or episodeId
  shots: Shot[];
}

export function ProductionHeatmap({ groupBy = 'scene', compact = false }: Props) {
  const { state } = useApp();
  const [openCell, setOpenCell] = useState<{ dayId: string; groupKey: string } | null>(null);

  const days = useMemo(
    () => [...state.shootDays].sort((a, b) => a.date.localeCompare(b.date)),
    [state.shootDays]
  );

  /* Group keys depending on mode. */
  const groups = useMemo(() => {
    if (groupBy === 'scene') {
      return state.scenes
        .slice()
        .sort((a, b) => (a.dayIdx ?? 0) - (b.dayIdx ?? 0))
        .map((s) => ({
          key: s.id,
          label: s.label,
          subLabel: s.slug,
          episodeId: s.episodeId,
        }));
    }
    return [...state.episodes, ...state.specials].map((e) => ({
      key: e.id,
      label: `Ep ${e.number}`,
      subLabel: e.title,
      episodeId: e.id,
    }));
  }, [state.scenes, state.episodes, state.specials, groupBy]);

  /* Build cell data. */
  const cells = useMemo(() => {
    const m = new Map<string, Cell>();
    days.forEach((d) => {
      groups.forEach((g) => {
        m.set(`${d.id}::${g.key}`, {
          dayId: d.id,
          groupKey: g.key,
          shots: [],
        });
      });
    });
    /* Bucket shots into cells. We treat a shot as "on day X" if its
       scene's dayIdx matches the day's index — fallback to first day. */
    state.shots.forEach((s) => {
      const scene = state.scenes.find((sc) => sc.id === s.sceneId);
      const dayIdx = scene?.dayIdx;
      let day: ShootDay | undefined;
      if (dayIdx != null) {
        /* day index from the planning view is 1-based; use the one that
           matches dayIdx in the sorted days list. */
        day = days[dayIdx - 1] ?? days[0];
      } else {
        day = days[0];
      }
      if (!day) return;
      const groupKey = groupBy === 'scene' ? s.sceneId ?? '' : s.episodeId;
      const cellKey = `${day.id}::${groupKey}`;
      const cell = m.get(cellKey);
      if (cell) cell.shots.push(s);
    });
    return m;
  }, [days, groups, state.shots, state.scenes, groupBy]);

  if (days.length === 0 || groups.length === 0) {
    return (
      <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          Heatmap needs shoot days and scenes/shots. Add them in Schedule + Production.
        </div>
      </section>
    );
  }

  /* Limit groups in compact mode — first 8 with the most shots. */
  const visibleGroups = compact
    ? groups
        .map((g) => ({
          ...g,
          shotCount: state.shots.filter((s) =>
            groupBy === 'scene' ? s.sceneId === g.key : s.episodeId === g.key
          ).length,
        }))
        .sort((a, b) => b.shotCount - a.shotCount)
        .slice(0, 8)
    : groups;

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
      <header className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="display-italic text-[16px] text-[color:var(--color-on-paper)] leading-tight flex items-center gap-2">
            <Grid3x3 size={14} className="text-[color:var(--color-brass)]" />
            Production heatmap
          </h3>
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            day × {groupBy} · click a cell to see shots
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Layers size={11} className="text-[color:var(--color-on-paper-muted)]" />
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums">
            {days.length} days × {visibleGroups.length} {groupBy}s
          </span>
        </div>
      </header>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="text-[10px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-[color:var(--color-paper-light)] text-left py-1 pr-2 font-normal label-caps text-[color:var(--color-on-paper-faint)]">
                {groupBy}
              </th>
              {days.map((d, i) => (
                <th
                  key={d.id}
                  className="px-0.5 py-1 text-center font-normal prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums"
                  title={d.date}
                >
                  D{i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleGroups.map((g) => (
              <tr key={g.key}>
                <td
                  className="sticky left-0 bg-[color:var(--color-paper-light)] py-0.5 pr-2 max-w-[180px] truncate"
                  title={g.label + ' · ' + g.subLabel}
                >
                  <div className="display-italic text-[12px] text-[color:var(--color-on-paper)] truncate leading-tight">
                    {g.label}
                  </div>
                  {g.subLabel && (
                    <div className="prose-body italic text-[9px] text-[color:var(--color-on-paper-faint)] truncate leading-tight">
                      {g.subLabel}
                    </div>
                  )}
                </td>
                {days.map((d) => {
                  const cell = cells.get(`${d.id}::${g.key}`);
                  return (
                    <td key={d.id} className="px-0.5 py-0.5">
                      <HeatmapCell
                        cell={cell}
                        onOpen={() => setOpenCell({ dayId: d.id, groupKey: g.key })}
                        active={openCell?.dayId === d.id && openCell.groupKey === g.key}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)] flex items-center gap-4 prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
        <LegendDot color="var(--color-success)" label="all captured" />
        <LegendDot color="var(--color-brass)" label="mostly captured" />
        <LegendDot color="var(--color-paper-deep)" label="planned" />
        <LegendDot color="var(--color-coral-deep)" label="cut / deferred" />
        <LegendDot color="transparent" label="no shots" border />
      </div>

      {/* Cell drill-down */}
      {openCell && (
        <CellDrillDown
          cell={cells.get(`${openCell.dayId}::${openCell.groupKey}`)}
          day={days.find((d) => d.id === openCell.dayId)}
          group={visibleGroups.find((g) => g.key === openCell.groupKey)}
          onClose={() => setOpenCell(null)}
          episodes={[...state.episodes, ...state.specials]}
        />
      )}
    </section>
  );
}

/* ---------- Heatmap cell ---------- */

function HeatmapCell({
  cell,
  onOpen,
  active,
}: {
  cell?: Cell;
  onOpen: () => void;
  active: boolean;
}) {
  const total = cell?.shots.length ?? 0;
  const captured = cell?.shots.filter((s) => s.status === 'captured').length ?? 0;
  const cut = cell?.shots.filter((s) => s.status === 'cut' || s.status === 'deferred').length ?? 0;
  const tone =
    total === 0
      ? 'empty'
      : captured === total
      ? 'all-captured'
      : captured >= total / 2
      ? 'mostly-captured'
      : cut === total
      ? 'all-cut'
      : 'planned';
  const bg =
    tone === 'all-captured'
      ? 'var(--color-success)'
      : tone === 'mostly-captured'
      ? 'var(--color-brass)'
      : tone === 'planned'
      ? 'var(--color-paper-deep)'
      : tone === 'all-cut'
      ? 'var(--color-coral-deep)'
      : 'transparent';
  const intensity =
    tone === 'all-captured'
      ? 0.6
      : tone === 'mostly-captured'
      ? 0.5
      : tone === 'planned'
      ? 0.5
      : tone === 'all-cut'
      ? 0.3
      : 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      title={cell ? `${total} shots · ${captured} captured · ${cut} cut` : 'no shots'}
      className={`block w-6 h-6 rounded-[2px] transition-all border-[0.5px] ${
        active
          ? 'border-[color:var(--color-on-paper)] ring-1 ring-[color:var(--color-on-paper)]'
          : 'border-[color:var(--color-border-paper)] hover:border-[color:var(--color-on-paper-muted)]'
      }`}
      style={{
        background: bg,
        opacity: total === 0 ? 0.25 : intensity + 0.4,
      }}
    >
      {total > 0 && (
        <span className="block text-[8px] tabular-nums text-[color:var(--color-on-paper)]">
          {total}
        </span>
      )}
    </button>
  );
}

/* ---------- Legend dot ---------- */

function LegendDot({
  color,
  label,
  border,
}: {
  color: string;
  label: string;
  border?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`w-3 h-3 rounded-[2px] ${
          border ? 'border-[0.5px] border-[color:var(--color-border-paper)]' : ''
        }`}
        style={{ background: color, opacity: color === 'var(--color-paper-deep)' ? 0.6 : 0.7 }}
      />
      <span>{label}</span>
    </span>
  );
}

/* ---------- Cell drill-down ---------- */

function CellDrillDown({
  cell,
  day,
  group,
  onClose,
  episodes,
}: {
  cell?: Cell;
  day?: ShootDay;
  group?: { key: string; label: string; subLabel?: string };
  onClose: () => void;
  episodes: Episode[];
}) {
  if (!cell || !day || !group) return null;
  return (
    <div className="mt-3 p-3 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-brass)]/40">
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <div className="display-italic text-[14px] text-[color:var(--color-on-paper)] leading-tight">
            {fmtDate(day.date)} · {group.label}
          </div>
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
            {group.subLabel ?? ''}
            {day.episodeId && (
              <>
                {' · '}
                {episodes.find((e) => e.id === day.episodeId)?.title ?? ''}
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] transition-colors"
        >
          close
        </button>
      </div>
      {cell.shots.length === 0 ? (
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)]">
          No shots planned for this {group ? 'cell' : 'day'}.
        </div>
      ) : (
        <ul className="space-y-1">
          {cell.shots.map((s) => (
            <li
              key={s.id}
              className="flex items-baseline gap-2 prose-body italic text-[12px]"
            >
              <span className="tabular-nums text-[color:var(--color-brass-deep)] mr-1">
                {s.number}
              </span>
              <span className="text-[color:var(--color-on-paper)] truncate flex-1">
                {s.description || 'untitled shot'}
              </span>
              <span
                className={`label-caps tracking-[0.10em] text-[9px] tabular-nums ${
                  s.status === 'captured'
                    ? 'text-[color:var(--color-success)]'
                    : s.status === 'cut' || s.status === 'deferred'
                    ? 'text-[color:var(--color-coral-deep)]'
                    : 'text-[color:var(--color-on-paper-muted)]'
                }`}
              >
                {s.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}
