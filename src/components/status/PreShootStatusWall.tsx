import { useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Anchor,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Circle,
  Compass,
  FileText,
  GitBranch,
  Music,
  Shield,
  ShieldCheck,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { AppState } from '../../types';

/* ---------- Pre-Shoot Status Wall (Phase 12 wave 4) ----------

   THE meta-overview. One screen tells you: are we shoot-ready?

   Five horizontal bands:

     1. Days-to-shoot countdown + critical-path bar
     2. Module health (RYG per module — auto-derived)
     3. Top risks (10 most urgent / triggered)
     4. Decisions inbox (made / pending tally)
     5. Milestone ladder (next 3 milestones)

   Auto-derived completeness rules per module — no manual data entry.
   Click any module to jump there.

   Used in:
     · OverviewView (top of view)             primary surface
     · ProductionShell (could embed later)    optional */

interface ModuleHealth {
  view:
    | 'overview'
    | 'schedule'
    | 'sponsors'
    | 'crew'
    | 'risks'
    | 'episodes'
    | 'production'
    | 'map'
    | 'dop'
    | 'sound'
    | 'pitch'
    | 'journal'
    | 'contracts'
    | 'post'
    | 'distribution'
    | 'marketing'
    | 'research';
  label: string;
  Icon: LucideIcon;
  status: 'green' | 'amber' | 'red' | 'muted';
  count: number;
  total: number;
  hint: string;
}

export function PreShootStatusWall() {
  const { state, dispatch } = useApp();

  /* Days to shoot — earliest scheduled shoot day. */
  const shootCountdown = useMemo(() => {
    if (state.shootDays.length === 0) return null;
    const sorted = [...state.shootDays].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0].date;
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    const days = daysBetween(todayIso, first);
    return { firstDate: first, days, totalDays: sorted.length };
  }, [state.shootDays]);

  const modules = useMemo<ModuleHealth[]>(() => deriveModuleHealth(state), [state]);

  /* Top risks — open or in mitigation, sorted by score. */
  const topRisks = useMemo(() => {
    return [...state.risks]
      .filter((r) => r.status !== 'mitigated' && r.status !== 'closed')
      .sort((a, b) => {
        /* Use ISO-extended scale if present, else legacy axis. */
        const aScore = riskScore(a);
        const bScore = riskScore(b);
        return bScore - aScore;
      })
      .slice(0, 5);
  }, [state.risks]);

  /* Decisions logged + pending blockers from tasks. */
  const decisions = useMemo(() => {
    const made = state.decisions.length;
    const pending = state.tasks.filter(
      (t) => t.status === 'blocked' || (t.status !== 'done' && t.priority === 'high')
    ).length;
    return { made, pending };
  }, [state.decisions, state.tasks]);

  /* Next 3 milestones by date. */
  const upcomingMilestones = useMemo(() => {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    return [...state.milestones]
      .filter((m) => m.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  }, [state.milestones]);

  const overallStatus = useMemo(() => deriveOverallStatus(modules), [modules]);

  function jump(view: ModuleHealth['view']) {
    dispatch({ type: 'SET_VIEW', view });
  }

  return (
    <section className="space-y-4">
      {/* Hero band — countdown + overall status */}
      <div className="bg-[color:var(--color-on-paper)] text-[color:var(--color-paper-light)] rounded-[3px] p-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
        <div>
          <div className="label-caps text-[color:var(--color-brass)] mb-1.5">
            Pre-shoot status
          </div>
          {shootCountdown ? (
            <h2 className="display-italic text-[34px] leading-tight">
              T-minus{' '}
              <span className="tabular-nums">{Math.abs(shootCountdown.days)}</span>{' '}
              days to first shoot
              <span className="text-[color:var(--color-paper-deep)] mx-3">·</span>
              <span className="text-[color:var(--color-brass)]">
                {shootCountdown.totalDays}
              </span>
              <span className="prose-body italic text-[18px] text-[color:var(--color-paper-deep)] ml-1.5">
                shoot days planned
              </span>
            </h2>
          ) : (
            <h2 className="display-italic text-[28px] leading-tight">
              No shoot days scheduled — schedule first
            </h2>
          )}
          {shootCountdown && (
            <p className="prose-body italic text-[15px] text-[color:var(--color-paper-deep)] mt-2">
              First shoot: {fmtIsoDate(shootCountdown.firstDate)}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end justify-center">
          <OverallGauge status={overallStatus.tone} score={overallStatus.score} />
          <div className="prose-body italic text-[12px] text-[color:var(--color-paper-deep)] mt-1 text-right">
            {overallStatus.hint}
          </div>
        </div>
      </div>

      {/* Module health grid */}
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="display-italic text-[16px] text-[color:var(--color-on-paper)] flex items-center gap-2">
            <Target size={13} className="text-[color:var(--color-brass)]" />
            Module health
          </h3>
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums">
            {modules.filter((m) => m.status === 'green').length}/
            {modules.length} green
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {modules.map((m) => (
            <button
              key={m.view}
              type="button"
              onClick={() => jump(m.view)}
              className={`text-left rounded-[3px] p-2.5 border-[0.5px] transition-all ${
                m.status === 'red'
                  ? 'border-[color:var(--color-coral-deep)]/40 bg-[color:var(--color-coral-deep)]/10 hover:bg-[color:var(--color-coral-deep)]/15'
                  : m.status === 'amber'
                  ? 'border-[color:var(--color-brass)]/40 bg-[color:var(--color-brass)]/10 hover:bg-[color:var(--color-brass)]/15'
                  : m.status === 'green'
                  ? 'border-[color:var(--color-success)]/40 bg-[color:var(--color-success)]/10 hover:bg-[color:var(--color-success)]/15'
                  : 'border-[color:var(--color-border-paper)] bg-[color:var(--color-paper)] hover:bg-[color:var(--color-paper-deep)]/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <m.Icon
                  size={11}
                  className={
                    m.status === 'red'
                      ? 'text-[color:var(--color-coral-deep)]'
                      : m.status === 'amber'
                      ? 'text-[color:var(--color-brass-deep)]'
                      : m.status === 'green'
                      ? 'text-[color:var(--color-success)]'
                      : 'text-[color:var(--color-on-paper-muted)]'
                  }
                />
                <StatusDot status={m.status} />
              </div>
              <div className="display-italic text-[13px] text-[color:var(--color-on-paper)] leading-tight">
                {m.label}
              </div>
              <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mt-0.5 tabular-nums">
                {m.hint}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] tabular-nums">
                  {m.total > 0 ? `${m.count}/${m.total}` : '—'}
                </span>
                <ChevronRight size={11} className="text-[color:var(--color-on-paper-faint)]" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Three-column row: risks · decisions · milestones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top risks */}
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="display-italic text-[15px] text-[color:var(--color-on-paper)] flex items-center gap-2">
              <ShieldCheck
                size={12}
                className={
                  topRisks.length > 0
                    ? 'text-[color:var(--color-coral-deep)]'
                    : 'text-[color:var(--color-success)]'
                }
              />
              Top risks
            </h3>
            <button
              type="button"
              onClick={() => jump('risks')}
              className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-brass-deep)] transition-colors"
            >
              all →
            </button>
          </div>
          {topRisks.length === 0 ? (
            <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
              No active risks. Either you're golden or no risks logged yet.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {topRisks.map((r) => {
                const score = riskScore(r);
                return (
                  <li
                    key={r.id}
                    className="flex items-baseline gap-2 prose-body italic text-[12px]"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        score >= 12
                          ? 'bg-[color:var(--color-coral-deep)]'
                          : score >= 6
                          ? 'bg-[color:var(--color-brass)]'
                          : 'bg-[color:var(--color-on-paper-muted)]'
                      }`}
                    />
                    <span className="flex-1 text-[color:var(--color-on-paper)] truncate">
                      {r.title}
                    </span>
                    <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] tabular-nums">
                      {score || '—'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Decisions */}
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="display-italic text-[15px] text-[color:var(--color-on-paper)] flex items-center gap-2">
              <Compass size={12} className="text-[color:var(--color-brass-deep)]" />
              Decisions
            </h3>
            <button
              type="button"
              onClick={() => jump('overview')}
              className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-brass-deep)] transition-colors"
            >
              inbox →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="display-italic text-[26px] text-[color:var(--color-success)] tabular-nums leading-none">
                {decisions.made}
              </div>
              <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1">
                made
              </div>
            </div>
            <div>
              <div
                className={`display-italic text-[26px] tabular-nums leading-none ${
                  decisions.pending > 0
                    ? 'text-[color:var(--color-brass-deep)]'
                    : 'text-[color:var(--color-on-paper-muted)]'
                }`}
              >
                {decisions.pending}
              </div>
              <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1">
                pending
              </div>
            </div>
          </div>
          {decisions.pending > 0 && (
            <p className="prose-body italic text-[11px] text-[color:var(--color-brass-deep)] mt-3 leading-snug">
              {decisions.pending} pending decision{decisions.pending === 1 ? '' : 's'} —
              clear before pilot to avoid live debate on the boat.
            </p>
          )}
        </div>

        {/* Upcoming milestones */}
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="display-italic text-[15px] text-[color:var(--color-on-paper)] flex items-center gap-2">
              <Calendar size={12} className="text-[color:var(--color-brass-deep)]" />
              Next milestones
            </h3>
            <button
              type="button"
              onClick={() => jump('schedule')}
              className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-brass-deep)] transition-colors"
            >
              all →
            </button>
          </div>
          {upcomingMilestones.length === 0 ? (
            <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
              No upcoming milestones scheduled.
            </div>
          ) : (
            <ul className="space-y-2">
              {upcomingMilestones.map((m) => {
                const today = new Date();
                const todayIso = `${today.getFullYear()}-${(today.getMonth() + 1)
                  .toString()
                  .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
                const days = daysBetween(todayIso, m.date);
                return (
                  <li key={m.id} className="flex items-baseline gap-2">
                    <span
                      className={`label-caps text-[10px] tabular-nums w-12 text-right ${
                        days <= 7
                          ? 'text-[color:var(--color-coral-deep)]'
                          : days <= 30
                          ? 'text-[color:var(--color-brass-deep)]'
                          : 'text-[color:var(--color-on-paper-muted)]'
                      }`}
                    >
                      T-{days}
                    </span>
                    <span className="flex-1 prose-body italic text-[12px] text-[color:var(--color-on-paper)] truncate">
                      {m.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Module-health derivation ---------- */

function deriveModuleHealth(state: AppState): ModuleHealth[] {
  const completedTasks = state.tasks.filter((t) => t.status === 'done').length;
  const totalTasks = state.tasks.length;

  /* Schedule: % of milestones with status. */
  const milestonesWithStatus = state.milestones.filter((m) => m.status).length;

  /* Crew: how many crew with role assigned + at least one position recorded. */
  const crewWithRole = state.crew.filter((c) => c.role && c.role.length > 0).length;

  /* Episodes: % with synopsis filled (≥ 100 chars = real content). */
  const epsWithTreatment = state.episodes.filter(
    (e) => e.synopsis && e.synopsis.trim().length >= 100
  ).length;

  /* DOP / kit: how many kit items configured (status set + non-default). */
  const kitConfigured = state.dopKit.filter(
    (k) => k.status === 'ready' || k.status === 'rolling' || k.status === 'standby'
  ).length;

  /* Locations: % with backup chain. */
  const locsWithBackup = state.locations.filter((l) => (l.backupChain?.length ?? 0) > 0).length;

  /* Permits: % approved. */
  const permitsApproved = state.permits.filter((p) => p.status === 'approved').length;
  const permitsBlocking = state.permits.filter((p) => p.blocksShoot && p.status !== 'approved').length;

  /* Sponsors: % committed/pitched (closest to "secured" in current model). */
  const sponsorsSecured = state.sponsors.filter(
    (s) => s.status === 'committed' || s.status === 'pitched'
  ).length;

  /* Festivals: % with deadline date set. */
  const festivalsWithDeadline = state.festivals.filter((f) => f.deadline).length;

  /* Pitch: applications past planning phase. */
  const pitchAssets = state.applications.filter((a) => a.status !== 'planning').length;

  /* Music: cue sheet entries + klapa (currently unused but available). */
  const _musicEntries = state.cueSheet.length + state.klapa.length;

  /* Post: edit milestones non-empty. */
  const editMilestonesActive = state.editMilestones.filter((m) => m.status !== 'pending').length;

  /* Distribution: deals + sales agents. */
  const distSurfaces = state.deals.length + state.salesAgents.length;

  /* Marketing: social + press + trailer cuts. */
  const marketingAssets = state.socialPosts.length + state.pressContacts.length + state.trailerCuts.length;

  /* Research: sources tracked. */
  const researchSources = state.researchSources.length;

  /* Contracts: % signed. */
  const contractsSigned = state.contracts.filter((c) => c.status === 'signed').length;

  return [
    {
      view: 'overview',
      label: 'Overview',
      Icon: Target,
      ...quantize(totalTasks > 0 ? completedTasks / totalTasks : 0.5, totalTasks > 0),
      count: completedTasks,
      total: totalTasks,
      hint: `${completedTasks}/${totalTasks} tasks done`,
    },
    {
      view: 'schedule',
      label: 'Schedule',
      Icon: Calendar,
      ...quantize(state.milestones.length > 0 ? milestonesWithStatus / state.milestones.length : 0.3, state.milestones.length > 0),
      count: milestonesWithStatus,
      total: state.milestones.length,
      hint: `${milestonesWithStatus}/${state.milestones.length} milestones tracked`,
    },
    {
      view: 'crew',
      label: 'Crew',
      Icon: Users,
      ...quantize(state.crew.length > 0 ? crewWithRole / state.crew.length : 0, state.crew.length > 0),
      count: crewWithRole,
      total: state.crew.length,
      hint: `${state.crew.length} crew · ${crewWithRole} with roles`,
    },
    {
      view: 'risks',
      label: 'Risks',
      Icon: AlertCircle,
      ...quantize(state.risks.length > 0 ? state.risks.filter((r) => r.status === 'mitigated' || r.status === 'closed' || r.status === 'mitigating').length / state.risks.length : 0.5, state.risks.length > 0),
      count: state.risks.length,
      total: state.risks.length,
      hint: `${state.risks.length} risks logged`,
    },
    {
      view: 'episodes',
      label: 'Episodes',
      Icon: FileText,
      ...quantize(state.episodes.length > 0 ? epsWithTreatment / state.episodes.length : 0, state.episodes.length > 0),
      count: epsWithTreatment,
      total: state.episodes.length,
      hint: `${epsWithTreatment}/${state.episodes.length} have treatment`,
    },
    {
      view: 'production',
      label: 'Production',
      Icon: Camera,
      ...quantize(state.shootDays.length > 0 ? Math.min(1, state.shootDays.length / 14) : 0, state.shootDays.length > 0),
      count: state.shootDays.length,
      total: 14,
      hint: `${state.shootDays.length} shoot days planned`,
    },
    {
      view: 'map',
      label: 'Locations',
      Icon: Anchor,
      ...quantize(state.locations.length > 0 ? locsWithBackup / state.locations.length : 0, state.locations.length > 0),
      count: locsWithBackup,
      total: state.locations.length,
      hint: `${locsWithBackup}/${state.locations.length} have fallback`,
    },
    {
      view: 'dop',
      label: 'Cinematography',
      Icon: Camera,
      ...quantize(state.dopKit.length > 0 ? kitConfigured / state.dopKit.length : 0, state.dopKit.length > 0),
      count: kitConfigured,
      total: state.dopKit.length,
      hint: `${kitConfigured}/${state.dopKit.length} kit ready`,
    },
    {
      view: 'sound',
      label: 'Sound',
      Icon: Music,
      ...quantize(state.micPlacements.length > 0 ? Math.min(1, state.micPlacements.length / 10) : 0, state.micPlacements.length > 0),
      count: state.micPlacements.length,
      total: 10,
      hint: `${state.micPlacements.length} mic placements`,
    },
    {
      view: 'contracts',
      label: 'Legal & permits',
      Icon: Shield,
      ...quantize(
        permitsBlocking === 0 && state.contracts.length > 0
          ? contractsSigned / state.contracts.length
          : permitsBlocking > 0
          ? 0
          : 0.4,
        state.contracts.length > 0 || state.permits.length > 0
      ),
      count: state.permits.length + contractsSigned,
      total: state.permits.length + state.contracts.length,
      hint: permitsBlocking > 0 ? `${permitsBlocking} blocking` : `${permitsApproved} approved`,
    },
    {
      view: 'sponsors',
      label: 'Sponsors',
      Icon: Target,
      ...quantize(state.sponsors.length > 0 ? sponsorsSecured / state.sponsors.length : 0, state.sponsors.length > 0),
      count: sponsorsSecured,
      total: state.sponsors.length,
      hint: `${sponsorsSecured}/${state.sponsors.length} secured`,
    },
    {
      view: 'pitch',
      label: 'Pitch & funding',
      Icon: GitBranch,
      ...quantize(state.applications.length > 0 ? pitchAssets / state.applications.length : 0, state.applications.length > 0 || state.festivals.length > 0),
      count: pitchAssets + festivalsWithDeadline,
      total: state.applications.length + state.festivals.length,
      hint: `${festivalsWithDeadline} festivals · ${pitchAssets} apps`,
    },
    {
      view: 'post',
      label: 'Post-production',
      Icon: FileText,
      ...quantize(state.editMilestones.length > 0 ? editMilestonesActive / state.editMilestones.length : 0, state.editMilestones.length > 0),
      count: editMilestonesActive,
      total: state.editMilestones.length,
      hint: `${editMilestonesActive}/${state.editMilestones.length} edit milestones`,
    },
    {
      view: 'distribution',
      label: 'Distribution',
      Icon: GitBranch,
      ...quantize(distSurfaces > 0 ? Math.min(1, distSurfaces / 4) : 0, distSurfaces > 0),
      count: distSurfaces,
      total: 4,
      hint: `${state.deals.length} deals · ${state.salesAgents.length} agents`,
    },
    {
      view: 'marketing',
      label: 'Marketing',
      Icon: Music,
      ...quantize(marketingAssets > 0 ? Math.min(1, marketingAssets / 8) : 0, marketingAssets > 0),
      count: marketingAssets,
      total: 8,
      hint: `${state.socialPosts.length} social · ${state.trailerCuts.length} cuts`,
    },
    {
      view: 'research',
      label: 'Research',
      Icon: FileText,
      ...quantize(researchSources > 0 ? Math.min(1, researchSources / 10) : 0, researchSources > 0),
      count: researchSources,
      total: 10,
      hint: `${researchSources} sources`,
    },
    {
      view: 'journal',
      label: 'Journal',
      Icon: FileText,
      ...quantize(state.journalEntries.length > 0 ? Math.min(1, state.journalEntries.length / 30) : 0, state.journalEntries.length > 0),
      count: state.journalEntries.length,
      total: 30,
      hint: `${state.journalEntries.length} entries`,
    },
  ];
}

function quantize(ratio: number, hasData: boolean): { status: ModuleHealth['status'] } {
  if (!hasData) return { status: 'muted' };
  if (ratio >= 0.7) return { status: 'green' };
  if (ratio >= 0.3) return { status: 'amber' };
  return { status: 'red' };
}

function deriveOverallStatus(modules: ModuleHealth[]): {
  tone: 'green' | 'amber' | 'red';
  score: number;
  hint: string;
} {
  const active = modules.filter((m) => m.status !== 'muted');
  if (active.length === 0) return { tone: 'amber', score: 0, hint: 'no data yet' };
  const greens = active.filter((m) => m.status === 'green').length;
  const ambers = active.filter((m) => m.status === 'amber').length;
  const reds = active.filter((m) => m.status === 'red').length;
  const score = Math.round((greens * 100 + ambers * 50) / active.length);
  if (reds > 3) return { tone: 'red', score, hint: `${reds} modules in red` };
  if (greens >= active.length * 0.7) return { tone: 'green', score, hint: 'looking shoot-ready' };
  return { tone: 'amber', score, hint: `${greens} green · ${ambers} amber · ${reds} red` };
}

/* ---------- Status dot ---------- */

function StatusDot({ status }: { status: ModuleHealth['status'] }) {
  if (status === 'muted') {
    return <Circle size={10} className="text-[color:var(--color-on-paper-faint)]" />;
  }
  if (status === 'green') {
    return <CheckCircle2 size={10} className="text-[color:var(--color-success)]" fill="currentColor" />;
  }
  if (status === 'amber') {
    return <AlertCircle size={10} className="text-[color:var(--color-brass-deep)]" fill="currentColor" />;
  }
  return <AlertTriangle size={10} className="text-[color:var(--color-coral-deep)]" fill="currentColor" />;
}

/* ---------- Overall gauge ---------- */

function OverallGauge({
  status,
  score,
}: {
  status: 'green' | 'amber' | 'red';
  score: number;
}) {
  const color =
    status === 'green'
      ? 'var(--color-success)'
      : status === 'amber'
      ? 'var(--color-brass)'
      : 'var(--color-coral-deep)';
  const label = status === 'green' ? 'green' : status === 'amber' ? 'amber' : 'red';
  return (
    <div className="flex items-baseline gap-3">
      <div
        className="display-italic text-[44px] tabular-nums leading-none"
        style={{ color }}
      >
        {score}
      </div>
      <div className="text-right">
        <div className="display-italic text-[18px]" style={{ color }}>
          {label}
        </div>
        <div className="prose-body italic text-[11px] text-[color:var(--color-paper-deep)]">
          / 100
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function riskScore(r: { probability?: 'low' | 'high'; impact?: 'low' | 'high'; probabilityScale?: 1|2|3|4|5; impactScale?: 1|2|3|4|5 }): number {
  /* Prefer the 1-5 ISO scales if set; fall back to legacy 'low'|'high' axis
     where low=1 high=4 to keep ordering meaningful. */
  const p = r.probabilityScale ?? (r.probability === 'high' ? 4 : 1);
  const i = r.impactScale ?? (r.impact === 'high' ? 4 : 1);
  return p * i;
}

function daysBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  const a = new Date(fy, (fm ?? 1) - 1, fd ?? 1);
  const b = new Date(ty, (tm ?? 1) - 1, td ?? 1);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function fmtIsoDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
