import { useMemo } from 'react';
import {
  Anchor,
  ArrowRight,
  Compass,
  Droplet,
  Fuel,
  LifeBuoy,
  Sailboat,
  ShoppingBasket,
  User,
  Wind,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { newId } from '../episode/shared';
import type { BoatOpsDay } from '../../types';
import { EditableText } from '../primitives/EditableText';
import { resolveShootDay, shootDaysSorted } from './productionSelectors';

interface Props {
  previewDateIso?: string;
}

export function BoatOpsTab({ previewDateIso }: Props) {
  const { state, dispatch } = useApp();
  const resolved = resolveShootDay(state, previewDateIso);

  if (!resolved) {
    return (
      <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
        No shoot days configured. Add shoot days in Schedule first.
      </p>
    );
  }

  const allDays = shootDaysSorted(state);
  const todayDate = resolved.day.date;
  const todayBoat = state.boatOpsDays.find((b) => b.date === todayDate);

  const tomorrow =
    resolved.index < resolved.total ? allDays[resolved.index] : null;

  const todayAnchor = resolved.anchorage;
  const tomorrowAnchor = tomorrow
    ? state.locations.find((l) => l.id === tomorrow.anchorageId) ?? null
    : null;

  const nm =
    todayAnchor && tomorrowAnchor
      ? haversineNm(
          todayAnchor.lat,
          todayAnchor.lng,
          tomorrowAnchor.lat,
          tomorrowAnchor.lng
        )
      : null;

  /* 7-day rotation outlook starting today */
  const rotation = useMemo(() => {
    return allDays.slice(resolved.index - 1, resolved.index - 1 + 7);
  }, [allDays, resolved.index]);

  function ensureToday(): BoatOpsDay {
    if (todayBoat) return todayBoat;
    const fresh: BoatOpsDay = {
      id: `bo-${todayDate}`,
      date: todayDate,
      anchorageId: todayAnchor?.id,
      fuelPct: 100,
      waterPct: 100,
      provisionsPct: 100,
      weatherNotes: '',
    };
    dispatch({ type: 'UPSERT_BOAT_OPS', day: fresh });
    return fresh;
  }

  function patchToday(p: Partial<BoatOpsDay>) {
    const t = ensureToday();
    dispatch({ type: 'UPDATE_BOAT_OPS', id: t.id, patch: p });
  }

  return (
    <div className="space-y-7 max-w-[1200px]">
      {/* Today → tomorrow ribbon */}
      <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-5">
        <div className="grid grid-cols-[1fr_30px_1fr] items-center gap-5">
          <div>
            <div className="label-caps text-[color:var(--color-on-paper-faint)] mb-1">
              Today · Day {resolved.index}
            </div>
            <div className="display-italic text-[24px] text-[color:var(--color-on-paper)] leading-tight">
              {todayAnchor ? (
                <>
                  <Anchor size={14} className="inline -mt-1 mr-1.5 text-[color:var(--color-brass-deep)]" />
                  {todayAnchor.label}
                </>
              ) : (
                'no anchorage assigned'
              )}
            </div>
            {todayAnchor && (
              <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1 tabular-nums">
                {todayAnchor.lat.toFixed(3)}°N · {todayAnchor.lng.toFixed(3)}°E
              </div>
            )}
          </div>
          <ArrowRight size={20} className="text-[color:var(--color-brass)] mx-auto" />
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
              Tomorrow · Day {resolved.index + 1}
            </div>
            <div className="display-italic text-[24px] text-[color:var(--color-on-paper)] leading-tight">
              {tomorrowAnchor ? (
                <>
                  <Anchor size={14} className="inline -mt-1 mr-1.5 text-[color:var(--color-brass)]" />
                  {tomorrowAnchor.label}
                </>
              ) : (
                'no shoot day after this one'
              )}
            </div>
            {nm != null && (
              <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1 tabular-nums">
                {nm.toFixed(1)} NM ·{' '}
                <span className="text-[color:var(--color-brass-deep)]">
                  ETA ~{etaHours(nm).toFixed(1)}h @ 6kn
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats grid: fuel · water · provisions · sea state */}
      <section className="grid grid-cols-4 gap-5">
        <PercentTile
          icon={Fuel}
          label="Fuel"
          pct={todayBoat?.fuelPct ?? 100}
          onChange={(v) => patchToday({ fuelPct: v })}
          tone="brass"
        />
        <PercentTile
          icon={Droplet}
          label="Water"
          pct={todayBoat?.waterPct ?? 100}
          onChange={(v) => patchToday({ waterPct: v })}
          tone="dock"
        />
        <PercentTile
          icon={ShoppingBasket}
          label="Provisions"
          pct={todayBoat?.provisionsPct ?? 100}
          onChange={(v) => patchToday({ provisionsPct: v })}
          tone="olive"
        />
        <SeaTile
          dir={todayBoat?.windDir}
          seaStateM={todayBoat?.seaStateM}
          onWind={(v) => patchToday({ windDir: v })}
          onSea={(v) => patchToday({ seaStateM: v ?? undefined })}
        />
      </section>

      {/* Skipper + watch */}
      <section className="grid grid-cols-2 gap-5">
        <Panel icon={User} title="Skipper of the day">
          <select
            value={todayBoat?.skipperId ?? ''}
            onChange={(e) => patchToday({ skipperId: e.target.value || undefined })}
            className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none display-italic text-[18px] text-[color:var(--color-on-paper)] py-1"
          >
            <option value="">— pick skipper —</option>
            {state.crew.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.role}
              </option>
            ))}
          </select>
        </Panel>
        <Panel icon={Compass} title="Watch rotation">
          <EditableText
            value={todayBoat?.watchRotation ?? ''}
            onChange={(v) => patchToday({ watchRotation: v || undefined })}
            placeholder="00–04 captain · 04–08 Tomo · …"
            className="prose-body italic text-[14px] text-[color:var(--color-on-paper)] leading-relaxed"
          />
        </Panel>
      </section>

      {/* Weather + sea notes */}
      <Panel icon={Wind} title="Weather + sea notes">
        <EditableText
          multiline
          rows={3}
          value={todayBoat?.weatherNotes ?? ''}
          onChange={(v) => patchToday({ weatherNotes: v })}
          placeholder="Clear morning, NW 8kn forecast climbing to 14kn by 14:00. Good window 06:30–11:00."
          className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed block w-full"
        />
      </Panel>

      {/* 7-day rotation outlook */}
      <section>
        <div className="flex items-baseline gap-2 mb-3">
          <Sailboat size={13} className="text-[color:var(--color-brass-deep)]" />
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            7-day rotation outlook
          </h3>
          <div className="flex-1 h-px bg-[color:var(--color-border-brass)]/40" />
        </div>
        <ul className="grid grid-cols-7 gap-2">
          {rotation.map((day, idx) => {
            const a = state.locations.find((l) => l.id === day.anchorageId);
            const isToday = day.date === todayDate;
            return (
              <li
                key={day.id}
                className={`bg-[color:var(--color-paper-light)] border-[0.5px] rounded-[3px] px-3 py-3 ${
                  isToday
                    ? 'border-[color:var(--color-brass)]'
                    : 'border-[color:var(--color-border-paper)]'
                }`}
              >
                <div className="label-caps text-[color:var(--color-brass-deep)] mb-1 tabular-nums">
                  {idx === 0 ? 'today' : idx === 1 ? 'tomorrow' : `+${idx}d`}
                </div>
                <div className="display-italic text-[13px] text-[color:var(--color-on-paper)] leading-tight">
                  {a?.label ?? '—'}
                </div>
                <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-1 tabular-nums">
                  {fmtShort(day.date)}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* MOB protocol card */}
      <section className="bg-[color:var(--color-coral-deep)]/8 border-[0.5px] border-[color:var(--color-coral)]/40 rounded-[3px] px-6 py-5">
        <div className="flex items-baseline gap-3 mb-3">
          <LifeBuoy size={14} className="text-[color:var(--color-coral-deep)]" />
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            MOB protocol
          </h3>
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
            man overboard · pin to galley
          </span>
        </div>
        <ol className="space-y-2 grid grid-cols-2 gap-x-7">
          {[
            'SHOUT — "Man overboard, port/starboard side"',
            'POINT — designate one crew to keep eyes on the person, never look away',
            'PRESS MOB on the chartplotter — drops a waypoint',
            'THROW — life ring + dan buoy + lit horseshoe immediately',
            'RECOVER — return to person · approach from leeward · stop engine',
            'LIFT — use lifesling / ladder · life vest stays on',
            'MEDICAL — hypothermia check · rewarm slowly',
            'REPORT — Coast Guard on VHF 16 if any concern',
          ].map((step, i) => (
            <li
              key={i}
              className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed flex items-baseline gap-2"
            >
              <span className="display-italic text-[14px] text-[color:var(--color-coral-deep)] tabular-nums shrink-0 mt-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 pt-4 border-t-[0.5px] border-[color:var(--color-coral)]/30 prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] tabular-nums flex items-baseline justify-between">
          <span>VHF 16 · Coast Guard 195 · pan-pan / mayday by severity</span>
          <span>print this card and pin to the chartplotter</span>
        </div>
      </section>
    </div>
  );
}

/* ---------- subcomponents ---------- */

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4">
      <header className="flex items-baseline gap-2 mb-3 pb-2 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
        <Icon size={12} className="text-[color:var(--color-brass-deep)]" />
        <h3 className="display-italic text-[16px] text-[color:var(--color-on-paper)]">
          {title}
        </h3>
      </header>
      {children}
    </article>
  );
}

function PercentTile({
  icon: Icon,
  label,
  pct,
  onChange,
  tone,
}: {
  icon: typeof User;
  label: string;
  pct: number;
  onChange: (v: number) => void;
  tone: 'brass' | 'dock' | 'olive';
}) {
  const colour =
    tone === 'brass'
      ? 'var(--color-brass)'
      : tone === 'dock'
      ? 'var(--color-dock)'
      : 'var(--color-olive)';
  const tn = Math.max(0, Math.min(100, pct));
  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4">
      <div className="flex items-baseline justify-between mb-2.5">
        <div className="flex items-baseline gap-1.5 label-caps text-[color:var(--color-brass-deep)]">
          <Icon size={11} />
          <span>{label}</span>
        </div>
        <span className="display-italic text-[20px] text-[color:var(--color-on-paper)] tabular-nums">
          {tn}%
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-[color:var(--color-paper-deep)]/55 mb-2">
        <div
          style={{ width: `${tn}%`, background: colour }}
          className="h-full rounded-full transition-all"
        />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={tn}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full accent-[color:var(--color-brass)]"
        aria-label={`${label} percent`}
      />
    </article>
  );
}

function SeaTile({
  dir,
  seaStateM,
  onWind,
  onSea,
}: {
  dir?: string;
  seaStateM?: number;
  onWind: (v: string) => void;
  onSea: (v: number | null) => void;
}) {
  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4">
      <div className="flex items-baseline gap-1.5 label-caps text-[color:var(--color-brass-deep)] mb-2.5">
        <Wind size={11} />
        <span>Wind / sea</span>
      </div>
      <div className="space-y-2">
        <EditableText
          value={dir ?? ''}
          onChange={onWind}
          placeholder="WSW 12kn"
          className="display-italic text-[18px] text-[color:var(--color-on-paper)] tabular-nums block"
        />
        <div className="flex items-baseline gap-2">
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
            sea state
          </span>
          <input
            type="number"
            step="0.1"
            min={0}
            value={seaStateM ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              onSea(v === '' ? null : parseFloat(v));
            }}
            placeholder="0.8"
            className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none display-italic text-[16px] text-[color:var(--color-on-paper)] tabular-nums w-16 py-0.5"
          />
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">m</span>
        </div>
      </div>
    </article>
  );
}

function haversineNm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function etaHours(nm: number, speedKn = 6): number {
  return nm / speedKn;
}

function fmtShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/* Suppress unused-import linter for crew-id-typed newId (used in spawned BoatOpsDay) */
export const _newIdHint = newId;
