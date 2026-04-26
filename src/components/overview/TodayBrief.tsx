import { useMemo } from 'react';
import { ArrowRight, Calendar, CheckCircle2, Clock, Sun } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { AppState, ViewKey } from '../../types';
import { VerseOfTheDay } from './VerseOfTheDay';

/* Today Brief — top strip of the Overview cockpit.
   Shows date, day-of-shoot countdown, and 3 computed "today's focus" cards
   pulling actionable items from across modules (milestones, risks, sponsors,
   tasks, festivals, applications). */

interface FocusItem {
  id: string;
  priority: 'critical' | 'high' | 'med';
  title: string;
  description: string;
  source: 'milestone' | 'risk' | 'sponsor' | 'task' | 'festival' | 'application';
  jumpTo?: ViewKey;
  daysOut?: number;
}

const PRIORITY_TONE: Record<FocusItem['priority'], { bg: string; fg: string; label: string }> = {
  critical: { bg: 'rgba(194,106,74,0.15)', fg: 'rgb(140,60,40)',  label: 'critical' },
  high:     { bg: 'rgba(217,169,62,0.15)', fg: 'rgb(140,100,30)', label: 'high' },
  med:      { bg: 'rgba(91,163,204,0.15)', fg: 'rgb(60,120,160)', label: 'medium' },
};

function daysFromNow(iso: string, today: Date): number {
  const d = new Date(iso);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function computeFocusItems(state: AppState, today: Date): FocusItem[] {
  const items: FocusItem[] = [];

  /* Approaching milestones */
  for (const m of state.milestones) {
    const daysOut = daysFromNow(m.date, today);
    if (daysOut > 0 && daysOut <= 30) {
      items.push({
        id: `m-${m.id}`,
        priority: daysOut <= 7 ? 'critical' : daysOut <= 14 ? 'high' : 'med',
        title: m.label,
        description: `Milestone · ${daysOut}d`,
        source: 'milestone',
        jumpTo: 'schedule',
        daysOut,
      });
    }
  }

  /* High-impact open risks */
  for (const r of state.risks) {
    const status = r.status ?? 'open';
    if (status === 'mitigated' || status === 'closed') continue;
    const score = (r.probabilityScale ?? 3) * (r.impactScale ?? 3);
    if (score >= 12) {
      items.push({
        id: `r-${r.id}`,
        priority: score >= 20 ? 'critical' : 'high',
        title: r.title,
        description: `Risk · score ${score}${r.category ? ` · ${r.category}` : ''}`,
        source: 'risk',
        jumpTo: 'risks',
      });
    }
  }

  /* Sponsors aging in pipeline */
  for (const s of state.sponsors) {
    if (s.status === 'committed') continue;
    const lastContact = s.lastContactDate ? new Date(s.lastContactDate) : null;
    const daysSince = lastContact
      ? Math.floor((today.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    if ((s.status === 'pitched' && daysSince > 14) || (s.status === 'contacted' && daysSince > 7)) {
      items.push({
        id: `s-${s.id}`,
        priority: daysSince > 30 ? 'high' : 'med',
        title: `Follow up ${s.name}`,
        description: `Sponsor · ${s.status} · ${daysSince}d quiet`,
        source: 'sponsor',
        jumpTo: 'sponsors',
      });
    }
  }

  /* High-priority tasks */
  for (const t of state.tasks) {
    if (t.status === 'done') continue;
    if (t.priority !== 'high') continue;
    const daysOut = t.dueDate ? daysFromNow(t.dueDate, today) : 999;
    items.push({
      id: `t-${t.id}`,
      priority: daysOut <= 0 ? 'critical' : daysOut <= 7 ? 'high' : 'med',
      title: t.title,
      description: `Task · ${t.status}${t.dueDate ? ` · due ${daysOut}d` : ''}`,
      source: 'task',
      daysOut: t.dueDate ? daysOut : undefined,
    });
  }

  /* Festival deadlines */
  for (const f of state.festivals) {
    if (f.status !== 'target') continue;
    if (!f.deadline) continue;
    const daysOut = daysFromNow(f.deadline, today);
    if (daysOut > 0 && daysOut <= 21) {
      items.push({
        id: `f-${f.id}`,
        priority: daysOut <= 7 ? 'critical' : 'high',
        title: `Submit · ${f.name}`,
        description: `Festival · deadline ${daysOut}d`,
        source: 'festival',
        jumpTo: 'pitch',
        daysOut,
      });
    }
  }

  /* Application deadlines */
  for (const a of state.applications) {
    if (a.status !== 'planning' && a.status !== 'drafting') continue;
    if (!a.deadline) continue;
    const daysOut = daysFromNow(a.deadline, today);
    if (daysOut > 0 && daysOut <= 30) {
      items.push({
        id: `a-${a.id}`,
        priority: daysOut <= 7 ? 'critical' : daysOut <= 14 ? 'high' : 'med',
        title: a.name,
        description: `Application · ${a.status} · ${daysOut}d`,
        source: 'application',
        jumpTo: 'pitch',
        daysOut,
      });
    }
  }

  /* Sort by priority, then days-out */
  const order: Record<FocusItem['priority'], number> = { critical: 0, high: 1, med: 2 };
  items.sort((a, b) => {
    const pdiff = order[a.priority] - order[b.priority];
    if (pdiff !== 0) return pdiff;
    return (a.daysOut ?? 999) - (b.daysOut ?? 999);
  });

  return items.slice(0, 3);
}

export function TodayBrief({ onJump }: { onJump: (view: ViewKey) => void }) {
  const { state } = useApp();
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  /* Day-of-shoot countdown */
  const sortedDays = useMemo(
    () => [...state.shootDays].sort((a, b) => a.date.localeCompare(b.date)),
    [state.shootDays]
  );
  const firstShootDay = sortedDays[0];
  const lastShootDay = sortedDays[sortedDays.length - 1];

  const shootCountdown = useMemo(() => {
    if (!firstShootDay) return null;
    const start = new Date(firstShootDay.date);
    const end = lastShootDay ? new Date(lastShootDay.date) : start;
    const todayMs = today.getTime();
    const startMs = start.getTime();
    const endMs = end.getTime();
    if (todayMs < startMs) {
      const days = Math.ceil((startMs - todayMs) / (1000 * 60 * 60 * 24));
      return { phase: 'pre' as const, days, label: `T-${days} days to shoot start` };
    }
    if (todayMs > endMs) {
      const days = Math.ceil((todayMs - endMs) / (1000 * 60 * 60 * 24));
      return { phase: 'post' as const, days, label: `${days}d post-wrap` };
    }
    const days = Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
    const total = sortedDays.length;
    return { phase: 'live' as const, days, total, label: `LIVE · day ${days} of ${total}` };
  }, [firstShootDay, lastShootDay, sortedDays.length, today]);

  /* Production phase from schedulePhases */
  const currentPhase = useMemo(() => {
    const todayMs = today.getTime();
    return state.schedulePhases.find((p) => {
      const startMs = new Date(p.start).getTime();
      const endMs = new Date(p.end).getTime();
      return todayMs >= startMs && todayMs <= endMs;
    });
  }, [state.schedulePhases, today]);

  const focusItems = useMemo(() => computeFocusItems(state, today), [state, today]);

  return (
    <section className="space-y-5">
      {/* Date + countdown + verse */}
      <header className="grid grid-cols-[1fr_360px] gap-6 items-start">
        <div>
          <div className="label-caps tracking-[0.14em] text-[color:var(--color-on-paper-faint)] mb-1">
            today
          </div>
          <h1 className="display-italic text-[34px] text-[color:var(--color-on-paper)] leading-tight">
            {todayStr}
          </h1>
          <div className="flex items-baseline gap-4 mt-2 prose-body italic text-[13px]">
            {shootCountdown && (
              <span
                className={`flex items-baseline gap-1.5 tabular-nums ${
                  shootCountdown.phase === 'live'
                    ? 'text-[color:var(--color-coral-deep)]'
                    : shootCountdown.phase === 'pre'
                    ? 'text-[color:var(--color-brass-deep)]'
                    : 'text-[color:var(--color-on-paper-muted)]'
                }`}
              >
                <Clock size={11} />
                {shootCountdown.label}
              </span>
            )}
            {currentPhase && (
              <span className="flex items-baseline gap-1.5 text-[color:var(--color-on-paper-muted)]">
                <Sun size={11} />
                {currentPhase.label} phase
              </span>
            )}
          </div>
        </div>
        <div className="bg-[color:var(--color-paper-light)] border-l-2 border-[color:var(--color-brass)] px-4 py-2.5">
          <VerseOfTheDay compact />
        </div>
      </header>

      {/* 3 focus cards */}
      <div>
        <div className="flex items-baseline justify-between mb-2.5">
          <span className="label-caps tracking-[0.14em] text-[color:var(--color-brass-deep)]">
            today's focus
          </span>
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
            top {focusItems.length} from {focusItems.length === 0 ? 'none' : 'across the production'}
          </span>
        </div>
        {focusItems.length === 0 ? (
          <div className="bg-[color:var(--color-success)]/10 border-l-2 border-[color:var(--color-success)] px-5 py-4 flex items-baseline gap-2">
            <CheckCircle2 size={14} className="text-[color:var(--color-success)] shrink-0 translate-y-[2px]" />
            <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed">
              Nothing critical waiting — all milestones, risks, sponsors and tasks
              are stable. Use this calm to plan ahead.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-3 gap-3">
            {focusItems.map((item) => (
              <FocusCard key={item.id} item={item} onJump={onJump} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function FocusCard({
  item,
  onJump,
}: {
  item: FocusItem;
  onJump: (view: ViewKey) => void;
}) {
  const tone = PRIORITY_TONE[item.priority];
  return (
    <li
      className="rounded-[3px] border-l-2 px-4 py-3 bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)]"
      style={{ borderLeftColor: tone.fg }}
    >
      <header className="flex items-baseline justify-between mb-1">
        <span
          className="label-caps tracking-[0.14em] text-[10px]"
          style={{ color: tone.fg }}
        >
          {tone.label}
        </span>
        <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)]">
          {item.source}
        </span>
      </header>
      <h4 className="display-italic text-[15px] text-[color:var(--color-on-paper)] leading-tight">
        {item.title}
      </h4>
      <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1 leading-relaxed">
        {item.description}
      </p>
      {item.jumpTo && (
        <button
          type="button"
          onClick={() => onJump(item.jumpTo as ViewKey)}
          className="mt-2 flex items-baseline gap-1 label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] transition-colors"
        >
          <Calendar size={10} />
          open {item.jumpTo}
          <ArrowRight size={9} />
        </button>
      )}
    </li>
  );
}
