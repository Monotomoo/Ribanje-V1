import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Handshake,
  ListChecks,
  Mail,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { ViewKey } from '../../types';

/* Decisions Inbox — Tomo's "what needs me now" surface.
   Aggregates actionable items from across modules:
   - Tasks tagged decision or high priority
   - Risks unmitigated with high score
   - Sponsors aging in pipeline
   - Approaching milestones / deadlines / festival submissions
   Each row has quick action buttons (✓ done · ⌚ snooze · → escalate / open). */

type ItemSource = 'task' | 'risk' | 'sponsor' | 'milestone' | 'festival' | 'application';
type FilterKey = 'all' | ItemSource;

interface InboxItem {
  id: string;
  source: ItemSource;
  priority: 'critical' | 'high' | 'med';
  title: string;
  description: string;
  daysOut?: number;
  jumpTo: ViewKey;
  /* Source-specific actions */
  actions: {
    label: string;
    icon: typeof Check;
    type: 'primary' | 'snooze' | 'escalate';
    /* Action handler stored as a discriminated tag the parent dispatches */
    handlerKey:
      | 'task-done'
      | 'task-snooze'
      | 'sponsor-mark-contacted'
      | 'risk-mark-mitigating'
      | 'open-detail';
  }[];
  refId: string; // task id / risk id / sponsor id etc.
}

const SOURCE_META: Record<ItemSource, { label: string; icon: typeof Check; color: string }> = {
  task:        { label: 'task',        icon: ListChecks,    color: 'var(--color-on-paper-muted)' },
  risk:        { label: 'risk',        icon: AlertTriangle, color: 'var(--color-coral-deep)' },
  sponsor:     { label: 'sponsor',     icon: Handshake,     color: 'var(--color-brass-deep)' },
  milestone:   { label: 'milestone',   icon: Calendar,      color: 'var(--color-coral-deep)' },
  festival:    { label: 'festival',    icon: Mail,          color: 'var(--color-warn)' },
  application: { label: 'application', icon: Mail,          color: 'var(--color-warn)' },
};

const PRIORITY_TONE: Record<InboxItem['priority'], string> = {
  critical: 'border-[color:var(--color-coral-deep)]',
  high:     'border-[color:var(--color-warn)]',
  med:      'border-[color:var(--color-brass)]',
};

function daysFromNow(iso: string, today: Date): number {
  const d = new Date(iso);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function DecisionsInbox({ onJump }: { onJump: (view: ViewKey) => void }) {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<FilterKey>('all');

  const today = useMemo(() => new Date(), []);

  /* Compute inbox items */
  const items: InboxItem[] = useMemo(() => {
    const out: InboxItem[] = [];

    /* Tasks — high priority + not done */
    for (const t of state.tasks) {
      if (t.status === 'done') continue;
      if (t.priority !== 'high' && t.status !== 'blocked') continue;
      const daysOut = t.dueDate ? daysFromNow(t.dueDate, today) : undefined;
      out.push({
        id: `t-${t.id}`,
        source: 'task',
        priority:
          t.status === 'blocked' ? 'critical'
          : daysOut !== undefined && daysOut <= 0 ? 'critical'
          : daysOut !== undefined && daysOut <= 7 ? 'high'
          : 'med',
        title: t.title,
        description: `${t.status}${t.dueDate ? ` · due ${daysOut}d` : ''}${t.assigneeId ? ' · assigned' : ' · unassigned'}`,
        daysOut,
        jumpTo: 'crew',
        actions: [
          { label: 'done', icon: Check, type: 'primary', handlerKey: 'task-done' },
          { label: 'snooze', icon: Clock, type: 'snooze', handlerKey: 'task-snooze' },
        ],
        refId: t.id,
      });
    }

    /* Risks — unmitigated high P×I */
    for (const r of state.risks) {
      const status = r.status ?? 'open';
      if (status === 'mitigated' || status === 'closed') continue;
      const score = (r.probabilityScale ?? 3) * (r.impactScale ?? 3);
      if (score < 12) continue;
      out.push({
        id: `r-${r.id}`,
        source: 'risk',
        priority: score >= 20 ? 'critical' : 'high',
        title: r.title,
        description: `score ${score}${r.category ? ` · ${r.category}` : ''} · ${status}`,
        jumpTo: 'risks',
        actions: [
          { label: 'mitigating', icon: Check, type: 'primary', handlerKey: 'risk-mark-mitigating' },
          { label: 'open', icon: ArrowRight, type: 'escalate', handlerKey: 'open-detail' },
        ],
        refId: r.id,
      });
    }

    /* Sponsors — aging without follow-up */
    for (const s of state.sponsors) {
      if (s.status === 'committed') continue;
      const lastContact = s.lastContactDate ? new Date(s.lastContactDate) : null;
      const daysSince = lastContact
        ? Math.floor((today.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      if (s.status === 'pitched' && daysSince > 14) {
        out.push({
          id: `s-${s.id}`,
          source: 'sponsor',
          priority: daysSince > 30 ? 'high' : 'med',
          title: `Follow up · ${s.name}`,
          description: `${s.status} · ${daysSince}d quiet · tier ${s.tier}`,
          jumpTo: 'sponsors',
          actions: [
            { label: 'contacted', icon: Check, type: 'primary', handlerKey: 'sponsor-mark-contacted' },
            { label: 'open', icon: ArrowRight, type: 'escalate', handlerKey: 'open-detail' },
          ],
          refId: s.id,
        });
      }
    }

    /* Milestones */
    for (const m of state.milestones) {
      const daysOut = daysFromNow(m.date, today);
      if (daysOut <= 0 || daysOut > 21) continue;
      out.push({
        id: `m-${m.id}`,
        source: 'milestone',
        priority: daysOut <= 7 ? 'critical' : 'high',
        title: m.label,
        description: `${m.category ?? 'milestone'} · ${daysOut}d`,
        daysOut,
        jumpTo: 'schedule',
        actions: [{ label: 'open', icon: ArrowRight, type: 'escalate', handlerKey: 'open-detail' }],
        refId: m.id,
      });
    }

    /* Festival submissions */
    for (const f of state.festivals) {
      if (f.status !== 'target') continue;
      if (!f.deadline) continue;
      const daysOut = daysFromNow(f.deadline, today);
      if (daysOut <= 0 || daysOut > 30) continue;
      out.push({
        id: `f-${f.id}`,
        source: 'festival',
        priority: daysOut <= 7 ? 'critical' : daysOut <= 14 ? 'high' : 'med',
        title: f.name,
        description: `submission · ${daysOut}d`,
        daysOut,
        jumpTo: 'pitch',
        actions: [{ label: 'open', icon: ArrowRight, type: 'escalate', handlerKey: 'open-detail' }],
        refId: f.id,
      });
    }

    /* Funding applications */
    for (const a of state.applications) {
      if (a.status !== 'planning' && a.status !== 'drafting') continue;
      if (!a.deadline) continue;
      const daysOut = daysFromNow(a.deadline, today);
      if (daysOut <= 0 || daysOut > 30) continue;
      out.push({
        id: `a-${a.id}`,
        source: 'application',
        priority: daysOut <= 7 ? 'critical' : daysOut <= 14 ? 'high' : 'med',
        title: a.name,
        description: `${a.status} · ${daysOut}d · ${a.funder}`,
        daysOut,
        jumpTo: 'pitch',
        actions: [{ label: 'open', icon: ArrowRight, type: 'escalate', handlerKey: 'open-detail' }],
        refId: a.id,
      });
    }

    /* Sort: priority first, then days-out */
    const order: Record<InboxItem['priority'], number> = { critical: 0, high: 1, med: 2 };
    out.sort((a, b) => {
      const pdiff = order[a.priority] - order[b.priority];
      if (pdiff !== 0) return pdiff;
      return (a.daysOut ?? 999) - (b.daysOut ?? 999);
    });

    return out;
  }, [state, today]);

  /* Counts per source */
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const i of items) c[i.source] = (c[i.source] ?? 0) + 1;
    return c;
  }, [items]);

  /* Filtered list */
  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.source === filter);
  }, [items, filter]);

  /* Action handlers */
  function performAction(item: InboxItem, handlerKey: InboxItem['actions'][0]['handlerKey']) {
    switch (handlerKey) {
      case 'task-done':
        dispatch({ type: 'UPDATE_TASK', id: item.refId, patch: { status: 'done', updatedAt: new Date().toISOString() } });
        break;
      case 'task-snooze':
        {
          const t = state.tasks.find((tt) => tt.id === item.refId);
          if (t) {
            const nextDue = t.dueDate ? new Date(t.dueDate) : new Date();
            nextDue.setDate(nextDue.getDate() + 7);
            dispatch({
              type: 'UPDATE_TASK',
              id: item.refId,
              patch: { dueDate: nextDue.toISOString().slice(0, 10), updatedAt: new Date().toISOString() },
            });
          }
        }
        break;
      case 'risk-mark-mitigating':
        dispatch({ type: 'UPDATE_RISK', id: item.refId, patch: { status: 'mitigating' } });
        break;
      case 'sponsor-mark-contacted':
        dispatch({
          type: 'UPDATE_SPONSOR',
          id: item.refId,
          patch: { lastContactDate: new Date().toISOString().slice(0, 10) },
        });
        break;
      case 'open-detail':
        onJump(item.jumpTo);
        break;
    }
  }

  return (
    <section>
      <header className="flex items-baseline justify-between mb-3">
        <span className="label-caps tracking-[0.14em] text-[color:var(--color-brass-deep)]">
          decisions waiting
        </span>
        <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums">
          {items.length} item{items.length === 1 ? '' : 's'}
        </span>
      </header>

      {/* Filter chips */}
      <div className="flex items-baseline flex-wrap gap-1.5 mb-3">
        <FilterChip label="all" count={counts.all ?? 0} active={filter === 'all'} onClick={() => setFilter('all')} />
        {(Object.keys(SOURCE_META) as ItemSource[]).map((src) => {
          const c = counts[src] ?? 0;
          if (c === 0) return null;
          return (
            <FilterChip
              key={src}
              label={SOURCE_META[src].label}
              count={c}
              active={filter === src}
              onClick={() => setFilter(src)}
              tone={SOURCE_META[src].color}
            />
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-[color:var(--color-success)]/10 border-l-2 border-[color:var(--color-success)] px-5 py-4">
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed flex items-baseline gap-2">
            <Check size={13} className="text-[color:var(--color-success)] shrink-0 translate-y-[2px]" />
            Inbox clear — nothing critical waiting in this view.
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {filtered.slice(0, 12).map((item) => (
            <InboxRow key={item.id} item={item} onAction={(k) => performAction(item, k)} />
          ))}
          {filtered.length > 12 && (
            <li className="text-center prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] py-2">
              +{filtered.length - 12} more — open the source module to see them all
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  tone,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  tone?: string;
}) {
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
        active && tone
          ? { borderColor: tone, color: tone, background: 'rgba(201,169,97,0.10)' }
          : active
          ? { borderColor: 'var(--color-brass)', background: 'rgba(201,169,97,0.10)' }
          : undefined
      }
    >
      {label} <span className="opacity-70 ml-1">{count}</span>
    </button>
  );
}

function InboxRow({
  item,
  onAction,
}: {
  item: InboxItem;
  onAction: (k: InboxItem['actions'][0]['handlerKey']) => void;
}) {
  const meta = SOURCE_META[item.source];
  const Icon = meta.icon;
  return (
    <li
      className={`bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] border-l-2 rounded-[3px] px-4 py-2.5 flex flex-col gap-2 md:grid md:grid-cols-[1fr_auto] md:gap-4 md:items-baseline ${
        PRIORITY_TONE[item.priority]
      }`}
    >
      <div>
        <div className="flex items-baseline gap-2">
          <Icon size={11} style={{ color: meta.color }} className="shrink-0 translate-y-[1px]" />
          <span
            className="label-caps tracking-[0.10em] text-[9px]"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
          {item.daysOut !== undefined && (
            <span className="label-caps tracking-[0.10em] text-[9px] text-[color:var(--color-on-paper-faint)] tabular-nums">
              {item.daysOut <= 0 ? 'overdue' : `${item.daysOut}d`}
            </span>
          )}
          <span
            className="label-caps tracking-[0.10em] text-[9px]"
            style={{
              color:
                item.priority === 'critical'
                  ? 'var(--color-coral-deep)'
                  : item.priority === 'high'
                  ? 'var(--color-warn)'
                  : 'var(--color-brass-deep)',
            }}
          >
            {item.priority}
          </span>
        </div>
        <div className="display-italic text-[14px] text-[color:var(--color-on-paper)] leading-tight mt-0.5">
          {item.title}
        </div>
        <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          {item.description}
        </div>
      </div>
      <div className="flex items-baseline gap-1.5 shrink-0">
        {item.actions.map((a) => (
          <button
            key={a.handlerKey}
            type="button"
            onClick={() => onAction(a.handlerKey)}
            className={`flex items-baseline gap-1 label-caps tracking-[0.10em] text-[10px] px-2.5 py-1 rounded-[2px] transition-colors ${
              a.type === 'primary'
                ? 'bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] hover:bg-[color:var(--color-success)]/25'
                : a.type === 'snooze'
                ? 'text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)]'
                : 'text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)]'
            }`}
          >
            <a.icon size={9} />
            {a.label}
          </button>
        ))}
      </div>
    </li>
  );
}
