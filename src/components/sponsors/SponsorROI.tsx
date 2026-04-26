import { useMemo, useState } from 'react';
import { Plus, Star, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Sponsor, SponsorDeliverable, SponsorDeliverableStatus, SponsorDeliverableType } from '../../types';
import { newId } from '../episode/shared';
import { EditableText } from '../primitives/EditableText';

interface Props {
  sponsor: Sponsor;
}

/* Per-episode reach estimates · used for ROI calculation. Conservative.
   Tomo / sales agent can refine when real broadcaster reach data lands. */
const EPISODE_REACH_K = 200;          // est. viewers per episode (Croatia, primetime)
const RESHOW_MULTIPLIER = 2;          // domestic reshow / streaming long-tail
const PLACEMENT_QUALITY: Record<number, { label: string; multiplier: number }> = {
  1: { label: 'logo cameo', multiplier: 0.4 },
  2: { label: 'screen credit', multiplier: 1.0 },
  3: { label: 'featured integration', multiplier: 2.5 },
};

const DELIVERABLE_TYPES: SponsorDeliverableType[] = [
  'logo-on-screen',
  'screen-credit',
  'social-post',
  'press-mention',
  'premiere-invite',
  'product-placement',
  'other',
];

const STATUSES: SponsorDeliverableStatus[] = ['pending', 'in-progress', 'delivered'];
const STATUS_TONE: Record<SponsorDeliverableStatus, string> = {
  pending: 'text-[color:var(--color-on-paper-muted)]',
  'in-progress': 'text-[color:var(--color-warn)]',
  delivered: 'text-[color:var(--color-success)]',
};

export function SponsorROI({ sponsor }: Props) {
  const { state, dispatch } = useApp();
  const [placementQuality, setPlacementQuality] = useState<1 | 2 | 3>(2);

  const linkedEpisodeIds = sponsor.episodeIds ?? [];
  const linkedEpisodes = state.episodes.filter((e) => linkedEpisodeIds.includes(e.id));

  const roi = useMemo(() => {
    const episodeCount = Math.max(1, linkedEpisodeIds.length || state.episodes.length);
    const totalImpressions =
      EPISODE_REACH_K * 1000 * episodeCount * RESHOW_MULTIPLIER;
    const adjustedImpressions = Math.round(
      totalImpressions * PLACEMENT_QUALITY[placementQuality].multiplier
    );
    /* CPM-equivalent valuation — typical EU TV doc CPM €15–30, use €22 mid */
    const cpmEur = 22;
    const valueEur = (adjustedImpressions / 1000) * cpmEur;
    const valueK = Math.round(valueEur / 1000);
    const expectedK = sponsor.expectedAmount;
    const ratio = expectedK > 0 ? valueK / expectedK : 0;
    return {
      episodeCount,
      adjustedImpressions,
      valueK,
      expectedK,
      ratio,
    };
  }, [linkedEpisodeIds, state.episodes, placementQuality, sponsor.expectedAmount]);

  /* Deliverables for this sponsor */
  const deliverables = state.sponsorDeliverables
    .filter((d) => d.sponsorId === sponsor.id)
    .sort((a, b) => a.label.localeCompare(b.label));

  function addDeliverable() {
    const deliverable: SponsorDeliverable = {
      id: newId('deliv'),
      sponsorId: sponsor.id,
      type: 'logo-on-screen',
      label: 'New deliverable',
      status: 'pending',
    };
    dispatch({ type: 'ADD_SPONSOR_DELIVERABLE', deliverable });
  }

  function patchDeliverable(id: string, p: Partial<SponsorDeliverable>) {
    dispatch({ type: 'UPDATE_SPONSOR_DELIVERABLE', id, patch: p });
  }

  function cycleStatus(d: SponsorDeliverable) {
    const idx = STATUSES.indexOf(d.status);
    patchDeliverable(d.id, { status: STATUSES[(idx + 1) % STATUSES.length] });
  }

  return (
    <div className="space-y-5">
      {/* ROI calculator */}
      <section>
        <header className="flex items-baseline gap-3 mb-3">
          <Star size={11} className="text-[color:var(--color-brass-deep)]" />
          <h4 className="display-italic text-[16px] text-[color:var(--color-on-paper)]">
            ROI estimate
          </h4>
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
            CPM-equivalent · indicative only
          </span>
        </header>

        <div className="bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-3">
          {/* Placement quality picker */}
          <div className="flex items-baseline justify-between mb-3">
            <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
              Placement quality
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setPlacementQuality(q as 1 | 2 | 3)}
                  className={`label-caps tracking-[0.10em] text-[10px] py-0.5 px-2 rounded-[2px] transition-colors ${
                    placementQuality === q
                      ? 'bg-[color:var(--color-brass)]/30 text-[color:var(--color-on-paper)]'
                      : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
                  }`}
                >
                  {PLACEMENT_QUALITY[q].label}
                </button>
              ))}
            </div>
          </div>

          {/* Output */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                Episodes
              </div>
              <div className="display-italic text-[18px] text-[color:var(--color-on-paper)] tabular-nums">
                {roi.episodeCount}
              </div>
              <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
                {linkedEpisodeIds.length > 0 ? `${linkedEpisodes.length} linked` : 'all'}
              </div>
            </div>
            <div>
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                Impressions
              </div>
              <div className="display-italic text-[18px] text-[color:var(--color-on-paper)] tabular-nums">
                {(roi.adjustedImpressions / 1000).toFixed(0)}k
              </div>
              <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
                weighted
              </div>
            </div>
            <div>
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                Value est.
              </div>
              <div
                className={`display-italic text-[18px] tabular-nums ${
                  roi.ratio >= 1
                    ? 'text-[color:var(--color-success)]'
                    : 'text-[color:var(--color-on-paper)]'
                }`}
              >
                {roi.valueK}k €
              </div>
              <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
                {roi.ratio >= 1
                  ? `${roi.ratio.toFixed(1)}× the ask`
                  : `${(roi.ratio * 100).toFixed(0)}% of ask`}
              </div>
            </div>
          </div>

          <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] leading-relaxed mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            Math: episodes × 200k viewers × 2× reshow × placement-quality × €22 CPM. Real
            buyer numbers refine this once a broadcaster commits.
          </p>
        </div>
      </section>

      {/* Deliverables tracker */}
      <section>
        <header className="flex items-baseline justify-between mb-3">
          <h4 className="display-italic text-[16px] text-[color:var(--color-on-paper)]">
            Deliverables we owe
          </h4>
          <button
            type="button"
            onClick={addDeliverable}
            className="flex items-center gap-1 label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] rounded-[2px] px-2 py-0.5 transition-colors"
          >
            <Plus size={10} />
            <span>add</span>
          </button>
        </header>

        {deliverables.length === 0 ? (
          <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] bg-[color:var(--color-paper)] border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-4 py-3 leading-relaxed">
            Once {sponsor.name} signs, log every deliverable here — logo placements, screen
            credits, social posts, premiere invites, press mentions. Cycle status as each
            ships.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {deliverables.map((d) => (
              <li
                key={d.id}
                className="bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-3 py-2 grid grid-cols-[120px_1fr_110px_28px] gap-3 items-baseline"
              >
                <select
                  value={d.type}
                  onChange={(e) =>
                    patchDeliverable(d.id, {
                      type: e.target.value as SponsorDeliverableType,
                    })
                  }
                  className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none label-caps text-[10px] tracking-[0.10em] text-[color:var(--color-brass-deep)] py-0.5"
                >
                  {DELIVERABLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/-/g, ' ')}
                    </option>
                  ))}
                </select>
                <EditableText
                  value={d.label}
                  onChange={(v) => patchDeliverable(d.id, { label: v })}
                  className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]"
                />
                <button
                  type="button"
                  onClick={() => cycleStatus(d)}
                  className={`label-caps tracking-[0.12em] text-[10px] text-left py-0.5 px-1.5 rounded-[2px] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors ${STATUS_TONE[d.status]}`}
                >
                  {d.status}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete "${d.label}"?`)) {
                      dispatch({ type: 'DELETE_SPONSOR_DELIVERABLE', id: d.id });
                    }
                  }}
                  className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors justify-self-end"
                  aria-label="Delete deliverable"
                >
                  <Trash2 size={10} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
