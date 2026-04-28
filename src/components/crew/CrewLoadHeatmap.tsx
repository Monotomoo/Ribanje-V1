import { useMemo, useState } from 'react';
import { Calendar, Filter, Grid3x3, Users } from 'lucide-react';
import { useApp } from '../../state/AppContext';

/* ---------- Crew-Load Heatmap (Phase 12) ----------

   Day × person grid. Each cell sums "what is this person doing today"
   across multiple sources:

     • tasks due that day (assigneeId match)
     • assigned a crew position that day (= on-shift)
     • owns a schedulePhase that spans that day
     • is the operator on a shot for that day's scenes

   Load score: 0 = off, 1 = light, 2 = busy, 3+ = overcommit.

   Why it matters: it answers "who's stretched too thin on Day 6?"
   before it bites the producer. A boom op on cam B AND with 3 tasks
   AND covering a phase milestone is a problem worth seeing in
   advance, not at 5am on the boat. */

const RANGE_OPTIONS = ['7 days', '14 days', '30 days', 'shoot range'] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];

interface Props {
  compact?: boolean;
}

interface LoadCell {
  date: string;
  crewId: string;
  taskCount: number;
  hasPosition: boolean;
  hasPhase: boolean;
  shotCount: number;
  load: number;     // composite 0..N
  details: string[];
}

export function CrewLoadHeatmap({ compact = false }: Props) {
  const { state } = useApp();
  const [range, setRange] = useState<RangeOption>('shoot range');
  const [openCell, setOpenCell] = useState<{ crewId: string; date: string } | null>(null);

  const dates = useMemo(() => {
    const today = new Date();
    if (range === '7 days') return rangeDates(today, 7);
    if (range === '14 days') return rangeDates(today, 14);
    if (range === '30 days') return rangeDates(today, 30);
    /* Shoot range — span the shoot days. */
    if (state.shootDays.length === 0) return rangeDates(today, 14);
    const sorted = [...state.shootDays].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0].date;
    const last = sorted[sorted.length - 1].date;
    return rangeDatesFromIso(first, last);
  }, [range, state.shootDays]);

  const cells = useMemo(() => {
    const result = new Map<string, LoadCell>();
    state.crew.forEach((c) => {
      dates.forEach((d) => {
        const dateIso = d.iso;
        const tasksForDay = state.tasks.filter(
          (t) =>
            t.assigneeId === c.id &&
            t.dueDate === dateIso &&
            t.status !== 'done'
        );
        const positionForDay = state.crewPositions.some(
          (p) => p.crewId === c.id && p.date === dateIso && p.slot !== 'off'
        );
        const phaseSpan = state.schedulePhases.some((ph) => {
          if (ph.ownerId !== c.id) return false;
          return dateIso >= ph.start && dateIso <= ph.end;
        });
        /* Shots: figure out which scenes are on this day, count shots
           where this crew is the operator. */
        const shootDay = state.shootDays.find((sd) => sd.date === dateIso);
        let shotCount = 0;
        if (shootDay) {
          /* This day's index in the shoot timeline */
          const sortedDays = [...state.shootDays].sort((a, b) => a.date.localeCompare(b.date));
          const dayIdx = sortedDays.findIndex((sd) => sd.id === shootDay.id) + 1;
          const scenesOnDay = state.scenes.filter((sc) => sc.dayIdx === dayIdx);
          const sceneIds = new Set(scenesOnDay.map((s) => s.id));
          shotCount = state.shots.filter(
            (s) =>
              s.operator === c.id &&
              s.sceneId &&
              sceneIds.has(s.sceneId) &&
              s.status !== 'cut'
          ).length;
        }

        const taskCount = tasksForDay.length;
        const load =
          taskCount +
          (positionForDay ? 1 : 0) +
          (phaseSpan ? 1 : 0) +
          (shotCount > 0 ? Math.min(shotCount, 3) : 0);

        const details: string[] = [];
        if (positionForDay) details.push('on shift');
        if (phaseSpan) details.push('owns phase');
        if (taskCount > 0) details.push(`${taskCount} task${taskCount === 1 ? '' : 's'}`);
        if (shotCount > 0) details.push(`${shotCount} shot${shotCount === 1 ? '' : 's'}`);

        result.set(`${c.id}::${dateIso}`, {
          date: dateIso,
          crewId: c.id,
          taskCount,
          hasPosition: positionForDay,
          hasPhase: phaseSpan,
          shotCount,
          load,
          details,
        });
      });
    });
    return result;
  }, [state, dates]);

  /* Crew sorted by max load to put overcommit-prone people at top. */
  const sortedCrew = useMemo(() => {
    return [...state.crew]
      .map((c) => {
        const maxLoad = Math.max(
          0,
          ...Array.from(cells.values())
            .filter((cell) => cell.crewId === c.id)
            .map((cell) => cell.load)
        );
        const totalLoad = Array.from(cells.values())
          .filter((cell) => cell.crewId === c.id)
          .reduce((sum, cell) => sum + cell.load, 0);
        return { crew: c, maxLoad, totalLoad };
      })
      .sort((a, b) => b.totalLoad - a.totalLoad);
  }, [state.crew, cells]);

  const visibleCrew = compact ? sortedCrew.slice(0, 5) : sortedCrew;
  const visibleDates = compact ? dates.slice(0, 14) : dates;

  if (state.crew.length === 0) {
    return (
      <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          No crew yet. Add crew in the Crew module first.
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
      <header className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="display-italic text-[16px] text-[color:var(--color-on-paper)] leading-tight flex items-center gap-2">
            <Grid3x3 size={14} className="text-[color:var(--color-brass)]" />
            Crew-load heatmap
          </h3>
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            day × person · sum of tasks + position + phase + shot ops
          </div>
        </div>
        {!compact && (
          <div className="flex items-center gap-2">
            <Filter size={11} className="text-[color:var(--color-on-paper-muted)]" />
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as RangeOption)}
              className="px-2 py-1 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[11px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
            >
              {RANGE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}
      </header>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="text-[10px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-[color:var(--color-paper-light)] text-left py-1 pr-2 font-normal label-caps text-[color:var(--color-on-paper-faint)] z-10">
                <Users size={10} className="inline -mt-0.5 mr-1" />
                crew
              </th>
              {visibleDates.map((d) => {
                const isShootDay = state.shootDays.some((sd) => sd.date === d.iso);
                return (
                  <th
                    key={d.iso}
                    className={`px-0.5 py-1 text-center font-normal prose-body italic text-[9px] tabular-nums ${
                      isShootDay
                        ? 'text-[color:var(--color-brass-deep)]'
                        : 'text-[color:var(--color-on-paper-muted)]'
                    }`}
                    title={d.iso}
                  >
                    <div>{d.dayMonth}</div>
                    {!compact && (
                      <div className="opacity-60 text-[8px]">{d.weekday}</div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleCrew.map(({ crew, maxLoad, totalLoad }) => (
              <tr key={crew.id}>
                <td
                  className="sticky left-0 bg-[color:var(--color-paper-light)] py-0.5 pr-2 z-10"
                  title={`${crew.name} · ${crew.role} · max load ${maxLoad}`}
                >
                  <div className="display-italic text-[12px] text-[color:var(--color-on-paper)] truncate leading-tight max-w-[160px]">
                    {firstName(crew.name)}
                  </div>
                  {!compact && (
                    <div className="prose-body italic text-[9px] text-[color:var(--color-on-paper-faint)] truncate leading-tight max-w-[160px]">
                      {crew.role}
                    </div>
                  )}
                </td>
                {visibleDates.map((d) => {
                  const cell = cells.get(`${crew.id}::${d.iso}`);
                  return (
                    <td key={d.iso} className="px-0.5 py-0.5">
                      <LoadCellTile
                        cell={cell}
                        active={openCell?.crewId === crew.id && openCell.date === d.iso}
                        onOpen={() =>
                          setOpenCell({ crewId: crew.id, date: d.iso })
                        }
                      />
                    </td>
                  );
                })}
                {!compact && (
                  <td className="pl-2 prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums whitespace-nowrap">
                    Σ {totalLoad}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)] flex items-center gap-3 prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
        <LegendDot color="transparent" label="off" border />
        <LegendDot color="var(--color-success)" label="light (1)" />
        <LegendDot color="var(--color-brass)" label="busy (2)" />
        <LegendDot color="var(--color-coral-deep)" label="overcommit (3+)" />
      </div>

      {/* Drill-down */}
      {openCell && (
        <CellDetail
          cell={cells.get(`${openCell.crewId}::${openCell.date}`)}
          crew={state.crew.find((c) => c.id === openCell.crewId)}
          onClose={() => setOpenCell(null)}
        />
      )}
    </section>
  );
}

/* ---------- Cell tile ---------- */

function LoadCellTile({
  cell,
  active,
  onOpen,
}: {
  cell?: LoadCell;
  active: boolean;
  onOpen: () => void;
}) {
  const load = cell?.load ?? 0;
  const tone =
    load === 0
      ? 'empty'
      : load === 1
      ? 'light'
      : load === 2
      ? 'busy'
      : 'overcommit';
  const bg =
    tone === 'light'
      ? 'var(--color-success)'
      : tone === 'busy'
      ? 'var(--color-brass)'
      : tone === 'overcommit'
      ? 'var(--color-coral-deep)'
      : 'transparent';
  const opacity =
    tone === 'empty' ? 0.15 : tone === 'light' ? 0.5 : tone === 'busy' ? 0.7 : 0.9;
  return (
    <button
      type="button"
      onClick={onOpen}
      title={
        cell && cell.details.length > 0
          ? `${cell.details.join(' · ')} (load ${cell.load})`
          : 'off'
      }
      className={`block w-6 h-6 rounded-[2px] transition-all border-[0.5px] ${
        active
          ? 'border-[color:var(--color-on-paper)] ring-1 ring-[color:var(--color-on-paper)]'
          : 'border-[color:var(--color-border-paper)] hover:border-[color:var(--color-on-paper-muted)]'
      }`}
      style={{ background: bg, opacity }}
    >
      {load > 0 && (
        <span className="block text-[8px] tabular-nums text-[color:var(--color-paper-light)] font-medium">
          {load}
        </span>
      )}
    </button>
  );
}

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
        style={{ background: color, opacity: 0.7 }}
      />
      <span>{label}</span>
    </span>
  );
}

/* ---------- Cell drill-down ---------- */

function CellDetail({
  cell,
  crew,
  onClose,
}: {
  cell?: LoadCell;
  crew?: { id: string; name: string; role: string };
  onClose: () => void;
}) {
  if (!cell || !crew) return null;
  return (
    <div className="mt-3 p-3 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-brass)]/40">
      <div className="flex items-baseline justify-between mb-1.5">
        <div>
          <div className="display-italic text-[14px] text-[color:var(--color-on-paper)] leading-tight">
            {crew.name} · {fmtDate(cell.date)}
          </div>
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
            {crew.role}
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
      <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] leading-relaxed">
        load <span className="tabular-nums">{cell.load}</span>
        {cell.details.length > 0 && <> · {cell.details.join(' · ')}</>}
      </div>
      {cell.load === 0 && (
        <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1">
          Off this day. No tasks, position, phase, or shot ops on the books.
        </div>
      )}
      {cell.load >= 3 && (
        <div className="prose-body italic text-[11px] text-[color:var(--color-coral-deep)] mt-1">
          Overcommitted. Consider reassigning a task or pulling someone in for backup.
        </div>
      )}
    </div>
  );
}

/* ---------- Date helpers ---------- */

function rangeDates(start: Date, count: number) {
  const result: { iso: string; dayMonth: string; weekday: string }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    result.push(formatDateBits(d));
  }
  return result;
}

function rangeDatesFromIso(startIso: string, endIso: string) {
  const [sy, sm, sd] = startIso.split('-').map(Number);
  const [ey, em, ed] = endIso.split('-').map(Number);
  const start = new Date(sy, (sm ?? 1) - 1, sd ?? 1);
  const end = new Date(ey, (em ?? 1) - 1, ed ?? 1);
  const result: { iso: string; dayMonth: string; weekday: string }[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    result.push(formatDateBits(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

function formatDateBits(d: Date) {
  const iso = `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  const dayMonth = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' }).toLowerCase();
  return { iso, dayMonth, weekday };
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const _unused = Calendar;
/* eslint-enable @typescript-eslint/no-unused-vars */
