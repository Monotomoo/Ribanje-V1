import type {
  AppState,
  EpisodeStatus,
  MomentStatus,
  Risk,
  RiskStatus,
  SchedulePhase,
  Milestone,
  TalentStatus,
} from '../types';

export const SHOOT_START_ISO = '2026-10-01';
export const SHOOT_END_ISO = '2026-10-31';

const SHOOT_START = new Date(SHOOT_START_ISO + 'T00:00:00Z').getTime();
const SHOOT_END = new Date(SHOOT_END_ISO + 'T00:00:00Z').getTime();

export function daysToShootStart(): number {
  const diff = SHOOT_START - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function shootDayCount(): number {
  return Math.round((SHOOT_END - SHOOT_START) / (1000 * 60 * 60 * 24));
}

export function currentPhase(state: AppState): SchedulePhase | null {
  const now = Date.now();
  const active = state.schedulePhases.find((p) => {
    const s = new Date(p.start + 'T00:00:00Z').getTime();
    const e = new Date(p.end + 'T23:59:59Z').getTime();
    return now >= s && now <= e;
  });
  return active ?? null;
}

export interface UpcomingMilestone {
  milestone: Milestone;
  days: number;
}

export function upcomingMilestones(
  state: AppState,
  limit = 3
): UpcomingMilestone[] {
  const now = Date.now();
  return state.milestones
    .map((m) => ({
      milestone: m,
      days: Math.ceil(
        (new Date(m.date + 'T00:00:00Z').getTime() - now) /
          (1000 * 60 * 60 * 24)
      ),
    }))
    .filter((m) => m.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, limit);
}

export function episodeStatusCounts(
  state: AppState
): Record<EpisodeStatus, number> {
  const out: Record<EpisodeStatus, number> = {
    concept: 0,
    scripted: 0,
    shot: 0,
    cut: 0,
    locked: 0,
  };
  for (const ep of [...state.episodes, ...state.specials]) {
    out[ep.status] = (out[ep.status] ?? 0) + 1;
  }
  return out;
}

export function antiScriptCounts(state: AppState): Record<MomentStatus, number> {
  const out: Record<MomentStatus, number> = { planned: 0, captured: 0, cut: 0 };
  for (const m of state.antiScriptMoments) out[m.status] += 1;
  return out;
}

export function talentPipelineCounts(
  state: AppState
): Record<TalentStatus, number> {
  const out: Record<TalentStatus, number> = {
    prospect: 0,
    contacted: 0,
    confirmed: 0,
    declined: 0,
  };
  for (const t of state.talents) out[t.status] += 1;
  return out;
}

export interface CrewRosterFill {
  total: number;
  filled: number;
}

/* "Filled" = crew member has both a name and a role assigned. */
export function crewRosterFill(state: AppState): CrewRosterFill {
  let filled = 0;
  for (const m of state.crew) {
    if (m.name && m.role) filled += 1;
  }
  return { filled, total: state.crew.length };
}

export interface RiskSummary {
  total: number;
  highHigh: number;
  mitigated: number;
  byStatus: Record<RiskStatus, number>;
  /* Naive aggregate score using the 1–5 scales when present, else legacy 2-axis */
  totalScore: number;
  residualScore: number;
}

export function riskSummary(state: AppState): RiskSummary {
  const byStatus: Record<RiskStatus, number> = {
    open: 0,
    mitigating: 0,
    mitigated: 0,
    accepted: 0,
    closed: 0,
  };
  let highHigh = 0;
  let mitigated = 0;
  let totalScore = 0;
  let residualScore = 0;

  for (const r of state.risks) {
    const s = r.status ?? 'open';
    byStatus[s] = (byStatus[s] ?? 0) + 1;
    if (r.probability === 'high' && r.impact === 'high') highHigh += 1;
    if (s === 'mitigated' || s === 'closed') mitigated += 1;

    const p = r.probabilityScale ?? legacyScale(r.probability);
    const i = r.impactScale ?? legacyScale(r.impact);
    totalScore += p * i;
    const rp = r.residualP ?? p;
    const ri = r.residualI ?? i;
    residualScore += rp * ri;
  }

  return {
    total: state.risks.length,
    highHigh,
    mitigated,
    byStatus,
    totalScore,
    residualScore,
  };
}

function legacyScale(axis: 'low' | 'high'): 1 | 2 | 3 | 4 | 5 {
  return axis === 'high' ? 4 : 2;
}

export interface SponsorHealth {
  target: number;             // sum of expectedAmount across all sponsors
  committed: number;
  pitched: number;
  gap: number;
  pctToTarget: number;        // committed / target * 100
}

export function sponsorHealth(state: AppState): SponsorHealth {
  let target = 0;
  let committed = 0;
  let pitched = 0;
  for (const s of state.sponsors) {
    target += s.expectedAmount;
    if (s.status === 'committed') committed += s.expectedAmount;
    if (s.status === 'pitched') pitched += s.expectedAmount;
  }
  const gap = Math.max(0, target - committed);
  const pctToTarget = target > 0 ? (committed / target) * 100 : 0;
  return { target, committed, pitched, gap, pctToTarget };
}

/* Rolled-up counts of journal / catches / meals / refs per episode for display */
export function episodeContentCounts(state: AppState): {
  catches: number;
  meals: number;
  references: number;
  journal: number;
  antiScript: number;
} {
  return {
    catches: state.catches.length,
    meals: state.meals.length,
    references: state.references.length,
    journal: state.journalEntries.length,
    antiScript: state.antiScriptMoments.length,
  };
}

/* "Today's focus" — small, useful, computed suggestions. */
export interface FocusItem {
  title: string;
  hint?: string;
  view?: import('../types').ViewKey;
  tone?: 'brass' | 'coral' | 'success';
}

export function todaysFocus(state: AppState): FocusItem[] {
  const out: FocusItem[] = [];

  /* HAVC dev application proximity */
  const havcDev = state.milestones.find((m) =>
    m.label.toLowerCase().includes('havc dev')
  );
  if (havcDev) {
    const days = Math.ceil(
      (new Date(havcDev.date + 'T00:00:00Z').getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );
    if (days >= 0 && days <= 60) {
      out.push({
        title: `HAVC dev application in ${days} day${days === 1 ? '' : 's'}`,
        hint: 'open the pitch deck and review the funding stack',
        view: 'pitch',
        tone: days <= 14 ? 'coral' : 'brass',
      });
    }
  }

  /* Episode statuses that need attention */
  const ec = episodeStatusCounts(state);
  if (ec.concept >= 4) {
    out.push({
      title: `${ec.concept} episodes still in concept`,
      hint: 'lock synopses and start anti-script moments',
      view: 'episodes',
      tone: 'brass',
    });
  }

  /* Talent confirmations short of episodes */
  const talent = talentPipelineCounts(state);
  if (talent.confirmed < 3) {
    out.push({
      title: `${talent.confirmed} confirmed talents · ${talent.prospect} still prospect`,
      hint: 'confirm two more before HAVC dev',
      view: 'episodes',
      tone: 'brass',
    });
  }

  /* Sponsor pipeline gap */
  const sh = sponsorHealth(state);
  if (sh.gap > 0 && sh.committed === 0) {
    out.push({
      title: `Sponsor target ${sh.target}k · 0 committed`,
      hint: 'work the pipeline — pick a tier I to pitch this week',
      view: 'sponsors',
      tone: 'coral',
    });
  } else if (sh.pctToTarget < 30 && sh.target > 0) {
    out.push({
      title: `${Math.round(sh.pctToTarget)}% of sponsor target committed`,
      hint: 'pipeline needs energy',
      view: 'sponsors',
      tone: 'brass',
    });
  }

  /* High-high risk count */
  const rs = riskSummary(state);
  if (rs.highHigh >= 2) {
    out.push({
      title: `${rs.highHigh} critical risks (high × high)`,
      hint: 'mitigation plans — not optional',
      view: 'risks',
      tone: 'coral',
    });
  }

  /* Days to shoot */
  const days = daysToShootStart();
  if (days >= 0 && days <= 90) {
    out.push({
      title:
        days === 0
          ? 'Shoot starts today'
          : `${days} day${days === 1 ? '' : 's'} to shoot start`,
      hint: 'check kit, anchorages, talent confirms',
      view: 'schedule',
      tone: days <= 14 ? 'coral' : 'success',
    });
  } else if (days < 0 && days >= -30) {
    out.push({
      title: `Day ${Math.abs(days) + 1} of shoot`,
      hint: 'log today in the journal',
      view: 'journal',
      tone: 'success',
    });
  }

  return out.slice(0, 4);
}
