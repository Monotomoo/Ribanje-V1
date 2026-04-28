import { useState } from 'react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import { SlateStrip } from '../primitives/SlateStrip';
import { Pill } from '../primitives/Pill';
import { PhaseHint } from '../primitives/PhaseHint';
import { EpisodeHub } from '../episode/EpisodeHub';
import { EpisodeMakeSheet } from '../episode/EpisodeMakeSheet';
import type { Episode } from '../../types';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, GripVertical } from 'lucide-react';

export function EpisodesView() {
  const { state, dispatch } = useApp();
  const t = useT();
  const selectedId = state.selectedEpisodeId;
  const [makeSheetEpId, setMakeSheetEpId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (selectedId) {
    return (
      <EpisodeHub
        episodeId={selectedId}
        onBack={() => dispatch({ type: 'SELECT_EPISODE', episodeId: null })}
      />
    );
  }

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = state.episodes.map((ep) => ep.id);
    const oldIdx = ids.indexOf(String(e.active.id));
    const newIdx = ids.indexOf(String(e.over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(ids, oldIdx, newIdx);
    dispatch({ type: 'REORDER_EPISODES', ids: reordered });
  }

  function open(id: string) {
    dispatch({ type: 'SELECT_EPISODE', episodeId: id });
  }

  const makeSheetEp =
    makeSheetEpId &&
    [...state.episodes, ...state.specials].find((e) => e.id === makeSheetEpId);

  return (
    <div className="space-y-12 max-w-[1400px]">
      <section>
        <SectionLabel>{t('episodes.main.label')}</SectionLabel>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={state.episodes.map((e) => e.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 gap-6 mt-5">
              {state.episodes.map((ep) => (
                <SortableEpisodeCard
                  key={ep.id}
                  ep={ep}
                  onOpen={() => open(ep.id)}
                  onMakeSheet={() => setMakeSheetEpId(ep.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <section>
        <SectionLabel>{t('episodes.specials')}</SectionLabel>
        <div className="grid grid-cols-2 gap-6 mt-5">
          {state.specials.map((ep) => (
            <EpisodeCard
              key={ep.id}
              ep={ep}
              onOpen={() => open(ep.id)}
              onMakeSheet={() => setMakeSheetEpId(ep.id)}
            />
          ))}
        </div>
      </section>

      <PhaseHint
        phase={3}
        text={t('episodes.phase.hint')}
      />

      {makeSheetEp && (
        <EpisodeMakeSheet episode={makeSheetEp} onClose={() => setMakeSheetEpId(null)} />
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="label-caps text-[color:var(--color-brass-deep)]">{children}</span>
      <div className="flex-1 h-px bg-[color:var(--color-border-brass)]/55" />
    </div>
  );
}

function SortableEpisodeCard({
  ep,
  onOpen,
  onMakeSheet,
}: {
  ep: Episode;
  onOpen: () => void;
  onMakeSheet: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ep.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 10 : 1,
  };
  return (
    <article
      ref={setNodeRef}
      style={style}
      className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden hover:border-[color:var(--color-brass)] transition-colors duration-150 relative group"
    >
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          aria-label="open episode make-sheet"
          title="Episode make-sheet (A4 print)"
          onClick={(e) => {
            e.stopPropagation();
            onMakeSheet();
          }}
          className="p-1.5 rounded-full text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-brass-deep)] hover:bg-[color:var(--color-paper-card)]/95 transition-colors"
        >
          <FileText size={13} />
        </button>
        <button
          type="button"
          aria-label="drag to reorder"
          className="p-1 text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-brass-deep)] cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>
      </div>
      <ClickableCardContent ep={ep} onOpen={onOpen} />
    </article>
  );
}

function EpisodeCard({
  ep,
  onOpen,
  onMakeSheet,
}: {
  ep: Episode;
  onOpen: () => void;
  onMakeSheet: () => void;
}) {
  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden hover:border-[color:var(--color-brass)] transition-colors duration-150 relative group">
      <button
        type="button"
        aria-label="open episode make-sheet"
        title="Episode make-sheet (A4 print)"
        onClick={(e) => {
          e.stopPropagation();
          onMakeSheet();
        }}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-brass-deep)] hover:bg-[color:var(--color-paper-card)]/95 opacity-0 group-hover:opacity-100 transition-all"
      >
        <FileText size={13} />
      </button>
      <ClickableCardContent ep={ep} onOpen={onOpen} />
    </article>
  );
}

function ClickableCardContent({
  ep,
  onOpen,
}: {
  ep: Episode;
  onOpen: () => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left block focus:outline-none focus:ring-1 focus:ring-[color:var(--color-dock)] rounded-[3px]"
    >
      <SlateStrip
        episodeNum={ep.number}
        title={ep.title}
        right={<Pill variant={ep.status}>{ep.status}</Pill>}
      />
      <div className="px-7 py-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className="display-italic text-[14px] text-[color:var(--color-brass)]">
            {ep.theme}
          </span>
          <span className="text-[color:var(--color-on-paper-faint)]">·</span>
          <span className="font-sans text-[11px] tracking-[0.14em] uppercase text-[color:var(--color-on-paper-muted)]">
            {ep.runtime} {t('episodes.runtime.suffix')}
          </span>
        </div>
        <p className="prose-body text-[15px] text-[color:var(--color-on-paper)] leading-[1.55]">
          {ep.synopsis}
        </p>
        <div className="font-sans text-[11px] tracking-[0.14em] uppercase text-[color:var(--color-on-paper-faint)] pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          {ep.anchor}
        </div>
      </div>
    </button>
  );
}
