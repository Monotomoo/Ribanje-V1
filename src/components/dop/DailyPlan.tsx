import { useMemo, useState } from 'react';
import {
  Anchor,
  Battery,
  Camera,
  Compass,
  Disc,
  Plane,
  Sailboat,
  Sparkles,
  Waves,
  Weight,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { CameraSlot, ShootDay } from '../../types';
import { EPISODE_COLORS } from '../map/AdriaticChart';
import { KitChecklist } from './KitChecklist';
import { LiveRollCockpit } from './LiveRollCockpit';
import { ShotListRadar } from './ShotListRadar';

/* Daily plan — the central "running the day" surface for Tom.
   Multi-cam matrix · live power + storage compute · shooting-conditions
   decision tool · per-day rollup. Replaces the previous placeholder. */

type CamSlot = 'A' | 'B' | 'drone' | 'underwater' | 'crash';

const SLOT_ORDER: CamSlot[] = ['A', 'B', 'drone', 'underwater', 'crash'];
const SLOT_LABEL: Record<CamSlot, string> = {
  A: 'Cam A',
  B: 'Cam B',
  drone: 'Drone',
  underwater: 'Underwater',
  crash: 'Crash',
};
const SLOT_ICON: Record<CamSlot, typeof Camera> = {
  A: Camera,
  B: Camera,
  drone: Plane,
  underwater: Waves,
  crash: Disc,
};

/* Codec → GB per hour for storage estimation. Tom can refine. */
const CODEC_GBPH: Record<string, number> = {
  'ProRes 4444': 280,
  'ProRes 422 HQ': 110,
  'ProRes 422': 75,
  'ARRIRAW': 540,
  'XAVC HS': 17,
  'XAVC S-I': 28,
  'H.265': 8,
  'DNG (drone)': 50,
};

interface CamConfig {
  slot: CamSlot;
  defaultCamera?: string;       // dopKit id
  defaultCodec: string;
  defaultRollHours: number;
}

const DEFAULT_CAM_CONFIGS: CamConfig[] = [
  { slot: 'A',          defaultCamera: 'kit-cam-a', defaultCodec: 'ProRes 4444',  defaultRollHours: 6 },
  { slot: 'B',          defaultCamera: 'kit-cam-b', defaultCodec: 'XAVC S-I',     defaultRollHours: 4 },
  { slot: 'drone',      defaultCodec: 'DNG (drone)', defaultRollHours: 1.5 },
  { slot: 'underwater', defaultCodec: 'ProRes 422 HQ', defaultRollHours: 1 },
  { slot: 'crash',      defaultCodec: 'H.265',         defaultRollHours: 0.5 },
];

export function DailyPlan() {
  const { state } = useApp();
  const sortedDays = useMemo(
    () => [...state.shootDays].sort((a, b) => a.date.localeCompare(b.date)),
    [state.shootDays]
  );
  const [selectedDayId, setSelectedDayId] = useState<string>(
    sortedDays[Math.min(11, sortedDays.length - 1)]?.id ?? sortedDays[0]?.id ?? ''
  );

  const day = sortedDays.find((d) => d.id === selectedDayId) ?? sortedDays[0];
  if (!day) {
    return (
      <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
        No shoot days configured. Add shoot days in Schedule first.
      </p>
    );
  }

  const dayIdx = sortedDays.findIndex((d) => d.id === day.id);
  const episode = day.episodeId
    ? [...state.episodes, ...state.specials].find((e) => e.id === day.episodeId)
    : null;
  const anchorage = day.anchorageId
    ? state.locations.find((l) => l.id === day.anchorageId)
    : null;

  return (
    <div className="space-y-7">
      {/* Header + day picker */}
      <header className="flex items-baseline justify-between">
        <div>
          <h3 className="display-italic text-[24px] text-[color:var(--color-on-paper)] leading-tight">
            Daily plan
          </h3>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Multi-cam cockpit · real-compute power + storage · shooting conditions
          </p>
        </div>
        <select
          value={selectedDayId}
          onChange={(e) => setSelectedDayId(e.target.value)}
          className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none display-italic text-[16px] text-[color:var(--color-on-paper)] py-1 min-w-[280px]"
        >
          {sortedDays.map((d, i) => {
            const ep = d.episodeId
              ? [...state.episodes, ...state.specials].find((e) => e.id === d.episodeId)
              : null;
            return (
              <option key={d.id} value={d.id}>
                Day {i + 1} · {d.date} · {ep?.title ?? '—'}
              </option>
            );
          })}
        </select>
      </header>

      {/* Hero strip */}
      <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
              Day {dayIdx + 1} of {sortedDays.length} · {day.date}
            </div>
            <div className="display-italic text-[22px] text-[color:var(--color-on-paper)]">
              {episode ? `Ep ${episode.number} · ${episode.title}` : 'No episode assigned'}
              {anchorage && (
                <>
                  <span className="text-[color:var(--color-on-paper-muted)] mx-2">·</span>
                  <Anchor size={13} className="inline -mt-1 mr-1 text-[color:var(--color-brass-deep)]" />
                  <span className="text-[color:var(--color-on-paper)]">{anchorage.label}</span>
                </>
              )}
            </div>
          </div>
          {day.weatherWindow && (
            <span
              className="label-caps tracking-[0.10em] text-[10px] px-2 py-1 rounded-[2px]"
              style={{
                background: weatherTone(day.weatherWindow).bg,
                color: weatherTone(day.weatherWindow).fg,
              }}
            >
              {day.weatherWindow}
            </span>
          )}
        </div>
      </section>

      {/* Live Roll Cockpit — DURING-shoot transformation (toggleable) */}
      <LiveRollCockpit />

      {/* Pre-shoot kit checklist — collapsible, per-day */}
      <KitChecklist />

      {/* Multi-cam matrix */}
      <MulticamMatrix day={day} />

      {/* Shot list radar — angle = time-of-day, radius = status */}
      <ShotListRadar />

      {/* Power + storage live compute */}
      <PowerStorageStats day={day} />

      {/* Shooting conditions matrix */}
      <ShootingConditionsMatrix />

      {/* Per-day rollup table — across the whole shoot */}
      <DayRollup days={sortedDays} />
    </div>
  );
}

/* ---------- Multi-cam matrix ---------- */

function MulticamMatrix({ day }: { day: ShootDay }) {
  const { state } = useApp();
  const sortedDays = useMemo(
    () => [...state.shootDays].sort((a, b) => a.date.localeCompare(b.date)),
    [state.shootDays]
  );
  const dayIdx = sortedDays.findIndex((d) => d.id === day.id);

  /* Scenes for this day index (matches Production's dayIdx assignment). */
  const scenes = state.scenes
    .filter((s) => s.dayIdx === dayIdx)
    .sort((a, b) => a.label.localeCompare(b.label));

  /* All shots for this episode — includes loose shots. */
  const dayShots = state.shots.filter((s) => {
    if (s.sceneId) {
      const scene = state.scenes.find((sc) => sc.id === s.sceneId);
      return scene?.dayIdx === dayIdx;
    }
    return s.episodeId === day.episodeId;
  });

  /* Camera kits — A/B from category=camera, others from their categories. */
  const camKits = state.dopKit.filter((k) => k.category === 'camera');
  const droneKits = state.dopKit.filter((k) => k.category === 'aerial');
  const uwKits = state.dopKit.filter((k) => k.category === 'underwater');
  const stabKits = state.dopKit.filter((k) => k.category === 'stab');

  /* For each camera slot, summarize today's shots. */
  function shotsFor(slot: CamSlot) {
    return dayShots.filter((s) => s.cameraSlot === slot);
  }

  function operatorName(crewId: string | undefined): string | null {
    if (!crewId) return null;
    return state.crew.find((c) => c.id === crewId)?.name ?? null;
  }

  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3">
        <Camera size={13} className="text-[color:var(--color-brass-deep)]" />
        <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
          Multi-cam plan
        </h4>
        <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          {scenes.length > 0 ? `${scenes.length} scenes` : 'no scenes assigned to this day'} ·{' '}
          {dayShots.length} shots total
        </span>
      </div>

      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
        {/* Camera column headers */}
        <div className="grid grid-cols-5 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
          {SLOT_ORDER.map((slot) => {
            const Icon = SLOT_ICON[slot];
            const kits =
              slot === 'A' ? camKits.slice(0, 1) :
              slot === 'B' ? camKits.slice(1, 2) :
              slot === 'drone' ? droneKits :
              slot === 'underwater' ? uwKits :
              [];
            const shots = shotsFor(slot);
            const captured = shots.filter((s) => s.status === 'captured').length;
            return (
              <div
                key={slot}
                className="px-4 py-3 border-r-[0.5px] border-[color:var(--color-border-paper)] last:border-r-0"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <div className="flex items-baseline gap-1.5">
                    <Icon size={11} className="text-[color:var(--color-brass-deep)]" />
                    <span className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
                      {SLOT_LABEL[slot]}
                    </span>
                  </div>
                  {shots.length > 0 && (
                    <span className="prose-body italic text-[10px] text-[color:var(--color-brass-deep)] tabular-nums">
                      {captured}/{shots.length}
                    </span>
                  )}
                </div>
                <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] truncate">
                  {kits[0]?.label ?? (slot === 'crash' ? 'standby' : '—')}
                </div>
                {/* Trinity overlay marker for cam A in stab slot */}
                {slot === 'A' && stabKits.length > 0 && (
                  <div className="prose-body italic text-[10px] text-[color:var(--color-brass-deep)] mt-0.5 flex items-baseline gap-1">
                    <Sparkles size={9} />
                    {stabKits[0].label} ready
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scene × camera matrix */}
        {scenes.length > 0 ? (
          <ul>
            {scenes.map((scene) => (
              <li
                key={scene.id}
                className="border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0"
              >
                <div className="px-5 py-2 bg-[color:var(--color-paper)] border-b-[0.5px] border-[color:var(--color-border-paper)]/60">
                  <div className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
                    {scene.label}
                  </div>
                  {scene.notes && (
                    <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
                      {scene.notes}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-5">
                  {SLOT_ORDER.map((slot) => {
                    const sceneShots = state.shots
                      .filter((s) => s.sceneId === scene.id && s.cameraSlot === slot)
                      .sort((a, b) => a.number.localeCompare(b.number));
                    return (
                      <div
                        key={slot}
                        className="px-4 py-3 border-r-[0.5px] border-[color:var(--color-border-paper)]/60 last:border-r-0 min-h-[60px]"
                      >
                        {sceneShots.length === 0 ? (
                          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
                            —
                          </span>
                        ) : (
                          <ul className="space-y-1.5">
                            {sceneShots.map((sh) => {
                              const op = operatorName(sh.operator);
                              const tone =
                                sh.status === 'captured'
                                  ? 'text-[color:var(--color-success)]'
                                  : sh.status === 'cut'
                                  ? 'text-[color:var(--color-on-paper-faint)] line-through'
                                  : 'text-[color:var(--color-on-paper)]';
                              return (
                                <li key={sh.id} className={`prose-body italic text-[11px] ${tone}`}>
                                  <span className="text-[color:var(--color-brass-deep)] tabular-nums mr-1.5">
                                    {sh.number}
                                  </span>
                                  {sh.framing && (
                                    <span className="text-[color:var(--color-on-paper-muted)] mr-1">
                                      {sh.framing}
                                    </span>
                                  )}
                                  {sh.movement && (
                                    <span className="text-[color:var(--color-on-paper-muted)]">
                                      · {sh.movement}
                                    </span>
                                  )}
                                  {op && (
                                    <div className="prose-body italic text-[10px] text-[color:var(--color-brass-deep)]">
                                      → {op}
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-7 text-center prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)]">
            No scenes assigned to Day {dayIdx + 1} yet.
            {dayShots.length > 0 && (
              <> Loose shots for this episode below — {dayShots.length} of them.</>
            )}
          </div>
        )}

        {/* Loose shots fallback */}
        {scenes.length === 0 && dayShots.length > 0 && (
          <div className="grid grid-cols-5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            {SLOT_ORDER.map((slot) => {
              const slotShots = dayShots.filter((s) => s.cameraSlot === slot);
              return (
                <div
                  key={slot}
                  className="px-4 py-3 border-r-[0.5px] border-[color:var(--color-border-paper)]/60 last:border-r-0"
                >
                  {slotShots.length === 0 ? (
                    <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
                      —
                    </span>
                  ) : (
                    <ul className="space-y-1">
                      {slotShots.map((sh) => (
                        <li
                          key={sh.id}
                          className="prose-body italic text-[11px] text-[color:var(--color-on-paper)]"
                        >
                          <span className="text-[color:var(--color-brass-deep)] tabular-nums mr-1">
                            {sh.number}
                          </span>
                          {sh.description.slice(0, 30)}
                          {sh.description.length > 30 && '…'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Power + storage real compute ---------- */

function PowerStorageStats({ day }: { day: ShootDay }) {
  const { state } = useApp();

  const compute = useMemo(() => {
    const camKits = state.dopKit.filter((k) => k.category === 'camera');
    const config = DEFAULT_CAM_CONFIGS;

    let totalWh = 0;
    let totalGb = 0;
    let totalRollHours = 0;
    let totalKitWeightKg = 0;
    const lines: { slot: CamSlot; cam: string; codec: string; hours: number; gb: number; wh: number }[] = [];

    for (const cfg of config) {
      const cam =
        cfg.slot === 'A' ? camKits[0] :
        cfg.slot === 'B' ? camKits[1] :
        cfg.slot === 'drone' ? state.dopKit.find((k) => k.category === 'aerial') :
        cfg.slot === 'underwater' ? state.dopKit.find((k) => k.category === 'underwater') :
        undefined;

      const codecGbph = CODEC_GBPH[cfg.defaultCodec] ?? 35;
      const wh = (cam?.wattsPerHour ?? 0) * cfg.defaultRollHours;
      const gb = codecGbph * cfg.defaultRollHours;

      totalWh += wh;
      totalGb += gb;
      totalRollHours += cfg.defaultRollHours;
      if (cam?.weightKg) totalKitWeightKg += cam.weightKg;

      lines.push({
        slot: cfg.slot,
        cam: cam?.label ?? `(no ${cfg.slot} camera)`,
        codec: cfg.defaultCodec,
        hours: cfg.defaultRollHours,
        gb,
        wh,
      });
    }

    /* Add lens + audio + stab weight */
    for (const k of state.dopKit) {
      if (k.category === 'lens' || k.category === 'audio' || k.category === 'stab') {
        totalKitWeightKg += k.weightKg ?? 0;
      }
    }

    /* V-mount budget — assume 4 × 150Wh = 600Wh as default */
    const batteryBudgetWh = 600;

    return {
      lines,
      totalWh,
      totalGb,
      totalRollHours,
      totalKitWeightKg,
      batteryBudgetWh,
      batteryHeadroomPct: ((batteryBudgetWh - totalWh) / batteryBudgetWh) * 100,
    };
  }, [state.dopKit]);
  void day;

  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3">
        <Battery size={13} className="text-[color:var(--color-brass-deep)]" />
        <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
          Power + storage budget
        </h4>
        <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          live compute · per-cam codec × hours
        </span>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <BudgetTile
          icon={Battery}
          label="Power load"
          value={`${Math.round(compute.totalWh)} Wh`}
          sub={`${compute.batteryHeadroomPct >= 0 ? Math.round(compute.batteryHeadroomPct) + '% headroom' : 'OVER BUDGET — pack more'}`}
          tone={
            compute.batteryHeadroomPct >= 30 ? 'success' :
            compute.batteryHeadroomPct >= 0 ? 'warn' :
            'coral'
          }
        />
        <BudgetTile
          icon={Disc}
          label="Storage"
          value={`${(compute.totalGb / 1024).toFixed(2)} TB`}
          sub={`${Math.round(compute.totalGb)} GB across all cams`}
        />
        <BudgetTile
          icon={Compass}
          label="Roll hours"
          value={`${compute.totalRollHours.toFixed(1)} h`}
          sub="cumulative across cameras"
        />
        <BudgetTile
          icon={Weight}
          label="Kit weight"
          value={`${compute.totalKitWeightKg.toFixed(1)} kg`}
          sub="cameras + lenses + audio + stab"
        />
      </div>

      {/* Per-cam breakdown */}
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
        <div className="grid grid-cols-[100px_1fr_140px_70px_90px_90px] gap-3 px-5 py-2.5 border-b-[0.5px] border-[color:var(--color-border-brass)]/40 label-caps text-[color:var(--color-on-paper-faint)]">
          <span>Slot</span>
          <span>Camera</span>
          <span>Codec</span>
          <span className="text-right">Hours</span>
          <span className="text-right">GB</span>
          <span className="text-right">Wh</span>
        </div>
        {compute.lines.map((l) => {
          const Icon = SLOT_ICON[l.slot];
          return (
            <div
              key={l.slot}
              className="grid grid-cols-[100px_1fr_140px_70px_90px_90px] gap-3 px-5 py-2 border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0 items-baseline"
            >
              <span className="display-italic text-[13px] text-[color:var(--color-on-paper)] flex items-baseline gap-1.5">
                <Icon size={10} className="text-[color:var(--color-brass-deep)]" />
                {SLOT_LABEL[l.slot]}
              </span>
              <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] truncate">
                {l.cam}
              </span>
              <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] tabular-nums">
                {l.codec}
              </span>
              <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums text-right">
                {l.hours.toFixed(1)}
              </span>
              <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums text-right">
                {Math.round(l.gb)}
              </span>
              <span
                className={`display-italic text-[14px] tabular-nums text-right ${
                  l.wh > 0
                    ? 'text-[color:var(--color-on-paper)]'
                    : 'text-[color:var(--color-on-paper-faint)]'
                }`}
              >
                {Math.round(l.wh)}
              </span>
            </div>
          );
        })}
        {/* Total row */}
        <div className="grid grid-cols-[100px_1fr_140px_70px_90px_90px] gap-3 px-5 py-2 bg-[color:var(--color-paper-deep)]/15 items-baseline">
          <span className="label-caps text-[color:var(--color-brass-deep)]">total</span>
          <span></span>
          <span></span>
          <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums text-right">
            {compute.totalRollHours.toFixed(1)}
          </span>
          <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums text-right">
            {Math.round(compute.totalGb)}
          </span>
          <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums text-right">
            {Math.round(compute.totalWh)}
          </span>
        </div>
      </div>

      <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] mt-3 leading-relaxed">
        Math: per-camera <code className="font-sans not-italic">wattsPerHour</code> × roll hours = Wh ·
        codec GB/h × roll hours = GB · default V-mount budget 600 Wh (4 × 150 Wh). Refine roll hours
        + codec per shoot day in the multi-cam plan above. Tom verifies on Day 1.
      </p>
    </section>
  );
}

function BudgetTile({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Battery;
  label: string;
  value: string;
  sub?: string;
  tone?: 'success' | 'warn' | 'coral';
}) {
  const subColor =
    tone === 'success'
      ? 'text-[color:var(--color-success)]'
      : tone === 'warn'
      ? 'text-[color:var(--color-warn)]'
      : tone === 'coral'
      ? 'text-[color:var(--color-coral-deep)]'
      : 'text-[color:var(--color-on-paper-muted)]';
  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-3">
      <div className="flex items-baseline gap-1.5 label-caps text-[color:var(--color-brass-deep)] mb-1">
        <Icon size={10} />
        <span>{label}</span>
      </div>
      <div className="display-italic text-[22px] text-[color:var(--color-on-paper)] tabular-nums leading-none">
        {value}
      </div>
      {sub && (
        <div className={`prose-body italic text-[11px] mt-1 ${subColor}`}>{sub}</div>
      )}
    </article>
  );
}

/* ---------- Shooting conditions matrix ---------- */

interface RigThreshold {
  rig: string;
  icon: typeof Sailboat;
  /* Max sea state in meters this rig is operational */
  maxSeaM: number;
  /* Max wind in m/s */
  maxWindMs: number;
  /* Min visibility in meters (relevant for UW) */
  minVizM?: number;
  notes?: string;
}

const RIGS: RigThreshold[] = [
  { rig: 'Cam A · handheld', icon: Camera,    maxSeaM: 4.0, maxWindMs: 25, notes: 'Anywhere, anytime' },
  { rig: 'Cam B (FX3)',      icon: Camera,    maxSeaM: 3.0, maxWindMs: 20, notes: 'Lighter rig, more agile' },
  { rig: 'Trinity stab',     icon: Sparkles,  maxSeaM: 2.0, maxWindMs: 14, notes: 'Counterweight wants stability' },
  { rig: 'Drone',            icon: Plane,     maxSeaM: 4.0, maxWindMs: 12, notes: 'Wind ceiling is hard cutoff' },
  { rig: 'Underwater',       icon: Waves,     maxSeaM: 2.0, maxWindMs: 14, minVizM: 5, notes: 'Viz < 5m = abort' },
];

function ShootingConditionsMatrix() {
  const seaBuckets = [
    { label: '0–1m', max: 1 },
    { label: '1–2m', max: 2 },
    { label: '2–3m', max: 3 },
    { label: '3m+', max: 4.5 },
  ];
  const windBuckets = [
    { label: '0–8 m/s', max: 8 },
    { label: '8–12 m/s', max: 12 },
    { label: '12–18 m/s', max: 18 },
    { label: '18+ m/s', max: 25 },
  ];

  function rigsAvailable(seaMax: number, windMax: number): { ok: RigThreshold[]; risky: RigThreshold[]; abort: RigThreshold[] } {
    const ok: RigThreshold[] = [];
    const risky: RigThreshold[] = [];
    const abort: RigThreshold[] = [];
    for (const r of RIGS) {
      if (seaMax > r.maxSeaM || windMax > r.maxWindMs) {
        abort.push(r);
      } else if (seaMax > r.maxSeaM * 0.85 || windMax > r.maxWindMs * 0.85) {
        risky.push(r);
      } else {
        ok.push(r);
      }
    }
    return { ok, risky, abort };
  }

  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3">
        <Sailboat size={13} className="text-[color:var(--color-brass-deep)]" />
        <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
          Shooting conditions matrix
        </h4>
        <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          sea state × wind → what's shootable
        </span>
      </div>

      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
        {/* Column headers — wind buckets */}
        <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr] gap-2 px-4 py-2 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
          <span></span>
          {windBuckets.map((w) => (
            <span
              key={w.label}
              className="label-caps text-[color:var(--color-brass-deep)] text-center"
            >
              {w.label}
            </span>
          ))}
        </div>
        {/* Rows — sea state buckets */}
        {seaBuckets.map((s) => (
          <div
            key={s.label}
            className="grid grid-cols-[120px_1fr_1fr_1fr_1fr] gap-2 px-4 py-2 border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0 items-stretch"
          >
            <span className="label-caps text-[color:var(--color-brass-deep)] flex items-center">
              sea {s.label}
            </span>
            {windBuckets.map((w) => {
              const cell = rigsAvailable(s.max, w.max);
              const cellTone =
                cell.abort.length === RIGS.length
                  ? 'bg-[color:var(--color-coral-deep)]/15 border-[color:var(--color-coral)]/40'
                  : cell.abort.length > 1
                  ? 'bg-[color:var(--color-warn)]/15 border-[color:var(--color-warn)]/40'
                  : 'bg-[color:var(--color-success)]/10 border-[color:var(--color-success)]/40';
              return (
                <div
                  key={w.label}
                  className={`border-[0.5px] rounded-[2px] px-2 py-1.5 ${cellTone}`}
                >
                  <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
                    {cell.ok.length} ok · {cell.risky.length} risky · {cell.abort.length} abort
                  </div>
                  {cell.abort.length > 0 ? (
                    <div className="prose-body italic text-[10px] text-[color:var(--color-coral-deep)] truncate">
                      ✗ {cell.abort.map((r) => r.rig.split(' ')[0]).join(', ')}
                    </div>
                  ) : (
                    <div className="prose-body italic text-[10px] text-[color:var(--color-success)]">
                      ✓ all rigs OK
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Per-rig thresholds */}
      <div className="grid grid-cols-5 gap-2 mt-3">
        {RIGS.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.rig}
              className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-3 py-2"
            >
              <div className="flex items-baseline gap-1.5 mb-1">
                <Icon size={10} className="text-[color:var(--color-brass-deep)]" />
                <span className="display-italic text-[12px] text-[color:var(--color-on-paper)]">
                  {r.rig}
                </span>
              </div>
              <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums">
                ≤{r.maxSeaM}m sea · ≤{r.maxWindMs} m/s wind
                {r.minVizM && ` · viz ≥${r.minVizM}m`}
              </div>
              {r.notes && (
                <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-0.5 leading-tight">
                  {r.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Per-day rollup ---------- */

function DayRollup({ days }: { days: ShootDay[] }) {
  const { state } = useApp();
  /* Sum daily Wh + GB across all days using same defaults as PowerStorageStats. */
  const camKits = state.dopKit.filter((k) => k.category === 'camera');

  const perDay = days.map((day) => {
    let dayWh = 0;
    let dayGb = 0;
    for (const cfg of DEFAULT_CAM_CONFIGS) {
      const cam =
        cfg.slot === 'A' ? camKits[0] :
        cfg.slot === 'B' ? camKits[1] :
        cfg.slot === 'drone' ? state.dopKit.find((k) => k.category === 'aerial') :
        cfg.slot === 'underwater' ? state.dopKit.find((k) => k.category === 'underwater') :
        undefined;
      const codecGbph = CODEC_GBPH[cfg.defaultCodec] ?? 35;
      dayWh += (cam?.wattsPerHour ?? 0) * cfg.defaultRollHours;
      dayGb += codecGbph * cfg.defaultRollHours;
    }
    return { day, dayWh, dayGb };
  });

  const totalGb = perDay.reduce((s, x) => s + x.dayGb, 0);
  const totalWh = perDay.reduce((s, x) => s + x.dayWh, 0);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
          Whole shoot rollup
        </h4>
        <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] tabular-nums">
          {(totalGb / 1024).toFixed(1)} TB · {(totalWh / 1000).toFixed(1)} kWh across {days.length} days
        </span>
      </div>
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
        <div className="grid grid-cols-[100px_1fr_1fr_100px_100px] gap-3 px-5 py-2 border-b-[0.5px] border-[color:var(--color-border-brass)]/40 label-caps text-[color:var(--color-on-paper-faint)]">
          <span>Day</span>
          <span>Episode</span>
          <span>Anchorage</span>
          <span className="text-right">Wh</span>
          <span className="text-right">GB</span>
        </div>
        {perDay.map(({ day, dayWh, dayGb }, i) => {
          const ep = day.episodeId
            ? [...state.episodes, ...state.specials].find((e) => e.id === day.episodeId)
            : null;
          const loc = day.anchorageId
            ? state.locations.find((l) => l.id === day.anchorageId)
            : null;
          const epColor = day.episodeId
            ? EPISODE_COLORS[day.episodeId] ?? '#2D4A6B'
            : '#E5DBC4';
          return (
            <div
              key={day.id}
              className="grid grid-cols-[100px_1fr_1fr_100px_100px] gap-3 px-5 py-1.5 border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0 items-baseline"
            >
              <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums">
                Day {i + 1}
              </span>
              <span className="flex items-baseline gap-2 prose-body italic text-[12px] text-[color:var(--color-on-paper)]">
                <span
                  className="w-2 h-2 rounded-full shrink-0 translate-y-[-1px]"
                  style={{ background: epColor }}
                />
                {ep?.title ?? '—'}
              </span>
              <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] truncate">
                {loc?.label ?? '—'}
              </span>
              <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums text-right">
                {Math.round(dayWh)}
              </span>
              <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums text-right">
                {Math.round(dayGb)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- helpers ---------- */

function weatherTone(w: string): { bg: string; fg: string } {
  switch (w) {
    case 'clear':
      return { bg: 'rgba(107,144,128,0.25)', fg: 'rgb(70,100,85)' };
    case 'mixed':
      return { bg: 'rgba(217,169,62,0.2)', fg: 'rgb(140,100,30)' };
    case 'jugo':
    case 'bura':
      return { bg: 'rgba(194,106,74,0.22)', fg: 'rgb(140,60,40)' };
    default:
      return { bg: 'rgba(14,30,54,0.08)', fg: 'rgb(80,90,110)' };
  }
}

/* Suppress unused-import linter */
export const _types: CameraSlot | null = null;
