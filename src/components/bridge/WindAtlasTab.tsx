import { useMemo, useState } from 'react';
import { Compass, Plus } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import type { ShelterStatus, WindAtlasEntry, WindName } from '../../types';

/* ---------- WindAtlasTab (Phase 15) ----------
   Per-anchorage wind atlas. 8 named Adriatic winds × shelter status
   visualised as a compass diagram.

   The compass shows the boat at center, eight wind sectors radiating
   outward. Each sector tinted by shelter status:
     • shelter — green (the boat is protected from this wind)
     • mixed   — brass
     • expose  — coral (this wind hits open water at this anchorage)
     • unset   — paper (no data yet)

   Editor: pick a wind, cycle through shelter/mixed/expose/unset. */

const WIND_BEARINGS: { wind: WindName; bearing: number; labelKey: string }[] = [
  { wind: 'tramontana', bearing: 0,   labelKey: 'tramontana' },
  { wind: 'bura',       bearing: 45,  labelKey: 'bura' },
  { wind: 'levanat',    bearing: 90,  labelKey: 'levanat' },
  { wind: 'jugo',       bearing: 135, labelKey: 'jugo' },
  { wind: 'ošter',      bearing: 180, labelKey: 'ošter' },
  { wind: 'lebić',      bearing: 225, labelKey: 'lebić' },
  { wind: 'pulenat',    bearing: 270, labelKey: 'pulenat' },
  { wind: 'maestral',   bearing: 315, labelKey: 'maestral' },
];

const SHELTER_TONE: Record<ShelterStatus | 'unset', string> = {
  shelter: 'var(--color-success)',
  mixed:   'var(--color-brass)',
  expose:  'var(--color-coral-deep)',
  unset:   'var(--color-paper-deep)',
};

const COMPASS_SIZE = 320;
const CENTER = COMPASS_SIZE / 2;

export function WindAtlasTab() {
  const { state, dispatch } = useApp();
  const t = useT();

  const [locationId, setLocationId] = useState<string>(state.locations[0]?.id ?? '');
  const location = state.locations.find((l) => l.id === locationId);
  const atlas = location?.windAtlas ?? [];

  function getStatus(w: WindName): ShelterStatus | 'unset' {
    const e = atlas.find((a) => a.wind === w);
    return e?.shelter ?? 'unset';
  }

  function cycleWind(w: WindName) {
    if (!location) return;
    const order: (ShelterStatus | 'unset')[] = ['unset', 'shelter', 'mixed', 'expose'];
    const cur = getStatus(w);
    const next = order[(order.indexOf(cur) + 1) % order.length];
    let newAtlas: WindAtlasEntry[];
    if (next === 'unset') {
      newAtlas = atlas.filter((a) => a.wind !== w);
    } else {
      const others = atlas.filter((a) => a.wind !== w);
      newAtlas = [...others, { wind: w, shelter: next }];
    }
    dispatch({
      type: 'UPDATE_LOCATION',
      id: location.id,
      patch: { windAtlas: newAtlas },
    });
  }

  function seedDefaults() {
    if (!location) return;
    /* Sensible defaults — generic Adriatic anchorage, mostly mixed.
       User audits each. */
    const defaults: WindAtlasEntry[] = WIND_BEARINGS.map((w) => ({
      wind: w.wind,
      shelter: 'mixed',
    }));
    dispatch({
      type: 'UPDATE_LOCATION',
      id: location.id,
      patch: { windAtlas: defaults },
    });
  }

  /* Stats */
  const counts = useMemo(() => {
    const c = { shelter: 0, mixed: 0, expose: 0, unset: 0 };
    WIND_BEARINGS.forEach((w) => {
      const s = getStatus(w.wind);
      c[s]++;
    });
    return c;
  }, [atlas]);

  return (
    <div className="space-y-5">
      <header>
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] leading-tight">
          {t('bridge.wind.title')}
        </h3>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          {t('bridge.wind.subtitle')}
        </p>
      </header>

      <div className="flex items-center gap-3 flex-wrap">
        <label>
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
            {t('bridge.wind.pick')}
          </div>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)] min-w-[220px]"
          >
            {state.locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        {atlas.length === 0 && location && (
          <button
            type="button"
            onClick={seedDefaults}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3px] bg-[color:var(--color-brass)] text-[color:var(--color-paper-light)] text-[12px] hover:bg-[color:var(--color-brass-deep)] transition-colors"
          >
            <Plus size={11} />
            <span className="prose-body italic">{t('bridge.wind.set.all')}</span>
          </button>
        )}
      </div>

      {!location ? (
        <div className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] py-12 text-center border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px]">
          {t('bridge.wind.no.atlas')}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
          {/* Compass diagram */}
          <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4 flex flex-col items-center">
            <svg width={COMPASS_SIZE} height={COMPASS_SIZE}>
              {/* Outer ring */}
              <circle
                cx={CENTER}
                cy={CENTER}
                r={CENTER - 6}
                fill="var(--color-paper-deep)"
                opacity={0.3}
                stroke="var(--color-border-paper)"
                strokeWidth={0.5}
              />
              {/* 8 wind sectors */}
              {WIND_BEARINGS.map((w, idx) => {
                const status = getStatus(w.wind);
                const tone = SHELTER_TONE[status];
                /* Each sector spans 45°. Compass top = 0°. */
                const startAngle = (idx * 45 - 22.5 - 90) * (Math.PI / 180);
                const endAngle = (idx * 45 + 22.5 - 90) * (Math.PI / 180);
                const r = CENTER - 8;
                const x1 = CENTER + r * Math.cos(startAngle);
                const y1 = CENTER + r * Math.sin(startAngle);
                const x2 = CENTER + r * Math.cos(endAngle);
                const y2 = CENTER + r * Math.sin(endAngle);
                const path = `M ${CENTER},${CENTER} L ${x1},${y1} A ${r},${r} 0 0 1 ${x2},${y2} Z`;

                /* Label position */
                const labelAngle = (idx * 45 - 90) * (Math.PI / 180);
                const labelR = r - 32;
                const lx = CENTER + labelR * Math.cos(labelAngle);
                const ly = CENTER + labelR * Math.sin(labelAngle);

                return (
                  <g
                    key={w.wind}
                    onClick={() => cycleWind(w.wind)}
                    style={{ cursor: 'pointer' }}
                  >
                    <path
                      d={path}
                      fill={tone}
                      opacity={status === 'unset' ? 0.3 : 0.5}
                      stroke="var(--color-paper-light)"
                      strokeWidth={1}
                    />
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="display-italic text-[12px] fill-[color:var(--color-on-paper)]"
                    >
                      {w.wind}
                    </text>
                  </g>
                );
              })}
              {/* Inner boat marker — bow points to bowHeading */}
              <circle
                cx={CENTER}
                cy={CENTER}
                r={18}
                fill="var(--color-paper-light)"
                stroke="var(--color-on-paper)"
                strokeWidth={1.5}
              />
              <text
                x={CENTER}
                y={CENTER + 4}
                textAnchor="middle"
                className="display-italic text-[11px] fill-[color:var(--color-on-paper)]"
              >
                ⚓
              </text>
              {/* North arrow */}
              <text
                x={CENTER}
                y={20}
                textAnchor="middle"
                className="display-italic text-[14px] fill-[color:var(--color-brass-deep)]"
              >
                N
              </text>
            </svg>
            <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mt-2 text-center">
              click any wind to cycle status
            </div>
          </div>

          {/* Side panel — list + counts */}
          <div className="space-y-3">
            <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
              <div className="display-italic text-[14px] text-[color:var(--color-on-paper)] mb-2">
                {location.label}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <Stat
                  count={counts.shelter}
                  total={8}
                  labelKey="shelter"
                  tone="var(--color-success)"
                  t={t}
                />
                <Stat
                  count={counts.mixed}
                  total={8}
                  labelKey="mixed"
                  tone="var(--color-brass)"
                  t={t}
                />
                <Stat
                  count={counts.expose}
                  total={8}
                  labelKey="expose"
                  tone="var(--color-coral-deep)"
                  t={t}
                />
              </div>
              <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
                {t('bridge.wind.compass.legend')}
              </div>
            </div>

            <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
              <div className="display-italic text-[13px] text-[color:var(--color-on-paper)] mb-2">
                detail
              </div>
              <ul className="space-y-1.5">
                {WIND_BEARINGS.map((w) => {
                  const status = getStatus(w.wind);
                  const tone = SHELTER_TONE[status];
                  return (
                    <li
                      key={w.wind}
                      onClick={() => cycleWind(w.wind)}
                      className="flex items-center gap-2 prose-body italic text-[12px] cursor-pointer hover:bg-[color:var(--color-paper-deep)]/30 rounded-[2px] px-1 py-0.5 transition-colors"
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: tone, opacity: status === 'unset' ? 0.3 : 0.7 }}
                      />
                      <span className="display-italic text-[13px] text-[color:var(--color-on-paper)] w-24">
                        {w.wind}
                      </span>
                      <span className="text-[color:var(--color-on-paper-muted)] tabular-nums text-[10px] w-12">
                        {w.bearing}°
                      </span>
                      <span
                        className="label-caps text-[9px] tabular-nums"
                        style={{ color: tone }}
                      >
                        {status === 'unset' ? '—' : t(`bridge.wind.${status}` as never)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  count,
  total,
  labelKey,
  tone,
  t,
}: {
  count: number;
  total: number;
  labelKey: 'shelter' | 'mixed' | 'expose';
  tone: string;
  t: ReturnType<typeof useT>;
}) {
  return (
    <div>
      <div
        className="display-italic text-[20px] tabular-nums leading-none"
        style={{ color: tone }}
      >
        {count}
      </div>
      <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mt-0.5">
        / {total} · {t(`bridge.wind.${labelKey}` as never)}
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const _unused = { Compass };
/* eslint-enable @typescript-eslint/no-unused-vars */
