import { Plus, Trash2 } from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useApp } from '../../state/AppContext';
import type { Task, TaskContext, TaskPriority, TaskStatus } from '../../types';
import { EditableText } from './EditableText';
import { newId } from '../episode/shared';

const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'blocked', 'done'];
const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  blocked: 'Blocked',
  done: 'Done',
};

const PRIORITY_CYCLE: TaskPriority[] = ['low', 'med', 'high'];
const PRIORITY_TONE: Record<TaskPriority, string> = {
  low: 'text-[color:var(--color-on-paper-faint)]',
  med: 'text-[color:var(--color-brass-deep)]',
  high: 'text-[color:var(--color-coral-deep)]',
};

interface Props {
  context: TaskContext;
  assigneeId?: string;
  episodeId?: string;
  emptyHint?: string;
}

/* Reusable task board — kanban across todo/in-progress/blocked/done. */
export function TaskBoard({ context, assigneeId, episodeId, emptyHint }: Props) {
  const { state, dispatch } = useApp();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const tasks = state.tasks.filter(
    (t) =>
      t.context === context &&
      (!assigneeId || t.assigneeId === assigneeId) &&
      (!episodeId || t.episodeId === episodeId)
  );

  const grouped = STATUSES.map((s) => ({
    status: s,
    tasks: tasks.filter((t) => t.status === s),
  }));

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const task = state.tasks.find((t) => t.id === active.id);
    if (!task) return;

    const overId = String(over.id);
    let target: TaskStatus | null = null;
    if (overId.startsWith('tasksCol:')) {
      target = overId.slice('tasksCol:'.length) as TaskStatus;
    } else {
      const t = state.tasks.find((t) => t.id === overId);
      target = t?.status ?? null;
    }
    if (target && target !== task.status) {
      dispatch({ type: 'UPDATE_TASK', id: task.id, patch: { status: target } });
    }
  }

  function add() {
    const now = new Date().toISOString();
    const task: Task = {
      id: newId('task'),
      title: 'New task',
      description: '',
      assigneeId,
      episodeId,
      status: 'todo',
      priority: 'med',
      tags: [],
      context,
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_TASK', task });
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </span>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] rounded-[2px] px-2.5 py-1 transition-colors"
        >
          <Plus size={10} />
          Add task
        </button>
      </div>

      {tasks.length === 0 && emptyHint && (
        <div className="border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-5 py-7 text-center">
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
            {emptyHint}
          </p>
        </div>
      )}

      {tasks.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-4 gap-3">
            {grouped.map((g) => (
              <Column key={g.status} status={g.status} tasks={g.tasks} />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}

function Column({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'tasksCol:' + status });
  return (
    <div className="flex flex-col">
      <header className="flex items-baseline justify-between px-1 mb-2">
        <span className="label-caps text-[color:var(--color-on-paper-muted)]">
          {STATUS_LABEL[status]}
        </span>
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">
          {tasks.length}
        </span>
      </header>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[140px] rounded-[3px] p-2 transition-colors ${
          isOver
            ? 'bg-[color:var(--color-brass)]/10 border-[0.5px] border-dashed border-[color:var(--color-brass)]'
            : 'bg-[color:var(--color-paper-deep)]/25 border-[0.5px] border-dashed border-[color:var(--color-border-paper)]'
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5">
            {tasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const { state, dispatch } = useApp();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  function patch(p: Partial<Task>) {
    dispatch({ type: 'UPDATE_TASK', id: task.id, patch: p });
  }
  const assignee = state.crew.find((c) => c.id === task.assigneeId);
  const initials = assignee
    ? assignee.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : null;

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-[color:var(--color-paper-card)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-3 py-2.5 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-baseline gap-2">
        <span
          className={`text-[10px] ${PRIORITY_TONE[task.priority]}`}
          title={`priority ${task.priority}`}
        >
          ●
        </span>
        <div className="flex-1 min-w-0">
          <EditableText
            value={task.title}
            onChange={(v) => patch({ title: v })}
            className="display-italic text-[14px] text-[color:var(--color-on-paper)] leading-tight"
          />
        </div>
      </div>
      <details className="mt-1 group/det">
        <summary
          className="label-caps text-[color:var(--color-on-paper-faint)] cursor-pointer list-none hover:text-[color:var(--color-brass-deep)]"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span className="group-open/det:hidden">edit</span>
          <span className="hidden group-open/det:inline">close</span>
        </summary>
        <div
          className="space-y-2 mt-2 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <EditableText
            value={task.description}
            onChange={(v) => patch({ description: v })}
            multiline
            rows={2}
            placeholder="Description"
            className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={task.assigneeId ?? ''}
              onChange={(e) => patch({ assigneeId: e.target.value || undefined })}
              className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] outline-none prose-body italic text-[11px] py-0.5"
            >
              <option value="">— assign to —</option>
              {state.crew.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={task.dueDate ?? ''}
              onChange={(e) => patch({ dueDate: e.target.value || undefined })}
              className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] outline-none prose-body italic text-[11px] py-0.5"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const i = PRIORITY_CYCLE.indexOf(task.priority);
                patch({
                  priority: PRIORITY_CYCLE[(i + 1) % PRIORITY_CYCLE.length],
                });
              }}
              className={`label-caps border-[0.5px] border-current rounded-full px-2 py-[1px] hover:opacity-80 ${PRIORITY_TONE[task.priority]}`}
            >
              {task.priority}
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'DELETE_TASK', id: task.id })}
              className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)]"
              aria-label="Delete task"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      </details>
      {(initials || task.dueDate) && (
        <div className="flex items-baseline justify-between mt-1.5">
          {initials && (
            <span className="label-caps text-[color:var(--color-brass-deep)]">
              {initials}
            </span>
          )}
          {task.dueDate && (
            <span className="label-caps text-[color:var(--color-on-paper-faint)] tabular-nums ml-auto">
              {fmtDue(task.dueDate)}
            </span>
          )}
        </div>
      )}
    </article>
  );
}

function fmtDue(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
