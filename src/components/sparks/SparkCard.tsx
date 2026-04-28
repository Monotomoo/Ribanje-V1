import { useState } from 'react';
import {
  Clock,
  ExternalLink,
  MapPin,
  Pause,
  Play,
  Star,
  Trash2,
  User,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT, useI18n } from '../../i18n';
import type { Spark, SparkStatus } from '../../types';
import { SPARK_KIND_BY_KIND, SPARK_STATUSES } from './sparkKinds';
import { PromoteMenu } from './PromoteMenu';

/* ---------- SparkCard (Phase 13) ----------
   Renders a single Spark. Used inside SparkWall columns, DemoDispatch
   timeline, and SparkCompare side-by-side panels.

   Responsive to spark.kind:
     • voice         compact audio playback inline
     • image         clickable thumbnail
     • reference     external-link pill
     • sketch        embedded preview (data URL)
     • text-only      headline + body
   All variants share: kind badge, time, location, captured-by chip,
   rating stars, beat tags, status pill, action menu. */

interface Props {
  spark: Spark;
  onSelectForCompare?: (s: Spark) => void;
  isSelectedForCompare?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  compact?: boolean;
}

export function SparkCard({
  spark,
  onSelectForCompare,
  isSelectedForCompare,
  draggable = false,
  onDragStart,
  onDragEnd,
  compact = false,
}: Props) {
  const { state, dispatch } = useApp();
  const t = useT();
  const { locale } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);

  const kindMeta = SPARK_KIND_BY_KIND[spark.kind];
  const statusMeta = SPARK_STATUSES.find((s) => s.status === spark.status)!;
  const KindIcon = kindMeta.Icon;

  const memo = spark.voiceMemoId
    ? state.voiceMemos.find((v) => v.id === spark.voiceMemoId)
    : undefined;
  const location = spark.locationId
    ? state.locations.find((l) => l.id === spark.locationId)
    : undefined;
  const crew = spark.capturedBy
    ? state.crew.find((c) => c.id === spark.capturedBy)
    : undefined;

  function patchSpark(p: Partial<Spark>) {
    dispatch({ type: 'UPDATE_SPARK', id: spark.id, patch: p });
  }

  function setStatus(s: SparkStatus) {
    dispatch({ type: 'SET_SPARK_STATUS', id: spark.id, status: s });
  }

  function remove() {
    if (!window.confirm(`Delete spark "${spark.title}"?`)) return;
    dispatch({ type: 'DELETE_SPARK', id: spark.id });
  }

  function setRating(r: 1 | 2 | 3 | 4 | 5) {
    patchSpark({ rating: spark.rating === r ? undefined : r });
  }

  return (
    <article
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      data-spark-id={spark.id}
      className={`group relative rounded-[3px] border-l-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] hover:border-[color:var(--color-border-paper-strong)] transition-colors ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isSelectedForCompare ? 'ring-1 ring-[color:var(--color-brass)]' : ''}`}
      style={{ borderLeftColor: statusMeta.tone }}
    >
      <div className={compact ? 'p-2' : 'p-3'}>
        {/* Header: kind icon · headline · status */}
        <div className="flex items-start gap-2 mb-1.5">
          <KindIcon
            size={compact ? 11 : 13}
            className="text-[color:var(--color-brass-deep)] mt-0.5 shrink-0"
          />
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <input
                type="text"
                value={spark.title}
                autoFocus
                onChange={(e) => patchSpark({ title: e.target.value })}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    e.currentTarget.blur();
                  }
                }}
                className="w-full bg-transparent text-[13px] display-italic text-[color:var(--color-on-paper)] focus:outline-none border-b-[0.5px] border-[color:var(--color-brass)]/40"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                className="text-left w-full"
              >
                <div
                  className={`display-italic text-[color:var(--color-on-paper)] leading-tight ${
                    compact ? 'text-[12px]' : 'text-[13px]'
                  }`}
                >
                  {spark.title || t('common.untitled')}
                </div>
              </button>
            )}
            <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mt-0.5">
              {t(kindMeta.labelKey)}
            </div>
          </div>
          <span
            className="label-caps text-[9px] tabular-nums shrink-0 px-1.5 py-0.5 rounded-[2px]"
            style={{
              color: statusMeta.tone,
              background: `color-mix(in oklab, ${statusMeta.tone} 12%, transparent)`,
            }}
          >
            {t(statusMeta.labelKey)}
          </span>
        </div>

        {/* Kind-specific body */}
        {spark.kind === 'voice' && memo && (
          <div className="mb-2">
            <CompactAudio src={memo.audioBase64} duration={memo.durationMs} />
            {memo.transcript && (
              <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1 line-clamp-2">
                {memo.transcript}
              </div>
            )}
          </div>
        )}

        {spark.kind === 'image' && spark.imageDataUrl && (
          <div className="mb-2 -mx-1">
            <img
              src={spark.imageDataUrl}
              alt={spark.title}
              className="w-full h-auto rounded-[2px] border-[0.5px] border-[color:var(--color-border-paper)] max-h-[180px] object-cover"
            />
          </div>
        )}

        {spark.kind === 'sketch' && spark.imageDataUrl && (
          <div className="mb-2 -mx-1">
            <img
              src={spark.imageDataUrl}
              alt={spark.title}
              className="w-full h-auto rounded-[2px] border-[0.5px] border-[color:var(--color-border-paper)] bg-[color:var(--color-paper)] max-h-[180px] object-contain"
            />
          </div>
        )}

        {spark.kind === 'reference' && spark.referenceUrl && (
          <a
            href={spark.referenceUrl}
            target="_blank"
            rel="noreferrer"
            className="mb-2 flex items-center gap-1.5 prose-body italic text-[11px] text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] transition-colors break-all"
          >
            <ExternalLink size={10} className="shrink-0" />
            <span className="truncate">{spark.referenceUrl}</span>
          </a>
        )}

        {spark.body && (
          <div
            className={`prose-body text-[12px] text-[color:var(--color-on-paper)] leading-snug mb-2 ${
              expanded ? '' : 'line-clamp-3'
            }`}
          >
            {spark.body}
          </div>
        )}

        {spark.body && spark.body.length > 140 && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] transition-colors"
          >
            {t('common.expand')}
          </button>
        )}

        {/* Beat tags */}
        {spark.beatTags && spark.beatTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {spark.beatTags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded-[2px] text-[9px] display-italic bg-[color:var(--color-paper-deep)] text-[color:var(--color-on-paper-muted)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Rating stars */}
        {!compact && (
          <div className="flex items-center gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRating(r as 1 | 2 | 3 | 4 | 5)}
                className="p-0.5 hover:scale-110 transition-transform"
                aria-label={`${r} star`}
              >
                <Star
                  size={11}
                  className={
                    spark.rating && spark.rating >= r
                      ? 'text-[color:var(--color-brass-deep)]'
                      : 'text-[color:var(--color-on-paper-faint)]'
                  }
                  fill={spark.rating && spark.rating >= r ? 'currentColor' : 'none'}
                />
              </button>
            ))}
          </div>
        )}

        {/* Footer: time · location · crew */}
        <div className="flex items-center gap-2 prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums flex-wrap">
          <span className="flex items-center gap-1">
            <Clock size={9} />
            {fmtRelative(spark.capturedAt, locale)}
          </span>
          {location && (
            <span className="flex items-center gap-1">
              <MapPin size={9} />
              <span className="truncate max-w-[80px]">{location.label}</span>
            </span>
          )}
          {crew && (
            <span className="flex items-center gap-1">
              <User size={9} />
              <span className="truncate max-w-[60px]">
                {crew.name.split(/\s+/)[0]}
              </span>
            </span>
          )}
        </div>

        {/* Action row — visible on hover/expand on the wall, always on dispatch */}
        {!compact && (
          <div className="mt-2 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)] flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1">
              {(['raw', 'brewing', 'parked'] as SparkStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  disabled={spark.status === s}
                  className={`label-caps text-[9px] px-1.5 py-0.5 rounded-[2px] transition-colors ${
                    spark.status === s
                      ? 'bg-[color:var(--color-on-paper)] text-[color:var(--color-paper-light)] cursor-default'
                      : 'text-[color:var(--color-on-paper-muted)] hover:bg-[color:var(--color-paper-deep)]'
                  }`}
                >
                  {t((SPARK_STATUSES.find((x) => x.status === s)!).labelKey)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {onSelectForCompare && (
                <button
                  type="button"
                  onClick={() => onSelectForCompare(spark)}
                  className={`label-caps text-[9px] px-1.5 py-0.5 rounded-[2px] transition-colors ${
                    isSelectedForCompare
                      ? 'bg-[color:var(--color-brass)] text-[color:var(--color-paper-light)]'
                      : 'text-[color:var(--color-on-paper-muted)] hover:bg-[color:var(--color-brass)]/15'
                  }`}
                  title={t('spark.tab.compare')}
                >
                  A·B
                </button>
              )}
              {spark.status !== 'promoted' && (
                <button
                  type="button"
                  onClick={() => setPromoteOpen(true)}
                  className="label-caps text-[9px] px-1.5 py-0.5 rounded-[2px] bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] hover:bg-[color:var(--color-success)]/25 transition-colors"
                >
                  {t('spark.promote')}
                </button>
              )}
              <button
                type="button"
                onClick={remove}
                className="p-0.5 rounded-[2px] text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] hover:bg-[color:var(--color-coral-deep)]/10 transition-colors"
                title={t('common.delete')}
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        )}

        {spark.promotedTo && !compact && (
          <div className="mt-2 prose-body italic text-[10px] text-[color:var(--color-success)]">
            ↳ {t('spark.promote.linked')} {spark.promotedTo.type}
          </div>
        )}
      </div>

      {/* Promote target picker — Phase 13 */}
      <PromoteMenu
        spark={spark}
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
      />
    </article>
  );
}

/* ---------- Compact audio playback ---------- */

function CompactAudio({ src, duration }: { src: string; duration: number }) {
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    if (!audioEl) return;
    if (playing) audioEl.pause();
    else audioEl.play().catch(() => undefined);
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-[2px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)]">
      <audio
        ref={setAudioEl}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        preload="none"
      />
      <button
        type="button"
        onClick={toggle}
        className={`p-1 rounded-full transition-colors ${
          playing
            ? 'bg-[color:var(--color-coral-deep)] text-[color:var(--color-paper)]'
            : 'bg-[color:var(--color-brass)] text-[color:var(--color-paper-light)]'
        }`}
        aria-label={playing ? 'pause' : 'play'}
      >
        {playing ? <Pause size={11} /> : <Play size={11} />}
      </button>
      <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums">
        {Math.round(duration / 1000)}s
      </span>
    </div>
  );
}

/* ---------- helpers ---------- */

function fmtRelative(iso: string, locale: 'en' | 'hr'): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.round(diff / 60_000);
  if (min < 1) return locale === 'hr' ? 'sad' : 'now';
  if (min < 60) return `${min}m`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return locale === 'hr' ? `${days}d` : `${days}d`;
}
