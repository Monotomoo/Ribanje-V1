import { GripVertical } from 'lucide-react';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { useApp } from '../../state/AppContext';
import type { AntiScriptMoment, MomentStatus } from '../../types';
import { EditableText } from '../primitives/EditableText';
import { EditableNumber } from '../primitives/EditableNumber';
import { Pill } from '../primitives/Pill';
import { DeleteButton, EmptyState, Field } from './shared';

const STATUS_CYCLE: MomentStatus[] = ['planned', 'captured', 'cut'];

interface Props {
  episodeId: string;
}

export function BeatTimeline({ episodeId }: Props) {
  const { state } = useApp();
  const moments = state.antiScriptMoments
    .filter((m) => m.episodeId === episodeId)
    .sort((a, b) => a.orderIdx - b.orderIdx);

  const total = moments.reduce(
    (s, m) => s + (m.expectedDurationMin ?? 0),
    0
  );

  const { setNodeRef, isOver } = useDroppable({
    id: 'beatdrop:' + episodeId,
  });

  return (
    <div>
      <header className="flex items-baseline justify-between mb-3">
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          Beat timeline
        </h3>
        <div className="flex items-baseline gap-3 label-caps text-[color:var(--color-on-paper-faint)]">
          <span>{moments.length} beats</span>
          <span className="text-[color:var(--color-on-paper-faint)]">·</span>
          <span className="tabular-nums">{total} of 50 min</span>
        </div>
      </header>

      {/* Proportional preview strip */}
      {moments.length > 0 && (
        <div className="mb-4">
          <div className="flex h-3 rounded-full overflow-hidden border-[0.5px] border-[color:var(--color-border-paper)] bg-[color:var(--color-paper-deep)]/40">
            {moments.map((m) => {
              const dur = Math.max(0.5, m.expectedDurationMin ?? 1);
              const cap = Math.max(50, total);
              return (
                <div
                  key={m.id}
                  style={{
                    width: `${(dur / cap) * 100}%`,
                    background: momentColor(m.status),
                  }}
                  title={`${m.title} · ${dur} min`}
                />
              );
            })}
          </div>
        </div>
      )}

      <div
        ref={setNodeRef}
        className={`min-h-[160px] rounded-[3px] p-2 transition-colors ${
          isOver
            ? 'bg-[color:var(--color-brass)]/10 border-[0.5px] border-dashed border-[color:var(--color-brass)]'
            : moments.length === 0
            ? 'bg-[color:var(--color-paper-deep)]/25 border-[0.5px] border-dashed border-[color:var(--color-border-paper)]'
            : ''
        }`}
      >
        {moments.length === 0 ? (
          <EmptyState
            message="No beats yet."
            hint="Drag a beat from the library on the left to start the timeline."
          />
        ) : (
          <SortableContext
            items={moments.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2.5">
              {moments.map((m) => (
                <SortableMoment key={m.id} moment={m} />
              ))}
            </ul>
          </SortableContext>
        )}
      </div>
    </div>
  );
}

function SortableMoment({ moment }: { moment: AntiScriptMoment }) {
  const { dispatch } = useApp();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: moment.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  function patch(p: Partial<AntiScriptMoment>) {
    dispatch({ type: 'UPDATE_ANTI_SCRIPT', id: moment.id, patch: p });
  }
  function cycleStatus() {
    const i = STATUS_CYCLE.indexOf(moment.status);
    patch({ status: STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length] });
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="relative bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] hover:border-[color:var(--color-brass)] rounded-[3px] px-5 py-4 group"
    >
      <button
        type="button"
        aria-label="drag to reorder"
        className="absolute top-3 right-3 text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-brass-deep)] cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>

      <div className="flex items-baseline gap-3 pr-8">
        <span className="display-italic text-[16px] text-[color:var(--color-brass)] tabular-nums w-6 shrink-0">
          {moment.orderIdx + 1}.
        </span>
        <div className="flex-1 min-w-0">
          <EditableText
            value={moment.title}
            onChange={(v) => patch({ title: v })}
            placeholder="Moment title"
            className="display-italic text-[19px] text-[color:var(--color-on-paper)] leading-tight"
          />
        </div>
        <button type="button" onClick={cycleStatus} className="shrink-0">
          <Pill
            variant={
              moment.status === 'captured'
                ? 'captured'
                : moment.status === 'cut'
                ? 'cut'
                : 'planned'
            }
          >
            {moment.status}
          </Pill>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mt-3 pl-9">
        <Field label="Who">
          <EditableText
            value={moment.who}
            onChange={(v) => patch({ who: v })}
            placeholder="—"
            className="prose-body text-[13px] text-[color:var(--color-on-paper)]"
          />
        </Field>
        <Field label="What">
          <EditableText
            value={moment.what}
            onChange={(v) => patch({ what: v })}
            placeholder="—"
            className="prose-body text-[13px] text-[color:var(--color-on-paper)]"
          />
        </Field>
        <Field label="Where">
          <EditableText
            value={moment.where}
            onChange={(v) => patch({ where: v })}
            placeholder="—"
            className="prose-body text-[13px] text-[color:var(--color-on-paper)]"
          />
        </Field>
        <Field label="Duration">
          <EditableNumber
            value={moment.expectedDurationMin ?? 0}
            onChange={(v) => patch({ expectedDurationMin: v })}
            suffix=" min"
            size="sm"
            align="left"
          />
        </Field>
      </div>

      <div className="mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)] pl-9 flex items-baseline gap-4">
        <div className="flex-1">
          <Field label="Why it matters">
            <EditableText
              value={moment.whyItMatters}
              onChange={(v) => patch({ whyItMatters: v })}
              multiline
              rows={2}
              placeholder="Why is this the moment to chase?"
              className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-[1.55]"
            />
          </Field>
        </div>
        <DeleteButton
          onClick={() => dispatch({ type: 'DELETE_ANTI_SCRIPT', id: moment.id })}
        />
      </div>
    </li>
  );
}

function momentColor(s: MomentStatus): string {
  switch (s) {
    case 'planned':  return 'rgba(168,136,74,0.55)';
    case 'captured': return 'var(--color-success)';
    case 'cut':      return 'rgba(194,106,74,0.55)';
  }
}
