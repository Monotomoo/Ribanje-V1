import { useMemo } from 'react';
import {
  ArrowRight,
  Clapperboard,
  Eye,
  Power,
  Sun,
  Sunset,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import {
  countShotStatus,
  resolveShootDay,
  shotsForShootDay,
  sunTimesFor,
} from './productionSelectors';
import { LiveConditionsFeed } from '../conditions/LiveConditionsFeed';
import { CameraStatusStrip } from '../dop/CameraStatusStrip';
import { SurpriseCaptureLog } from '../surprise/SurpriseCaptureLog';
import { LiveRollCockpit } from '../dop/LiveRollCockpit';
import { CrewPositionBoard } from './CrewPositionBoard';
import { TwoBoatTimeline } from '../schedule/TwoBoatTimeline';
import { RiskTriggerWatch } from './RiskTriggerWatch';
import { ProductionPulse } from './ProductionPulse';
import { ProductionHeatmap } from './ProductionHeatmap';

/* ---------- Show Day Shell (Phase 12) ----------

   Activated by toggling state.showDayMode. The Production module flips
   from a planning UI to a kiosk-style operational view designed for the
   boat: bigger fonts, fewer chrome elements, hero "next shot" card front
   and centre, then the live surfaces in a stack.

   No tabs in this mode — just Today's surfaces, all visible, scrollable.
   A persistent EXIT SHOW DAY button lives in the corner to flip back.

   Used in:
     · ProductionShell when state.showDayMode === true */

export function ShowDayShell() {
  const { state, dispatch } = useApp();
  const resolved = resolveShootDay(state, undefined);

  if (!resolved) {
    return (
      <div className="text-center py-20">
        <div className="prose-body italic text-[16px] text-[color:var(--color-on-paper-muted)]">
          No shoot days configured. Add shoot days in Schedule first.
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'TOGGLE_SHOW_DAY_MODE', on: false })}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] hover:bg-[color:var(--color-paper-deep)] transition-colors"
        >
          <Power size={11} />
          <span className="prose-body italic">exit show day</span>
        </button>
      </div>
    );
  }

  const { day, index, total, episode, anchorage } = resolved;
  const shots = shotsForShootDay(state, day);
  const counts = countShotStatus(shots);
  const sun = anchorage ? sunTimesFor(day.date, anchorage.lat, anchorage.lng) : null;

  /* "Next shot up" — the next un-captured shot in the day plan. */
  const nextShot = useMemo(() => {
    return shots.find((s) => s.status === 'planned');
  }, [shots]);

  return (
    <div className="show-day-shell space-y-8 max-w-[1100px] mx-auto">
      {/* Banner */}
      <div className="bg-[color:var(--color-on-paper)] text-[color:var(--color-paper-light)] rounded-[3px] p-5 flex items-baseline justify-between">
        <div>
          <div className="label-caps text-[color:var(--color-brass)] mb-1">
            Show day mode
          </div>
          <h1 className="display-italic text-[44px] leading-tight">
            Day {index} of {total}
            {episode && (
              <>
                <span className="text-[color:var(--color-paper-deep)] mx-3">·</span>
                <span>Ep {episode.number}</span>
              </>
            )}
          </h1>
          <div className="prose-body italic text-[16px] text-[color:var(--color-paper-deep)] mt-2">
            {fmtIsoDate(day.date)}
            {anchorage && ` · ${anchorage.label}`}
            {sun && (
              <>
                <span className="mx-2">·</span>
                <Sun size={14} className="inline -mt-0.5" />
                <span className="tabular-nums ml-1">
                  {fmtTime(sun.sunrise)} → {fmtTime(sun.sunset)}
                </span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'TOGGLE_SHOW_DAY_MODE', on: false })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[3px] bg-[color:var(--color-paper-light)]/10 border-[0.5px] border-[color:var(--color-paper-light)]/30 text-[color:var(--color-paper-light)] text-[12px] hover:bg-[color:var(--color-paper-light)]/20 transition-colors"
        >
          <Power size={12} />
          <span className="display-italic">exit show day</span>
        </button>
      </div>

      {/* Next shot card */}
      <div className="bg-[color:var(--color-brass)]/10 border-[1px] border-[color:var(--color-brass)] rounded-[3px] p-6">
        <div className="flex items-baseline justify-between mb-3">
          <div className="label-caps text-[color:var(--color-brass-deep)]">
            <Eye size={11} className="inline -mt-0.5 mr-1" />
            Next shot up
          </div>
          <div className="prose-body italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums">
            {counts.captured}
            <span className="text-[color:var(--color-on-paper-muted)]">
              {' / '}
              {counts.total} captured
            </span>
          </div>
        </div>

        {nextShot ? (
          <div>
            <h2 className="display-italic text-[36px] text-[color:var(--color-on-paper)] leading-tight mb-2">
              <span className="tabular-nums text-[color:var(--color-brass-deep)] mr-3">
                {nextShot.number}
              </span>
              {nextShot.description || 'untitled shot'}
            </h2>
            <div className="prose-body italic text-[18px] text-[color:var(--color-on-paper-muted)]">
              cam {nextShot.cameraSlot}
              {nextShot.framing ? ` · ${nextShot.framing}` : ''}
              {nextShot.movement ? ` · ${nextShot.movement}` : ''}
              {nextShot.audioPlan ? ` · ${nextShot.audioPlan}` : ''}
              {nextShot.lensId && (
                <>
                  {' · lens '}
                  <span className="text-[color:var(--color-on-paper)]">
                    {state.dopKit.find((k) => k.id === nextShot.lensId)?.label ?? '?'}
                  </span>
                </>
              )}
            </div>
            {nextShot.notes && (
              <div className="prose-body italic text-[15px] text-[color:var(--color-on-paper)] mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-brass)]/30">
                {nextShot.notes}
              </div>
            )}
          </div>
        ) : (
          <div className="display-italic text-[28px] text-[color:var(--color-on-paper-muted)] py-2">
            All planned shots captured.
            <span className="prose-body italic text-[16px] block mt-1">
              The unplanned moment is now the gold. Tap surprise capture.
            </span>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2">
          <Clapperboard size={14} className="text-[color:var(--color-brass-deep)]" />
          <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
            {shots.length === 0
              ? 'no shots planned today'
              : `${shots.length} shots in the day plan · roll/cut buttons below`}
          </span>
          <ArrowRight
            size={11}
            className="text-[color:var(--color-on-paper-faint)] ml-1"
          />
        </div>
      </div>

      {/* Production Pulse — health at-a-glance */}
      <ProductionPulse date={day.date} />

      {/* Live Roll Cockpit — main shoot tool */}
      <LiveRollCockpit />

      {/* Live Conditions Feed */}
      <LiveConditionsFeed date={day.date} locationId={anchorage?.id} />

      {/* Camera Status Strip — full grid, not compact */}
      <CameraStatusStrip date={day.date} />

      {/* Surprise Capture Log — full mode */}
      <SurpriseCaptureLog
        episodeId={episode?.id}
        locationId={anchorage?.id}
        date={day.date}
      />

      {/* Crew Position Board — full grid */}
      <CrewPositionBoard date={day.date} />

      {/* Two-Boat Timeline — full editor */}
      <TwoBoatTimeline date={day.date} />

      {/* Risk Trigger Watch — full surface */}
      <RiskTriggerWatch date={day.date} />

      {/* Production Heatmap — coverage map across the whole shoot */}
      <ProductionHeatmap groupBy="scene" compact />

      {/* Sundown reminder */}
      {sun && (
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4 flex items-center gap-3">
          <Sunset size={16} className="text-[color:var(--color-brass-deep)]" />
          <div className="flex-1">
            <div className="display-italic text-[15px] text-[color:var(--color-on-paper)]">
              Golden hour ends {fmtTime(sun.sunset)}
            </div>
            <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
              Wrap planning starts after sunset. Switch to Wrap tab when the day is done.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

function fmtIsoDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function fmtTime(d: Date | null | undefined): string {
  if (!d) return '—';
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
