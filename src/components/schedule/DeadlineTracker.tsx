import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  Plus,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Milestone, MilestoneCategory, MilestoneStatus } from '../../types';
import { EditableText } from '../primitives/EditableText';
import { newId } from '../episode/shared';
import { MILESTONE_CATEGORY_COLOR } from './ProductionGantt';

const CATEGORIES: MilestoneCategory[] = [
  'havc',
  'eu-media',
  'hrt',
  'festival',
  'shoot',
  'post',
  'internal',
];

const CATEGORY_LABEL: Record<MilestoneCategory, string> = {
  havc: 'HAVC',
  'eu-media': 'EU MEDIA',
  hrt: 'HRT',
  festival: 'Festival',
  shoot: 'Shoot',
  post: 'Post',
  internal: 'Internal',
};

const STATUS_TONE: Record<MilestoneStatus, { bg: string; fg: string; label: string }> = {
  open:    { bg: 'rgba(91,163,204,0.15)',  fg: 'rgb(60,120,160)',  label: 'open' },
  snoozed: { bg: 'rgba(120,128,100,0.15)', fg: 'rgb(85,95,75)',    label: 'snoozed' },
  done:    { bg: 'rgba(107,144,128,0.18)', fg: 'rgb(75,110,90)',   label: 'done' },
};

type TimeFilter = 'all' | 'overdue' | 'thisWeek' | 'thisMonth' | 'next90' | 'future';
type StatusFilter = 'all' | MilestoneStatus;
type CategoryFilter = 'all' | MilestoneCategory;

function daysFromNow(iso: string): number {
  const d = new Date(iso + 'T00:00:00Z').getTime();
  return Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
}

export function DeadlineTracker() {
  const { state, dispatch } = useApp();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  /* Filter + sort */
  const filtered = useMemo(() => {
    let out = [...state.milestones];

    /* Time filter */
    if (timeFilter !== 'all') {
      out = out.filter((m) => {
        const d = daysFromNow(m.date);
        switch (timeFilter) {
          case 'overdue': return d < 0;
          case 'thisWeek': return d >= 0 && d <= 7;
          case 'thisMonth': return d >= 0 && d <= 30;
          case 'next90': return d >= 0 && d <= 90;
          case 'future': return d > 90;
          default: return true;
        }
      });
    }

    /* Status filter */
    if (statusFilter !== 'all') {
      out = out.filter((m) => (m.status ?? 'open') === statusFilter);
    }

    /* Category filter */
    if (categoryFilter !== 'all') {
      out = out.filter((m) => (m.category ?? 'internal') === categoryFilter);
    }

    /* Sort: open + soonest first, snoozed/done last */
    out.sort((a, b) => {
      const aStatus = a.status ?? 'open';
      const bStatus = b.status ?? 'open';
      if (aStatus === 'done' && bStatus !== 'done') return 1;
      if (bStatus === 'done' && aStatus !== 'done') return -1;
      return a.date.localeCompare(b.date);
    });

    return out;
  }, [state.milestones, timeFilter, statusFilter, categoryFilter]);

  /* Counts */
  const counts = useMemo(() => {
    const c = {
      all: state.milestones.length,
      overdue: 0,
      thisWeek: 0,
      thisMonth: 0,
      next90: 0,
      future: 0,
      open: 0,
      snoozed: 0,
      done: 0,
    };
    for (const m of state.milestones) {
      const d = daysFromNow(m.date);
      if (d < 0) c.overdue++;
      else if (d <= 7) c.thisWeek++;
      else if (d <= 30) c.thisMonth++;
      else if (d <= 90) c.next90++;
      else c.future++;
      const s = m.status ?? 'open';
      c[s]++;
    }
    return c;
  }, [state.milestones]);

  function add() {
    const milestone: Milestone = {
      id: newId('m'),
      label: 'New deadline',
      date: new Date().toISOString().slice(0, 10),
      category: 'internal',
      status: 'open',
    };
    dispatch({ type: 'ADD_MILESTONE', milestone });
  }

  function patch(id: string, p: Partial<Milestone>) {
    dispatch({ type: 'UPDATE_MILESTONE', id, patch: p });
  }

  function snooze(m: Milestone, days: number) {
    const cur = new Date(m.date + 'T00:00:00Z');
    cur.setUTCDate(cur.getUTCDate() + days);
    const newDate = cur.toISOString().slice(0, 10);
    patch(m.id, { date: newDate, status: 'snoozed' });
  }

  function markDone(m: Milestone) {
    patch(m.id, { status: 'done' });
  }

  function reopen(m: Milestone) {
    patch(m.id, { status: 'open' });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
            Deadlines &amp; milestones
          </h3>
          <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Funding · broadcaster · festival · shoot · post · internal. Quick-snooze · mark done · reassign inline.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          new deadline
        </button>
      </div>

      {/* Horizontal deadline strip */}
      <DeadlineStrip />

      {/* Filter chips */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="label-caps text-[color:var(--color-on-paper-faint)] mr-1">when</span>
          <FilterChip label="all" count={counts.all} active={timeFilter === 'all'} onClick={() => setTimeFilter('all')} />
          <FilterChip label="overdue" count={counts.overdue} active={timeFilter === 'overdue'} onClick={() => setTimeFilter('overdue')} tone="coral" />
          <FilterChip label="this week" count={counts.thisWeek} active={timeFilter === 'thisWeek'} onClick={() => setTimeFilter('thisWeek')} tone="brass" />
          <FilterChip label="this month" count={counts.thisMonth} active={timeFilter === 'thisMonth'} onClick={() => setTimeFilter('thisMonth')} />
          <FilterChip label="next 90d" count={counts.next90} active={timeFilter === 'next90'} onClick={() => setTimeFilter('next90')} />
          <FilterChip label="future" count={counts.future} active={timeFilter === 'future'} onClick={() => setTimeFilter('future')} />
        </div>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="label-caps text-[color:var(--color-on-paper-faint)] mr-1">status</span>
          <FilterChip label="all" count={counts.all} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
          <FilterChip label="open" count={counts.open} active={statusFilter === 'open'} onClick={() => setStatusFilter('open')} tone="dock" />
          <FilterChip label="snoozed" count={counts.snoozed} active={statusFilter === 'snoozed'} onClick={() => setStatusFilter('snoozed')} />
          <FilterChip label="done" count={counts.done} active={statusFilter === 'done'} onClick={() => setStatusFilter('done')} tone="success" />
        </div>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="label-caps text-[color:var(--color-on-paper-faint)] mr-1">category</span>
          <FilterChip label="all" count={counts.all} active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')} />
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              label={CATEGORY_LABEL[c]}
              count={state.milestones.filter((m) => (m.category ?? 'internal') === c).length}
              active={categoryFilter === c}
              onClick={() => setCategoryFilter(c)}
              hexTone={MILESTONE_CATEGORY_COLOR[c]}
            />
          ))}
        </div>
      </div>

      {/* Deadlines list */}
      {filtered.length === 0 ? (
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)] bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-10 text-center">
          No deadlines match the current filters.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {filtered.map((m) => (
            <DeadlineRow
              key={m.id}
              milestone={m}
              crew={state.crew}
              onPatch={(p) => patch(m.id, p)}
              onSnooze={(days) => snooze(m, days)}
              onDone={() => markDone(m)}
              onReopen={() => reopen(m)}
              onDelete={() => {
                if (window.confirm(`Delete "${m.label}"?`)) {
                  dispatch({ type: 'DELETE_MILESTONE', id: m.id });
                }
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  tone,
  hexTone,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  tone?: 'coral' | 'brass' | 'dock' | 'success';
  hexTone?: string;
}) {
  const toneColor = hexTone
    ? hexTone
    : tone === 'coral' ? 'var(--color-coral-deep)'
    : tone === 'brass' ? 'var(--color-brass-deep)'
    : tone === 'dock' ? 'var(--color-dock-deep)'
    : tone === 'success' ? 'var(--color-success)'
    : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`label-caps tracking-[0.10em] text-[10px] px-2 py-0.5 rounded-[2px] transition-colors border-[0.5px] ${
        active
          ? 'text-[color:var(--color-on-paper)]'
          : 'text-[color:var(--color-on-paper-faint)] border-[color:var(--color-border-paper)] hover:text-[color:var(--color-on-paper-muted)]'
      }`}
      style={
        active && toneColor
          ? { borderColor: toneColor, color: toneColor, background: 'rgba(201,169,97,0.06)' }
          : active
          ? { borderColor: 'var(--color-brass)', background: 'rgba(201,169,97,0.10)' }
          : undefined
      }
    >
      {label} <span className="opacity-70 ml-1">{count}</span>
    </button>
  );
}

function DeadlineRow({
  milestone: m,
  crew,
  onPatch,
  onSnooze,
  onDone,
  onReopen,
  onDelete,
}: {
  milestone: Milestone;
  crew: { id: string; name: string }[];
  onPatch: (p: Partial<Milestone>) => void;
  onSnooze: (days: number) => void;
  onDone: () => void;
  onReopen: () => void;
  onDelete: () => void;
}) {
  const days = daysFromNow(m.date);
  const status = m.status ?? 'open';
  const statusTone = STATUS_TONE[status];
  const cat = m.category ?? 'internal';
  const catColor = MILESTONE_CATEGORY_COLOR[cat];

  const dayTone =
    status === 'done' ? 'text-[color:var(--color-on-paper-faint)] line-through'
    : days < 0 ? 'text-[color:var(--color-coral-deep)]'
    : days <= 7 ? 'text-[color:var(--color-coral-deep)]'
    : days <= 30 ? 'text-[color:var(--color-brass-deep)]'
    : 'text-[color:var(--color-on-paper-muted)]';

  const owner = m.ownerId ? crew.find((c) => c.id === m.ownerId) : null;

  return (
    <li
      className={`bg-[color:var(--color-paper-light)] border-[0.5px] border-l-2 border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-2.5 grid grid-cols-[110px_70px_120px_1fr_140px_auto] gap-3 items-baseline transition-opacity ${
        status === 'done' ? 'opacity-65' : ''
      }`}
      style={{ borderLeftColor: catColor }}
    >
      {/* Date */}
      <input
        type="date"
        value={m.date}
        onChange={(e) => onPatch({ date: e.target.value })}
        className="bg-transparent prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums outline-none"
      />

      {/* Days out */}
      <span className={`display-italic text-[14px] tabular-nums text-right ${dayTone}`}>
        {days >= 0 ? `${days}d` : `${-days}d ago`}
      </span>

      {/* Category + status pill */}
      <div className="flex items-baseline gap-1.5">
        <select
          value={cat}
          onChange={(e) => onPatch({ category: e.target.value as MilestoneCategory })}
          className="bg-transparent label-caps tracking-[0.08em] text-[9px] outline-none"
          style={{ color: catColor }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        <span
          className="label-caps tracking-[0.08em] text-[9px] px-1.5 py-0.5 rounded-[2px]"
          style={{ background: statusTone.bg, color: statusTone.fg }}
        >
          {statusTone.label}
        </span>
      </div>

      {/* Label */}
      <EditableText
        value={m.label}
        onChange={(v) => onPatch({ label: v })}
        className="display-italic text-[14px] text-[color:var(--color-on-paper)]"
      />

      {/* Owner */}
      <div className="flex items-baseline gap-1.5">
        <User size={9} className="text-[color:var(--color-on-paper-faint)]" />
        <select
          value={m.ownerId ?? ''}
          onChange={(e) => onPatch({ ownerId: e.target.value || undefined })}
          className="bg-transparent prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] outline-none truncate flex-1"
        >
          <option value="">— unassigned —</option>
          {crew.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Quick actions */}
      <div className="flex items-baseline gap-1">
        {status !== 'done' ? (
          <>
            <ActionBtn label="+7d" icon={Clock} onClick={() => onSnooze(7)} title="Snooze 7 days" />
            <ActionBtn label="+14d" icon={Clock} onClick={() => onSnooze(14)} title="Snooze 14 days" />
            <ActionBtn
              label="done"
              icon={Check}
              onClick={onDone}
              tone="success"
              title="Mark done"
            />
          </>
        ) : (
          <ActionBtn
            label="reopen"
            icon={Zap}
            onClick={onReopen}
            tone="brass"
            title="Reopen"
          />
        )}
        <button
          type="button"
          onClick={onDelete}
          className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] p-1"
          aria-label="Delete deadline"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </li>
  );
}

function ActionBtn({
  label,
  icon: Icon,
  onClick,
  tone,
  title,
}: {
  label: string;
  icon: typeof Check;
  onClick: () => void;
  tone?: 'success' | 'brass';
  title?: string;
}) {
  const cls =
    tone === 'success'
      ? 'bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] hover:bg-[color:var(--color-success)]/25'
      : tone === 'brass'
      ? 'bg-[color:var(--color-brass)]/15 text-[color:var(--color-brass-deep)] hover:bg-[color:var(--color-brass)]/25'
      : 'text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-paper)]';
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex items-baseline gap-0.5 label-caps tracking-[0.06em] text-[9px] px-1.5 py-0.5 rounded-[2px] transition-colors ${cls}`}
    >
      <Icon size={8} />
      {label}
    </button>
  );
}

function DeadlineStrip() {
  const { state } = useApp();
  const now = Date.now();
  /* Show only future or recently-past (within 14 days) deadlines on the strip. */
  const upcoming = state.milestones
    .filter(
      (m) =>
        new Date(m.date).getTime() >= now - 14 * 24 * 60 * 60 * 1000 &&
        (m.status ?? 'open') !== 'done'
    )
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  if (upcoming.length === 0) return null;

  /* Compute time window: from now to the latest milestone, padded */
  const minMs = now - 14 * 24 * 60 * 60 * 1000;
  const maxMs = Math.max(...upcoming.map((m) => new Date(m.date).getTime()));
  const span = Math.max(maxMs - minMs, 30 * 24 * 60 * 60 * 1000);

  const W = 1200;
  const H = 80;
  const padL = 24;
  const padR = 24;
  const innerW = W - padL - padR;

  const xFor = (iso: string) =>
    padL + ((new Date(iso).getTime() - minMs) / span) * innerW;
  const todayX = padL + ((now - minMs) / span) * innerW;

  /* Stagger labels into 3 rows by closeness */
  const rows: number[] = [-Infinity, -Infinity, -Infinity];
  const layout: Array<{ m: Milestone; x: number; row: number }> = [];
  for (const m of upcoming) {
    const x = xFor(m.date);
    let row = 0;
    while (row < 3 && x - rows[row] < 110) row++;
    if (row >= 3) row = 0;
    rows[row] = x;
    layout.push({ m, x, row });
  }

  return (
    <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-2 py-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 96 }}>
        <line
          x1={padL}
          x2={W - padR}
          y1={H / 2}
          y2={H / 2}
          stroke="rgba(168,136,74,0.4)"
          strokeWidth={0.5}
        />
        <line
          x1={todayX}
          x2={todayX}
          y1={6}
          y2={H - 6}
          stroke="var(--color-coral)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <text
          x={todayX + 4}
          y={H - 4}
          fontFamily="Inter, system-ui, sans-serif"
          fontSize={9}
          letterSpacing={1.4}
          fill="var(--color-coral-deep)"
        >
          TODAY
        </text>

        {layout.map(({ m, x, row }) => {
          const cat = m.category ?? 'internal';
          const color = MILESTONE_CATEGORY_COLOR[cat];
          const labelY = H / 2 + (row + 1) * 14;
          const isSnoozed = (m.status ?? 'open') === 'snoozed';
          return (
            <g key={m.id}>
              <polygon
                points={`${x},${H / 2 - 5} ${x + 5},${H / 2} ${x},${H / 2 + 5} ${x - 5},${H / 2}`}
                fill={isSnoozed ? 'var(--color-paper-light)' : color}
                stroke={color}
                strokeWidth={1}
                opacity={isSnoozed ? 0.5 : 1}
              />
              <line
                x1={x}
                x2={x}
                y1={H / 2 + 5}
                y2={labelY - 3}
                stroke={color}
                strokeOpacity={0.4}
                strokeWidth={0.5}
              />
              <text
                x={x}
                y={labelY}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize={9}
                letterSpacing={0.7}
                fill="rgba(14,30,54,0.7)"
                opacity={isSnoozed ? 0.5 : 1}
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* unused-import hint */
export const _icons = { ArrowRight };
