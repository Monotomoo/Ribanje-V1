import { useApp } from '../../state/AppContext';
import {
  daysToShootStart,
  currentPhase,
  todaysFocus,
  episodeStatusCounts,
  antiScriptCounts,
  talentPipelineCounts,
} from '../../lib/selectors';
import { LCDCard } from '../primitives/LCDCard';
import type { ViewKey } from '../../types';

interface Props {
  onJump?: (view: ViewKey) => void;
}

/* Production-first hero (no finance). Four non-financial KPIs + today's focus. */
export function OverviewHero({ onJump }: Props) {
  const { state } = useApp();
  const days = daysToShootStart();
  const phase = currentPhase(state);
  const focus = todaysFocus(state);
  const ec = episodeStatusCounts(state);
  const totalEpisodes = state.episodes.length + state.specials.length;
  const lockedOrShot = (ec.shot ?? 0) + (ec.cut ?? 0) + (ec.locked ?? 0);
  const moments = antiScriptCounts(state);
  const totalMoments = moments.planned + moments.captured + moments.cut;
  const talents = talentPipelineCounts(state);
  const totalTalents = Object.values(talents).reduce((s, v) => s + v, 0);

  /* Days-to-shoot display */
  const daysValue =
    days < 0 ? `+${Math.abs(days) + 1}` : days === 0 ? 'today' : `${days}`;
  const daysSub =
    days < 0
      ? `day ${Math.abs(days) + 1} of shoot`
      : days === 0
      ? 'shoot starts'
      : days === 1
      ? 'day to shoot'
      : 'days to shoot';

  /* Phase progress %  */
  let phaseProgress = 0;
  let phaseSub = 'no active phase';
  if (phase) {
    const startMs = new Date(phase.start + 'T00:00:00Z').getTime();
    const endMs = new Date(phase.end + 'T23:59:59Z').getTime();
    const now = Date.now();
    phaseProgress = Math.max(
      0,
      Math.min(100, ((now - startMs) / (endMs - startMs)) * 100)
    );
    phaseSub = `${Math.round(phaseProgress)}% through · ends ${fmtMonth(phase.end)}`;
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-4 gap-5">
        <LCDCard
          label="Days to shoot"
          value={daysValue}
          sub={daysSub}
          trend={days <= 14 && days >= 0 ? 'down' : 'flat'}
        />
        <LCDCard
          label="Phase"
          value={phase ? phase.label : 'between'}
          sub={phaseSub}
        />
        <LCDCard
          label="Episodes locked"
          value={`${lockedOrShot}/${totalEpisodes}`}
          sub={
            lockedOrShot === 0
              ? `${ec.concept ?? 0} in concept · ${ec.scripted ?? 0} scripted`
              : 'shot · cut · locked'
          }
          trend={lockedOrShot >= 1 ? 'up' : 'flat'}
        />
        <LCDCard
          label="Stories"
          value={`${totalMoments}`}
          sub={
            totalMoments === 0
              ? 'no anti-script moments yet'
              : `${moments.planned} planned · ${moments.captured} captured · ${talents.confirmed}/${totalTalents || 0} talents`
          }
          trend={moments.captured > 0 ? 'up' : 'flat'}
        />
      </div>

      {focus.length > 0 && <TodaysFocus focus={focus} onJump={onJump} />}
    </section>
  );
}

function TodaysFocus({
  focus,
  onJump,
}: {
  focus: ReturnType<typeof todaysFocus>;
  onJump?: (view: ViewKey) => void;
}) {
  return (
    <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-l-2 border-l-[color:var(--color-brass)] border-y-[color:var(--color-border-paper)] border-r-[color:var(--color-border-paper)] rounded-r-[3px] px-7 py-5">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="label-caps text-[color:var(--color-brass-deep)]">
          Today's focus
        </span>
        <div className="flex-1 h-px bg-[color:var(--color-border-brass)]/50" />
      </div>
      <ul className="grid grid-cols-2 gap-x-8 gap-y-3">
        {focus.map((f, i) => {
          const tone =
            f.tone === 'coral'
              ? 'text-[color:var(--color-coral-deep)]'
              : f.tone === 'success'
              ? 'text-[color:var(--color-success)]'
              : 'text-[color:var(--color-brass-deep)]';
          return (
            <li key={i} className="flex items-baseline gap-3">
              <span className={`text-[10px] mt-1 ${tone}`}>◆</span>
              <div className="flex-1 min-w-0">
                <div className="display-italic text-[16px] text-[color:var(--color-on-paper)] leading-tight">
                  {f.title}
                </div>
                {f.hint && (
                  <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-1">
                    {f.hint}
                  </div>
                )}
              </div>
              {f.view && onJump && (
                <button
                  type="button"
                  onClick={() => onJump(f.view!)}
                  className="label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] rounded-full px-2.5 py-[1px] transition-colors shrink-0"
                >
                  open
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function fmtMonth(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
