import { useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { ShootDay } from '../../types';
import { PrintLayout } from '../primitives/PrintLayout';
import {
  antiScriptForShootDay,
  catchesForShootDay,
  fmtTime,
  mealsForShootDay,
  shotsForShootDay,
  sunTimesFor,
} from './productionSelectors';

interface Props {
  shootDay: ShootDay;
  dayIndex: number;
  totalDays: number;
  onClose: () => void;
}

/* Daily Call Sheet — A4 portrait. Clean print layout pulling everything
   crew needs to read with morning coffee. Triggered from the Wrap tab. */
export function DailyCallSheetPrint({ shootDay, dayIndex, totalDays, onClose }: Props) {
  const { state } = useApp();

  /* Lock body scroll while modal open */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* Esc closes */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const allEpisodes = [...state.episodes, ...state.specials];
  const episode = shootDay.episodeId
    ? allEpisodes.find((e) => e.id === shootDay.episodeId)
    : null;
  const anchorage = shootDay.anchorageId
    ? state.locations.find((l) => l.id === shootDay.anchorageId)
    : null;
  const shots = shotsForShootDay(state, shootDay);
  const antiScript = antiScriptForShootDay(state, shootDay);
  const catches = catchesForShootDay(state, shootDay);
  const meals = mealsForShootDay(state, shootDay);
  const safety = state.safetyDays.find((s) => s.date === shootDay.date);
  const wrap = state.wrapEntries.find((w) => w.date === shootDay.date);
  const sun = anchorage ? sunTimesFor(shootDay.date, anchorage.lat, anchorage.lng) : null;

  return (
    <div className="fixed inset-0 z-40 bg-[color:var(--color-chrome-deep)]/85 backdrop-blur-sm overflow-y-auto print:relative print:bg-transparent print:overflow-visible print:p-0">
      {/* Toolbar (screen-only) */}
      <div className="sticky top-0 left-0 right-0 z-10 bg-[color:var(--color-chrome)] border-b-[0.5px] border-[color:var(--color-border-chrome-strong)] px-6 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-baseline gap-4">
          <h2 className="display-italic text-[20px] text-[color:var(--color-on-chrome)]">
            Daily Call Sheet
          </h2>
          <span className="prose-body italic text-[12px] text-[color:var(--color-on-chrome-muted)]">
            Day {dayIndex} of {totalDays}
            {episode && ` · Ep ${episode.number} ${episode.title}`}
            {anchorage && ` · ${anchorage.label}`}
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
          header={`Daily Call Sheet · Day ${dayIndex} / ${totalDays}`}
          footer="Ribanje 2026 — outer Adriatic documentary · v0.9 dashboard"
          dateStamp={shootDay.date}
        >
          {/* Hero */}
          <section className="mb-8">
            <div className="flex items-baseline justify-between mb-2">
              <h1 className="display-italic text-[42px] text-[color:var(--color-on-paper)] leading-none">
                {episode ? `${episode.title}` : 'Day'}
              </h1>
              <span className="label-caps text-[color:var(--color-brass-deep)]">
                {fmtIsoDate(shootDay.date)}
              </span>
            </div>
            {episode && (
              <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
                Episode {episode.number}{episode.theme ? ` · ${episode.theme}` : ''}
                {anchorage && ` · ${anchorage.label}`}
              </p>
            )}
          </section>

          {/* Sun + light */}
          {sun && (
            <section className="mb-8">
              <SectionLabel>Light</SectionLabel>
              <div className="grid grid-cols-5 gap-4 mt-3">
                <PrintStat label="Sunrise" value={fmtTime(sun.sunrise)} />
                <PrintStat label="Golden ends" value={fmtTime(sun.goldenMorningEnd)} />
                <PrintStat label="Solar noon" value={fmtTime(sun.solarNoon)} />
                <PrintStat label="Golden starts" value={fmtTime(sun.goldenEveningStart)} />
                <PrintStat label="Sunset" value={fmtTime(sun.sunset)} />
              </div>
            </section>
          )}

          {/* Crew */}
          {state.crew.length > 0 && (
            <section className="mb-8">
              <SectionLabel>Crew on duty</SectionLabel>
              <ul className="grid grid-cols-2 gap-x-7 gap-y-2 mt-3">
                {state.crew.map((c) => {
                  const w = state.walkieChannels.find((wc) => wc.crewId === c.id);
                  return (
                    <li key={c.id} className="flex items-baseline justify-between gap-3">
                      <span className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
                        {c.name}{' '}
                        <span className="text-[color:var(--color-on-paper-muted)]">
                          · {c.role}
                        </span>
                      </span>
                      {w && (
                        <span className="label-caps text-[color:var(--color-brass-deep)] tabular-nums whitespace-nowrap">
                          ch {w.primary}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Shots */}
          {shots.length > 0 && (
            <section className="mb-8">
              <SectionLabel>Shot list ({shots.length})</SectionLabel>
              <table className="w-full mt-3 text-[12px]">
                <thead>
                  <tr className="border-b-[0.5px] border-[color:var(--color-border-paper-strong)]">
                    <th className="text-left label-caps text-[color:var(--color-brass-deep)] pb-1.5">#</th>
                    <th className="text-left label-caps text-[color:var(--color-brass-deep)] pb-1.5">description</th>
                    <th className="text-left label-caps text-[color:var(--color-brass-deep)] pb-1.5">cam</th>
                    <th className="text-left label-caps text-[color:var(--color-brass-deep)] pb-1.5">framing</th>
                    <th className="text-left label-caps text-[color:var(--color-brass-deep)] pb-1.5">audio</th>
                    <th className="text-left label-caps text-[color:var(--color-brass-deep)] pb-1.5">status</th>
                  </tr>
                </thead>
                <tbody>
                  {shots.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b-[0.5px] border-[color:var(--color-border-paper)]/60"
                    >
                      <td className="py-1.5 prose-body italic tabular-nums text-[color:var(--color-brass-deep)]">
                        {s.number}
                      </td>
                      <td className="py-1.5 prose-body italic text-[color:var(--color-on-paper)]">
                        {s.description || '—'}
                      </td>
                      <td className="py-1.5 prose-body italic text-[color:var(--color-on-paper-muted)]">
                        {s.cameraSlot}
                      </td>
                      <td className="py-1.5 prose-body italic text-[color:var(--color-on-paper-muted)]">
                        {s.framing ?? '—'}
                      </td>
                      <td className="py-1.5 prose-body italic text-[color:var(--color-on-paper-muted)]">
                        {s.audioPlan ?? '—'}
                      </td>
                      <td className="py-1.5 prose-body italic text-[color:var(--color-on-paper-muted)]">
                        {s.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Anti-script + catch + meal */}
          <section className="mb-8 grid grid-cols-3 gap-7">
            <div>
              <SectionLabel>Anti-script targets</SectionLabel>
              {antiScript.length === 0 ? (
                <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-2">—</p>
              ) : (
                <ul className="space-y-1.5 mt-2">
                  {antiScript.slice(0, 6).map((m) => (
                    <li
                      key={m.id}
                      className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]"
                    >
                      {m.title}
                      {m.who && (
                        <span className="text-[color:var(--color-on-paper-muted)]">
                          {' · '}
                          {m.who}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <SectionLabel>Catch target</SectionLabel>
              {catches.length === 0 ? (
                <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-2">—</p>
              ) : (
                <ul className="space-y-1.5 mt-2">
                  {catches.slice(0, 4).map((c) => (
                    <li
                      key={c.id}
                      className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]"
                    >
                      {c.fishCro || c.fishEng || 'unnamed'}
                      {c.method && (
                        <span className="text-[color:var(--color-on-paper-muted)]">
                          {' · '}
                          {c.method}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <SectionLabel>Meal target</SectionLabel>
              {meals.length === 0 ? (
                <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-2">—</p>
              ) : (
                <ul className="space-y-1.5 mt-2">
                  {meals.slice(0, 4).map((m) => (
                    <li
                      key={m.id}
                      className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]"
                    >
                      {m.dish}
                      {m.wineProducer && (
                        <span className="text-[color:var(--color-on-paper-muted)]">
                          {' · '}
                          {m.wineProducer}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Safety briefing items */}
          <section className="mb-8">
            <SectionLabel>Safety brief</SectionLabel>
            <ul className="grid grid-cols-2 gap-x-7 gap-y-1.5 mt-3 text-[12px]">
              <SafetyLine on={safety?.lifeVestsIssued ?? false} label="Life vests issued · count vs crew aboard" />
              <SafetyLine on={safety?.weatherChecked ?? false} label="Weather + sea state checked" />
              <SafetyLine on={safety?.mobDrillScheduled ?? false} label="MOB drill scheduled (if applicable)" />
              <SafetyLine on={safety?.commsOK ?? false} label="Walkies + comms tested" />
              <SafetyLine on={safety?.briefingComplete ?? false} label="Briefing completed before first call" />
            </ul>
          </section>

          {/* Yesterday's tweaks (if available) */}
          {wrap?.tomorrowTweaks && (
            <section className="mb-8">
              <SectionLabel>Carried from last wrap</SectionLabel>
              <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed mt-2">
                {wrap.tomorrowTweaks}
              </p>
            </section>
          )}

          {/* Footer departure block */}
          <section className="mt-10 pt-5 border-t-[0.5px] border-[color:var(--color-border-paper-strong)]">
            <div className="grid grid-cols-3 gap-7 text-[12px]">
              <div>
                <SectionLabel>Departure</SectionLabel>
                <p className="display-italic text-[20px] text-[color:var(--color-on-paper)] mt-1 tabular-nums">
                  {sun?.sunrise
                    ? fmtTime(new Date(sun.sunrise.getTime() - 30 * 60 * 1000))
                    : '06:00'}
                </p>
                <p className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
                  ~30 min before sunrise
                </p>
              </div>
              <div>
                <SectionLabel>Brief</SectionLabel>
                <p className="display-italic text-[20px] text-[color:var(--color-on-paper)] mt-1 tabular-nums">
                  {sun?.sunrise ? fmtTime(sun.sunrise) : '06:30'}
                </p>
                <p className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
                  on the boat · life vests on
                </p>
              </div>
              <div>
                <SectionLabel>First call</SectionLabel>
                <p className="display-italic text-[20px] text-[color:var(--color-on-paper)] mt-1 tabular-nums">
                  {sun?.sunrise
                    ? fmtTime(new Date(sun.sunrise.getTime() + 30 * 60 * 1000))
                    : '07:00'}
                </p>
                <p className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
                  cameras up
                </p>
              </div>
            </div>
          </section>
        </PrintLayout>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

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

function SafetyLine({ on, label }: { on: boolean; label: string }) {
  return (
    <li className="flex items-baseline gap-2">
      <span
        className={`mt-0.5 inline-block w-3 h-3 rounded-[2px] border-[0.5px] flex items-center justify-center shrink-0 ${
          on
            ? 'border-[color:var(--color-success)] bg-[color:var(--color-success)]/15'
            : 'border-[color:var(--color-border-paper-strong)]'
        }`}
      >
        {on && (
          <span className="w-1.5 h-1.5 rounded-[1px] bg-[color:var(--color-success)]" />
        )}
      </span>
      <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]">
        {label}
      </span>
    </li>
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
