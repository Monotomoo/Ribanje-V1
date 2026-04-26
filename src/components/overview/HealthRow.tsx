import { useApp } from '../../state/AppContext';
import {
  episodeStatusCounts,
  antiScriptCounts,
  talentPipelineCounts,
  crewRosterFill,
  riskSummary,
  sponsorHealth,
  upcomingMilestones,
} from '../../lib/selectors';
import type { EpisodeStatus, MomentStatus, TalentStatus } from '../../types';

const EPISODE_STATUS_ORDER: EpisodeStatus[] = [
  'concept',
  'scripted',
  'shot',
  'cut',
  'locked',
];
const TALENT_STATUS_ORDER: TalentStatus[] = [
  'prospect',
  'contacted',
  'confirmed',
  'declined',
];

const MOMENT_STATUS_ORDER: MomentStatus[] = ['planned', 'captured', 'cut'];

export function HealthRow() {
  const { state } = useApp();
  const ec = episodeStatusCounts(state);
  const moments = antiScriptCounts(state);
  const talent = talentPipelineCounts(state);
  const crew = crewRosterFill(state);
  const risk = riskSummary(state);
  const sponsors = sponsorHealth(state);
  const upcoming = upcomingMilestones(state, 1);

  const totalEpisodes = state.episodes.length + state.specials.length;
  const totalTalent = Object.values(talent).reduce((s, v) => s + v, 0);
  const contentCounts = {
    catches: state.catches.length,
    meals: state.meals.length,
    references: state.references.length,
  };

  return (
    <section className="grid grid-cols-3 gap-5">
      <Block heading="Production health">
        <Row
          label="Episodes"
          value={`${totalEpisodes}`}
          right={
            <SegmentBar
              segments={EPISODE_STATUS_ORDER.map((k) => ({
                key: k,
                count: ec[k],
                color: episodeColor(k),
              }))}
              total={totalEpisodes}
            />
          }
        />
        <Row
          label="Crew filled"
          value={`${crew.filled}/${crew.total}`}
          right={
            <Bar
              fill={crew.total > 0 ? crew.filled / crew.total : 0}
              color="var(--color-success)"
            />
          }
        />
        <Row
          label="Talent confirmed"
          value={`${talent.confirmed}/${totalTalent || 0}`}
          right={
            totalTalent > 0 ? (
              <SegmentBar
                segments={TALENT_STATUS_ORDER.map((k) => ({
                  key: k,
                  count: talent[k],
                  color: talentColor(k),
                }))}
                total={totalTalent}
              />
            ) : (
              <em className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
                pipeline empty
              </em>
            )
          }
        />
      </Block>

      <Block heading="Story progress">
        <Row
          label="Anti-script moments"
          value={`${moments.planned + moments.captured + moments.cut}`}
          right={
            moments.planned + moments.captured + moments.cut > 0 ? (
              <SegmentBar
                segments={MOMENT_STATUS_ORDER.map((k) => ({
                  key: k,
                  count: moments[k],
                  color: momentColor(k),
                }))}
                total={moments.planned + moments.captured + moments.cut}
              />
            ) : (
              <em className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
                start in Episodes
              </em>
            )
          }
        />
        <Row label="Catches logged" value={`${contentCounts.catches}`} />
        <Row label="Meals logged" value={`${contentCounts.meals}`} />
        <Row label="References" value={`${contentCounts.references}`} />
      </Block>

      <Block heading="Risk & sponsors">
        <Row
          label="Critical risks"
          value={`${risk.highHigh}`}
          tone={risk.highHigh > 0 ? 'coral' : 'muted'}
        />
        <Row
          label="Mitigation"
          value={`${risk.mitigated}/${risk.total}`}
          right={
            <Bar
              fill={risk.total > 0 ? risk.mitigated / risk.total : 0}
              color="var(--color-success)"
            />
          }
        />
        <Row
          label="Sponsor target"
          value={`${sponsors.target}k`}
          tone="muted"
        />
        <Row
          label="Committed"
          value={`${sponsors.committed}k`}
          right={
            <Bar
              fill={sponsors.target > 0 ? sponsors.committed / sponsors.target : 0}
              color="var(--color-brass)"
            />
          }
          tone="brass"
        />
        {upcoming[0] && (
          <Row
            label="Next milestone"
            value={`${upcoming[0].days}d`}
            sub={upcoming[0].milestone.label}
          />
        )}
      </Block>
    </section>
  );
}

function Block({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
      <header className="mb-4 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]">
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          {heading}
        </h3>
      </header>
      <ul className="space-y-3">{children}</ul>
    </article>
  );
}

function Row({
  label,
  value,
  right,
  sub,
  tone = 'default',
}: {
  label: string;
  value: string;
  right?: React.ReactNode;
  sub?: string;
  tone?: 'default' | 'muted' | 'coral' | 'brass';
}) {
  const valueColor =
    tone === 'coral'
      ? 'text-[color:var(--color-coral-deep)]'
      : tone === 'muted'
      ? 'text-[color:var(--color-on-paper-muted)]'
      : tone === 'brass'
      ? 'text-[color:var(--color-brass-deep)]'
      : 'text-[color:var(--color-on-paper)]';
  return (
    <li className="flex items-baseline gap-4">
      <div className="flex-1 min-w-0">
        <div className="label-caps text-[color:var(--color-brass-deep)]">
          {label}
        </div>
        {sub && (
          <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-0.5 truncate">
            {sub}
          </div>
        )}
      </div>
      <span
        className={`display-italic text-[22px] tabular-nums ${valueColor} shrink-0`}
      >
        {value}
      </span>
      {right && <div className="w-20 shrink-0">{right}</div>}
    </li>
  );
}

function Bar({ fill, color }: { fill: number; color: string }) {
  const pct = Math.max(0, Math.min(1, fill)) * 100;
  return (
    <div className="h-1.5 bg-[color:var(--color-paper-deep)]/60 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function SegmentBar({
  segments,
  total,
}: {
  segments: { key: string; count: number; color: string }[];
  total: number;
}) {
  if (total === 0) return null;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden bg-[color:var(--color-paper-deep)]/40">
      {segments
        .filter((s) => s.count > 0)
        .map((s) => (
          <div
            key={s.key}
            style={{
              width: `${(s.count / total) * 100}%`,
              background: s.color,
            }}
            title={`${s.key}: ${s.count}`}
          />
        ))}
    </div>
  );
}

function episodeColor(s: EpisodeStatus): string {
  switch (s) {
    case 'concept':  return 'rgba(14,30,54,0.25)';
    case 'scripted': return 'var(--color-dock)';
    case 'shot':     return 'var(--color-brass)';
    case 'cut':      return 'var(--color-steel)';
    case 'locked':   return 'var(--color-success)';
  }
}
function talentColor(s: TalentStatus): string {
  switch (s) {
    case 'prospect':  return 'rgba(14,30,54,0.25)';
    case 'contacted': return 'var(--color-dock)';
    case 'confirmed': return 'var(--color-success)';
    case 'declined':  return 'var(--color-coral)';
  }
}
function momentColor(s: MomentStatus): string {
  switch (s) {
    case 'planned':  return 'rgba(14,30,54,0.25)';
    case 'captured': return 'var(--color-success)';
    case 'cut':      return 'var(--color-coral)';
  }
}
