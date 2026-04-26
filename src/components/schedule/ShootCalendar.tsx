import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import SunCalc from 'suncalc';
import { useApp } from '../../state/AppContext';
import type { ShootDay, WeatherWindow } from '../../types';
import { EditableText } from '../primitives/EditableText';
import { EPISODE_COLORS } from '../map/AdriaticChart';
import { ShootCalendarConflicts } from './ShootCalendarConflicts';

const WEATHER_CYCLE: WeatherWindow[] = [
  'clear',
  'mixed',
  'bura',
  'jugo',
  'storm',
];

const WEATHER_TONE: Record<WeatherWindow, string> = {
  clear: 'text-[color:var(--color-success)]',
  mixed: 'text-[color:var(--color-brass-deep)]',
  bura: 'text-[color:var(--color-coral-deep)]',
  jugo: 'text-[color:var(--color-warn)]',
  storm: 'text-[color:var(--color-coral)]',
};

const WEATHER_GLYPH: Record<WeatherWindow, string> = {
  clear: '☀',
  mixed: '⛅',
  bura: '〰',
  jugo: '↘',
  storm: '⛈',
};

export function ShootCalendar() {
  const { state, dispatch } = useApp();
  const days = [...state.shootDays].sort((a, b) =>
    a.date < b.date ? -1 : 1
  );
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  function handleDragStart(dayId: string) {
    setDragSourceId(dayId);
  }
  function handleDragEnd() {
    setDragSourceId(null);
    setDropTargetId(null);
  }
  function handleDragEnter(dayId: string) {
    if (dragSourceId && dragSourceId !== dayId) setDropTargetId(dayId);
  }
  function handleDrop(targetId: string) {
    if (!dragSourceId || dragSourceId === targetId) return;
    const src = state.shootDays.find((d) => d.id === dragSourceId);
    const tgt = state.shootDays.find((d) => d.id === targetId);
    if (!src || !tgt) return;
    /* Swap content (preserve dates + ids) */
    dispatch({
      type: 'UPDATE_SHOOT_DAY',
      id: src.id,
      patch: {
        episodeId: tgt.episodeId,
        anchorageId: tgt.anchorageId,
        weatherWindow: tgt.weatherWindow,
        notes: tgt.notes,
      },
    });
    dispatch({
      type: 'UPDATE_SHOOT_DAY',
      id: tgt.id,
      patch: {
        episodeId: src.episodeId,
        anchorageId: src.anchorageId,
        weatherWindow: src.weatherWindow,
        notes: src.notes,
      },
    });
    setDragSourceId(null);
    setDropTargetId(null);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-baseline justify-between">
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          Shoot calendar
        </h3>
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">
          October 2026 · {days.length} days · drag the handle to swap days
        </span>
      </header>

      {/* Conflict detector */}
      <ShootCalendarConflicts />

      {/* Episode strip — proportional bar across the month */}
      <EpisodeStrip days={days} />

      {/* Day grid — 7 cols, ~5 rows */}
      <div className="grid grid-cols-7 gap-2">
        {/* Weekday headers */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div
            key={d}
            className="label-caps text-[color:var(--color-on-paper-faint)] text-center pb-1"
          >
            {d}
          </div>
        ))}
        {/* Pad start to align with Monday */}
        {(() => {
          if (days.length === 0) return null;
          const first = new Date(days[0].date + 'T00:00:00Z');
          const dow = (first.getUTCDay() + 6) % 7; // 0 = Mon
          return Array.from({ length: dow }).map((_, i) => (
            <div key={'pad-' + i} />
          ));
        })()}
        {days.map((day) => (
          <DayCell
            key={day.id}
            day={day}
            isDragSource={dragSourceId === day.id}
            isDropTarget={dropTargetId === day.id}
            onDragStart={() => handleDragStart(day.id)}
            onDragEnd={handleDragEnd}
            onDragEnter={() => handleDragEnter(day.id)}
            onDrop={() => handleDrop(day.id)}
          />
        ))}
      </div>

      {/* Per-episode summary table */}
      <EpisodeRotationTable days={days} />
    </div>
  );
}

function EpisodeStrip({ days }: { days: ShootDay[] }) {
  if (days.length === 0) return null;
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden border-[0.5px] border-[color:var(--color-border-paper)]">
        {days.map((d) => {
          const c = d.episodeId ? EPISODE_COLORS[d.episodeId] ?? '#2D4A6B' : '#E5DBC4';
          return (
            <div
              key={d.id}
              style={{ flex: 1, background: c }}
              title={`${d.date} · ${d.episodeId ?? 'unassigned'}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayCell({
  day,
  isDragSource,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDrop,
}: {
  day: ShootDay;
  isDragSource: boolean;
  isDropTarget: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragEnter: () => void;
  onDrop: () => void;
}) {
  const { state, dispatch } = useApp();
  const ep = day.episodeId
    ? state.episodes.find((e) => e.id === day.episodeId)
    : null;
  const loc = day.anchorageId
    ? state.locations.find((l) => l.id === day.anchorageId)
    : null;
  const epColor = day.episodeId ? EPISODE_COLORS[day.episodeId] ?? '#2D4A6B' : '#E5DBC4';

  const dn = new Date(day.date + 'T00:00:00Z').getUTCDate();

  /* Sunrise / sunset for selected anchorage */
  let sunrise = '—';
  let sunset = '—';
  if (loc) {
    const d = new Date(day.date + 'T12:00:00Z');
    const t = SunCalc.getTimes(d, loc.lat, loc.lng);
    if (!isNaN(t.sunrise.getTime())) {
      sunrise = t.sunrise.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (!isNaN(t.sunset.getTime())) {
      sunset = t.sunset.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  function patch(p: Partial<ShootDay>) {
    dispatch({ type: 'UPDATE_SHOOT_DAY', id: day.id, patch: p });
  }

  function cycleWeather() {
    const i = day.weatherWindow
      ? WEATHER_CYCLE.indexOf(day.weatherWindow)
      : -1;
    patch({ weatherWindow: WEATHER_CYCLE[(i + 1) % WEATHER_CYCLE.length] });
  }

  return (
    <article
      className={`bg-[color:var(--color-paper-light)] border-[0.5px] rounded-[3px] px-3 py-2.5 transition-all min-h-[110px] flex flex-col ${
        isDragSource
          ? 'opacity-40 border-[color:var(--color-brass)]'
          : isDropTarget
          ? 'border-[color:var(--color-brass)] ring-2 ring-[color:var(--color-brass)]/40'
          : 'border-[color:var(--color-border-paper)] hover:border-[color:var(--color-brass)]'
      }`}
      onDragOver={(e) => {
        if (!isDragSource) {
          e.preventDefault();
          onDragEnter();
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      <header className="flex items-baseline justify-between mb-1">
        <div className="flex items-baseline gap-1">
          <span
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move';
              onDragStart();
            }}
            onDragEnd={onDragEnd}
            className="cursor-grab active:cursor-grabbing text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-brass-deep)] transition-colors translate-y-[1px]"
            title="Drag to swap with another day"
          >
            <GripVertical size={11} />
          </span>
          <span className="display-italic text-[20px] text-[color:var(--color-on-paper)] tabular-nums leading-none">
            {dn}
          </span>
        </div>
        {day.weatherWindow && (
          <button
            type="button"
            onClick={cycleWeather}
            className={`text-[14px] ${WEATHER_TONE[day.weatherWindow]}`}
            title={day.weatherWindow}
          >
            {WEATHER_GLYPH[day.weatherWindow]}
          </button>
        )}
      </header>
      <div
        className="h-0.5 -mx-3 mb-2"
        style={{ background: epColor }}
      />
      <select
        value={day.episodeId ?? ''}
        onChange={(e) => patch({ episodeId: e.target.value || undefined })}
        className="bg-transparent label-caps text-[color:var(--color-brass-deep)] outline-none mb-1.5 -mx-1 px-1 py-0"
      >
        <option value="">—</option>
        {state.episodes.map((e) => (
          <option key={e.id} value={e.id}>
            {e.title}
          </option>
        ))}
      </select>
      <select
        value={day.anchorageId ?? ''}
        onChange={(e) => patch({ anchorageId: e.target.value || undefined })}
        className="bg-transparent prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] outline-none -mx-1 px-1 py-0 truncate"
      >
        <option value="">— anchorage —</option>
        {state.locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
          </option>
        ))}
      </select>
      <div className="mt-auto pt-2 flex items-baseline justify-between gap-1 label-caps text-[color:var(--color-on-paper-faint)] tabular-nums">
        <span>{sunrise}</span>
        <span>·</span>
        <span>{sunset}</span>
      </div>
      {day.notes && (
        <div className="prose-body italic text-[10.5px] text-[color:var(--color-on-paper-muted)] mt-1 line-clamp-2 leading-tight">
          <EditableText
            value={day.notes}
            onChange={(v) => patch({ notes: v })}
            className="prose-body italic text-[10.5px] text-[color:var(--color-on-paper-muted)]"
          />
        </div>
      )}
    </article>
  );
}

function EpisodeRotationTable({ days }: { days: ShootDay[] }) {
  const { state } = useApp();
  const byEp: Record<string, ShootDay[]> = {};
  for (const d of days) {
    const key = d.episodeId ?? 'unassigned';
    if (!byEp[key]) byEp[key] = [];
    byEp[key].push(d);
  }

  return (
    <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
      <header className="px-5 py-3 border-b-[0.5px] border-[color:var(--color-border-paper)] flex items-baseline justify-between">
        <span className="label-caps text-[color:var(--color-brass-deep)]">
          Episode rotation
        </span>
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">
          days per episode
        </span>
      </header>
      <ul>
        {state.episodes.map((ep) => {
          const list = byEp[ep.id] ?? [];
          const c = EPISODE_COLORS[ep.id] ?? '#2D4A6B';
          return (
            <li
              key={ep.id}
              className="grid grid-cols-[20px_120px_1fr_60px] items-baseline gap-3 px-5 py-2 border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: c }}
              />
              <span className="display-italic text-[15px] text-[color:var(--color-on-paper)]">
                {ep.title}
              </span>
              <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] truncate">
                {list.length > 0
                  ? `${fmtDay(list[0].date)} → ${fmtDay(list[list.length - 1].date)}`
                  : 'unscheduled'}
              </span>
              <span className="display-italic text-[16px] text-[color:var(--color-on-paper)] tabular-nums text-right">
                {list.length}d
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function fmtDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
