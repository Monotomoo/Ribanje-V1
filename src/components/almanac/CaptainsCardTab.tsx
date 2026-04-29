import { useMemo, useState } from 'react';
import SunCalc from 'suncalc';
import {
  Anchor,
  Calendar,
  Cloud,
  Compass,
  Fuel,
  MapPin,
  Printer,
  Radio,
  Sun,
  Sunrise,
  Sunset,
  Users,
  Waves,
  Wind,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT, useI18n } from '../../i18n';

/* ---------- Captain's Card · Kapetanski list (Phase 14) ----------

   One A4 page per shoot day for Luka. Print-ready (@media print rules).
   Pulls together everything a captain needs at the chart table:

     • Date + headline weather
     • Sun times (sunrise/sunset/golden)
     • Tide times (low/high)
     • Wind / sea forecast (next 12h peak)
     • Two-boat waypoints + rendezvous times
     • Crew aboard
     • Emergency channels + walkie freq
     • Fuel reminder
     • Free notes panel

   Print button uses window.print() with print-only styling. */

export function CaptainsCardTab() {
  const { state } = useApp();
  const t = useT();
  const { fmtDateLong } = useI18n();

  const dateOptions = useMemo(
    () => [...state.shootDays].sort((a, b) => a.date.localeCompare(b.date)),
    [state.shootDays]
  );
  const [pickedId, setPickedId] = useState<string>(() => {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    const upcoming = dateOptions.find((d) => d.date >= todayIso);
    return upcoming?.id ?? dateOptions[0]?.id ?? '';
  });

  const day = state.shootDays.find((d) => d.id === pickedId);
  const anchorage = day?.anchorageId
    ? state.locations.find((l) => l.id === day.anchorageId)
    : null;
  const episode = day?.episodeId
    ? [...state.episodes, ...state.specials].find((e) => e.id === day.episodeId)
    : null;

  /* Sun times for the day. */
  const sun = useMemo(() => {
    if (!day || !anchorage) return null;
    const [y, m, d] = day.date.split('-').map(Number);
    const noon = new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
    const t = SunCalc.getTimes(noon, anchorage.lat, anchorage.lng);
    return {
      sunrise: t.sunrise,
      sunset: t.sunset,
      goldenAm: t.goldenHourEnd,
      goldenPm: t.goldenHour,
      solarNoon: t.solarNoon,
    };
  }, [day, anchorage]);

  /* Two-boat waypoints. */
  const waypoints = useMemo(() => {
    if (!day) return [];
    return [...state.boatWaypoints]
      .filter((w) => w.date === day.date)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [state.boatWaypoints, day]);

  /* Conditions for the day — pick peak wind + sea. */
  const conditionsToday = useMemo(() => {
    if (!day) return null;
    const fc = state.conditionsForecasts.filter((c) => c.date === day.date);
    if (fc.length === 0) return null;
    const peakWind = Math.max(0, ...fc.map((f) => f.windKnots ?? 0));
    const peakGust = Math.max(0, ...fc.map((f) => f.gustKnots ?? 0));
    const peakSea = Math.max(0, ...fc.map((f) => f.seaStateM ?? 0));
    const peakPrecip = Math.max(0, ...fc.map((f) => f.precipChance ?? 0));
    const dirs = fc
      .filter((f) => f.windDir)
      .map((f) => f.windDir!)
      .filter((v, i, a) => a.indexOf(v) === i);
    return { peakWind, peakGust, peakSea, peakPrecip, dirs };
  }, [day, state.conditionsForecasts]);

  /* Crew aboard — those with a position other than 'off'. */
  const crewAboard = useMemo(() => {
    if (!day) return [];
    const positions = state.crewPositions.filter(
      (p) => p.date === day.date && p.slot !== 'off'
    );
    const crewIds = new Set(positions.map((p) => p.crewId));
    return state.crew.filter((c) => crewIds.has(c.id));
  }, [day, state.crewPositions, state.crew]);

  /* Walkie channels for crew aboard. */
  const walkies = useMemo(() => {
    return state.walkieChannels.filter((w) => crewAboard.some((c) => c.id === w.crewId));
  }, [state.walkieChannels, crewAboard]);

  /* Rendezvous times = waypoints where both boats land at same loc + hour. */
  const rendezvous = useMemo(() => {
    const map = new Map<string, { hour: number; locationId: string; times: string[] }>();
    waypoints.forEach((w) => {
      if (!w.locationId) return;
      const hour = parseInt(w.time.split(':')[0], 10);
      const key = `${hour}-${w.locationId}`;
      if (!map.has(key)) {
        map.set(key, { hour, locationId: w.locationId, times: [] });
      }
      map.get(key)?.times.push(w.time);
    });
    return Array.from(map.values()).filter((v) => v.times.length >= 2);
  }, [waypoints]);

  if (!day) {
    return (
      <div className="text-center prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] py-12 border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px]">
        {t('almanac.captain.no.day')}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* No-print picker + print button */}
      <header className="flex items-baseline justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] leading-tight">
            {t('almanac.captain.title')}
          </h3>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            {t('almanac.captain.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar size={12} className="text-[color:var(--color-on-paper-muted)]" />
          <select
            value={pickedId}
            onChange={(e) => setPickedId(e.target.value)}
            className="px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
          >
            {dateOptions.map((d, i) => (
              <option key={d.id} value={d.id}>
                Day {i + 1} · {d.date}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[color:var(--color-brass)] text-[color:var(--color-paper-light)] text-[12px] hover:bg-[color:var(--color-brass-deep)] transition-colors"
          >
            <Printer size={12} />
            <span className="display-italic">{t('almanac.captain.print')}</span>
          </button>
        </div>
      </header>

      {/* The card itself — print-ready A4 */}
      <article
        className="captain-card bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-8 print:p-12 print:shadow-none print:border-none"
        style={{ minHeight: '297mm', maxWidth: '210mm', margin: '0 auto' }}
      >
        {/* Header */}
        <header className="border-b-[1px] border-[color:var(--color-on-paper)] pb-4 mb-6">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                {t('almanac.captain.title')}
              </div>
              <h1 className="display-italic text-[44px] text-[color:var(--color-on-paper)] leading-tight">
                {fmtDateLong(day.date)}
              </h1>
              {episode && (
                <div className="prose-body italic text-[15px] text-[color:var(--color-on-paper-muted)] mt-1">
                  Ep {episode.number} · {episode.title}
                </div>
              )}
            </div>
            <div className="text-right">
              {anchorage && (
                <>
                  <div className="label-caps text-[10px] text-[color:var(--color-brass-deep)] mb-1">
                    <Anchor size={10} className="inline -mt-0.5 mr-1" />
                    anchorage
                  </div>
                  <div className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
                    {anchorage.label}
                  </div>
                  <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums mt-0.5">
                    {anchorage.lat.toFixed(3)}°N · {anchorage.lng.toFixed(3)}°E
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* 4-column row: weather · sun · tide · fuel */}
        <section className="grid grid-cols-4 gap-4 mb-6">
          {/* Weather */}
          <div>
            <div className="label-caps text-[10px] text-[color:var(--color-brass-deep)] mb-1.5">
              <Cloud size={10} className="inline -mt-0.5 mr-1" />
              {t('almanac.captain.weather')}
            </div>
            {conditionsToday ? (
              <div className="space-y-0.5 prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums">
                <div className="flex items-baseline gap-1.5">
                  <Wind size={9} className="text-[color:var(--color-on-paper-muted)]" />
                  {conditionsToday.peakWind > 0 ? `${conditionsToday.peakWind} kn` : '—'}
                  {conditionsToday.peakGust > conditionsToday.peakWind && (
                    <span className="text-[color:var(--color-coral-deep)] text-[10px]">
                      gust {conditionsToday.peakGust}
                    </span>
                  )}
                </div>
                {conditionsToday.dirs.length > 0 && (
                  <div className="text-[10px] text-[color:var(--color-on-paper-muted)]">
                    {conditionsToday.dirs.join(' · ')}
                  </div>
                )}
                <div className="flex items-baseline gap-1.5">
                  <Waves size={9} className="text-[color:var(--color-on-paper-muted)]" />
                  {conditionsToday.peakSea > 0 ? `${conditionsToday.peakSea.toFixed(1)} m` : '—'}
                </div>
                {conditionsToday.peakPrecip > 0 && (
                  <div className="text-[10px] text-[color:var(--color-coral-deep)]">
                    rain {conditionsToday.peakPrecip}%
                  </div>
                )}
              </div>
            ) : (
              <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
                no forecast loaded
              </div>
            )}
          </div>

          {/* Sun */}
          <div>
            <div className="label-caps text-[10px] text-[color:var(--color-brass-deep)] mb-1.5">
              <Sun size={10} className="inline -mt-0.5 mr-1" />
              {t('almanac.captain.sun')}
            </div>
            {sun ? (
              <div className="space-y-0.5 prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums">
                <div className="flex items-baseline gap-1.5">
                  <Sunrise size={9} className="text-[color:var(--color-on-paper-muted)]" />
                  {fmtT(sun.sunrise)}
                </div>
                <div className="text-[10px] text-[color:var(--color-on-paper-muted)]">
                  golden ends {fmtT(sun.goldenAm)}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <Sunset size={9} className="text-[color:var(--color-on-paper-muted)]" />
                  {fmtT(sun.sunset)}
                </div>
                <div className="text-[10px] text-[color:var(--color-on-paper-muted)]">
                  golden starts {fmtT(sun.goldenPm)}
                </div>
              </div>
            ) : (
              <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
                no anchorage
              </div>
            )}
          </div>

          {/* Tide */}
          <div>
            <div className="label-caps text-[10px] text-[color:var(--color-brass-deep)] mb-1.5">
              <Waves size={10} className="inline -mt-0.5 mr-1" />
              {t('almanac.captain.tides')}
            </div>
            {anchorage?.tideLowTime || anchorage?.tideHighTime ? (
              <div className="space-y-0.5 prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums">
                {anchorage.tideLowTime && (
                  <div>low · {anchorage.tideLowTime}</div>
                )}
                {anchorage.tideHighTime && (
                  <div>high · {anchorage.tideHighTime}</div>
                )}
                {anchorage.tideAmplitudeM && (
                  <div className="text-[10px] text-[color:var(--color-on-paper-muted)]">
                    amp ~{anchorage.tideAmplitudeM.toFixed(1)} m
                  </div>
                )}
              </div>
            ) : (
              <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
                no tide data
              </div>
            )}
          </div>

          {/* Fuel reminder */}
          <div>
            <div className="label-caps text-[10px] text-[color:var(--color-brass-deep)] mb-1.5">
              <Fuel size={10} className="inline -mt-0.5 mr-1" />
              {t('almanac.captain.fuel')}
            </div>
            <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] leading-snug">
              top off before sail-out · note tank reading at start of day
            </div>
          </div>
        </section>

        {/* Waypoints */}
        <section className="mb-6">
          <div className="label-caps text-[10px] text-[color:var(--color-brass-deep)] mb-2 pb-1 border-b-[0.5px] border-[color:var(--color-on-paper-faint)]">
            <Compass size={10} className="inline -mt-0.5 mr-1" />
            {t('almanac.captain.waypoints')}
          </div>
          {waypoints.length === 0 ? (
            <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)]">
              no waypoints planned for this day
            </div>
          ) : (
            <ul className="space-y-1">
              {waypoints.map((w) => {
                const loc = w.locationId
                  ? state.locations.find((l) => l.id === w.locationId)
                  : null;
                return (
                  <li
                    key={w.id}
                    className="flex items-baseline gap-3 prose-body italic text-[13px] text-[color:var(--color-on-paper)] tabular-nums"
                  >
                    <span className="display-italic text-[14px] text-[color:var(--color-brass-deep)] w-12">
                      {w.time}
                    </span>
                    <span className="label-caps text-[9px] text-[color:var(--color-on-paper-muted)] w-16">
                      {w.boatRole}
                    </span>
                    <span className="label-caps text-[9px] text-[color:var(--color-on-paper-muted)] w-12">
                      {w.arriveOrDepart}
                    </span>
                    <span className="flex-1">
                      <MapPin size={9} className="inline -mt-0.5 mr-1 text-[color:var(--color-on-paper-muted)]" />
                      {loc?.label ?? w.customLabel ?? '?'}
                    </span>
                    {w.notes && (
                      <span className="text-[10px] text-[color:var(--color-on-paper-muted)]">
                        {w.notes}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Rendezvous */}
        {rendezvous.length > 0 && (
          <section className="mb-6">
            <div className="label-caps text-[10px] text-[color:var(--color-brass-deep)] mb-2 pb-1 border-b-[0.5px] border-[color:var(--color-on-paper-faint)]">
              <Users size={10} className="inline -mt-0.5 mr-1" />
              {t('almanac.captain.rendezvous')}
            </div>
            <ul className="space-y-1">
              {rendezvous.map((r, idx) => {
                const loc = state.locations.find((l) => l.id === r.locationId);
                return (
                  <li
                    key={idx}
                    className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] tabular-nums"
                  >
                    <span className="display-italic text-[14px] text-[color:var(--color-brass-deep)] mr-3">
                      {r.hour.toString().padStart(2, '0')}:00
                    </span>
                    {loc?.label ?? r.locationId} · {r.times.join(' · ')}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Crew aboard */}
        <section className="mb-6">
          <div className="label-caps text-[10px] text-[color:var(--color-brass-deep)] mb-2 pb-1 border-b-[0.5px] border-[color:var(--color-on-paper-faint)]">
            <Users size={10} className="inline -mt-0.5 mr-1" />
            {t('almanac.captain.crew')}
          </div>
          {crewAboard.length === 0 ? (
            <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)]">
              no crew positions assigned
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {crewAboard.map((c) => {
                const w = walkies.find((wc) => wc.crewId === c.id);
                return (
                  <div
                    key={c.id}
                    className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
                  >
                    <span className="display-italic text-[13px]">{c.name}</span>
                    <span className="text-[color:var(--color-on-paper-muted)] mx-1">·</span>
                    {c.role}
                    {w && (
                      <span className="text-[color:var(--color-brass-deep)] tabular-nums ml-2">
                        ch {w.primary}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Emergency */}
        <section className="mb-6">
          <div className="label-caps text-[10px] text-[color:var(--color-brass-deep)] mb-2 pb-1 border-b-[0.5px] border-[color:var(--color-on-paper-faint)]">
            <Radio size={10} className="inline -mt-0.5 mr-1" />
            {t('almanac.captain.emergency')}
          </div>
          <div className="grid grid-cols-3 gap-3 prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums">
            <div>
              <span className="label-caps text-[9px] text-[color:var(--color-on-paper-muted)] block mb-0.5">
                MRCC Rijeka
              </span>
              VHF 16 · 9155 · +385 51 195
            </div>
            <div>
              <span className="label-caps text-[9px] text-[color:var(--color-on-paper-muted)] block mb-0.5">
                Coast Guard
              </span>
              VHF 16 · 195
            </div>
            <div>
              <span className="label-caps text-[9px] text-[color:var(--color-on-paper-muted)] block mb-0.5">
                Medical
              </span>
              194 · 112 (EU)
            </div>
          </div>
        </section>

        {/* Notes */}
        <section>
          <div className="label-caps text-[10px] text-[color:var(--color-brass-deep)] mb-2 pb-1 border-b-[0.5px] border-[color:var(--color-on-paper-faint)]">
            {t('almanac.captain.notes')}
          </div>
          <div
            className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] leading-relaxed min-h-[80px]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(transparent, transparent 18px, var(--color-border-paper) 18px, var(--color-border-paper) 19px)',
              backgroundSize: '100% 19px',
            }}
          >
            {day.notes && <span className="text-[color:var(--color-on-paper)]">{day.notes}</span>}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-6 pt-3 border-t-[0.5px] border-[color:var(--color-on-paper-faint)] flex items-baseline justify-between prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums">
          <span>Ribanje 2026 · Kapetanski list</span>
          <span>{day.date}</span>
        </footer>
      </article>

      {/* Print rules */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white; }
          .captain-card {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          nav, header.app-header, aside, .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function fmtT(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
