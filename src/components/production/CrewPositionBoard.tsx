import { useMemo, useState } from 'react';
import {
  Anchor,
  Coffee,
  Home,
  Sailboat,
  Settings,
  Ship,
  Truck,
  UserX,
  Users,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import type { StringKey } from '../../i18n';
import type { CrewPosition, CrewPositionSlot } from '../../types';

/* ---------- Crew Position Board (Phase 12) ----------

   "Where is everyone right now?" Per-crew snapshot. Drag a crew chip
   between lanes (HTML5 drag) or tap-cycle through slots on touch.

   The board is a moveable map of the operation — quick glance answers
   "do we have everyone on the talent boat?" / "who's at lunch?" /
   "where is Marko right now?".

   Per shoot day. Historical snapshots remain so you can reconstruct
   "where was the boom op at 14:00 last Wednesday?" if needed for
   continuity / wrap notes.

   Used in:
     · Production · Today                  compact embed
     · Production · Crew board (its own surface) */

const SLOTS: { slot: CrewPositionSlot; labelKey: StringKey; descKey: StringKey; Icon: typeof Sailboat }[] = [
  { slot: 'talent-boat',  labelKey: 'crew.slot.talent-boat',  descKey: 'crew.slot.talent-boat.desc',  Icon: Sailboat },
  { slot: 'camera-boat',  labelKey: 'crew.slot.camera-boat',  descKey: 'crew.slot.camera-boat.desc',  Icon: Ship },
  { slot: 'support-boat', labelKey: 'crew.slot.support-boat', descKey: 'crew.slot.support-boat.desc', Icon: Anchor },
  { slot: 'shore',        labelKey: 'crew.slot.shore',        descKey: 'crew.slot.shore.desc',        Icon: Home },
  { slot: 'lunch',        labelKey: 'crew.slot.lunch',        descKey: 'crew.slot.lunch.desc',        Icon: Coffee },
  { slot: 'prep',         labelKey: 'crew.slot.prep',         descKey: 'crew.slot.prep.desc',         Icon: Settings },
  { slot: 'travel',       labelKey: 'crew.slot.travel',       descKey: 'crew.slot.travel.desc',       Icon: Truck },
  { slot: 'off',          labelKey: 'crew.slot.off',          descKey: 'crew.slot.off.desc',          Icon: UserX },
];

interface Props {
  date: string;          // ISO YYYY-MM-DD
  compact?: boolean;
}

export function CrewPositionBoard({ date, compact = false }: Props) {
  const { state, dispatch } = useApp();
  const t = useT();
  const [draggedCrewId, setDraggedCrewId] = useState<string | null>(null);
  const [overSlot, setOverSlot] = useState<CrewPositionSlot | null>(null);

  const positionsByCrewId = useMemo(() => {
    const m = new Map<string, CrewPosition>();
    state.crewPositions
      .filter((p) => p.date === date)
      .forEach((p) => m.set(p.crewId, p));
    return m;
  }, [state.crewPositions, date]);

  function getCrewInSlot(slot: CrewPositionSlot) {
    return state.crew.filter((c) => positionsByCrewId.get(c.id)?.slot === slot);
  }

  function unassignedCrew() {
    return state.crew.filter((c) => !positionsByCrewId.has(c.id));
  }

  function setPosition(crewId: string, slot: CrewPositionSlot) {
    const existing = positionsByCrewId.get(crewId);
    const id = existing?.id ?? `cp-${date}-${crewId}-${Math.random().toString(36).slice(2, 6)}`;
    dispatch({
      type: 'UPSERT_CREW_POSITION',
      position: {
        id,
        crewId,
        date,
        slot,
        updatedAt: new Date().toISOString(),
        notes: existing?.notes,
      },
    });
  }

  function clearPosition(crewId: string) {
    const existing = positionsByCrewId.get(crewId);
    if (existing) {
      dispatch({ type: 'DELETE_CREW_POSITION', id: existing.id });
    }
  }

  function cyclePosition(crewId: string) {
    const current = positionsByCrewId.get(crewId)?.slot;
    const idx = current ? SLOTS.findIndex((s) => s.slot === current) : -1;
    const next = SLOTS[(idx + 1) % SLOTS.length];
    setPosition(crewId, next.slot);
  }

  function onDragStart(e: React.DragEvent, crewId: string) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', crewId);
    setDraggedCrewId(crewId);
  }

  function onDragEnd() {
    setDraggedCrewId(null);
    setOverSlot(null);
  }

  function onDragOver(e: React.DragEvent, slot: CrewPositionSlot | null) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverSlot(slot);
  }

  function onDrop(e: React.DragEvent, slot: CrewPositionSlot | null) {
    e.preventDefault();
    const crewId = e.dataTransfer.getData('text/plain') || draggedCrewId;
    if (!crewId) return;
    if (slot === null) {
      clearPosition(crewId);
    } else {
      setPosition(crewId, slot);
    }
    setDraggedCrewId(null);
    setOverSlot(null);
  }

  const lanes = compact
    ? SLOTS.filter((s) =>
        ['talent-boat', 'camera-boat', 'shore', 'lunch'].includes(s.slot)
      )
    : SLOTS;

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
      <header className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="display-italic text-[16px] text-[color:var(--color-on-paper)] leading-tight flex items-center gap-2">
            <Users size={14} className="text-[color:var(--color-brass)]" />
            {t('crew.title')}
          </h3>
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            {compact ? t('crew.tap.cycle') : t('crew.drag.between')}
          </div>
        </div>
        <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums">
          {state.crew.length - unassignedCrew().length}/{state.crew.length} {t('crew.placed')}
        </span>
      </header>

      {/* Unassigned chip pool */}
      {unassignedCrew().length > 0 && (
        <div
          onDragOver={(e) => onDragOver(e, null)}
          onDrop={(e) => onDrop(e, null)}
          className={`mb-3 p-2 rounded-[3px] border-[0.5px] border-dashed transition-colors ${
            overSlot === null && draggedCrewId
              ? 'border-[color:var(--color-coral-deep)] bg-[color:var(--color-coral-deep)]/5'
              : 'border-[color:var(--color-border-paper)] bg-[color:var(--color-paper-deep)]/30'
          }`}
        >
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1.5">
            {t('crew.unassigned')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unassignedCrew().map((c) => (
              <CrewChip
                key={c.id}
                crew={c}
                position={undefined}
                draggable
                onDragStart={(e) => onDragStart(e, c.id)}
                onDragEnd={onDragEnd}
                onClick={() => cyclePosition(c.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div
        className={`grid gap-2 ${
          compact
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        }`}
      >
        {lanes.map((laneSpec) => {
          const crewInSlot = getCrewInSlot(laneSpec.slot);
          const isOver = overSlot === laneSpec.slot && draggedCrewId;
          return (
            <div
              key={laneSpec.slot}
              onDragOver={(e) => onDragOver(e, laneSpec.slot)}
              onDrop={(e) => onDrop(e, laneSpec.slot)}
              className={`min-h-[110px] rounded-[3px] p-2.5 transition-colors ${
                isOver
                  ? 'bg-[color:var(--color-brass)]/15 border-[0.5px] border-[color:var(--color-brass)]'
                  : 'bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <laneSpec.Icon
                  size={12}
                  className="text-[color:var(--color-on-paper-muted)] shrink-0"
                />
                <div className="display-italic text-[12px] text-[color:var(--color-on-paper)] leading-tight flex-1">
                  {t(laneSpec.labelKey)}
                </div>
                <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] tabular-nums">
                  {crewInSlot.length}
                </span>
              </div>

              {!compact && (
                <div className="prose-body italic text-[9px] text-[color:var(--color-on-paper-faint)] mb-2 leading-tight">
                  {t(laneSpec.descKey)}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {crewInSlot.map((c) => (
                  <CrewChip
                    key={c.id}
                    crew={c}
                    position={positionsByCrewId.get(c.id)}
                    draggable
                    onDragStart={(e) => onDragStart(e, c.id)}
                    onDragEnd={onDragEnd}
                    onClick={() => cyclePosition(c.id)}
                  />
                ))}
                {crewInSlot.length === 0 && (
                  <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)]">
                    —
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {compact && unassignedCrew().length > 0 && (
        <div className="mt-3 prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
          {unassignedCrew().length} {t('crew.unassigned.hint')}
        </div>
      )}
    </section>
  );
}

/* ---------- Crew chip ---------- */

function CrewChip({
  crew,
  position,
  draggable,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  crew: { id: string; name: string; role: string };
  position: CrewPosition | undefined;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onClick?: () => void;
}) {
  const initials = getInitials(crew.name);
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      title={`${crew.name} · ${crew.role}${position?.notes ? ' · ' + position.notes : ''}`}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[3px] bg-[color:var(--color-paper-deep)] hover:bg-[color:var(--color-brass)]/20 border-[0.5px] border-[color:var(--color-border-paper)] transition-colors cursor-grab active:cursor-grabbing"
    >
      <span className="w-5 h-5 rounded-full bg-[color:var(--color-brass)] text-[color:var(--color-paper-light)] flex items-center justify-center text-[9px] tabular-nums font-medium">
        {initials}
      </span>
      <span className="display-italic text-[11px] text-[color:var(--color-on-paper)] leading-tight">
        {firstName(crew.name)}
      </span>
    </button>
  );
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}
