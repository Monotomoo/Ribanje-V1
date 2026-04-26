import { useMemo } from 'react';
import {
  AlertTriangle,
  Anchor,
  CheckCircle2,
  Circle,
  Clapperboard,
  Compass,
  Fish,
  Mic,
  Radio,
  ShieldCheck,
  Sun,
  Sunrise,
  Sunset,
  UtensilsCrossed,
  Users,
  Wind,
  Zap,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import {
  antiScriptForShootDay,
  catchesForShootDay,
  countShotStatus,
  crewForShootDay,
  fmtTime,
  mealsForShootDay,
  resolveShootDay,
  shotsForShootDay,
  sunTimesFor,
} from './productionSelectors';

interface Props {
  /* Optional override — used by the Production shell's "preview day N" picker. */
  previewDateIso?: string;
}

export function TodayTab({ previewDateIso }: Props) {
  const { state, dispatch } = useApp();
  const resolved = resolveShootDay(state, previewDateIso);

  if (!resolved) {
    return (
      <div className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
        No shoot days configured. Add shoot days in Schedule first.
      </div>
    );
  }

  const { day, index, total, daysAway, isToday, isPreShoot, isPostShoot, episode, anchorage } =
    resolved;

  const shots = shotsForShootDay(state, day);
  const counts = countShotStatus(shots);
  const crew = crewForShootDay(state, day);
  const antiScript = antiScriptForShootDay(state, day);
  const catches = catchesForShootDay(state, day);
  const meals = mealsForShootDay(state, day);

  const sun = useMemo(() => {
    if (!anchorage) return null;
    return sunTimesFor(day.date, anchorage.lat, anchorage.lng);
  }, [day.date, anchorage]);

  const safety = state.safetyDays.find((s) => s.date === day.date);
  const wrapEntry = state.wrapEntries.find((w) => w.date === day.date);

  return (
    <div className="space-y-10">
      {/* Hero strip */}
      <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-8 py-6">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
              {isToday
                ? 'Today on the boat'
                : isPreShoot
                ? `Pre-production · T-minus ${Math.abs(daysAway)} days`
                : isPostShoot
                ? `Wrap · ${Math.abs(daysAway)} days past`
                : `Day ${index} preview`}
            </div>
            <h2 className="display-italic text-[34px] text-[color:var(--color-on-paper)] leading-tight">
              Day {index} of {total}
              {episode && (
                <>
                  <span className="text-[color:var(--color-on-paper-muted)] mx-2.5">·</span>
                  <span className="text-[color:var(--color-on-paper)]">
                    Ep {episode.number} {episode.title}
                  </span>
                </>
              )}
            </h2>
            <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mt-1.5">
              {fmtIsoDate(day.date)}
              {anchorage && (
                <>
                  {' · '}
                  <Anchor size={11} className="inline -mt-0.5" />{' '}
                  {anchorage.label}
                </>
              )}
              {!anchorage && day.episodeId && ' · anchorage tbd'}
            </p>
          </div>
          {episode && (
            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'SET_VIEW', view: 'episodes' });
                dispatch({ type: 'SELECT_EPISODE', episodeId: episode.id });
              }}
              className="label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] transition-colors"
            >
              open episode →
            </button>
          )}
        </div>

        {/* Sun + weather row */}
        {sun && (
          <div className="grid grid-cols-5 gap-5 pt-5 border-t-[0.5px] border-[color:var(--color-border-brass)]/40">
            <SunStat icon={Sunrise} label="Sunrise" value={fmtTime(sun.sunrise)} />
            <SunStat
              icon={Sun}
              label="Golden ends"
              value={fmtTime(sun.goldenMorningEnd)}
              hint="morning soft light"
            />
            <SunStat icon={Sun} label="Solar noon" value={fmtTime(sun.solarNoon)} />
            <SunStat
              icon={Sunset}
              label="Golden start"
              value={fmtTime(sun.goldenEveningStart)}
              hint="evening soft light"
            />
            <SunStat icon={Sunset} label="Sunset" value={fmtTime(sun.sunset)} />
          </div>
        )}
        {!anchorage && (
          <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            Assign an anchorage to this shoot day in Schedule to see sun + light times.
          </div>
        )}
      </section>

      {/* Three-column body */}
      <div className="grid grid-cols-3 gap-6">
        {/* Today's shots */}
        <Panel
          icon={Clapperboard}
          title="Today's shots"
          headerRight={
            shots.length > 0 ? (
              <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums">
                {counts.captured}/{counts.total} captured
              </span>
            ) : null
          }
        >
          {shots.length === 0 ? (
            <Empty hint="Add scenes + shots in the Shot list tab to populate today's plan." />
          ) : (
            <ul className="space-y-2.5">
              {shots.slice(0, 8).map((s) => {
                const Icon =
                  s.status === 'captured'
                    ? CheckCircle2
                    : s.status === 'cut'
                    ? Circle
                    : Circle;
                const tone =
                  s.status === 'captured'
                    ? 'text-[color:var(--color-success)]'
                    : s.status === 'cut'
                    ? 'text-[color:var(--color-on-paper-faint)] line-through'
                    : s.status === 'deferred'
                    ? 'text-[color:var(--color-coral-deep)]'
                    : 'text-[color:var(--color-on-paper)]';
                return (
                  <li key={s.id} className="flex items-baseline gap-2.5">
                    <Icon size={11} className={`mt-1 shrink-0 ${tone}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`prose-body italic text-[13px] ${tone}`}>
                        <span className="tabular-nums text-[color:var(--color-brass-deep)] mr-1.5">
                          {s.number}
                        </span>
                        {s.description || 'untitled shot'}
                      </div>
                      <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] mt-0.5">
                        cam {s.cameraSlot}
                        {s.framing ? ` · ${s.framing}` : ''}
                        {s.movement ? ` · ${s.movement}` : ''}
                        {s.audioPlan ? ` · ${s.audioPlan}` : ''}
                      </div>
                    </div>
                  </li>
                );
              })}
              {shots.length > 8 && (
                <li className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                  + {shots.length - 8} more · open Shot list tab
                </li>
              )}
            </ul>
          )}
        </Panel>

        {/* Today's crew */}
        <Panel
          icon={Users}
          title="Today's crew"
          headerRight={
            crew.length > 0 ? (
              <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums">
                {crew.length}
              </span>
            ) : null
          }
        >
          {crew.length === 0 ? (
            <Empty hint="Add crew in Crew tab." />
          ) : (
            <ul className="space-y-2.5">
              {crew.map((c) => {
                const walkie = state.walkieChannels.find((w) => w.crewId === c.id);
                return (
                  <li key={c.id}>
                    <div className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
                      {c.name}
                    </div>
                    <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
                      {c.role}
                      {walkie && (
                        <>
                          {' · '}
                          <Radio size={9} className="inline -mt-0.5" /> ch {walkie.primary}
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* Today's kit (top-line summary) */}
        <Panel icon={Zap} title="Today's kit">
          {state.dopKit.length === 0 ? (
            <Empty hint="Tom drops kit specs in Cinematography." />
          ) : (
            <KitSummary state={state} />
          )}
        </Panel>
      </div>

      {/* Targets row — anti-script + catch + meal */}
      <div className="grid grid-cols-3 gap-6">
        <Panel icon={Compass} title="Anti-script targets" subtle="don't miss this">
          {antiScript.length === 0 ? (
            <Empty hint="Plant moments per episode in Episodes → Story." />
          ) : (
            <ul className="space-y-2.5">
              {antiScript.slice(0, 5).map((m) => {
                const tone =
                  m.status === 'captured'
                    ? 'text-[color:var(--color-success)]'
                    : m.status === 'cut'
                    ? 'text-[color:var(--color-on-paper-faint)] line-through'
                    : 'text-[color:var(--color-on-paper)]';
                return (
                  <li key={m.id}>
                    <div className={`display-italic text-[14px] ${tone}`}>
                      {m.title}
                    </div>
                    {m.who && (
                      <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
                        {m.who}
                        {m.where && ` · ${m.where}`}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel icon={Fish} title="Catch target" subtle="planned this episode">
          {catches.length === 0 ? (
            <Empty hint="Log catches in Episode → Subject." />
          ) : (
            <ul className="space-y-2.5">
              {catches.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <div className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
                    {c.fishCro || c.fishEng || 'unnamed catch'}
                  </div>
                  <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
                    {c.method}
                    {c.timeOfDay && ` · ${c.timeOfDay}`}
                    {c.weightKg && ` · ${c.weightKg}kg`}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel icon={UtensilsCrossed} title="Meal target" subtle="dish of the day">
          {meals.length === 0 ? (
            <Empty hint="Plan meals in Episode → Subject." />
          ) : (
            <ul className="space-y-2.5">
              {meals.slice(0, 4).map((m) => (
                <li key={m.id}>
                  <div className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
                    {m.dish}
                  </div>
                  {(m.wineProducer || m.wineRegion) && (
                    <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
                      {m.wineProducer}
                      {m.wineRegion && ` · ${m.wineRegion}`}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Walkie + safety */}
      <div className="grid grid-cols-2 gap-6">
        <Panel icon={Mic} title="Walkie channels">
          {state.walkieChannels.length === 0 ? (
            <Empty hint="Set RF channels per crew. Coordinate with Sound's frequency map." />
          ) : (
            <ul className="grid grid-cols-2 gap-y-2 gap-x-5">
              {state.walkieChannels.map((w) => {
                const c = state.crew.find((x) => x.id === w.crewId);
                return (
                  <li key={w.id} className="flex items-baseline justify-between">
                    <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]">
                      {c?.name || 'unknown'}
                    </span>
                    <span className="display-italic text-[15px] text-[color:var(--color-brass-deep)] tabular-nums">
                      ch {w.primary}
                      {w.backup && (
                        <span className="text-[color:var(--color-on-paper-faint)]">
                          {' / '}
                          {w.backup}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel icon={ShieldCheck} title="Safety brief" subtle="check before first call">
          <SafetyChecklist
            state={safety}
            onToggle={(field, value) => {
              if (safety) {
                dispatch({
                  type: 'UPDATE_SAFETY',
                  id: safety.id,
                  patch: { [field]: value },
                });
              } else {
                dispatch({
                  type: 'UPSERT_SAFETY',
                  day: {
                    id: `safety-${day.date}`,
                    date: day.date,
                    lifeVestsIssued: false,
                    weatherChecked: false,
                    mobDrillScheduled: false,
                    commsOK: false,
                    briefingComplete: false,
                    [field]: value,
                  },
                });
              }
            }}
          />
        </Panel>
      </div>

      {/* Today's wrap mini-preview */}
      {wrapEntry && (
        <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
          <header className="flex items-baseline justify-between mb-3">
            <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
              Today's wrap
            </h3>
            <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
              hand-fill in the Wrap tab tonight
            </span>
          </header>
          <div className="grid grid-cols-3 gap-5 text-[13px] prose-body italic text-[color:var(--color-on-paper-muted)] leading-relaxed">
            <div>
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                What worked
              </div>
              {wrapEntry.whatWorked || '—'}
            </div>
            <div>
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                What didn't
              </div>
              {wrapEntry.whatDidnt || '—'}
            </div>
            <div>
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                Tomorrow's tweaks
              </div>
              {wrapEntry.tomorrowTweaks || '—'}
            </div>
          </div>
        </section>
      )}

      {/* Pre-shoot countdown footer */}
      {isPreShoot && (
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)] text-center pt-4">
          Production starts {fmtIsoDate(day.date)}. Use these {Math.abs(daysAway)} days to fill
          scenes, shots, kit, and crew assignments — everything you populate now becomes the
          Day-1 call sheet.
        </p>
      )}
    </div>
  );
}

/* ---------- subcomponents ---------- */

function Panel({
  icon: Icon,
  title,
  subtle,
  children,
  headerRight,
}: {
  icon: typeof Sun;
  title: string;
  subtle?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-5">
      <header className="flex items-baseline justify-between gap-2 mb-3 pb-2.5 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
        <div className="flex items-baseline gap-2">
          <Icon size={12} className="text-[color:var(--color-brass-deep)]" />
          <h3 className="display-italic text-[16px] text-[color:var(--color-on-paper)]">
            {title}
          </h3>
          {subtle && (
            <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
              {subtle}
            </span>
          )}
        </div>
        {headerRight}
      </header>
      {children}
    </article>
  );
}

function SunStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Sun;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 label-caps text-[color:var(--color-brass-deep)]">
        <Icon size={10} />
        <span>{label}</span>
      </div>
      <div className="display-italic text-[20px] text-[color:var(--color-on-paper)] tabular-nums">
        {value}
      </div>
      {hint && (
        <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)]">
          {hint}
        </div>
      )}
    </div>
  );
}

function Empty({ hint }: { hint: string }) {
  return (
    <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] leading-relaxed">
      {hint}
    </p>
  );
}

function KitSummary({ state }: { state: ReturnType<typeof useApp>['state'] }) {
  /* Top-line counts; deeper kit detail lives in Cinematography. */
  const cams = state.dopKit.filter((k) => k.category === 'camera').length;
  const lenses = state.dopKit.filter((k) => k.category === 'lens').length;
  const audio = state.dopKit.filter((k) => k.category === 'audio').length;
  const stab = state.dopKit.filter((k) => k.category === 'stab').length;
  const aerial = state.dopKit.filter((k) => k.category === 'aerial').length;
  const uw = state.dopKit.filter((k) => k.category === 'underwater').length;
  return (
    <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
      <KitRow label="Cameras" count={cams} />
      <KitRow label="Lenses" count={lenses} />
      <KitRow label="Audio" count={audio} />
      <KitRow label="Stab" count={stab} />
      <KitRow label="Aerial" count={aerial} />
      <KitRow label="Underwater" count={uw} />
    </ul>
  );
}

function KitRow({ label, count }: { label: string; count: number }) {
  return (
    <li className="flex items-baseline justify-between">
      <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
        {label}
      </span>
      <span className="display-italic text-[15px] text-[color:var(--color-on-paper)] tabular-nums">
        {count}
      </span>
    </li>
  );
}

interface SafetyDayLite {
  lifeVestsIssued: boolean;
  weatherChecked: boolean;
  mobDrillScheduled: boolean;
  commsOK: boolean;
  briefingComplete: boolean;
}

const SAFETY_FIELDS: Array<{
  field: keyof SafetyDayLite;
  label: string;
  hint?: string;
}> = [
  { field: 'lifeVestsIssued', label: 'Life vests issued', hint: 'count vs crew aboard' },
  { field: 'weatherChecked', label: 'Weather + sea checked' },
  { field: 'mobDrillScheduled', label: 'MOB drill (if scheduled)' },
  { field: 'commsOK', label: 'Comms + walkies tested' },
  { field: 'briefingComplete', label: 'Briefing complete' },
];

function SafetyChecklist({
  state,
  onToggle,
}: {
  state?: SafetyDayLite;
  onToggle: (field: keyof SafetyDayLite, value: boolean) => void;
}) {
  return (
    <ul className="space-y-2">
      {SAFETY_FIELDS.map((f) => {
        const on = state?.[f.field] ?? false;
        return (
          <li key={f.field} className="flex items-baseline gap-2.5">
            <button
              type="button"
              onClick={() => onToggle(f.field, !on)}
              className={`mt-0.5 w-4 h-4 rounded-[2px] border flex items-center justify-center shrink-0 transition-colors ${
                on
                  ? 'bg-[color:var(--color-success)] border-[color:var(--color-success)]'
                  : 'bg-transparent border-[color:var(--color-border-paper-strong)] hover:border-[color:var(--color-brass)]'
              }`}
              aria-label={`Toggle ${f.label}`}
            >
              {on && <CheckCircle2 size={12} className="text-[color:var(--color-paper)]" />}
            </button>
            <div className="flex-1">
              <span
                className={`prose-body italic text-[13px] ${
                  on
                    ? 'text-[color:var(--color-on-paper)]'
                    : 'text-[color:var(--color-on-paper-muted)]'
                }`}
              >
                {f.label}
              </span>
              {f.hint && (
                <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] ml-2">
                  · {f.hint}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
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

/* Suppress unused-icon linter warning by re-exporting the icons we may use elsewhere. */
export const _icons = { AlertTriangle, Wind };
