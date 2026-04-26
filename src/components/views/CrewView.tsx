import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { CrewMember } from '../../types';
import { TaskBoard } from '../primitives/TaskBoard';
import { NoteThread } from '../primitives/NoteThread';
import { LCDCard } from '../primitives/LCDCard';
import { newId } from '../episode/shared';
import { CrewDrawer } from '../crew/CrewDrawer';

const TABS = ['Roster', 'Tasks', 'Cross-team notes', 'Standup'] as const;
type Tab = (typeof TABS)[number];

export function CrewView() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<Tab>('Roster');
  const [openId, setOpenId] = useState<string | null>(null);

  function add() {
    const member: CrewMember = {
      id: newId('c'),
      name: 'New crew member',
      role: '',
    };
    dispatch({ type: 'ADD_CREW', member });
    setOpenId(member.id);
  }

  const selected = openId
    ? state.crew.find((m) => m.id === openId) ?? null
    : null;

  /* Per-crew task counts */
  const taskCounts: Record<string, { total: number; done: number }> = {};
  for (const m of state.crew) {
    const tasks = state.tasks.filter(
      (t) => t.context === 'crew' && t.assigneeId === m.id
    );
    taskCounts[m.id] = {
      total: tasks.length,
      done: tasks.filter((t) => t.status === 'done').length,
    };
  }

  const totalTasks = state.tasks.filter((t) => t.context === 'crew').length;
  const openTasks = state.tasks.filter(
    (t) => t.context === 'crew' && t.status !== 'done'
  ).length;

  return (
    <div className="space-y-7 max-w-[1400px]">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
            Crew
          </h2>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Roster · tasks per person · threaded notes · daily standup. Click a card for the per-person hub.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] rounded-[2px] px-3 py-1.5 transition-colors"
        >
          <Plus size={11} />
          Add crew
        </button>
      </div>

      {/* Stats strip */}
      <section className="grid grid-cols-4 gap-5">
        <LCDCard label="Crew" value={`${state.crew.length}`} sub="people" />
        <LCDCard
          label="Tasks open"
          value={`${openTasks}`}
          sub={`${totalTasks} total · across team`}
          trend={openTasks === 0 ? 'up' : 'flat'}
        />
        <LCDCard
          label="Cross-team notes"
          value={`${state.notes.filter((n) => n.targetType === 'crew' && !n.resolvedAt).length}`}
          sub="open threads"
        />
        <LCDCard
          label="Pinned"
          value={`${state.notes.filter((n) => n.pinned).length}`}
          sub="notes pinned across team"
        />
      </section>

      {/* Tabs */}
      <div className="flex items-baseline gap-1 border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] p-1 w-fit">
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 transition-colors rounded-[2px] ${
                active
                  ? 'bg-[color:var(--color-paper-deep)]/40 text-[color:var(--color-on-paper)]'
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              <span
                className={
                  active
                    ? 'display-italic text-[15px]'
                    : 'font-sans text-[11px] tracking-[0.14em] uppercase'
                }
              >
                {t}
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'Roster' && (
        <section>
          <div className="grid grid-cols-2 gap-5">
            {state.crew.map((m) => {
              const counts = taskCounts[m.id];
              const pinnedNotes = state.notes.filter(
                (n) =>
                  n.targetType === 'crew' &&
                  n.targetId === m.id &&
                  n.pinned
              );
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setOpenId(m.id)}
                  className="text-left bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6 hover:border-[color:var(--color-brass)] transition-colors"
                >
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-full bg-[color:var(--color-chrome)] text-[color:var(--color-brass)] flex items-center justify-center display-italic text-[18px] shrink-0">
                      {initials(m.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="display-italic text-[24px] text-[color:var(--color-on-paper)] leading-tight">
                        {m.name}
                      </div>
                      <div className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mt-1">
                        {m.role || '—'}
                      </div>
                      {m.rate && (
                        <div className="label-caps text-[color:var(--color-brass-deep)] mt-3">
                          {m.rate}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)] grid grid-cols-3 gap-3">
                    <Stat label="Tasks" value={`${counts?.total ?? 0}`} />
                    <Stat
                      label="Done"
                      value={`${counts?.done ?? 0}`}
                      tone="success"
                    />
                    <Stat
                      label="Pinned"
                      value={`${pinnedNotes.length}`}
                      tone="brass"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'Tasks' && (
        <section>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mb-3">
            Cross-team task board. Drag cards across columns to update status.
            Open a task to assign it.
          </p>
          <TaskBoard
            context="crew"
            emptyHint="No team tasks yet — add one to start."
          />
        </section>
      )}

      {tab === 'Cross-team notes' && (
        <section>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mb-3">
            Open notes thread for the whole team. Use this for shared logistics —
            "Tom's lens kit confirmed," "Rene needs three days off mid-shoot," etc.
          </p>
          <NoteThread
            targetType="crew"
            targetId="global"
            emptyMessage="No team notes yet."
          />
        </section>
      )}

      {tab === 'Standup' && (
        <section className="space-y-5">
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
            Daily standup log per person. Drop a quick "yesterday / today /
            blocked" note in each thread. Useful during the October shoot.
          </p>
          {state.crew.length === 0 ? (
            <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)]">
              Add crew to start standups.
            </p>
          ) : (
            <div className="space-y-7">
              {state.crew.map((m) => (
                <article
                  key={m.id}
                  className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5"
                >
                  <header className="flex items-baseline gap-3 mb-3 pb-3 border-b-[0.5px] border-[color:var(--color-border-paper)]">
                    <span className="w-8 h-8 rounded-full bg-[color:var(--color-chrome)] text-[color:var(--color-brass)] flex items-center justify-center display-italic text-[12px]">
                      {initials(m.name)}
                    </span>
                    <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
                      {m.name}
                    </h3>
                    <span className="label-caps text-[color:var(--color-on-paper-faint)] ml-auto">
                      {m.role}
                    </span>
                  </header>
                  <NoteThread
                    targetType="crew"
                    targetId={m.id}
                    defaultAuthorId={m.id}
                    emptyMessage="No standup entries yet."
                  />
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <CrewDrawer member={selected} onClose={() => setOpenId(null)} />
    </div>
  );
}

function initials(name: string): string {
  return (
    name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '·'
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'brass';
}) {
  const v =
    tone === 'success'
      ? 'text-[color:var(--color-success)]'
      : tone === 'brass'
      ? 'text-[color:var(--color-brass-deep)]'
      : 'text-[color:var(--color-on-paper)]';
  return (
    <div>
      <div className="label-caps text-[color:var(--color-on-paper-faint)] mb-0.5">
        {label}
      </div>
      <div className={`display-italic text-[18px] tabular-nums ${v}`}>
        {value}
      </div>
    </div>
  );
}
