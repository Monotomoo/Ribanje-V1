import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Check,
  CheckSquare,
  Clapperboard,
  Link2,
  MapPin,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import type { StringKey } from '../../i18n';
import type { Spark, SparkPromotionType } from '../../types';
import { promoteSpark } from './sparkPromote';
import { SPARK_KIND_BY_KIND } from './sparkKinds';

/* ---------- PromoteMenu (Phase 13) ----------

   Modal picker for moving a Spark into a real planning entity.
   Shows the 5 supported targets:
     • Beat       — AntiScriptMoment
     • Shot       — Shot in a scene
     • Reference  — Reference entry
     • Task       — Task assignable to crew
     • Location   — disabled (needs map coordinates)

   Renders a small spark preview at the top, the 5 target buttons
   (each with icon + label + hint), and an inline error band if
   promotion fails (e.g. "no episode to attach to"). */

const TARGETS: {
  type: SparkPromotionType;
  Icon: LucideIcon;
  labelKey: StringKey;
  hintKey: StringKey;
}[] = [
  { type: 'beat',       Icon: Sparkles,    labelKey: 'spark.promote.to.beat',       hintKey: 'spark.promote.to.beat.hint' },
  { type: 'shot',       Icon: Clapperboard, labelKey: 'spark.promote.to.shot',       hintKey: 'spark.promote.to.shot.hint' },
  { type: 'reference',  Icon: Link2,        labelKey: 'spark.promote.to.reference',  hintKey: 'spark.promote.to.reference.hint' },
  { type: 'task',       Icon: CheckSquare,  labelKey: 'spark.promote.to.task',       hintKey: 'spark.promote.to.task.hint' },
  { type: 'location',   Icon: MapPin,       labelKey: 'spark.promote.to.location',   hintKey: 'spark.promote.to.location.hint' },
];

interface Props {
  spark: Spark | null;
  open: boolean;
  onClose: () => void;
}

export function PromoteMenu({ spark, open, onClose }: Props) {
  const { state, dispatch } = useApp();
  const t = useT();
  const [error, setError] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<SparkPromotionType | null>(null);

  /* Reset state when the menu opens for a new spark. */
  useEffect(() => {
    if (open) {
      setError(null);
      setPendingType(null);
    }
  }, [open, spark?.id]);

  if (!open || !spark) return null;

  function handlePick(type: SparkPromotionType) {
    if (!spark) return;
    setPendingType(type);
    setError(null);
    const result = promoteSpark(spark, state, dispatch, type);
    if (result.ok) {
      /* Brief delay so the user sees the success affordance before close. */
      window.setTimeout(() => {
        onClose();
      }, 350);
    } else {
      setPendingType(null);
      /* Map known reasons to translated keys. */
      const reasonKey: StringKey =
        result.reason.includes('episode')
          ? 'spark.promote.error.no.episode'
          : result.reason.includes('scene')
          ? 'spark.promote.error.no.scene'
          : result.reason.includes('location')
          ? 'spark.promote.error.location'
          : 'spark.promote.error.no.episode';
      setError(t(reasonKey));
    }
  }

  const kindMeta = SPARK_KIND_BY_KIND[spark.kind];
  const KindIcon = kindMeta.Icon;
  const location = spark.locationId
    ? state.locations.find((l) => l.id === spark.locationId)
    : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-[color:var(--color-chrome)]/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] w-full max-w-[460px] overflow-hidden">
        {/* Header */}
        <header className="px-5 py-3 bg-[color:var(--color-paper)] border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between">
          <div>
            <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
              {t('spark.promote.title')}
            </h3>
            <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
              {t('spark.promote.subtitle')}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper)]"
            aria-label={t('common.close')}
          >
            <X size={14} />
          </button>
        </header>

        {/* Spark preview */}
        <div className="px-5 py-3 border-b-[0.5px] border-[color:var(--color-border-paper)]">
          <div className="flex items-baseline gap-2">
            <KindIcon
              size={12}
              className="text-[color:var(--color-brass-deep)] mt-0.5 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="display-italic text-[14px] text-[color:var(--color-on-paper)] leading-tight">
                {spark.title || t('common.untitled')}
              </div>
              <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums mt-0.5">
                {t(kindMeta.labelKey)}
                {location && <> · {location.label}</>}
                {' · '}
                {fmtRelative(spark.capturedAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Target buttons */}
        <div className="p-3 space-y-1.5">
          {TARGETS.map((target) => {
            const TargetIcon = target.Icon;
            const isPending = pendingType === target.type;
            const isLocation = target.type === 'location';
            const disabled = isLocation;
            return (
              <button
                key={target.type}
                type="button"
                onClick={() => !disabled && handlePick(target.type)}
                disabled={disabled || pendingType !== null}
                className={`w-full text-left px-3 py-2.5 rounded-[3px] border-[0.5px] transition-colors flex items-center gap-3 ${
                  disabled
                    ? 'border-[color:var(--color-border-paper)] bg-[color:var(--color-paper-deep)]/30 opacity-50 cursor-not-allowed'
                    : isPending
                    ? 'border-[color:var(--color-success)] bg-[color:var(--color-success)]/15'
                    : 'border-[color:var(--color-border-paper)] bg-[color:var(--color-paper)] hover:border-[color:var(--color-brass)] hover:bg-[color:var(--color-brass)]/5 disabled:opacity-50'
                }`}
              >
                <TargetIcon
                  size={14}
                  className={
                    isPending
                      ? 'text-[color:var(--color-success)] shrink-0'
                      : 'text-[color:var(--color-brass-deep)] shrink-0'
                  }
                />
                <div className="flex-1 min-w-0">
                  <div className="display-italic text-[14px] text-[color:var(--color-on-paper)] leading-tight">
                    {t(target.labelKey)}
                  </div>
                  <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5 leading-tight">
                    {t(target.hintKey)}
                  </div>
                </div>
                {isPending && (
                  <Check size={14} className="text-[color:var(--color-success)] shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Error band */}
        {error && (
          <div className="px-5 py-3 bg-[color:var(--color-coral-deep)]/10 border-t-[0.5px] border-[color:var(--color-coral-deep)]/40 flex items-start gap-2">
            <AlertTriangle
              size={12}
              className="text-[color:var(--color-coral-deep)] shrink-0 mt-0.5"
            />
            <div className="prose-body italic text-[12px] text-[color:var(--color-coral-deep)] leading-snug">
              {error}
            </div>
          </div>
        )}

        {/* Success affordance */}
        {pendingType && !error && (
          <div className="px-5 py-3 bg-[color:var(--color-success)]/10 border-t-[0.5px] border-[color:var(--color-success)]/40 flex items-center gap-2">
            <Check
              size={12}
              className="text-[color:var(--color-success)] shrink-0"
            />
            <div className="prose-body italic text-[12px] text-[color:var(--color-success)]">
              {t('spark.promote.success')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function fmtRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
