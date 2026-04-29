import { useMemo, useState } from 'react';
import {
  Anchor,
  Calendar,
  Plus,
  Sailboat,
  Ship,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import type { StringKey } from '../../i18n';
import type { BoatRole, BoatWaypoint } from '../../types';

/* ---------- Two-Boat Timeline (Phase 12) ----------

   Talent boat + camera boat (+ optional support) on a synchronised time
   axis. Each boat is a horizontal lane. Each waypoint is a chip:
   {time + location/label}. When two boats are at the same location at
   the same hour, a vertical brass tie-line draws between them — the
   rendezvous moment, where the hero shot happens.

   Why it matters: docs are blocked when boats miss each other. This
   timeline forces the producer (Tomislav) to plan the meeting before
   arriving and finding nobody. Captain Luka on talent boat, Tom on
   camera boat — they have to land at the same anchorage at the same
   30-min window to roll together.

   Used in:
     · ScheduleView (Two boats tab)        per-shoot-day editor
     · TodayTab (Production)               compact read-only embed */

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06..22
const HOUR_W = 38;
const LANE_H = 56;
const LABEL_W = 96;

const ROLES: { role: BoatRole; labelKey: StringKey; descKey: StringKey; Icon: typeof Sailboat }[] = [
  { role: 'talent',  labelKey: 'twoboat.talent',  descKey: 'twoboat.boat.talent.desc',  Icon: Sailboat },
  { role: 'camera',  labelKey: 'twoboat.camera',  descKey: 'twoboat.boat.camera.desc',  Icon: Ship },
  { role: 'support', labelKey: 'twoboat.support', descKey: 'twoboat.boat.support.desc', Icon: Anchor },
];

interface Props {
  date: string;          // ISO YYYY-MM-DD
  compact?: boolean;
}

export function TwoBoatTimeline({ date, compact = false }: Props) {
  const { state, dispatch } = useApp();
  const t = useT();
  const [editing, setEditing] = useState<BoatWaypoint | null>(null);
  const [drafting, setDrafting] = useState<{ role: BoatRole; time: string } | null>(null);

  const waypoints = useMemo(
    () => state.boatWaypoints.filter((w) => w.date === date),
    [state.boatWaypoints, date]
  );

  /* Group by hour for tie-line detection (rendezvous). */
  const rendezvous = useMemo(() => {
    const map = new Map<string, Set<BoatRole>>();
    waypoints.forEach((w) => {
      const hour = parseInt(w.time.split(':')[0], 10);
      if (!w.locationId) return;
      const key = `${hour}-${w.locationId}`;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)?.add(w.boatRole);
    });
    /* Only keep entries with 2+ different boats. */
    const result = new Map<string, { hour: number; locationId: string }>();
    map.forEach((roles, key) => {
      if (roles.size >= 2) {
        const [hour, locationId] = key.split('-');
        result.set(key, { hour: Number(hour), locationId });
      }
    });
    return Array.from(result.values());
  }, [waypoints]);

  function addWaypoint(role: BoatRole, time: string) {
    setDrafting({ role, time });
  }

  function commitDraft(patch: Partial<BoatWaypoint>) {
    if (!drafting) return;
    const wp: BoatWaypoint = {
      id: `wp-${Math.random().toString(36).slice(2, 8)}`,
      date,
      boatRole: drafting.role,
      time: drafting.time,
      arriveOrDepart: 'arrive',
      ...patch,
    };
    dispatch({ type: 'ADD_BOAT_WAYPOINT', waypoint: wp });
    setDrafting(null);
  }

  function patch(id: string, p: Partial<BoatWaypoint>) {
    dispatch({ type: 'UPDATE_BOAT_WAYPOINT', id, patch: p });
  }

  function remove(id: string) {
    if (!window.confirm('Remove this waypoint?')) return;
    dispatch({ type: 'DELETE_BOAT_WAYPOINT', id });
    setEditing(null);
  }

  const stripWidth = LABEL_W + HOURS.length * HOUR_W;
  const lanes = compact
    ? ROLES.filter((r) => r.role !== 'support')
    : ROLES;

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
      <header className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="display-italic text-[16px] text-[color:var(--color-on-paper)] leading-tight flex items-center gap-2">
            <Sailboat size={14} className="text-[color:var(--color-brass)]" />
            {t('twoboat.title')}
          </h3>
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            {fmtDate(date)} · {t('twoboat.click.hour')}
          </div>
        </div>
        {rendezvous.length > 0 && (
          <span className="prose-body italic text-[11px] text-[color:var(--color-brass-deep)] tabular-nums">
            {rendezvous.length} {t('twoboat.rendezvous.planned')}
          </span>
        )}
      </header>

      <div className="overflow-x-auto -mx-2 px-2">
        <svg
          width={stripWidth}
          height={lanes.length * LANE_H + 32}
          className="block min-w-full"
        >
          {/* hour ticks */}
          {HOURS.map((h, i) => (
            <text
              key={`h-${h}`}
              x={LABEL_W + i * HOUR_W + HOUR_W / 2}
              y={14}
              textAnchor="middle"
              className="text-[9px] tabular-nums fill-[color:var(--color-on-paper-muted)]"
            >
              {h.toString().padStart(2, '0')}
            </text>
          ))}

          {/* rendezvous tie-lines */}
          {rendezvous.map((r, idx) => {
            const i = HOURS.indexOf(r.hour);
            if (i < 0) return null;
            const x = LABEL_W + i * HOUR_W + HOUR_W / 2;
            return (
              <line
                key={`r-${idx}`}
                x1={x}
                x2={x}
                y1={24}
                y2={24 + lanes.length * LANE_H - 8}
                stroke="var(--color-brass)"
                strokeWidth={2}
                strokeDasharray="3 2"
                opacity={0.6}
              />
            );
          })}

          {/* lanes */}
          {lanes.map((laneSpec, laneIdx) => {
            const yTop = 24 + laneIdx * LANE_H;
            const laneWaypoints = waypoints
              .filter((w) => w.boatRole === laneSpec.role)
              .sort((a, b) => a.time.localeCompare(b.time));
            return (
              <g key={laneSpec.role}>
                {/* lane label */}
                <foreignObject x={4} y={yTop + 4} width={LABEL_W - 12} height={LANE_H - 8}>
                  <div className="flex items-start gap-1.5 pt-1">
                    <laneSpec.Icon
                      size={12}
                      className="text-[color:var(--color-on-paper-muted)] mt-0.5 shrink-0"
                    />
                    <div>
                      <div className="display-italic text-[12px] text-[color:var(--color-on-paper)] leading-tight">
                        {t(laneSpec.labelKey)}
                      </div>
                      {!compact && (
                        <div className="prose-body italic text-[9px] text-[color:var(--color-on-paper-faint)] leading-tight mt-0.5">
                          {t(laneSpec.descKey)}
                        </div>
                      )}
                    </div>
                  </div>
                </foreignObject>

                {/* lane background */}
                <rect
                  x={LABEL_W}
                  y={yTop}
                  width={HOURS.length * HOUR_W}
                  height={LANE_H - 8}
                  fill="var(--color-paper-deep)"
                  opacity={0.4}
                />

                {/* hour gridlines + click zones */}
                {HOURS.map((h, i) => (
                  <g key={`g-${laneSpec.role}-${h}`}>
                    <line
                      x1={LABEL_W + i * HOUR_W}
                      x2={LABEL_W + i * HOUR_W}
                      y1={yTop}
                      y2={yTop + LANE_H - 8}
                      stroke="var(--color-border-paper)"
                      strokeWidth={0.5}
                      opacity={0.5}
                    />
                    {!compact && (
                      <foreignObject
                        x={LABEL_W + i * HOUR_W + 2}
                        y={yTop + 2}
                        width={HOUR_W - 4}
                        height={LANE_H - 12}
                      >
                        <button
                          type="button"
                          onClick={() => addWaypoint(laneSpec.role, `${h.toString().padStart(2, '0')}:00`)}
                          className="w-full h-full opacity-0 hover:opacity-100 hover:bg-[color:var(--color-brass)]/10 transition-opacity rounded-[2px] flex items-center justify-center"
                          aria-label={`Add waypoint at ${h}:00`}
                        >
                          <Plus
                            size={10}
                            className="text-[color:var(--color-brass)]"
                          />
                        </button>
                      </foreignObject>
                    )}
                  </g>
                ))}

                {/* waypoints */}
                {laneWaypoints.map((w) => {
                  const hour = parseInt(w.time.split(':')[0], 10);
                  const minute = parseInt(w.time.split(':')[1] ?? '0', 10);
                  const i = HOURS.indexOf(hour);
                  if (i < 0) return null;
                  const x = LABEL_W + i * HOUR_W + (minute / 60) * HOUR_W;
                  const loc = w.locationId
                    ? state.locations.find((l) => l.id === w.locationId)
                    : null;
                  const label = loc?.label ?? w.customLabel ?? '?';
                  const tone =
                    w.arriveOrDepart === 'arrive'
                      ? 'var(--color-success)'
                      : w.arriveOrDepart === 'depart'
                      ? 'var(--color-coral-deep)'
                      : 'var(--color-on-paper-muted)';
                  return (
                    <g
                      key={w.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setEditing(w)}
                    >
                      <circle
                        cx={x}
                        cy={yTop + (LANE_H - 8) / 2}
                        r={5}
                        fill={tone}
                        stroke="var(--color-paper-light)"
                        strokeWidth={1.5}
                      />
                      <foreignObject
                        x={x + 8}
                        y={yTop + (LANE_H - 8) / 2 - 16}
                        width={Math.min(140, stripWidth - x - 12)}
                        height={32}
                      >
                        <div className="leading-tight">
                          <div className="display-italic text-[11px] text-[color:var(--color-on-paper)] truncate">
                            {label}
                          </div>
                          <div className="prose-body italic text-[9px] text-[color:var(--color-on-paper-muted)] tabular-nums">
                            {w.time} · {w.arriveOrDepart}
                          </div>
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {!compact && waypoints.length === 0 && (
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-3">
          {t('twoboat.empty')}
        </div>
      )}

      {(editing || drafting) && (
        <WaypointEditor
          waypoint={editing}
          drafting={drafting}
          locations={state.locations}
          onPatch={(p) => editing && patch(editing.id, p)}
          onCommit={commitDraft}
          onRemove={() => editing && remove(editing.id)}
          onClose={() => {
            setEditing(null);
            setDrafting(null);
          }}
        />
      )}

      {/* Crew assignment helper */}
      {!compact && rendezvous.length > 0 && (
        <RendezvousSummary
          rendezvous={rendezvous}
          waypoints={waypoints}
          locations={state.locations}
        />
      )}
    </section>
  );
}

/* ---------- Editor / draft modal ---------- */

function WaypointEditor({
  waypoint,
  drafting,
  locations,
  onPatch,
  onCommit,
  onRemove,
  onClose,
}: {
  waypoint: BoatWaypoint | null;
  drafting: { role: BoatRole; time: string } | null;
  locations: { id: string; label: string }[];
  onPatch: (p: Partial<BoatWaypoint>) => void;
  onCommit: (p: Partial<BoatWaypoint>) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const isDraft = !waypoint;
  const [draft, setDraft] = useState<Partial<BoatWaypoint>>({});

  function update(p: Partial<BoatWaypoint>) {
    if (waypoint) {
      onPatch(p);
    } else {
      setDraft({ ...draft, ...p });
    }
  }

  const value = waypoint ?? { ...drafting, ...draft } as Partial<BoatWaypoint>;

  return (
    <div className="fixed inset-0 z-50 bg-[color:var(--color-chrome)]/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] w-full max-w-[480px] overflow-hidden">
        <header className="px-5 py-3 bg-[color:var(--color-paper)] border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            {isDraft ? t('twoboat.editor.new') : t('twoboat.editor.edit')}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
                {t('twoboat.field.time')}
              </div>
              <input
                type="time"
                value={value.time ?? '08:00'}
                onChange={(e) => update({ time: e.target.value })}
                className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
              />
            </div>
            <div>
              <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
                {t('twoboat.field.action')}
              </div>
              <select
                value={value.arriveOrDepart ?? 'arrive'}
                onChange={(e) =>
                  update({
                    arriveOrDepart: e.target.value as BoatWaypoint['arriveOrDepart'],
                  })
                }
                className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
              >
                <option value="arrive">{t('twoboat.action.arrive')}</option>
                <option value="depart">{t('twoboat.action.depart')}</option>
                <option value="pass">{t('twoboat.action.pass')}</option>
              </select>
            </div>
          </div>

          <div>
            <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
              {t('twoboat.field.location')}
            </div>
            <select
              value={value.locationId ?? ''}
              onChange={(e) => update({ locationId: e.target.value || undefined })}
              className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
            >
              <option value="">{t('twoboat.field.location.pick')}</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
              {t('twoboat.field.custom.label')}
            </div>
            <input
              type="text"
              value={value.customLabel ?? ''}
              onChange={(e) => update({ customLabel: e.target.value || undefined })}
              placeholder={t('twoboat.field.custom.placeholder')}
              className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
            />
          </div>

          <div>
            <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
              {t('common.notes')}
            </div>
            <textarea
              value={value.notes ?? ''}
              onChange={(e) => update({ notes: e.target.value || undefined })}
              rows={2}
              className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)] resize-none"
              placeholder={t('twoboat.field.notes.placeholder')}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            {isDraft ? (
              <span />
            ) : (
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[3px] text-[11px] text-[color:var(--color-coral-deep)] hover:bg-[color:var(--color-coral-deep)]/10 transition-colors"
              >
                <Trash2 size={11} />
                <span className="prose-body italic">delete</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] px-2 py-1"
              >
                close
              </button>
              {isDraft && (
                <button
                  type="button"
                  onClick={() => onCommit(draft)}
                  className="px-3 py-1.5 rounded-[3px] bg-[color:var(--color-brass)] text-[color:var(--color-paper)] text-[12px] hover:bg-[color:var(--color-brass-deep)] transition-colors display-italic"
                >
                  add waypoint
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Rendezvous summary ---------- */

function RendezvousSummary({
  rendezvous,
  waypoints,
  locations,
}: {
  rendezvous: { hour: number; locationId: string }[];
  waypoints: BoatWaypoint[];
  locations: { id: string; label: string }[];
}) {
  return (
    <div className="mt-4 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
      <div className="display-italic text-[13px] text-[color:var(--color-on-paper)] mb-2 flex items-center gap-2">
        <Users size={11} className="text-[color:var(--color-brass)]" />
        Rendezvous moments
      </div>
      <ul className="space-y-1.5">
        {rendezvous.map((r, idx) => {
          const loc = locations.find((l) => l.id === r.locationId);
          const involved = waypoints
            .filter(
              (w) =>
                w.locationId === r.locationId &&
                parseInt(w.time.split(':')[0], 10) === r.hour
            )
            .map((w) => `${w.boatRole}@${w.time}`)
            .join(' · ');
          return (
            <li
              key={idx}
              className="flex items-baseline justify-between prose-body italic text-[12px]"
            >
              <span className="text-[color:var(--color-on-paper)]">
                <span className="tabular-nums text-[color:var(--color-brass-deep)] mr-1.5">
                  {r.hour.toString().padStart(2, '0')}:00
                </span>
                {loc?.label ?? r.locationId}
              </span>
              <span className="text-[color:var(--color-on-paper-muted)] tabular-nums text-[10px]">
                {involved}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- helpers ---------- */

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

/* ---------- Calendar import shim ---------- */
/* eslint-disable @typescript-eslint/no-unused-vars */
const _unusedCalendar = Calendar;
/* eslint-enable @typescript-eslint/no-unused-vars */
