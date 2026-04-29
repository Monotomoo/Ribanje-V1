import { useMemo, useState } from 'react';
import {
  Battery,
  BatteryLow,
  HardDrive,
  Radio,
  RadioTower,
  RadioReceiver,
  RefreshCw,
  Camera,
  Settings2,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import type {
  CameraSlot,
  CameraStatus,
  CameraSyncStatus,
} from '../../types';

/* ---------- Camera Status Strip (Phase 12) ----------

   5-camera at-a-glance grid. RYG tiles big enough to read in sun on a
   wet iPad. Per camera:
     • Battery %
     • Card %
     • Sync status (synced · drift · offline)
     • White balance (K)
     • ISO
     • Operator (resolved from crew)

   Each tile expands into a quick-edit pad on tap. Updated by whoever's
   nearest the camera — usually a crew member in the boat doing a 30-second
   round-trip across cameras every 20 minutes.

   Used in:
     · DOPView (Cameras tab)         full grid
     · ProductionView TodayTab       compact strip
     · LiveRollCockpit (future)      embedded near record button */

const SLOTS: { slot: CameraSlot; label: string; description: string }[] = [
  { slot: 'A',          label: 'Cam A',  description: 'Primary · talent boat' },
  { slot: 'B',          label: 'Cam B',  description: 'Secondary · camera boat' },
  { slot: 'drone',      label: 'Drone',  description: 'Aerial · DJI' },
  { slot: 'underwater', label: 'U/W',    description: 'Underwater · GoPro / Action' },
  { slot: 'crash',      label: 'Crash',  description: 'Crash cam · sacrificial' },
];

interface Props {
  date: string;          // ISO YYYY-MM-DD
  compact?: boolean;     // smaller tiles, no operator/notes
}

export function CameraStatusStrip({ date, compact = false }: Props) {
  const { state, dispatch } = useApp();
  const t = useT();
  const [openSlot, setOpenSlot] = useState<CameraSlot | null>(null);

  const statusBySlot = useMemo(() => {
    const m = new Map<CameraSlot, CameraStatus>();
    state.cameraStatuses
      .filter((s) => s.date === date)
      .forEach((s) => m.set(s.slot, s));
    return m;
  }, [state.cameraStatuses, date]);

  function upsert(slot: CameraSlot, patch: Partial<CameraStatus>) {
    const existing = statusBySlot.get(slot);
    const id =
      existing?.id ??
      `cs-${date}-${slot}-${Math.random().toString(36).slice(2, 6)}`;
    dispatch({
      type: 'UPSERT_CAMERA_STATUS',
      status: {
        id,
        slot,
        date,
        operatorId: existing?.operatorId,
        batteryPct: existing?.batteryPct,
        cardPct: existing?.cardPct,
        cardGbRemaining: existing?.cardGbRemaining,
        syncStatus: existing?.syncStatus,
        isoValue: existing?.isoValue,
        wbKelvin: existing?.wbKelvin,
        rigConfigId: existing?.rigConfigId,
        notes: existing?.notes,
        updatedAt: new Date().toISOString(),
        ...patch,
      },
    });
  }

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
      <header className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="display-italic text-[16px] text-[color:var(--color-on-paper)] leading-tight">
            {t('cam.title')}
          </h3>
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            {t('cam.tap.tile.update')}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpenSlot(null)}
          className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] transition-colors"
        >
          {openSlot ? t('common.collapse') : null}
        </button>
      </header>

      <div
        className={`grid gap-2 ${
          compact
            ? 'grid-cols-5'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
        }`}
      >
        {SLOTS.map(({ slot, label, description }) => {
          const status = statusBySlot.get(slot);
          const open = openSlot === slot;
          return (
            <button
              key={slot}
              type="button"
              onClick={() => setOpenSlot(open ? null : slot)}
              className={`text-left rounded-[3px] border-[0.5px] transition-all ${
                open
                  ? 'border-[color:var(--color-brass)] bg-[color:var(--color-brass)]/8'
                  : 'border-[color:var(--color-border-paper)] bg-[color:var(--color-paper)] hover:bg-[color:var(--color-paper-deep)]/40'
              } ${compact ? 'p-2 min-h-[80px]' : 'p-3 min-h-[140px]'}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
                  {label}
                </div>
                <Camera
                  size={compact ? 11 : 13}
                  className="text-[color:var(--color-on-paper-muted)]"
                />
              </div>

              {!compact && (
                <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mb-2 leading-tight">
                  {description}
                </div>
              )}

              <div className={`grid grid-cols-2 ${compact ? 'gap-1' : 'gap-2'}`}>
                <BatteryTile pct={status?.batteryPct} compact={compact} />
                <CardTile pct={status?.cardPct} compact={compact} />
                <SyncTile status={status?.syncStatus} compact={compact} />
                <WbTile k={status?.wbKelvin} compact={compact} />
              </div>

              {!compact && status?.updatedAt && (
                <div className="prose-body italic text-[9px] text-[color:var(--color-on-paper-faint)] mt-2 tabular-nums">
                  {fmtRelative(status.updatedAt)}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {openSlot && (
        <SlotEditor
          slot={openSlot}
          status={statusBySlot.get(openSlot)}
          onPatch={(patch) => upsert(openSlot, patch)}
          crew={state.crew}
        />
      )}
    </section>
  );
}

/* ---------- Status tiles ---------- */

function tileTone(pct: number | undefined, low: number, mid: number) {
  if (pct == null) return 'muted';
  if (pct <= low) return 'critical';
  if (pct <= mid) return 'warn';
  return 'ok';
}

const TONE_BG: Record<string, string> = {
  ok: 'bg-[color:var(--color-success)]/15 text-[color:var(--color-on-paper)]',
  warn: 'bg-[color:var(--color-brass)]/20 text-[color:var(--color-on-paper)]',
  critical: 'bg-[color:var(--color-coral-deep)]/20 text-[color:var(--color-coral-deep)]',
  muted: 'bg-[color:var(--color-paper-deep)]/40 text-[color:var(--color-on-paper-faint)]',
};

function BatteryTile({ pct, compact }: { pct?: number; compact?: boolean }) {
  const tone = tileTone(pct, 20, 50);
  const Icon = pct != null && pct <= 20 ? BatteryLow : Battery;
  return (
    <div
      className={`rounded-[3px] flex items-center gap-1 ${TONE_BG[tone]} ${
        compact ? 'px-1.5 py-0.5' : 'px-2 py-1'
      }`}
    >
      <Icon size={compact ? 9 : 11} />
      <span
        className={`tabular-nums ${
          compact ? 'text-[9px]' : 'text-[11px]'
        }`}
      >
        {pct != null ? `${pct}%` : '—'}
      </span>
    </div>
  );
}

function CardTile({ pct, compact }: { pct?: number; compact?: boolean }) {
  /* High card % is bad (full). Invert the tone calc: low used = ok, high used = bad. */
  const usedTone =
    pct == null
      ? 'muted'
      : pct >= 80
      ? 'critical'
      : pct >= 60
      ? 'warn'
      : 'ok';
  return (
    <div
      className={`rounded-[3px] flex items-center gap-1 ${TONE_BG[usedTone]} ${
        compact ? 'px-1.5 py-0.5' : 'px-2 py-1'
      }`}
    >
      <HardDrive size={compact ? 9 : 11} />
      <span
        className={`tabular-nums ${
          compact ? 'text-[9px]' : 'text-[11px]'
        }`}
      >
        {pct != null ? `${pct}%` : '—'}
      </span>
    </div>
  );
}

function SyncTile({
  status,
  compact,
}: {
  status?: CameraSyncStatus;
  compact?: boolean;
}) {
  const tone =
    status === 'synced'
      ? 'ok'
      : status === 'drift'
      ? 'warn'
      : status === 'offline'
      ? 'critical'
      : 'muted';
  const Icon =
    status === 'synced'
      ? RadioTower
      : status === 'drift'
      ? RadioReceiver
      : Radio;
  const label = status === 'synced' ? 'TC' : status === 'drift' ? 'TC' : status === 'offline' ? 'off' : '—';
  return (
    <div
      className={`rounded-[3px] flex items-center gap-1 ${TONE_BG[tone]} ${
        compact ? 'px-1.5 py-0.5' : 'px-2 py-1'
      }`}
    >
      <Icon size={compact ? 9 : 11} />
      <span className={compact ? 'text-[9px]' : 'text-[11px]'}>{label}</span>
    </div>
  );
}

function WbTile({ k, compact }: { k?: number; compact?: boolean }) {
  const tone = k == null ? 'muted' : 'ok';
  return (
    <div
      className={`rounded-[3px] flex items-center gap-1 ${TONE_BG[tone]} ${
        compact ? 'px-1.5 py-0.5' : 'px-2 py-1'
      }`}
    >
      <Settings2 size={compact ? 9 : 11} />
      <span
        className={`tabular-nums ${
          compact ? 'text-[9px]' : 'text-[11px]'
        }`}
      >
        {k != null ? `${k}K` : '—'}
      </span>
    </div>
  );
}

/* ---------- Slot editor ---------- */

function SlotEditor({
  slot,
  status,
  onPatch,
  crew,
}: {
  slot: CameraSlot;
  status?: CameraStatus;
  onPatch: (patch: Partial<CameraStatus>) => void;
  crew: { id: string; name: string }[];
}) {
  const t = useT();
  return (
    <div className="mt-3 p-4 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-brass)]/40">
      <div className="display-italic text-[15px] text-[color:var(--color-on-paper)] mb-3">
        {t('common.edit')} · {slotLabel(slot)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NumField
          label={t('cam.battery')}
          value={status?.batteryPct}
          onChange={(v) => onPatch({ batteryPct: v })}
          min={0}
          max={100}
        />
        <NumField
          label={t('cam.card')}
          value={status?.cardPct}
          onChange={(v) => onPatch({ cardPct: v })}
          min={0}
          max={100}
        />
        <SyncSelector
          value={status?.syncStatus}
          onChange={(v) => onPatch({ syncStatus: v })}
        />
        <OperatorSelector
          value={status?.operatorId}
          onChange={(v) => onPatch({ operatorId: v })}
          crew={crew}
        />
        <NumField
          label={t('cam.iso')}
          value={status?.isoValue}
          onChange={(v) => onPatch({ isoValue: v })}
        />
        <NumField
          label={t('cam.wb')}
          value={status?.wbKelvin}
          onChange={(v) => onPatch({ wbKelvin: v })}
          step={50}
        />
        <NumField
          label="GB"
          value={status?.cardGbRemaining}
          onChange={(v) => onPatch({ cardGbRemaining: v })}
          step={1}
        />
      </div>

      <div className="mt-3">
        <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
          {t('common.notes')}
        </div>
        <textarea
          value={status?.notes ?? ''}
          onChange={(e) => onPatch({ notes: e.target.value })}
          rows={2}
          className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)] resize-none"
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            onPatch({
              batteryPct: 100,
              cardPct: 0,
              syncStatus: 'synced',
            })
          }
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[color:var(--color-brass)] text-[color:var(--color-paper)] text-[11px] hover:bg-[color:var(--color-brass-deep)] transition-colors"
        >
          <RefreshCw size={11} />
          <span className="prose-body italic">{t('cam.fresh.setup')}</span>
        </button>
        {status?.updatedAt && (
          <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] tabular-nums">
            updated {fmtRelative(status.updatedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

function SyncSelector({
  value,
  onChange,
}: {
  value?: CameraSyncStatus;
  onChange: (v: CameraSyncStatus | undefined) => void;
}) {
  const t = useT();
  return (
    <label className="block">
      <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
        {t('cam.sync')}
      </div>
      <select
        value={value ?? ''}
        onChange={(e) => onChange((e.target.value || undefined) as CameraSyncStatus | undefined)}
        className="w-full px-2 py-1 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
      >
        <option value="">—</option>
        <option value="synced">synced</option>
        <option value="drift">drift</option>
        <option value="offline">offline</option>
        <option value="unknown">unknown</option>
      </select>
    </label>
  );
}

function OperatorSelector({
  value,
  onChange,
  crew,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
  crew: { id: string; name: string }[];
}) {
  const t = useT();
  return (
    <label className="block">
      <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
        {t('cam.operator')}
      </div>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full px-2 py-1 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
      >
        <option value="">—</option>
        {crew.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
        {label}
      </div>
      <input
        type="number"
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? undefined : Number(v));
        }}
        className="w-full px-2 py-1 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
      />
    </label>
  );
}

/* ---------- helpers ---------- */

function slotLabel(s: CameraSlot): string {
  return SLOTS.find((x) => x.slot === s)?.label ?? s;
}

function fmtRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
