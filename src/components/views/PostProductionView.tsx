import { useMemo, useState } from 'react';
import {
  Captions,
  CheckCircle2,
  Disc3,
  Languages,
  Music,
  Package,
  Plus,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { newId } from '../episode/shared';
import type {
  CueSheetEntry,
  CueSheetRightsStatus,
  CueSheetUsage,
  DeliverableSpec,
  EditMilestone,
  EditMilestoneStatus,
  SubtitleStatus,
  SubtitleTrack,
} from '../../types';
import { EditableText } from '../primitives/EditableText';
import { FilterableRegister, type RegisterColumn } from '../primitives/FilterableRegister';

type TabKey = 'timeline' | 'cue' | 'subs' | 'deliverables';

const PHASE_LABEL: Record<EditMilestone['phase'], string> = {
  assembly: 'Assembly',
  'rough-cut': 'Rough cut',
  'fine-cut': 'Fine cut',
  'picture-lock': 'Picture lock',
  online: 'Online',
  color: 'Color',
  'sound-mix': 'Sound mix',
  'print-master': 'Print master',
};

const PHASE_ORDER: EditMilestone['phase'][] = [
  'assembly',
  'rough-cut',
  'fine-cut',
  'picture-lock',
  'online',
  'color',
  'sound-mix',
  'print-master',
];

const STATUSES: EditMilestoneStatus[] = [
  'pending',
  'in-progress',
  'review',
  'complete',
  'blocked',
];
const STATUS_TONE: Record<EditMilestoneStatus, string> = {
  pending: 'text-[color:var(--color-on-paper-muted)]',
  'in-progress': 'text-[color:var(--color-brass-deep)]',
  review: 'text-[color:var(--color-warn)]',
  complete: 'text-[color:var(--color-success)]',
  blocked: 'text-[color:var(--color-coral-deep)]',
};

const SUB_STATUSES: SubtitleStatus[] = [
  'not-started',
  'in-translation',
  'in-review',
  'locked',
];
const SUB_TONE: Record<SubtitleStatus, string> = {
  'not-started': 'text-[color:var(--color-on-paper-muted)]',
  'in-translation': 'text-[color:var(--color-brass-deep)]',
  'in-review': 'text-[color:var(--color-warn)]',
  locked: 'text-[color:var(--color-success)]',
};

const USAGES: CueSheetUsage[] = ['background', 'featured', 'theme', 'end-credit'];
const RIGHTS: CueSheetRightsStatus[] = [
  'cleared',
  'pending',
  'public-domain',
  'commissioned',
  'unknown',
];
const RIGHTS_TONE: Record<CueSheetRightsStatus, string> = {
  cleared: 'text-[color:var(--color-success)]',
  pending: 'text-[color:var(--color-warn)]',
  'public-domain': 'text-[color:var(--color-on-paper-muted)]',
  commissioned: 'text-[color:var(--color-brass-deep)]',
  unknown: 'text-[color:var(--color-coral-deep)]',
};

export function PostProductionView() {
  const { state } = useApp();
  const [tab, setTab] = useState<TabKey>('timeline');

  const stats = useMemo(() => {
    const completed = state.editMilestones.filter((m) => m.status === 'complete').length;
    const subsLocked = state.subtitleTracks.filter((t) => t.status === 'locked').length;
    return { completed, subsLocked };
  }, [state.editMilestones, state.subtitleTracks]);

  return (
    <div className="space-y-7 max-w-[1400px]">
      {/* Stat strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <Tile
          icon={Disc3}
          label="Editorial milestones"
          value={state.editMilestones.length}
          sub={stats.completed > 0 ? `${stats.completed} complete` : 'arc tracked'}
        />
        <Tile
          icon={Music}
          label="Cue sheet rows"
          value={state.cueSheet.length}
          sub={state.cueSheet.length > 0 ? 'tracked' : 'log per song'}
        />
        <Tile
          icon={Captions}
          label="Subtitle tracks"
          value={state.subtitleTracks.length}
          sub={stats.subsLocked > 0 ? `${stats.subsLocked} locked` : 'in pipeline'}
        />
        <Tile
          icon={Package}
          label="Deliverables"
          value={state.deliverableSpecs.length}
          sub={state.deliverableSpecs.length > 0 ? 'specs ready' : 'add per buyer'}
        />
      </section>

      {/* Tab strip */}
      <nav
        role="tablist"
        className="flex items-baseline gap-1.5 border-b-[0.5px] border-[color:var(--color-border-paper)]"
      >
        {(
          [
            { key: 'timeline', label: 'Timeline', hint: 'editorial arc · 8 phases' },
            { key: 'cue', label: 'Cue sheet', hint: 'every song · rights · TC' },
            { key: 'subs', label: 'Subtitles', hint: 'languages · status · cost' },
            { key: 'deliverables', label: 'Deliverables', hint: 'tech specs per buyer' },
          ] as { key: TabKey; label: string; hint: string }[]
        ).map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`relative px-4 py-2.5 transition-colors ${
                active
                  ? 'text-[color:var(--color-on-paper)]'
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              <span
                className={
                  active
                    ? 'display-italic text-[19px]'
                    : 'font-sans text-[12px] tracking-[0.12em] uppercase'
                }
              >
                {t.label}
              </span>
              {active && (
                <>
                  <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[color:var(--color-brass)]" />
                  <span className="block prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-0.5">
                    {t.hint}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div>
        {tab === 'timeline' && <TimelineTab />}
        {tab === 'cue' && <CueSheetTab />}
        {tab === 'subs' && <SubtitlesTab />}
        {tab === 'deliverables' && <DeliverablesTab />}
      </div>
    </div>
  );
}

/* ---------- Timeline ---------- */

function TimelineTab() {
  const { state, dispatch } = useApp();

  const sorted = useMemo(() => {
    return [...state.editMilestones].sort((a, b) => {
      const ai = PHASE_ORDER.indexOf(a.phase);
      const bi = PHASE_ORDER.indexOf(b.phase);
      if (ai !== bi) return ai - bi;
      const ad = a.targetDate ?? '9999';
      const bd = b.targetDate ?? '9999';
      return ad.localeCompare(bd);
    });
  }, [state.editMilestones]);

  function add() {
    const milestone: EditMilestone = {
      id: newId('em'),
      episodeId: 'all',
      phase: 'assembly',
      status: 'pending',
    };
    dispatch({ type: 'ADD_EDIT_MILESTONE', milestone });
  }

  function patch(id: string, p: Partial<EditMilestone>) {
    dispatch({ type: 'UPDATE_EDIT_MILESTONE', id, patch: p });
  }

  function cycleStatus(m: EditMilestone) {
    const idx = STATUSES.indexOf(m.status);
    patch(m.id, { status: STATUSES[(idx + 1) % STATUSES.length] });
  }

  /* Build a horizontal arc visualization */
  const arc = PHASE_ORDER.map((phase) => {
    const items = sorted.filter((m) => m.phase === phase);
    const allComplete = items.length > 0 && items.every((m) => m.status === 'complete');
    const inProgress = items.some((m) => m.status === 'in-progress' || m.status === 'review');
    return { phase, items, allComplete, inProgress };
  });

  return (
    <div className="space-y-7">
      {/* Arc visualization */}
      <section>
        <div className="flex items-baseline gap-2 mb-4">
          <Disc3 size={13} className="text-[color:var(--color-brass-deep)]" />
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Editorial arc
          </h3>
          <div className="flex-1 h-px bg-[color:var(--color-border-brass)]/40" />
        </div>
        <ol className="grid grid-cols-8 gap-2">
          {arc.map((step, idx) => (
            <li
              key={step.phase}
              className={`bg-[color:var(--color-paper-light)] border-[0.5px] rounded-[3px] px-3 py-3 ${
                step.allComplete
                  ? 'border-[color:var(--color-success)]'
                  : step.inProgress
                  ? 'border-[color:var(--color-brass)]'
                  : 'border-[color:var(--color-border-paper)]'
              }`}
            >
              <div className="label-caps text-[color:var(--color-brass-deep)] tabular-nums mb-1">
                {String(idx + 1).padStart(2, '0')}
              </div>
              <div className="display-italic text-[13px] text-[color:var(--color-on-paper)] leading-tight">
                {PHASE_LABEL[step.phase]}
              </div>
              <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mt-1.5">
                {step.items[0]?.targetDate
                  ? fmtShort(step.items[0].targetDate)
                  : '—'}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Milestone list */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Milestones
          </h3>
          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
          >
            <Plus size={11} />
            <span>add milestone</span>
          </button>
        </div>
        <ul className="space-y-2">
          {sorted.map((m) => (
            <li
              key={m.id}
              className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4"
            >
              <div className="grid grid-cols-[140px_1fr_140px_110px_28px] gap-4 items-baseline">
                <div className="display-italic text-[15px] text-[color:var(--color-on-paper)]">
                  {PHASE_LABEL[m.phase]}
                </div>
                <EditableText
                  value={m.notes ?? ''}
                  onChange={(v) => patch(m.id, { notes: v || undefined })}
                  placeholder="What's the deliverable here…"
                  className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] leading-relaxed"
                />
                <input
                  type="date"
                  value={m.targetDate ?? ''}
                  onChange={(e) => patch(m.id, { targetDate: e.target.value || undefined })}
                  className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums py-0.5"
                />
                <button
                  type="button"
                  onClick={() => cycleStatus(m)}
                  className={`label-caps tracking-[0.14em] text-[10px] py-1 px-1.5 rounded-[2px] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors ${STATUS_TONE[m.status]} text-left`}
                >
                  {m.status}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete ${PHASE_LABEL[m.phase]}?`)) {
                      dispatch({ type: 'DELETE_EDIT_MILESTONE', id: m.id });
                    }
                  }}
                  className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors justify-self-end"
                  aria-label="Delete milestone"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ---------- Cue sheet ---------- */

function CueSheetTab() {
  const { state, dispatch } = useApp();
  const allEpisodes = [...state.episodes, ...state.specials];

  function add() {
    const entry: CueSheetEntry = {
      id: newId('cue'),
      episodeId: state.episodes[0]?.id ?? 'ep1',
      tcIn: '00:00:00:00',
      tcOut: '00:00:00:00',
      songTitle: 'New cue',
      usage: 'background',
      rightsStatus: 'unknown',
    };
    dispatch({ type: 'ADD_CUE', entry });
  }

  function patch(id: string, p: Partial<CueSheetEntry>) {
    dispatch({ type: 'UPDATE_CUE', id, patch: p });
  }

  function cycleRights(c: CueSheetEntry) {
    const idx = RIGHTS.indexOf(c.rightsStatus);
    patch(c.id, { rightsStatus: RIGHTS[(idx + 1) % RIGHTS.length] });
  }

  if (state.cueSheet.length === 0) {
    return (
      <div className="space-y-5">
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-8 py-12 text-center">
          <p className="display-italic text-[20px] text-[color:var(--color-on-paper)] mb-2">
            Cue sheet empty
          </p>
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mb-5 max-w-[560px] mx-auto leading-relaxed">
            Once songs land in the edit, log every cue here — TC in / out · title · composer · publisher · usage type · rights status · territory. Broadcasters require this on delivery (HRT, BBC, ARTE all want it as CSV or PDF).
          </p>
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-4 py-2 rounded-[2px] transition-colors"
          >
            <Plus size={12} />
            <span>add first cue</span>
          </button>
        </div>
      </div>
    );
  }

  /* Group by episode */
  const byEp = new Map<string, CueSheetEntry[]>();
  for (const c of state.cueSheet) {
    const arr = byEp.get(c.episodeId) ?? [];
    arr.push(c);
    byEp.set(c.episodeId, arr);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
          {state.cueSheet.length} cue{state.cueSheet.length === 1 ? '' : 's'} across{' '}
          {byEp.size} episode{byEp.size === 1 ? '' : 's'}
        </p>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add cue</span>
        </button>
      </div>

      {Array.from(byEp.entries()).map(([epId, cues]) => {
        const ep = allEpisodes.find((e) => e.id === epId);
        return (
          <section
            key={epId}
            className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden"
          >
            <header className="px-5 py-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between">
              <h3 className="display-italic text-[17px] text-[color:var(--color-on-paper)]">
                {ep ? `Ep ${ep.number} · ${ep.title}` : epId} ·{' '}
                <span className="text-[color:var(--color-on-paper-muted)]">{cues.length} cue{cues.length === 1 ? '' : 's'}</span>
              </h3>
            </header>
            <ul>
              {cues.map((c) => (
                <li
                  key={c.id}
                  className="grid grid-cols-[80px_80px_1.5fr_1fr_90px_90px_28px] gap-3 items-baseline px-5 py-2.5 border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0"
                >
                  <EditableText
                    value={c.tcIn}
                    onChange={(v) => patch(c.id, { tcIn: v })}
                    className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums"
                  />
                  <EditableText
                    value={c.tcOut}
                    onChange={(v) => patch(c.id, { tcOut: v })}
                    className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums"
                  />
                  <EditableText
                    value={c.songTitle}
                    onChange={(v) => patch(c.id, { songTitle: v })}
                    className="display-italic text-[14px] text-[color:var(--color-on-paper)]"
                  />
                  <EditableText
                    value={c.composer ?? ''}
                    onChange={(v) => patch(c.id, { composer: v || undefined })}
                    placeholder="composer / publisher"
                    className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
                  />
                  <select
                    value={c.usage}
                    onChange={(e) => patch(c.id, { usage: e.target.value as CueSheetUsage })}
                    className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none label-caps text-[10px] tracking-[0.10em] text-[color:var(--color-brass-deep)] py-0.5"
                  >
                    {USAGES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => cycleRights(c)}
                    className={`label-caps tracking-[0.10em] text-[10px] py-0.5 px-1.5 rounded-[2px] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors ${RIGHTS_TONE[c.rightsStatus]} text-left`}
                  >
                    {c.rightsStatus}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Delete cue?')) {
                        dispatch({ type: 'DELETE_CUE', id: c.id });
                      }
                    }}
                    className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors justify-self-end"
                    aria-label="Delete cue"
                  >
                    <Trash2 size={11} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/* ---------- Subtitles ---------- */

function SubtitlesTab() {
  const { state, dispatch } = useApp();
  const allEpisodes = [...state.episodes, ...state.specials];

  function add() {
    const track: SubtitleTrack = {
      id: newId('st'),
      episodeId: state.episodes[0]?.id ?? 'ep1',
      language: 'EN',
      status: 'not-started',
      format: 'SRT',
    };
    dispatch({ type: 'ADD_SUBTITLE', track });
  }

  function patch(id: string, p: Partial<SubtitleTrack>) {
    dispatch({ type: 'UPDATE_SUBTITLE', id, patch: p });
  }

  function cycleStatus(t: SubtitleTrack) {
    const idx = SUB_STATUSES.indexOf(t.status);
    patch(t.id, { status: SUB_STATUSES[(idx + 1) % SUB_STATUSES.length] });
  }

  /* Cost rollup */
  const totalCostK = state.subtitleTracks.reduce(
    (s, t) => s + (t.costEstimateK ?? 0),
    0
  );

  /* Group by episode */
  const byEp = new Map<string, SubtitleTrack[]>();
  for (const t of state.subtitleTracks) {
    const arr = byEp.get(t.episodeId) ?? [];
    arr.push(t);
    byEp.set(t.episodeId, arr);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
          {state.subtitleTracks.length} track{state.subtitleTracks.length === 1 ? '' : 's'} ·{' '}
          {byEp.size} episode{byEp.size === 1 ? '' : 's'} ·{' '}
          {totalCostK > 0 ? (
            <span className="text-[color:var(--color-brass-deep)] tabular-nums">
              ~{totalCostK}k € estimate
            </span>
          ) : (
            'cost estimates pending'
          )}
        </p>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add track</span>
        </button>
      </div>

      {Array.from(byEp.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([epId, tracks]) => {
          const ep = allEpisodes.find((e) => e.id === epId);
          return (
            <section
              key={epId}
              className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4"
            >
              <h3 className="display-italic text-[17px] text-[color:var(--color-on-paper)] mb-3">
                {ep ? `Ep ${ep.number} · ${ep.title}` : epId}
              </h3>
              <ul className="space-y-2">
                {tracks.map((t) => (
                  <li
                    key={t.id}
                    className="grid grid-cols-[60px_140px_120px_70px_110px_28px] gap-4 items-baseline"
                  >
                    <span className="display-italic text-[16px] text-[color:var(--color-brass-deep)] tabular-nums">
                      {t.language}
                    </span>
                    <EditableText
                      value={t.translator ?? ''}
                      onChange={(v) => patch(t.id, { translator: v || undefined })}
                      placeholder="translator"
                      className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]"
                    />
                    <EditableText
                      value={t.format ?? ''}
                      onChange={(v) => patch(t.id, { format: v || undefined })}
                      placeholder="format"
                      className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
                    />
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      value={t.costEstimateK ?? ''}
                      onChange={(e) =>
                        patch(t.id, {
                          costEstimateK:
                            e.target.value === '' ? undefined : parseFloat(e.target.value),
                        })
                      }
                      placeholder="cost"
                      className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums w-full py-0.5"
                    />
                    <button
                      type="button"
                      onClick={() => cycleStatus(t)}
                      className={`label-caps tracking-[0.14em] text-[10px] py-0.5 px-1.5 rounded-[2px] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors ${SUB_TONE[t.status]} text-left`}
                    >
                      {t.status}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Delete subtitle track?')) {
                          dispatch({ type: 'DELETE_SUBTITLE', id: t.id });
                        }
                      }}
                      className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors justify-self-end"
                      aria-label="Delete track"
                    >
                      <Trash2 size={11} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
    </div>
  );
}

/* ---------- Deliverables ---------- */

function DeliverablesTab() {
  const { state, dispatch } = useApp();

  function add() {
    const spec: DeliverableSpec = {
      id: newId('ds'),
      buyer: 'New buyer',
      format: 'ProRes 422 HQ',
      resolution: '1920×1080',
      framerate: '25p',
      audioFormat: 'stereo 24-bit 48k',
    };
    dispatch({ type: 'ADD_DELIVERABLE', spec });
  }

  function patch(id: string, p: Partial<DeliverableSpec>) {
    dispatch({ type: 'UPDATE_DELIVERABLE', id, patch: p });
  }

  const columns: RegisterColumn<DeliverableSpec>[] = [
    {
      key: 'buyer',
      label: 'Buyer',
      width: 'minmax(160px, 1fr)',
      sortValue: (r) => r.buyer.toLowerCase(),
      render: (r) => (
        <EditableText
          value={r.buyer}
          onChange={(v) => patch(r.id, { buyer: v })}
          className="display-italic text-[14px] text-[color:var(--color-on-paper)]"
        />
      ),
    },
    {
      key: 'format',
      label: 'Format',
      width: '160px',
      render: (r) => (
        <EditableText
          value={r.format}
          onChange={(v) => patch(r.id, { format: v })}
          className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
        />
      ),
    },
    {
      key: 'resolution',
      label: 'Resolution',
      width: '120px',
      render: (r) => (
        <EditableText
          value={r.resolution}
          onChange={(v) => patch(r.id, { resolution: v })}
          className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] tabular-nums"
        />
      ),
    },
    {
      key: 'fps',
      label: 'FPS',
      width: '90px',
      render: (r) => (
        <EditableText
          value={r.framerate}
          onChange={(v) => patch(r.id, { framerate: v })}
          className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] tabular-nums"
        />
      ),
    },
    {
      key: 'audio',
      label: 'Audio',
      width: 'minmax(220px, 1.5fr)',
      render: (r) => (
        <EditableText
          value={r.audioFormat}
          onChange={(v) => patch(r.id, { audioFormat: v })}
          className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
        />
      ),
    },
    {
      key: 'subs',
      label: 'Subtitles',
      width: 'minmax(180px, 1.2fr)',
      render: (r) => (
        <EditableText
          value={r.subtitleFormat ?? ''}
          onChange={(v) => patch(r.id, { subtitleFormat: v || undefined })}
          placeholder="—"
          className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
        />
      ),
    },
    {
      key: 'del',
      label: '',
      width: '28px',
      render: (r) => (
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Delete ${r.buyer} spec?`)) {
              dispatch({ type: 'DELETE_DELIVERABLE', id: r.id });
            }
          }}
          className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors"
          aria-label="Delete spec"
        >
          <Trash2 size={11} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
          Three buyers pre-seeded (HRT · BBC Storyville · ARTE/3sat). Each row is the tech
          spec the broadcaster will request on delivery. Add buyers as deals close.
        </p>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add spec</span>
        </button>
      </div>
      <FilterableRegister<DeliverableSpec>
        rows={state.deliverableSpecs}
        columns={columns}
        rowId={(r) => r.id}
        defaultSortKey="buyer"
      />
      {state.deliverableSpecs.length > 0 && (
        <section>
          <h3 className="display-italic text-[16px] text-[color:var(--color-on-paper)] mb-3 mt-6">
            Per-spec notes
          </h3>
          <ul className="space-y-2">
            {state.deliverableSpecs.map((d) => (
              <li
                key={d.id}
                className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-3"
              >
                <div className="display-italic text-[15px] text-[color:var(--color-on-paper)] mb-1">
                  {d.buyer}
                </div>
                <EditableText
                  value={d.notes ?? ''}
                  onChange={(v) => patch(d.id, { notes: v || undefined })}
                  placeholder="quirks, deadlines, contact, special requirements…"
                  multiline
                  rows={2}
                  className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] leading-relaxed block w-full"
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ---------- shared ---------- */

function Tile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Disc3;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4">
      <div className="flex items-baseline gap-1.5 label-caps text-[color:var(--color-brass-deep)] mb-1.5">
        <Icon size={11} />
        <span>{label}</span>
      </div>
      <div className="display-italic text-[28px] text-[color:var(--color-on-paper)] tabular-nums leading-none">
        {value}
      </div>
      <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1">
        {sub}
      </div>
    </article>
  );
}

function fmtShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });
}

/* unused-import suppressor */
export const _icons = { CheckCircle2, Languages };
