import { useMemo, useRef, useState } from 'react';
import { Plus, X, Zap } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Milestone, MilestoneCategory, SchedulePhase } from '../../types';
import { newId } from '../episode/shared';
import { EditableText } from '../primitives/EditableText';
import { usePointerDrag } from '../../lib/usePointerDrag';

/* Enhanced Production Gantt — drag-edit + critical path + owner avatars +
   inline milestone add + click-to-edit popover.

   Drag interactions:
   - Drag bar edge (left/right) → resize phase
   - Drag bar middle → slide phase
   - Click bar → open edit popover (label · dates · owner · critical · delete)
   - Click day-axis → add milestone at that date
   - + Add phase button at the top
*/

const LANE_TINT: Record<number, { fill: string; stroke: string }> = {
  0: { fill: 'rgba(120,128,100,0.22)', stroke: 'rgba(120,128,100,0.85)' },
  1: { fill: 'rgba(201,169,97,0.22)', stroke: 'rgba(168,136,74,0.85)' },
  2: { fill: 'rgba(61,114,128,0.22)', stroke: 'rgba(44,85,96,0.85)' },
};

const CATEGORY_COLOR: Record<MilestoneCategory, string> = {
  havc: '#8C5C7A',
  'eu-media': '#993556',
  hrt: '#3D7280',
  festival: '#D4537E',
  shoot: '#C9A961',
  post: '#788064',
  internal: 'rgba(168,136,74,0.55)',
};

const PHASE_OVERRIDE: Record<string, number> = {
  ph1: 0, ph2: 1, ph3: 0, ph4: 1, ph5: 0, ph6: 1, ph7: 2, ph8: 1,
};

const W = 1280;
const H = 380;
const padL = 8;
const padR = 24;
const padT = 60;
const padB = 100;
const innerW = W - padL - padR;
const laneCount = 3;
const laneH = 36;
const laneGap = 10;

const minISO = '2026-04-01';
const maxISO = '2027-12-31';

interface DragState {
  phaseId: string;
  edge: 'left' | 'right' | 'both';
  startClientX: number;
  origStart: number;
  origEnd: number;
  /* live preview values (ms) */
  curStart: number;
  curEnd: number;
}

export function EnhancedProductionGantt() {
  const { state, dispatch } = useApp();
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  const min = new Date(minISO).getTime();
  const max = new Date(maxISO).getTime();
  const span = max - min;

  const xFor = (iso: string) =>
    padL + ((new Date(iso).getTime() - min) / span) * innerW;
  const xForMs = (ms: number) => padL + ((ms - min) / span) * innerW;
  const yForLane = (l: number) => padT + l * (laneH + laneGap);
  const msFromX = (x: number) => min + ((x - padL) / innerW) * span;

  const todayMs = Date.now();
  const todayInRange = todayMs >= min && todayMs <= max;
  const todayX = xForMs(todayMs);

  /* Months for grid */
  const months = useMemo(() => {
    const out: { iso: string; label: string; major: boolean }[] = [];
    for (let y = 2026; y <= 2027; y++) {
      for (let m = 0; m < 12; m++) {
        const d = new Date(Date.UTC(y, m, 1));
        out.push({
          iso: d.toISOString().slice(0, 10),
          label: d.toLocaleString('en-US', { month: 'short' }),
          major: m === 0 || m === 6,
        });
      }
    }
    return out;
  }, []);

  /* Milestone label de-overlap */
  const milestoneRowYBase = padT + laneCount * (laneH + laneGap) + 30;
  const sortedMilestones = useMemo(
    () =>
      [...state.milestones]
        .filter((m) => {
          const t = new Date(m.date).getTime();
          return t >= min && t <= max;
        })
        .sort((a, b) => (a.date < b.date ? -1 : 1)),
    [state.milestones, min, max]
  );
  const milestoneLayout = useMemo(() => {
    const MIN_GAP = 95;
    const out: Array<{ milestone: Milestone; x: number; row: number }> = [];
    const lastByRow = [-Infinity, -Infinity, -Infinity];
    for (const m of sortedMilestones) {
      const x = xFor(m.date);
      let row = 0;
      while (row < 3 && x - lastByRow[row] < MIN_GAP) row++;
      if (row >= 3) row = 0;
      lastByRow[row] = x;
      out.push({ milestone: m, x, row });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedMilestones]);

  /* Drag handlers — pixel deltas → ms.
     Phase 11: unified mouse + touch via usePointerDrag. */
  const pointerDrag = usePointerDrag<{
    phaseId: string;
    edge: 'left' | 'right' | 'both';
    origStart: number;
    origEnd: number;
  }>();

  function pxDeltaToMs(deltaPx: number): number {
    if (!svgWrapRef.current) return 0;
    const rect = svgWrapRef.current.getBoundingClientRect();
    if (rect.width === 0) return 0;
    const vbDelta = (deltaPx / rect.width) * W;
    return (vbDelta / innerW) * span;
  }

  function startDrag(
    phase: SchedulePhase,
    edge: 'left' | 'right' | 'both',
    e: React.MouseEvent | React.TouchEvent
  ) {
    e.stopPropagation();
    const origStart = new Date(phase.start).getTime();
    const origEnd = new Date(phase.end).getTime();
    /* Seed live preview state immediately so the visual updates from frame 0 */
    setDrag({
      phaseId: phase.id,
      edge,
      startClientX: 'touches' in e ? e.touches[0].clientX : e.clientX,
      origStart,
      origEnd,
      curStart: origStart,
      curEnd: origEnd,
    });
    pointerDrag.start(e, { phaseId: phase.id, edge, origStart, origEnd }, {
      onMove: (s) => {
        const deltaPx = s.curX - s.startX;
        const deltaMs = pxDeltaToMs(deltaPx);
        let newStart = s.data.origStart;
        let newEnd = s.data.origEnd;
        if (s.data.edge === 'left' || s.data.edge === 'both')
          newStart = s.data.origStart + deltaMs;
        if (s.data.edge === 'right' || s.data.edge === 'both')
          newEnd = s.data.origEnd + deltaMs;
        if (newEnd - newStart < 86_400_000) {
          if (s.data.edge === 'left') newStart = newEnd - 86_400_000;
          else newEnd = newStart + 86_400_000;
        }
        setDrag({
          phaseId: s.data.phaseId,
          edge: s.data.edge,
          startClientX: s.startX,
          origStart: s.data.origStart,
          origEnd: s.data.origEnd,
          curStart: newStart,
          curEnd: newEnd,
        });
      },
      onEnd: (s) => {
        const deltaPx = s.curX - s.startX;
        const deltaMs = pxDeltaToMs(deltaPx);
        let newStart = s.data.origStart;
        let newEnd = s.data.origEnd;
        if (s.data.edge === 'left' || s.data.edge === 'both')
          newStart = s.data.origStart + deltaMs;
        if (s.data.edge === 'right' || s.data.edge === 'both')
          newEnd = s.data.origEnd + deltaMs;
        const dayMs = 86_400_000;
        let snappedStart = Math.round(newStart / dayMs) * dayMs;
        let snappedEnd = Math.round(newEnd / dayMs) * dayMs;
        if (snappedEnd <= snappedStart) snappedEnd = snappedStart + dayMs;
        dispatch({
          type: 'UPDATE_PHASE',
          id: s.data.phaseId,
          patch: {
            start: new Date(snappedStart).toISOString().slice(0, 10),
            end: new Date(snappedEnd).toISOString().slice(0, 10),
          },
        });
        setDrag(null);
      },
      onCancel: () => setDrag(null),
    });
  }

  /* Inline phase add */
  function addPhase() {
    const phase: SchedulePhase = {
      id: newId('phase'),
      label: 'New phase',
      start: new Date(todayMs).toISOString().slice(0, 10),
      end: new Date(todayMs + 30 * 86_400_000).toISOString().slice(0, 10),
      lane: 0,
      color: 'rgba(120,128,100,0.5)',
    };
    dispatch({ type: 'ADD_PHASE', phase });
    setEditingId(phase.id);
  }

  function patchPhase(id: string, patch: Partial<SchedulePhase>) {
    dispatch({ type: 'UPDATE_PHASE', id, patch });
  }

  function deletePhase(id: string) {
    if (window.confirm('Delete this phase?')) {
      dispatch({ type: 'DELETE_PHASE', id });
      setEditingId(null);
    }
  }

  /* Milestone add */
  function addMilestone(label: string, iso: string, category?: MilestoneCategory) {
    const milestone: Milestone = {
      id: newId('ms'),
      label,
      date: iso,
      category,
    };
    dispatch({ type: 'ADD_MILESTONE', milestone });
    setShowAddMilestone(false);
  }

  /* Live phase list — apply drag preview */
  const phaseList = state.schedulePhases.map((p) => {
    if (drag && drag.phaseId === p.id) {
      return {
        ...p,
        start: new Date(drag.curStart).toISOString().slice(0, 10),
        end: new Date(drag.curEnd).toISOString().slice(0, 10),
      };
    }
    return p;
  });

  /* Toolbar */
  const editingPhase = editingId
    ? state.schedulePhases.find((p) => p.id === editingId)
    : null;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-baseline gap-2">
        <button
          type="button"
          onClick={addPhase}
          className="flex items-baseline gap-1 label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-2.5 py-1 rounded-[2px] transition-colors"
        >
          <Plus size={9} />
          add phase
        </button>
        <button
          type="button"
          onClick={() => setShowAddMilestone(true)}
          className="flex items-baseline gap-1 label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-paper)] hover:border-[color:var(--color-brass)] px-2.5 py-1 rounded-[2px] transition-colors"
        >
          <Plus size={9} />
          add milestone
        </button>
        <span className="ml-auto prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
          drag bar edges to resize · drag middle to slide · click for detail
        </span>
      </div>

      {/* Gantt SVG */}
      <div
        ref={svgWrapRef}
        className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 pt-4 pb-3"
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ maxHeight: 400, cursor: drag ? 'grabbing' : 'default' }}
        >
          {/* Year backgrounds */}
          <rect
            x={padL}
            y={padT - 4}
            width={xFor('2027-01-01') - padL}
            height={H - padT - padB + 4}
            fill="rgba(14,30,54,0.02)"
          />

          {/* Month gridlines */}
          {months.map((m) => {
            const x = xFor(m.iso);
            if (x < padL || x > padL + innerW) return null;
            return (
              <line
                key={m.iso}
                x1={x}
                x2={x}
                y1={padT - 4}
                y2={H - padB + 4}
                stroke={m.major ? 'rgba(14,30,54,0.18)' : 'rgba(14,30,54,0.06)'}
                strokeWidth={0.5}
              />
            );
          })}

          {/* Year labels */}
          <text
            x={xFor('2026-07-01')}
            y={28}
            textAnchor="middle"
            className="fill-[color:var(--color-brass-deep)]"
            fontFamily="Fraunces, Georgia, serif"
            fontStyle="italic"
            fontSize={20}
          >
            2026
          </text>
          <text
            x={xFor('2027-07-01')}
            y={28}
            textAnchor="middle"
            className="fill-[color:var(--color-brass-deep)]"
            fontFamily="Fraunces, Georgia, serif"
            fontStyle="italic"
            fontSize={20}
          >
            2027
          </text>

          {/* Month tick labels */}
          {months.map((m) => {
            const x = xFor(m.iso);
            if (x < padL + 4 || x > padL + innerW - 4) return null;
            return (
              <text
                key={m.iso + '-tick'}
                x={x + 2}
                y={padT - 8}
                className="fill-[color:var(--color-on-paper-faint)]"
                fontFamily="Inter, system-ui, sans-serif"
                fontSize={9}
                letterSpacing={0.8}
              >
                {m.label.toLowerCase()}
              </text>
            );
          })}

          {/* Phase bars */}
          {phaseList.map((p) => {
            const lane = PHASE_OVERRIDE[p.id] ?? p.lane;
            const tint = LANE_TINT[lane] ?? LANE_TINT[0];
            const x = xFor(p.start);
            const w = Math.max(20, xFor(p.end) - x);
            const y = yForLane(lane);
            const isHover = hoveredId === p.id;
            const isCritical = p.critical;

            const startMs = new Date(p.start).getTime();
            const endMs = new Date(p.end).getTime();
            const phaseSpan = endMs - startMs || 1;
            const progress = Math.max(0, Math.min(1, (todayMs - startMs) / phaseSpan));

            /* Owner avatar */
            const owner = p.ownerId ? state.crew.find((c) => c.id === p.ownerId) : null;
            const monogram = owner ? owner.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase() : '';

            return (
              <g
                key={p.id}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Bar background — middle drag (slide) */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={laneH}
                  rx={2}
                  ry={2}
                  fill={tint.fill}
                  stroke={isCritical ? 'var(--color-coral)' : tint.stroke}
                  strokeWidth={isCritical ? 1.5 : isHover ? 1 : 0.5}
                  style={{ cursor: 'grab' }}
                  onMouseDown={(e) => startDrag(p, 'both', e)}
                  onTouchStart={(e) => startDrag(p, 'both', e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!drag) setEditingId(p.id);
                  }}
                />
                {/* Progress overlay */}
                {progress > 0 && (
                  <rect
                    x={x}
                    y={y}
                    width={w * progress}
                    height={laneH}
                    rx={2}
                    ry={2}
                    fill={tint.stroke}
                    opacity={0.32}
                    pointerEvents="none"
                  />
                )}
                {/* Left edge handle */}
                <rect
                  x={x - 4}
                  y={y}
                  width={8}
                  height={laneH}
                  fill="transparent"
                  style={{ cursor: 'ew-resize' }}
                  onMouseDown={(e) => startDrag(p, 'left', e)}
                  onTouchStart={(e) => startDrag(p, 'left', e)}
                />
                {/* Right edge handle */}
                <rect
                  x={x + w - 4}
                  y={y}
                  width={8}
                  height={laneH}
                  fill="transparent"
                  style={{ cursor: 'ew-resize' }}
                  onMouseDown={(e) => startDrag(p, 'right', e)}
                  onTouchStart={(e) => startDrag(p, 'right', e)}
                />
                {/* Edge visual indicators when hovered */}
                {isHover && (
                  <>
                    <line
                      x1={x}
                      x2={x}
                      y1={y + 4}
                      y2={y + laneH - 4}
                      stroke="var(--color-brass)"
                      strokeWidth={1.5}
                      pointerEvents="none"
                    />
                    <line
                      x1={x + w}
                      x2={x + w}
                      y1={y + 4}
                      y2={y + laneH - 4}
                      stroke="var(--color-brass)"
                      strokeWidth={1.5}
                      pointerEvents="none"
                    />
                  </>
                )}
                {/* Owner avatar */}
                {monogram && (
                  <g pointerEvents="none">
                    <circle
                      cx={x + 14}
                      cy={y + laneH / 2}
                      r={9}
                      fill="var(--color-paper-light)"
                      stroke="var(--color-brass)"
                      strokeWidth={1}
                    />
                    <text
                      x={x + 14}
                      y={y + laneH / 2 + 3}
                      textAnchor="middle"
                      fontFamily="Inter, system-ui, sans-serif"
                      fontSize={9}
                      fontWeight={500}
                      fill="var(--color-brass-deep)"
                    >
                      {monogram}
                    </text>
                  </g>
                )}
                {/* Label */}
                <text
                  x={x + (monogram ? 30 : 10)}
                  y={y + laneH / 2 + 5}
                  fontFamily="Fraunces, Georgia, serif"
                  fontStyle="italic"
                  fontSize={14}
                  className="fill-[color:var(--color-on-paper)]"
                  pointerEvents="none"
                >
                  {p.label}
                </text>
                {/* Critical indicator */}
                {isCritical && (
                  <g pointerEvents="none">
                    <Zap
                      x={x + w - 16}
                      y={y + 4}
                      size={10}
                      className="text-[color:var(--color-coral-deep)]"
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* Milestones */}
          {milestoneLayout.map(({ milestone: m, x, row }) => {
            const color = m.category ? CATEGORY_COLOR[m.category] : 'rgba(168,136,74,0.55)';
            const labelY = milestoneRowYBase + row * 18;
            return (
              <g
                key={m.id}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  if (window.confirm(`Delete milestone "${m.label}"?`)) {
                    dispatch({ type: 'DELETE_MILESTONE', id: m.id });
                  }
                }}
              >
                <line
                  x1={x}
                  x2={x}
                  y1={padT - 6}
                  y2={labelY - 8}
                  stroke={color}
                  strokeOpacity={0.5}
                  strokeWidth={0.5}
                  strokeDasharray="2 3"
                />
                <Diamond x={x} y={milestoneRowYBase - 12} color={color} />
                <line
                  x1={x}
                  x2={x}
                  y1={milestoneRowYBase - 6}
                  y2={labelY - 6}
                  stroke={color}
                  strokeOpacity={0.4}
                  strokeWidth={0.5}
                />
                <text
                  x={x}
                  y={labelY}
                  textAnchor="middle"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontSize={9.5}
                  letterSpacing={0.6}
                  className="fill-[color:var(--color-on-paper-muted)]"
                >
                  {m.label}
                </text>
              </g>
            );
          })}

          {/* Today indicator */}
          {todayInRange && (
            <g>
              <line
                x1={todayX}
                x2={todayX}
                y1={padT - 12}
                y2={H - padB}
                stroke="var(--color-coral)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={todayX + 5}
                y={padT - 16}
                className="fill-[color:var(--color-coral-deep)]"
                fontFamily="Inter, system-ui, sans-serif"
                fontSize={9}
                letterSpacing={1.5}
              >
                TODAY
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Edit popover */}
      {editingPhase && (
        <PhaseEditor
          phase={editingPhase}
          onPatch={(p) => patchPhase(editingPhase.id, p)}
          onDelete={() => deletePhase(editingPhase.id)}
          onClose={() => setEditingId(null)}
        />
      )}

      {/* Add milestone modal */}
      {showAddMilestone && (
        <MilestoneAdd
          onAdd={addMilestone}
          onCancel={() => setShowAddMilestone(false)}
        />
      )}

      {/* Drag readout */}
      {drag && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-[color:var(--color-chrome)]/90 backdrop-blur-sm text-[color:var(--color-on-chrome)] px-4 py-2 rounded-[3px] label-caps tracking-[0.10em] text-[11px] z-50 pointer-events-none">
          {new Date(drag.curStart).toISOString().slice(0, 10)} → {new Date(drag.curEnd).toISOString().slice(0, 10)} ·{' '}
          {Math.round((drag.curEnd - drag.curStart) / 86_400_000)} days
        </div>
      )}
    </div>
  );
}

function Diamond({ x, y, color }: { x: number; y: number; color: string }) {
  const s = 5;
  return (
    <polygon
      points={`${x},${y - s} ${x + s},${y} ${x},${y + s} ${x - s},${y}`}
      fill={color}
      stroke="rgba(14,30,54,0.5)"
      strokeWidth={0.5}
    />
  );
}

/* ---------- Phase editor popover ---------- */

function PhaseEditor({
  phase,
  onPatch,
  onDelete,
  onClose,
}: {
  phase: SchedulePhase;
  onPatch: (p: Partial<SchedulePhase>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { state } = useApp();
  return (
    <div className="fixed inset-0 z-40 bg-[color:var(--color-chrome)]/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] w-full max-w-[480px] overflow-hidden">
        <header className="px-5 py-3 bg-[color:var(--color-paper)] border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Phase
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper)]"
          >
            <X size={14} />
          </button>
        </header>
        <div className="px-5 py-4 space-y-4">
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">label</div>
            <EditableText
              value={phase.label}
              onChange={(v) => onPatch({ label: v })}
              className="display-italic text-[18px] text-[color:var(--color-on-paper)] block w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">start</div>
              <input
                type="date"
                value={phase.start}
                onChange={(e) => onPatch({ start: e.target.value })}
                className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-0.5 w-full"
              />
            </div>
            <div>
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">end</div>
              <input
                type="date"
                value={phase.end}
                onChange={(e) => onPatch({ end: e.target.value })}
                className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-0.5 w-full"
              />
            </div>
          </div>
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">owner</div>
            <select
              value={phase.ownerId ?? ''}
              onChange={(e) => onPatch({ ownerId: e.target.value || undefined })}
              className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-0.5"
            >
              <option value="">— unassigned —</option>
              {state.crew.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.role}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-baseline gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!phase.critical}
              onChange={(e) => onPatch({ critical: e.target.checked })}
              className="w-3.5 h-3.5"
            />
            <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]">
              On critical path
            </span>
          </label>
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">notes</div>
            <EditableText
              value={phase.notes ?? ''}
              onChange={(v) => onPatch({ notes: v || undefined })}
              placeholder="Planning notes · dependencies · risks"
              multiline
              rows={2}
              className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] block w-full leading-relaxed"
            />
          </div>
          <div className="flex items-baseline justify-end gap-2 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            <button
              type="button"
              onClick={onDelete}
              className="label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)]"
            >
              delete phase
            </button>
            <button
              type="button"
              onClick={onClose}
              className="label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-4 py-1.5 rounded-[2px] transition-colors ml-2"
            >
              done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Milestone add modal ---------- */

function MilestoneAdd({
  onAdd,
  onCancel,
}: {
  onAdd: (label: string, iso: string, category?: MilestoneCategory) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<MilestoneCategory | ''>('');

  return (
    <div className="fixed inset-0 z-40 bg-[color:var(--color-chrome)]/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] w-full max-w-[400px] overflow-hidden">
        <header className="px-5 py-3 bg-[color:var(--color-paper)] border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            New milestone
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper)]"
          >
            <X size={14} />
          </button>
        </header>
        <div className="px-5 py-4 space-y-3">
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">label</div>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. HAVC dev decision"
              className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none display-italic text-[16px] text-[color:var(--color-on-paper)] py-1"
              autoFocus
            />
          </div>
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">date</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-0.5"
            />
          </div>
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">category</div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MilestoneCategory | '')}
              className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-0.5"
            >
              <option value="">— none —</option>
              <option value="havc">HAVC</option>
              <option value="eu-media">EU MEDIA</option>
              <option value="hrt">HRT</option>
              <option value="festival">Festival</option>
              <option value="shoot">Shoot</option>
              <option value="post">Post</option>
              <option value="internal">Internal</option>
            </select>
          </div>
          <div className="flex items-baseline justify-end gap-2 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            <button
              type="button"
              onClick={onCancel}
              className="label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)]"
            >
              cancel
            </button>
            <button
              type="button"
              disabled={!label.trim()}
              onClick={() => onAdd(label.trim(), date, category || undefined)}
              className="label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] disabled:opacity-30 px-4 py-1.5 rounded-[2px] transition-colors"
            >
              add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
