import { useMemo, useState } from 'react';
import SunCalc from 'suncalc';
import { ArrowRight, Compass, Fuel, Sun, Sunset, Anchor } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';

/* ---------- PassagePlannerTab (Phase 15) ----------
   A → B passage with:
     • Distance (haversine, in nautical miles)
     • ETA at motor (default 6 kn)
     • ETA at sail (default 4 kn)
     • Fuel estimate (typical Adriatic motor ~3 L/h at cruise)
     • Sun arc during the passage (sunrise/golden/midday/golden/sunset)

   Uses existing Locations as endpoints. */

const KNOTS_MOTOR = 6;
const KNOTS_SAIL = 4;
const MOTOR_LITERS_PER_HOUR = 3;

export function PassagePlannerTab() {
  const { state } = useApp();
  const t = useT();
  const [fromId, setFromId] = useState<string>(state.locations[0]?.id ?? '');
  const [toId, setToId] = useState<string>(state.locations[1]?.id ?? '');
  const [departHour, setDepartHour] = useState<number>(8);

  const from = state.locations.find((l) => l.id === fromId);
  const to = state.locations.find((l) => l.id === toId);

  const calc = useMemo(() => {
    if (!from || !to) return null;
    const distNm = haversineNm(from.lat, from.lng, to.lat, to.lng);
    const motorH = distNm / KNOTS_MOTOR;
    const sailH = distNm / KNOTS_SAIL;
    const fuelL = motorH * MOTOR_LITERS_PER_HOUR;
    return {
      distNm,
      motorH,
      sailH,
      fuelL,
      bearing: bearingDeg(from.lat, from.lng, to.lat, to.lng),
    };
  }, [from, to]);

  /* Sun events during passage. */
  const sunDuringPassage = useMemo(() => {
    if (!from || !calc) return null;
    const today = new Date();
    today.setHours(departHour, 0, 0, 0);
    const t1 = SunCalc.getTimes(today, from.lat, from.lng);
    const arrival = new Date(today.getTime() + calc.motorH * 60 * 60 * 1000);
    /* Filter sun events between depart and arrival. */
    const events: { label: string; time: Date }[] = [];
    if (t1.sunrise >= today && t1.sunrise <= arrival) {
      events.push({ label: 'sunrise', time: t1.sunrise });
    }
    if (t1.goldenHourEnd >= today && t1.goldenHourEnd <= arrival) {
      events.push({ label: 'golden ends', time: t1.goldenHourEnd });
    }
    if (t1.solarNoon >= today && t1.solarNoon <= arrival) {
      events.push({ label: 'solar noon', time: t1.solarNoon });
    }
    if (t1.goldenHour >= today && t1.goldenHour <= arrival) {
      events.push({ label: 'golden starts', time: t1.goldenHour });
    }
    if (t1.sunset >= today && t1.sunset <= arrival) {
      events.push({ label: 'sunset', time: t1.sunset });
    }
    return { departureTime: today, arrival, events };
  }, [from, calc, departHour]);

  return (
    <div className="space-y-5">
      <header>
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] leading-tight">
          {t('bridge.passage.title')}
        </h3>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          {t('bridge.passage.subtitle')}
        </p>
      </header>

      {/* Picker row */}
      <div className="flex items-center gap-3 flex-wrap">
        <label>
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
            {t('bridge.passage.from')}
          </div>
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className="px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)] min-w-[180px]"
          >
            {state.locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <ArrowRight size={14} className="text-[color:var(--color-brass)] mt-5" />
        <label>
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
            {t('bridge.passage.to')}
          </div>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)] min-w-[180px]"
          >
            {state.locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
            {t('bridge.passage.depart.at')}
          </div>
          <select
            value={departHour}
            onChange={(e) => setDepartHour(Number(e.target.value))}
            className="px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
          >
            {Array.from({ length: 24 }, (_, i) => i).map((h) => (
              <option key={h} value={h}>
                {h.toString().padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </label>
      </div>

      {!from || !to || !calc ? (
        <div className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] py-12 text-center border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px]">
          {t('bridge.passage.from')} → {t('bridge.passage.to')}
        </div>
      ) : fromId === toId ? (
        <div className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] py-12 text-center border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px]">
          pick two different locations
        </div>
      ) : (
        <>
          {/* Hero stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat
              icon={Compass}
              label={t('bridge.passage.distance')}
              value={`${calc.distNm.toFixed(1)} nm`}
              sub={`${calc.bearing.toFixed(0)}° bearing`}
            />
            <Stat
              icon={Anchor}
              label={t('bridge.passage.eta.motor')}
              value={fmtHours(calc.motorH)}
              sub={`@ ${KNOTS_MOTOR} kn`}
            />
            <Stat
              icon={Anchor}
              label={t('bridge.passage.eta.sail')}
              value={fmtHours(calc.sailH)}
              sub={`@ ${KNOTS_SAIL} kn`}
            />
            <Stat
              icon={Fuel}
              label={t('bridge.passage.fuel.estimate')}
              value={`${calc.fuelL.toFixed(1)} L`}
              sub={`@ ${MOTOR_LITERS_PER_HOUR} L/h`}
            />
          </div>

          {/* Departure / arrival */}
          {sunDuringPassage && (
            <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-5">
              <header className="flex items-baseline justify-between mb-3">
                <div className="display-italic text-[16px] text-[color:var(--color-on-paper)]">
                  {fmtT(sunDuringPassage.departureTime)} {from.label}
                  <ArrowRight size={11} className="inline mx-2 text-[color:var(--color-brass)]" />
                  {fmtT(sunDuringPassage.arrival)} {to.label}
                </div>
              </header>

              <div className="label-caps text-[10px] text-[color:var(--color-brass-deep)] mb-2">
                <Sun size={10} className="inline -mt-0.5 mr-1" />
                {t('bridge.passage.sun.during')}
              </div>
              {sunDuringPassage.events.length === 0 ? (
                <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
                  no sun events during passage (sun stays at same height)
                </div>
              ) : (
                <ul className="space-y-1">
                  {sunDuringPassage.events.map((e, idx) => (
                    <li
                      key={idx}
                      className="flex items-baseline gap-3 prose-body italic text-[13px] text-[color:var(--color-on-paper)] tabular-nums"
                    >
                      <span className="display-italic text-[14px] text-[color:var(--color-brass-deep)] w-16">
                        {fmtT(e.time)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        {e.label.includes('sunrise') ? (
                          <Sun size={10} />
                        ) : e.label.includes('sunset') ? (
                          <Sunset size={10} />
                        ) : (
                          <Sun size={10} />
                        )}
                        {e.label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          )}
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Compass;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-3">
      <div className="flex items-baseline gap-1.5 mb-1">
        <Icon size={11} className="text-[color:var(--color-brass-deep)]" />
        <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
          {label}
        </span>
      </div>
      <div className="display-italic text-[24px] tabular-nums leading-none text-[color:var(--color-on-paper)]">
        {value}
      </div>
      <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums mt-1">
        {sub}
      </div>
    </article>
  );
}

/* ---------- math helpers ---------- */

function haversineNm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R_KM = 6371;
  const KM_PER_NM = 1.852;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R_KM * c;
  return km / KM_PER_NM;
}

function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const λ1 = toRad(lng1);
  const λ2 = toRad(lng2);
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const brng = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return brng;
}

function fmtHours(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function fmtT(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
