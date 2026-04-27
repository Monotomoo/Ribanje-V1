import { useMemo, useState } from 'react';
import { Anchor, Calendar, Flag, Cloud } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { ViewKey } from '../../types';
import { EPISODE_COLORS } from '../map/AdriaticChart';

/* 30-Day Production Ribbon — horizontal calendar of next 30 days.
   Per day shows: episode/phase color · milestone dots · deadline flags ·
   weather pill (if shoot day). Today highlighted. Hover for detail. */

interface DayCell {
  date: Date;
  iso: string;
  isToday: boolean;
  isShootDay: boolean;
  shootDayLabel?: string;
  episodeId?: string;
  episodeColor?: string;
  weatherWindow?: string;
  anchorageLabel?: string;
  phaseLabel?: string;
  phaseColor?: string;
  milestones: { id: string; label: string; category?: string }[];
  deadlines: { id: string; label: string; type: 'festival' | 'application' | 'other' }[];
}

const DAYS_FORWARD = 30;
const DAYS_BACKWARD = 2;

export function ProductionRibbon({
  onJump,
}: {
  onJump: (view: ViewKey) => void;
}) {
  const { state } = useApp();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const cells: DayCell[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const out: DayCell[] = [];
    for (let i = -DAYS_BACKWARD; i < DAYS_FORWARD; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const isToday = i === 0;

      /* Find shoot day */
      const shootDay = state.shootDays.find((s) => s.date === iso);
      const ep = shootDay?.episodeId
        ? [...state.episodes, ...state.specials].find((e) => e.id === shootDay.episodeId)
        : null;
      const epColor = shootDay?.episodeId
        ? EPISODE_COLORS[shootDay.episodeId] ?? 'rgba(14,30,54,0.40)'
        : undefined;
      const anchorage = shootDay?.anchorageId
        ? state.locations.find((l) => l.id === shootDay.anchorageId)
        : null;

      /* Find phase */
      const phase = state.schedulePhases.find((p) => {
        return iso >= p.start && iso <= p.end;
      });

      /* Milestones on this day */
      const milestones = state.milestones
        .filter((m) => m.date === iso)
        .map((m) => ({ id: m.id, label: m.label, category: m.category }));

      /* Deadlines (festivals + applications) on this day */
      const deadlines: DayCell['deadlines'] = [];
      for (const f of state.festivals) {
        if (f.deadline === iso) {
          deadlines.push({ id: f.id, label: f.name, type: 'festival' });
        }
      }
      for (const a of state.applications) {
        if (a.deadline === iso) {
          deadlines.push({ id: a.id, label: a.name, type: 'application' });
        }
      }

      out.push({
        date: d,
        iso,
        isToday,
        isShootDay: !!shootDay,
        shootDayLabel: ep ? `${ep.title}` : undefined,
        episodeId: shootDay?.episodeId,
        episodeColor: epColor,
        weatherWindow: shootDay?.weatherWindow,
        anchorageLabel: anchorage?.label,
        phaseLabel: phase?.label,
        phaseColor: phase?.color,
        milestones,
        deadlines,
      });
    }
    return out;
  }, [state]);

  const hoveredCell = hoveredIdx !== null ? cells[hoveredIdx] : null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <span className="label-caps tracking-[0.14em] text-[color:var(--color-brass-deep)]">
          next {DAYS_FORWARD} days
        </span>
        <div className="flex items-baseline gap-3 prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)]">
          <LegendChip label="shoot" color="var(--color-brass)" />
          <LegendChip label="milestone" color="var(--color-coral)" />
          <LegendChip label="deadline" color="var(--color-warn)" />
          <LegendChip label="phase" color="var(--color-on-paper-muted)" />
        </div>
      </div>

      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-x-auto md:overflow-hidden">
        {/* Phase strip */}
        <div className="flex h-[14px] border-b-[0.5px] border-[color:var(--color-border-paper)] min-w-[860px] md:min-w-0">
          {cells.map((c, i) => (
            <div
              key={i}
              className="flex-1 border-r-[0.5px] border-[color:var(--color-border-paper)]/60 last:border-r-0"
              style={{
                background: c.phaseColor
                  ? `${c.phaseColor}40`
                  : 'transparent',
              }}
              title={c.phaseLabel ?? ''}
            />
          ))}
        </div>

        {/* Day cells */}
        <ul className="flex min-w-[860px] md:min-w-0">
          {cells.map((c, i) => (
            <DayPill
              key={c.iso}
              cell={c}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => {
                if (c.isShootDay) onJump('production');
                else if (c.milestones.length) onJump('schedule');
                else if (c.deadlines.length) onJump('pitch');
              }}
            />
          ))}
        </ul>
      </div>

      {/* Detail row beneath */}
      <div className="min-h-[42px] mt-2">
        {hoveredCell ? (
          <DetailRow cell={hoveredCell} />
        ) : (
          <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] leading-relaxed">
            Hover any day for detail · click a shoot day to open Production · milestone or deadline opens its module.
          </p>
        )}
      </div>
    </section>
  );
}

function DayPill({
  cell,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  cell: DayCell;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}) {
  const dayNum = cell.date.getDate();
  const dayWk = cell.date.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 2);

  const hasMilestones = cell.milestones.length > 0;
  const hasDeadlines = cell.deadlines.length > 0;

  return (
    <li
      className={`flex-1 cursor-pointer relative h-[60px] flex flex-col items-center justify-center gap-0.5 border-r-[0.5px] border-[color:var(--color-border-paper)]/60 last:border-r-0 transition-colors ${
        cell.isToday
          ? 'bg-[color:var(--color-brass)]/15'
          : 'hover:bg-[color:var(--color-paper-deep)]/25'
      }`}
      style={
        cell.episodeColor
          ? { background: cell.isToday ? undefined : `${cell.episodeColor}18` }
          : undefined
      }
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      title={cell.iso}
    >
      <span
        className={`prose-body italic text-[9px] tracking-[0.05em] ${
          cell.isToday ? 'text-[color:var(--color-brass-deep)]' : 'text-[color:var(--color-on-paper-faint)]'
        }`}
      >
        {dayWk}
      </span>
      <span
        className={`display-italic tabular-nums leading-none ${
          cell.isToday
            ? 'text-[14px] text-[color:var(--color-brass-deep)]'
            : 'text-[12px] text-[color:var(--color-on-paper)]'
        }`}
      >
        {dayNum}
      </span>
      {/* Marker dots */}
      <div className="flex items-baseline gap-0.5 absolute bottom-1.5">
        {cell.isShootDay && (
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: cell.episodeColor ?? 'var(--color-brass)' }}
          />
        )}
        {hasMilestones && (
          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-coral)]" />
        )}
        {hasDeadlines && (
          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-warn)]" />
        )}
      </div>
      {cell.isToday && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-[color:var(--color-brass)]" />
      )}
    </li>
  );
}

function DetailRow({ cell }: { cell: DayCell }) {
  const dateLabel = cell.date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
  return (
    <div className="bg-[color:var(--color-paper-light)] border-l-2 border-[color:var(--color-brass)] px-4 py-2 flex items-baseline gap-4 flex-wrap">
      <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums">
        {dateLabel}
      </span>
      {cell.phaseLabel && (
        <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          phase · {cell.phaseLabel}
        </span>
      )}
      {cell.isShootDay && (
        <span className="flex items-baseline gap-1 prose-body italic text-[12px] text-[color:var(--color-on-paper)]">
          <Calendar size={11} className="text-[color:var(--color-brass-deep)]" />
          shoot · {cell.shootDayLabel ?? '—'}
          {cell.anchorageLabel && (
            <>
              <Anchor size={9} className="text-[color:var(--color-brass-deep)] ml-2" />
              {cell.anchorageLabel}
            </>
          )}
          {cell.weatherWindow && (
            <>
              <Cloud size={9} className="text-[color:var(--color-brass-deep)] ml-2" />
              {cell.weatherWindow}
            </>
          )}
        </span>
      )}
      {cell.milestones.map((m) => (
        <span
          key={m.id}
          className="flex items-baseline gap-1 prose-body italic text-[12px] text-[color:var(--color-coral-deep)]"
        >
          <Flag size={10} />
          {m.label}
        </span>
      ))}
      {cell.deadlines.map((d) => (
        <span
          key={d.id}
          className="flex items-baseline gap-1 prose-body italic text-[12px] text-[color:var(--color-warn)]"
        >
          ⏱ {d.label}
        </span>
      ))}
    </div>
  );
}

function LegendChip({ label, color }: { label: string; color: string }) {
  return (
    <span className="flex items-baseline gap-1 text-[color:var(--color-on-paper-muted)]">
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
