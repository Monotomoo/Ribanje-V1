import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useApp } from '../../state/AppContext';
import { EditableText } from '../primitives/EditableText';
import {
  AddButton,
  DeleteButton,
  EmptyState,
  EntityCard,
  Field,
  SectionHeader,
  newId,
} from './shared';
import type { AntiScriptMoment, Reference } from '../../types';
import { BEAT_TEMPLATES } from '../../lib/seed';
import { BeatLibrary } from './BeatLibrary';
import { BeatTimeline } from './BeatTimeline';
import { SketchSection } from './SketchSection';
import { MoodBoardSection } from './MoodBoardSection';
import { SurpriseCaptureLog } from '../surprise/SurpriseCaptureLog';

export function StoryTab({ episodeId }: { episodeId: string }) {
  const { state, dispatch } = useApp();
  const ep = [...state.episodes, ...state.specials].find((e) => e.id === episodeId);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  if (!ep) return null;

  const extras = state.episodeExtras[episodeId];
  const moments = state.antiScriptMoments
    .filter((m) => m.episodeId === episodeId)
    .sort((a, b) => a.orderIdx - b.orderIdx);
  const refs = state.references.filter((r) => r.episodeId === episodeId);

  function addReference() {
    const reference: Reference = {
      id: newId('ref'),
      episodeId,
      type: 'film',
      title: 'New reference',
      whyItMatters: '',
      notes: '',
    };
    dispatch({ type: 'ADD_REFERENCE', reference });
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    /* Library → timeline (drag a beat template into the drop zone or onto a moment) */
    if (activeId.startsWith('tpl:')) {
      const tplId = activeId.slice('tpl:'.length);
      const tpl = BEAT_TEMPLATES.find((t) => t.id === tplId);
      if (!tpl) return;

      let insertAt = moments.length;
      if (overId !== 'beatdrop:' + episodeId) {
        /* Dropped on an existing moment — insert before it */
        const idx = moments.findIndex((m) => m.id === overId);
        if (idx >= 0) insertAt = idx;
      }
      const moment: AntiScriptMoment = {
        id: newId('mom'),
        episodeId,
        title: tpl.label,
        expectedDurationMin: tpl.defaultDurationMin,
        who: '',
        what: tpl.description,
        where: '',
        whyItMatters: '',
        status: 'planned',
        orderIdx: insertAt,
      };
      dispatch({ type: 'ADD_ANTI_SCRIPT', moment });
      /* Re-index existing moments at-or-after insertAt */
      const newOrder = [
        ...moments.slice(0, insertAt).map((m) => m.id),
        moment.id,
        ...moments.slice(insertAt).map((m) => m.id),
      ];
      dispatch({ type: 'REORDER_ANTI_SCRIPT', episodeId, ids: newOrder });
      return;
    }

    /* Timeline → timeline reorder */
    if (active.id !== over.id) {
      const ids = moments.map((m) => m.id);
      const oldIdx = ids.indexOf(activeId);
      const newIdx = ids.indexOf(overId);
      if (oldIdx >= 0 && newIdx >= 0) {
        const reordered = arrayMove(ids, oldIdx, newIdx);
        dispatch({ type: 'REORDER_ANTI_SCRIPT', episodeId, ids: reordered });
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-8">
        {/* Synopsis full width */}
        <Field label="Synopsis">
          <EditableText
            value={ep.synopsis}
            onChange={(v) =>
              dispatch({ type: 'UPDATE_EPISODE', episodeId, patch: { synopsis: v } })
            }
            multiline
            rows={3}
            placeholder="What is this episode about?"
            className="prose-body text-[16px] text-[color:var(--color-on-paper)] leading-[1.55]"
          />
        </Field>

        {/* Surprise capture log — full editorial review surface */}
        <SurpriseCaptureLog episodeId={episodeId} />

        {/* Three-column row: Library · Timeline · Hektorović + Refs */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_280px] gap-4 md:gap-6">
          <BeatLibrary />
          <BeatTimeline episodeId={episodeId} />
          <aside className="space-y-6">
            <EntityCard>
              <SectionHeader title="Hektorović" />
              <Field label="Verse · Croatian">
                <EditableText
                  value={extras?.hektorovicVerseCro ?? ''}
                  onChange={(v) =>
                    dispatch({
                      type: 'UPDATE_EPISODE_EXTRAS',
                      episodeId,
                      patch: { hektorovicVerseCro: v },
                    })
                  }
                  multiline
                  rows={2}
                  placeholder="From the 1568 poem"
                  className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]"
                />
              </Field>
              <div className="mt-3">
                <Field label="Working translation">
                  <EditableText
                    value={extras?.hektorovicVerseEng ?? ''}
                    onChange={(v) =>
                      dispatch({
                        type: 'UPDATE_EPISODE_EXTRAS',
                        episodeId,
                        patch: { hektorovicVerseEng: v },
                      })
                    }
                    multiline
                    rows={2}
                    placeholder="In English"
                    className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
                  />
                </Field>
              </div>
              <div className="mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                <Field label="Modern parallel">
                  <EditableText
                    value={extras?.hektorovicParallel ?? ''}
                    onChange={(v) =>
                      dispatch({
                        type: 'UPDATE_EPISODE_EXTRAS',
                        episodeId,
                        patch: { hektorovicParallel: v },
                      })
                    }
                    multiline
                    rows={4}
                    placeholder="How does the 1568 voyage echo through this episode?"
                    className="prose-body text-[12px] text-[color:var(--color-on-paper)] leading-[1.55]"
                  />
                </Field>
              </div>
            </EntityCard>
          </aside>
        </div>

        {/* References — full width below */}
        <section>
          <SectionHeader
            title="References"
            count={refs.length}
            action={<AddButton label="Add reference" onClick={addReference} />}
          />
          {refs.length === 0 ? (
            <EmptyState message="No reference films, books, or images yet for this episode." />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {refs.map((r) => (
                <ReferenceCard key={r.id} reference={r} />
              ))}
            </div>
          )}
        </section>

        {/* Sketches — full width below references */}
        <SketchSection episodeId={episodeId} />

        {/* Mood boards — palette extraction from reference images */}
        <MoodBoardSection episodeId={episodeId} />
      </div>
    </DndContext>
  );
}

function ReferenceCard({ reference }: { reference: Reference }) {
  const { dispatch } = useApp();
  function patch(p: Partial<Reference>) {
    dispatch({ type: 'UPDATE_REFERENCE', id: reference.id, patch: p });
  }
  return (
    <EntityCard>
      <div className="flex items-baseline gap-3">
        <div className="flex-1 min-w-0">
          <EditableText
            value={reference.title}
            onChange={(v) => patch({ title: v })}
            className="display-italic text-[18px] text-[color:var(--color-on-paper)]"
          />
        </div>
        <DeleteButton
          onClick={() => dispatch({ type: 'DELETE_REFERENCE', id: reference.id })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Field label="Director / author">
          <EditableText
            value={reference.director ?? ''}
            onChange={(v) => patch({ director: v })}
            className="prose-body text-[13px] text-[color:var(--color-on-paper)]"
          />
        </Field>
        <Field label="Year">
          <EditableText
            value={reference.year?.toString() ?? ''}
            onChange={(v) => patch({ year: v ? parseInt(v, 10) : undefined })}
            className="prose-body text-[13px] text-[color:var(--color-on-paper)]"
          />
        </Field>
      </div>
      <div className="mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        <Field label="Why it matters">
          <EditableText
            value={reference.whyItMatters}
            onChange={(v) => patch({ whyItMatters: v })}
            multiline
            rows={2}
            placeholder="What does this teach us?"
            className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-[1.55]"
          />
        </Field>
      </div>
    </EntityCard>
  );
}
