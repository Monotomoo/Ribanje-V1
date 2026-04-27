import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Sponsor, SponsorStatus } from '../../types';
import { Pill } from '../primitives/Pill';
import { LCDCard } from '../primitives/LCDCard';
import { newId } from '../episode/shared';
import { sponsorHealth } from '../../lib/selectors';
import { SponsorDrawer } from '../sponsors/SponsorDrawer';

const COLUMNS: { status: SponsorStatus; label: string }[] = [
  { status: 'prospect', label: 'Prospect' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'pitched', label: 'Pitched' },
  { status: 'committed', label: 'Committed' },
];

export function SponsorsView() {
  const { state, dispatch } = useApp();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const health = sponsorHealth(state);

  function findStatusOfId(id: string): SponsorStatus | null {
    if (id.startsWith('col:')) return id.slice(4) as SponsorStatus;
    const sp = state.sponsors.find((s) => s.id === id);
    return sp?.status ?? null;
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeSp = state.sponsors.find((s) => s.id === active.id);
    if (!activeSp) return;
    const target = findStatusOfId(String(over.id));
    if (target && target !== activeSp.status) {
      dispatch({
        type: 'UPDATE_SPONSOR',
        id: activeSp.id,
        patch: { status: target },
      });
    }
  }

  function addSponsor() {
    const sponsor: Sponsor = {
      id: newId('sp'),
      name: 'New sponsor',
      tier: 2,
      expectedAmount: 0,
      category: '',
      status: 'prospect',
      notes: '',
    };
    dispatch({ type: 'ADD_SPONSOR', sponsor });
    setOpenId(sponsor.id);
  }

  const grouped = COLUMNS.map((c) => ({
    ...c,
    sponsors: state.sponsors.filter((s) => s.status === c.status),
  }));

  const dragging = activeId
    ? state.sponsors.find((s) => s.id === activeId) ?? null
    : null;

  const selected = openId
    ? state.sponsors.find((s) => s.id === openId) ?? null
    : null;

  return (
    <div className="space-y-9 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
            Sponsor pipeline
          </h2>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Drag cards between columns to update status · click any card to open the brief, outreach log, and pitchmaker.
          </p>
        </div>
        <button
          type="button"
          onClick={addSponsor}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] rounded-[2px] px-3 py-1.5 transition-colors"
        >
          <Plus size={11} />
          Add sponsor
        </button>
      </div>

      {/* Goals strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <LCDCard
          label="Pipeline target"
          value={`${health.target}k`}
          sub="sum of expected"
        />
        <LCDCard
          label="Committed"
          value={`${health.committed}k`}
          sub={`${Math.round(health.pctToTarget)}% to target`}
          trend={health.pctToTarget >= 50 ? 'up' : 'flat'}
        />
        <LCDCard
          label="Pitched"
          value={`${health.pitched}k`}
          sub="awaiting decision"
        />
        <LCDCard
          label="Gap"
          value={`${health.gap}k`}
          sub="left to close"
          trend={health.gap === 0 ? 'up' : health.committed === 0 ? 'down' : 'flat'}
        />
      </section>

      {/* Kanban */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {grouped.map((col) => (
            <Column
              key={col.status}
              {...col}
              onOpen={(id) => setOpenId(id)}
            />
          ))}
        </div>
        <DragOverlay>
          {dragging && <SponsorCardSurface sponsor={dragging} dragging />}
        </DragOverlay>
      </DndContext>

      {/* Episode-sponsor matrix */}
      <EpisodeSponsorMatrix onOpen={(id) => setOpenId(id)} />

      <SponsorDrawer
        sponsor={selected}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}

function Column({
  status,
  label,
  sponsors,
  onOpen,
}: {
  status: SponsorStatus;
  label: string;
  sponsors: Sponsor[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'col:' + status });
  const total = sponsors.reduce((s, x) => s + x.expectedAmount, 0);
  const isCommitted = status === 'committed';

  return (
    <div className="flex flex-col">
      <header className="px-1 mb-3">
        <div className="flex items-baseline justify-between">
          <h3
            className={`display-italic text-[20px] ${
              isCommitted
                ? 'text-[color:var(--color-success)]'
                : 'text-[color:var(--color-on-paper)]'
            }`}
          >
            {label}
          </h3>
          <span className="label-caps text-[color:var(--color-on-paper-faint)]">
            {sponsors.length}
          </span>
        </div>
        {isCommitted && (
          <div className="display-italic text-[15px] text-[color:var(--color-success)] tabular-nums mt-0.5">
            {total}k €
          </div>
        )}
      </header>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[400px] rounded-[3px] p-2 transition-colors duration-200 ${
          isOver
            ? 'bg-[color:var(--color-brass)]/12 border-[0.5px] border-dashed border-[color:var(--color-brass)]'
            : 'bg-[color:var(--color-paper-deep)]/30 border-[0.5px] border-dashed border-[color:var(--color-border-paper)]'
        }`}
      >
        <SortableContext
          items={sponsors.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sponsors.map((sp) => (
              <SortableSponsorCard
                key={sp.id}
                sponsor={sp}
                onOpen={() => onOpen(sp.id)}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function SortableSponsorCard({
  sponsor,
  onOpen,
}: {
  sponsor: Sponsor;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sponsor.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <SponsorCardSurface sponsor={sponsor} listeners={listeners} attributes={attributes} onOpen={onOpen} />
    </div>
  );
}

interface SponsorCardSurfaceProps {
  sponsor: Sponsor;
  dragging?: boolean;
  listeners?: ReturnType<typeof useSortable>['listeners'];
  attributes?: ReturnType<typeof useSortable>['attributes'];
  onOpen?: () => void;
}

function SponsorCardSurface({
  sponsor,
  dragging = false,
  listeners,
  attributes,
  onOpen,
}: SponsorCardSurfaceProps) {
  return (
    <article
      className={`bg-[color:var(--color-paper-card)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-3 ${
        dragging ? 'shadow-[0_8px_28px_rgba(14,30,54,0.18)]' : ''
      }`}
    >
      <div
        className="flex items-start justify-between gap-2 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <div className="flex-1 min-w-0">
          <h4 className="display-italic text-[15px] text-[color:var(--color-on-paper)] leading-tight">
            {sponsor.name}
          </h4>
        </div>
        <Pill
          variant={sponsor.tier === 1 ? 'shot' : sponsor.tier === 2 ? 'pitched' : 'concept'}
        >
          tier {sponsor.tier === 1 ? 'i' : sponsor.tier === 2 ? 'ii' : 'iii'}
        </Pill>
      </div>
      <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-1 line-clamp-1">
        {sponsor.category || '—'}
      </div>
      <div className="flex items-baseline justify-between mt-2.5 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">expected</span>
        <span className="display-italic text-[18px] text-[color:var(--color-on-paper)] tabular-nums">
          {sponsor.expectedAmount}
          <span className="text-[color:var(--color-on-paper-muted)] not-italic ml-0.5">k</span>
        </span>
      </div>
      {!dragging && onOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="mt-2 w-full label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-t-[0.5px] border-[color:var(--color-border-paper)] pt-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          open brief →
        </button>
      )}
    </article>
  );
}

function EpisodeSponsorMatrix({ onOpen }: { onOpen: (id: string) => void }) {
  const { state } = useApp();
  return (
    <section>
      <header className="flex items-baseline justify-between mb-3">
        <h3 className="display-italic text-[22px] text-[color:var(--color-on-paper)]">
          Episode × sponsor matrix
        </h3>
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">
          which sponsor anchors which episode
        </span>
      </header>

      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-[0.5px] border-[color:var(--color-border-paper)]">
              <th className="text-left label-caps text-[color:var(--color-brass-deep)] px-5 py-3 sticky left-0 bg-[color:var(--color-paper-light)]">
                Sponsor
              </th>
              {state.episodes.map((ep) => (
                <th
                  key={ep.id}
                  className="text-center label-caps text-[color:var(--color-brass-deep)] px-3 py-3 min-w-[80px]"
                >
                  Ep {ep.number}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.sponsors.map((sp) => (
              <tr
                key={sp.id}
                className="border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0 hover:bg-[color:var(--color-paper-deep)]/20"
              >
                <td className="px-5 py-2.5 sticky left-0 bg-inherit">
                  <button
                    type="button"
                    onClick={() => onOpen(sp.id)}
                    className="text-left"
                  >
                    <div className="display-italic text-[14px] text-[color:var(--color-on-paper)] hover:text-[color:var(--color-brass-deep)]">
                      {sp.name}
                    </div>
                    <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
                      tier {sp.tier} · {sp.expectedAmount}k
                    </div>
                  </button>
                </td>
                {state.episodes.map((ep) => {
                  const tied = (sp.episodeIds ?? []).includes(ep.id);
                  return (
                    <td key={ep.id} className="text-center px-3 py-2.5">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          tied
                            ? 'bg-[color:var(--color-brass)]'
                            : 'bg-[color:var(--color-paper-deep)]/60'
                        }`}
                        title={tied ? 'anchors this episode' : 'no tie-in'}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-2 text-center">
        Open a sponsor's brief to set episode tie-ins.
      </p>
    </section>
  );
}
