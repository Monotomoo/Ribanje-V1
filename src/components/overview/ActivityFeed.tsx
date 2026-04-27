import { useMemo } from 'react';
import {
  Activity,
  ArrowRight,
  CheckSquare,
  Circle,
  FileText,
  Handshake,
  MessageSquare,
  Notebook,
  Vote,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { ViewKey } from '../../types';

/* Activity Feed — latest events across the production, composed from
   timestamped entities. No new infra needed; we sort and merge from:
   - JournalEntry · Take · DecisionEntry · Note · OutreachContact · IncidentEntry
   Last 10 shown, jumpable. */

interface FeedEvent {
  id: string;
  timestamp: number;
  type: 'journal' | 'take' | 'decision' | 'note' | 'outreach' | 'incident' | 'task';
  title: string;
  description: string;
  jumpTo?: ViewKey;
}

const TYPE_META: Record<
  FeedEvent['type'],
  { label: string; icon: typeof Activity; color: string }
> = {
  journal:  { label: 'journal',   icon: Notebook,       color: 'var(--color-brass-deep)' },
  take:     { label: 'take',      icon: Circle,         color: 'var(--color-coral-deep)' },
  decision: { label: 'decision',  icon: Vote,           color: 'var(--color-on-paper)' },
  note:     { label: 'note',      icon: MessageSquare,  color: 'var(--color-on-paper-muted)' },
  outreach: { label: 'outreach',  icon: Handshake,      color: 'var(--color-brass-deep)' },
  incident: { label: 'incident',  icon: FileText,       color: 'var(--color-coral-deep)' },
  task:     { label: 'task',      icon: CheckSquare,    color: 'var(--color-brass-deep)' },
};

function tsFromIso(iso?: string): number {
  if (!iso) return 0;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function formatAgo(ms: number): string {
  if (ms === 0) return '—';
  const deltaSec = (Date.now() - ms) / 1000;
  if (deltaSec < 60) return 'just now';
  if (deltaSec < 3600) return `${Math.round(deltaSec / 60)}m ago`;
  if (deltaSec < 86400) return `${Math.round(deltaSec / 3600)}h ago`;
  if (deltaSec < 86400 * 7) return `${Math.round(deltaSec / 86400)}d ago`;
  const d = new Date(ms);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function ActivityFeed({ onJump }: { onJump: (view: ViewKey) => void }) {
  const { state } = useApp();

  const events: FeedEvent[] = useMemo(() => {
    const out: FeedEvent[] = [];

    /* Journal entries */
    for (const j of state.journalEntries) {
      out.push({
        id: `j-${j.id}`,
        timestamp: tsFromIso(j.date),
        type: 'journal',
        title: j.whatHappened ? j.whatHappened.slice(0, 60) + (j.whatHappened.length > 60 ? '…' : '') : 'Journal entry',
        description: `${j.weather ?? '—'} · mood ${j.moodTag}`,
        jumpTo: 'journal',
      });
    }

    /* Takes — only logged ones */
    for (const t of state.takes) {
      if (!t.startedAt) continue;
      const shot = state.shots.find((s) => s.id === t.shotId);
      out.push({
        id: `t-${t.id}`,
        timestamp: tsFromIso(t.endedAt ?? t.startedAt),
        type: 'take',
        title: `${shot?.number ?? '—'} · take ${t.takeNum}`,
        description: `${t.status}${t.cameraSlot ? ` · cam ${t.cameraSlot}` : ''}${t.durationSec ? ` · ${Math.round(t.durationSec)}s` : ''}`,
        jumpTo: 'production',
      });
    }

    /* Decisions */
    for (const d of state.decisions) {
      out.push({
        id: `d-${d.id}`,
        timestamp: tsFromIso(d.date),
        type: 'decision',
        title: d.title,
        description: `${d.scope} · chose ${d.chosen.slice(0, 40)}${d.chosen.length > 40 ? '…' : ''}`,
        jumpTo: 'overview',
      });
    }

    /* Notes */
    for (const n of state.notes) {
      out.push({
        id: `n-${n.id}`,
        timestamp: tsFromIso(n.createdAt),
        type: 'note',
        title: n.body.slice(0, 60) + (n.body.length > 60 ? '…' : ''),
        description: `${n.targetType}${n.resolvedAt ? ' · resolved' : ''}`,
        jumpTo: 'crew',
      });
    }

    /* Outreach */
    for (const o of state.outreachContacts) {
      const sponsor = state.sponsors.find((s) => s.id === o.sponsorId);
      out.push({
        id: `o-${o.id}`,
        timestamp: tsFromIso(o.date),
        type: 'outreach',
        title: `${o.channel} · ${sponsor?.name ?? 'sponsor'}`,
        description: `${o.reachedOut}${o.response ? ` · "${o.response.slice(0, 40)}"` : ''}`,
        jumpTo: 'sponsors',
      });
    }

    /* Incidents */
    for (const i of state.incidents) {
      out.push({
        id: `i-${i.id}`,
        timestamp: tsFromIso(i.date),
        type: 'incident',
        title: i.description.slice(0, 60) + (i.description.length > 60 ? '…' : ''),
        description: `severity ${i.severity}${i.actionTaken ? ` · "${i.actionTaken.slice(0, 30)}"` : ''}`,
        jumpTo: 'production',
      });
    }

    /* Tasks updated recently */
    for (const t of state.tasks) {
      if (t.status !== 'done') continue;
      out.push({
        id: `tk-${t.id}`,
        timestamp: tsFromIso(t.updatedAt),
        type: 'task',
        title: t.title,
        description: `done · ${t.context ?? 'task'}`,
        jumpTo: 'crew',
      });
    }

    /* Sort newest first */
    out.sort((a, b) => b.timestamp - a.timestamp);
    return out.slice(0, 12);
  }, [state]);

  if (events.length === 0) {
    return (
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <span className="label-caps tracking-[0.14em] text-[color:var(--color-brass-deep)]">
            recent activity
          </span>
        </div>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)] bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-6 text-center">
          No activity logged yet. Capture journal entries, takes, decisions or sponsor
          outreach to see them here.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <span className="label-caps tracking-[0.14em] text-[color:var(--color-brass-deep)]">
          recent activity
        </span>
        <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] tabular-nums">
          last {events.length} events
        </span>
      </div>
      <ul className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] divide-y divide-[color:var(--color-border-paper)]">
        {events.map((e) => (
          <FeedRow key={e.id} event={e} onJump={onJump} />
        ))}
      </ul>
    </section>
  );
}

function FeedRow({
  event: e,
  onJump,
}: {
  event: FeedEvent;
  onJump: (view: ViewKey) => void;
}) {
  const meta = TYPE_META[e.type];
  const Icon = meta.icon;
  return (
    <li
      className="px-4 py-2.5 grid grid-cols-[70px_1fr_auto] md:grid-cols-[80px_70px_1fr_auto] gap-2 md:gap-3 items-baseline cursor-pointer hover:bg-[color:var(--color-paper-deep)]/15 transition-colors"
      onClick={() => e.jumpTo && onJump(e.jumpTo)}
    >
      <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] tabular-nums">
        {formatAgo(e.timestamp)}
      </span>
      <span
        className="label-caps tracking-[0.10em] text-[9px] flex items-baseline gap-1"
        style={{ color: meta.color }}
      >
        <Icon size={9} className="shrink-0" />
        {meta.label}
      </span>
      <div className="min-w-0">
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] truncate">
          {e.title}
        </div>
        <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] truncate">
          {e.description}
        </div>
      </div>
      <ArrowRight
        size={10}
        className="text-[color:var(--color-on-paper-faint)] shrink-0"
      />
    </li>
  );
}
