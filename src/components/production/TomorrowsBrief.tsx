import { useEffect } from 'react';
import { ArrowRight, Printer, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { ShootDay } from '../../types';
import { PrintLayout } from '../primitives/PrintLayout';
import {
  antiScriptForShootDay,
  catchesForShootDay,
  fmtTime,
  mealsForShootDay,
  shootDaysSorted,
  shotsForShootDay,
  sunTimesFor,
} from './productionSelectors';

interface Props {
  todayDate: string;
  onClose: () => void;
}

/* Tomorrow's brief — the evening compile. Pulls today's wrap notes
   (what worked, what didn't, tweaks) and lays them next to tomorrow's
   shoot day plan. Hand to crew at dinner. */
export function TomorrowsBrief({ todayDate, onClose }: Props) {
  const { state } = useApp();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sorted = shootDaysSorted(state);
  const todayIdx = sorted.findIndex((d) => d.date === todayDate);
  const today = todayIdx >= 0 ? sorted[todayIdx] : null;
  const tomorrow = todayIdx >= 0 && todayIdx + 1 < sorted.length ? sorted[todayIdx + 1] : null;

  const todayWrap = state.wrapEntries.find((w) => w.date === todayDate);

  const allEpisodes = [...state.episodes, ...state.specials];
  function lookupEp(id?: string) {
    return id ? allEpisodes.find((e) => e.id === id) ?? null : null;
  }
  function lookupAnchor(id?: string) {
    return id ? state.locations.find((l) => l.id === id) ?? null : null;
  }

  const todayEp = lookupEp(today?.episodeId);
  const todayAnchor = lookupAnchor(today?.anchorageId);
  const tomorrowEp = lookupEp(tomorrow?.episodeId);
  const tomorrowAnchor = lookupAnchor(tomorrow?.anchorageId);

  const tomorrowSun =
    tomorrow && tomorrowAnchor
      ? sunTimesFor(tomorrow.date, tomorrowAnchor.lat, tomorrowAnchor.lng)
      : null;
  const tomorrowShots = tomorrow ? shotsForShootDay(state, tomorrow) : [];
  const tomorrowAntiScript = tomorrow ? antiScriptForShootDay(state, tomorrow) : [];
  const tomorrowCatches = tomorrow ? catchesForShootDay(state, tomorrow) : [];
  const tomorrowMeals = tomorrow ? mealsForShootDay(state, tomorrow) : [];

  /* Distance + ETA — stub for Tier A, just compare anchorage lat/lng. */
  let nm: string | null = null;
  if (todayAnchor && tomorrowAnchor) {
    const d = haversineNm(
      todayAnchor.lat,
      todayAnchor.lng,
      tomorrowAnchor.lat,
      tomorrowAnchor.lng
    );
    if (d > 0.5) nm = `${d.toFixed(1)} NM`;
  }

  return (
    <div className="fixed inset-0 z-40 bg-[color:var(--color-chrome-deep)]/85 backdrop-blur-sm overflow-y-auto print:relative print:bg-transparent print:overflow-visible print:p-0">
      {/* Toolbar */}
      <div className="sticky top-0 left-0 right-0 z-10 bg-[color:var(--color-chrome)] border-b-[0.5px] border-[color:var(--color-border-chrome-strong)] px-6 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-baseline gap-4">
          <h2 className="display-italic text-[20px] text-[color:var(--color-on-chrome)]">
            Tomorrow's brief
          </h2>
          <span className="prose-body italic text-[12px] text-[color:var(--color-on-chrome-muted)]">
            evening compile · today's wrap → tomorrow's plan
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 label-caps text-[color:var(--color-chrome)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
          >
            <Printer size={12} />
            <span>print A4</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[color:var(--color-on-chrome-muted)] hover:text-[color:var(--color-on-chrome)] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Print body */}
      <div className="py-10 print:py-0">
        <PrintLayout
          header="Tomorrow's brief"
          footer="Ribanje 2026 · evening compile · pin to the galley before dinner"
        >
          {/* Hero: today → tomorrow ribbon */}
          <section className="mb-8">
            <div className="grid grid-cols-[1fr_24px_1fr] items-center gap-5 mb-3">
              <div>
                <div className="label-caps text-[color:var(--color-on-paper-faint)]">
                  Today {today ? `· Day ${todayIdx + 1}` : ''}
                </div>
                <div className="display-italic text-[20px] text-[color:var(--color-on-paper-muted)] mt-1">
                  {todayEp ? `${todayEp.title}` : '—'}
                  {todayAnchor && (
                    <span className="text-[color:var(--color-on-paper-faint)] ml-2">
                      · {todayAnchor.label}
                    </span>
                  )}
                </div>
                <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] mt-0.5">
                  {today ? fmtIsoDate(today.date) : ''}
                </div>
              </div>
              <ArrowRight
                size={22}
                className="text-[color:var(--color-brass)] mx-auto"
              />
              <div>
                <div className="label-caps text-[color:var(--color-brass-deep)]">
                  Tomorrow {tomorrow ? `· Day ${todayIdx + 2}` : ''}
                </div>
                <div className="display-italic text-[28px] text-[color:var(--color-on-paper)] leading-tight mt-0.5">
                  {tomorrowEp ? tomorrowEp.title : 'No shoot day after this one'}
                  {tomorrowAnchor && (
                    <span className="text-[color:var(--color-on-paper-muted)] ml-2 text-[20px]">
                      · {tomorrowAnchor.label}
                    </span>
                  )}
                </div>
                <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-1">
                  {tomorrow ? fmtIsoDate(tomorrow.date) : ''}
                  {nm && (
                    <span className="text-[color:var(--color-brass-deep)] ml-3 tabular-nums">
                      {nm} sail
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Today's wrap → tomorrow's tweaks */}
          {todayWrap && (
            <section className="mb-8">
              <SectionLabel>Carried from today's wrap</SectionLabel>
              <div className="grid grid-cols-3 gap-7 mt-3">
                {todayWrap.whatWorked && (
                  <div>
                    <div className="label-caps text-[color:var(--color-on-paper-faint)] mb-1">
                      What worked
                    </div>
                    <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] leading-relaxed">
                      {todayWrap.whatWorked}
                    </p>
                  </div>
                )}
                {todayWrap.whatDidnt && (
                  <div>
                    <div className="label-caps text-[color:var(--color-on-paper-faint)] mb-1">
                      What didn't
                    </div>
                    <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] leading-relaxed">
                      {todayWrap.whatDidnt}
                    </p>
                  </div>
                )}
                {todayWrap.tomorrowTweaks && (
                  <div className="bg-[color:var(--color-paper)] border-l-2 border-[color:var(--color-brass)] px-3 py-2 -ml-3">
                    <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                      Tomorrow's tweaks
                    </div>
                    <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] leading-relaxed">
                      {todayWrap.tomorrowTweaks}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {tomorrow ? (
            <>
              {/* Tomorrow's light */}
              {tomorrowSun && (
                <section className="mb-8">
                  <SectionLabel>Tomorrow's light</SectionLabel>
                  <div className="grid grid-cols-5 gap-4 mt-3">
                    <PrintStat label="Sunrise" value={fmtTime(tomorrowSun.sunrise)} />
                    <PrintStat
                      label="Golden ends"
                      value={fmtTime(tomorrowSun.goldenMorningEnd)}
                    />
                    <PrintStat label="Solar noon" value={fmtTime(tomorrowSun.solarNoon)} />
                    <PrintStat
                      label="Golden starts"
                      value={fmtTime(tomorrowSun.goldenEveningStart)}
                    />
                    <PrintStat label="Sunset" value={fmtTime(tomorrowSun.sunset)} />
                  </div>
                </section>
              )}

              {/* Tomorrow's shot plan */}
              {tomorrowShots.length > 0 && (
                <section className="mb-8">
                  <SectionLabel>Tomorrow's shot plan ({tomorrowShots.length})</SectionLabel>
                  <ul className="space-y-1.5 mt-3">
                    {tomorrowShots.slice(0, 12).map((s) => (
                      <li
                        key={s.id}
                        className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
                      >
                        <span className="text-[color:var(--color-brass-deep)] tabular-nums mr-2">
                          {s.number}
                        </span>
                        {s.description || '—'}
                        <span className="text-[color:var(--color-on-paper-muted)] ml-2">
                          · cam {s.cameraSlot}
                          {s.framing ? ` · ${s.framing}` : ''}
                          {s.audioPlan ? ` · ${s.audioPlan}` : ''}
                        </span>
                      </li>
                    ))}
                    {tomorrowShots.length > 12 && (
                      <li className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] tabular-nums">
                        + {tomorrowShots.length - 12} more shots
                      </li>
                    )}
                  </ul>
                </section>
              )}

              {/* Anti-script / catch / meal three-up */}
              <section className="mb-8 grid grid-cols-3 gap-7">
                <div>
                  <SectionLabel>Don't miss</SectionLabel>
                  {tomorrowAntiScript.length === 0 ? (
                    <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-2">
                      —
                    </p>
                  ) : (
                    <ul className="space-y-1 mt-3">
                      {tomorrowAntiScript.slice(0, 5).map((m) => (
                        <li
                          key={m.id}
                          className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
                        >
                          {m.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <SectionLabel>Catch target</SectionLabel>
                  {tomorrowCatches.length === 0 ? (
                    <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-2">
                      —
                    </p>
                  ) : (
                    <ul className="space-y-1 mt-3">
                      {tomorrowCatches.slice(0, 4).map((c) => (
                        <li
                          key={c.id}
                          className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
                        >
                          {c.fishCro || c.fishEng}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <SectionLabel>Meal target</SectionLabel>
                  {tomorrowMeals.length === 0 ? (
                    <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-2">
                      —
                    </p>
                  ) : (
                    <ul className="space-y-1 mt-3">
                      {tomorrowMeals.slice(0, 4).map((m) => (
                        <li
                          key={m.id}
                          className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
                        >
                          {m.dish}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              {/* Departure block */}
              <section className="mt-10 pt-5 border-t-[0.5px] border-[color:var(--color-border-paper-strong)]">
                <div className="grid grid-cols-3 gap-7 text-[12px]">
                  <div>
                    <SectionLabel>Departure</SectionLabel>
                    <p className="display-italic text-[20px] text-[color:var(--color-on-paper)] mt-1 tabular-nums">
                      {tomorrowSun?.sunrise
                        ? fmtTime(new Date(tomorrowSun.sunrise.getTime() - 30 * 60 * 1000))
                        : '06:00'}
                    </p>
                    <p className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
                      ~30 min before sunrise
                    </p>
                  </div>
                  <div>
                    <SectionLabel>Brief</SectionLabel>
                    <p className="display-italic text-[20px] text-[color:var(--color-on-paper)] mt-1 tabular-nums">
                      {tomorrowSun?.sunrise ? fmtTime(tomorrowSun.sunrise) : '06:30'}
                    </p>
                    <p className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
                      on the boat · life vests on
                    </p>
                  </div>
                  <div>
                    <SectionLabel>First call</SectionLabel>
                    <p className="display-italic text-[20px] text-[color:var(--color-on-paper)] mt-1 tabular-nums">
                      {tomorrowSun?.sunrise
                        ? fmtTime(new Date(tomorrowSun.sunrise.getTime() + 30 * 60 * 1000))
                        : '07:00'}
                    </p>
                    <p className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
                      cameras up
                    </p>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <section className="mb-8">
              <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] leading-relaxed">
                No shoot day scheduled after today. This is the wrap. The next document is
                the post-production hand-off plan.
              </p>
            </section>
          )}
        </PrintLayout>
      </div>
    </div>
  );
}

/* Haversine distance in nautical miles. */
function haversineNm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065; // earth radius in NM
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="label-caps text-[color:var(--color-brass-deep)]">{children}</span>
      <span className="flex-1 h-px bg-[color:var(--color-border-brass)]/60" />
    </div>
  );
}

function PrintStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-caps text-[color:var(--color-on-paper-faint)]">{label}</div>
      <div className="display-italic text-[18px] text-[color:var(--color-on-paper)] tabular-nums mt-0.5">
        {value}
      </div>
    </div>
  );
}

function fmtIsoDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/* Suppress unused-import linter via re-export. */
export const _shootDayType: ShootDay | null = null;
