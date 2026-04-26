import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Disc,
  Plane,
  Skull,
  Sparkles,
  Waves,
  X,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { CameraSlot, DOPKitItem, Shot } from '../../types';

/* Kit Failure Simulator — pick one or more kit items to "fail" and see the
   blast radius across remaining shots. Computes:
   - Direct hits (shots that explicitly use the failed lens / cam slot)
   - Slot promotion path (Cam A down → B promotes to primary)
   - Lost shots (UW down on UW-only scenes = unsalvageable)
   - Salvageable shots (B-cam can cover A-cam framing in 70% of cases)

   Demo-grade DP decision support. The "what if" tool that builds disaster
   muscle memory before disaster hits. */

const SLOT_LABEL: Record<CameraSlot, string> = {
  A: 'Cam A',
  B: 'Cam B',
  drone: 'Drone',
  underwater: 'Underwater',
  crash: 'Crash',
};
const SLOT_ICON: Record<CameraSlot, typeof Camera> = {
  A: Camera,
  B: Camera,
  drone: Plane,
  underwater: Waves,
  crash: Disc,
};

/* Slot fallback rules: when slot X fails, what slot can attempt to cover? */
const SLOT_FALLBACK: Record<CameraSlot, CameraSlot | null> = {
  A: 'B',                  // A camera down → B promotes
  B: 'crash',              // B down → crash cam can pinch-hit
  drone: null,             // drone has no fallback (aerial only)
  underwater: null,        // UW has no fallback (water-tight only)
  crash: null,             // crash is already a fallback
};

interface ShotImpact {
  shot: Shot;
  status: 'lost' | 'salvageable' | 'unaffected';
  reason: string;
  fallbackSlot?: CameraSlot;
}

export function KitFailureSimulator() {
  const { state } = useApp();
  const [failedItemIds, setFailedItemIds] = useState<Set<string>>(new Set());

  const failedItems = useMemo(
    () => state.dopKit.filter((k) => failedItemIds.has(k.id)),
    [state.dopKit, failedItemIds]
  );

  /* Compute the failed slots from failed items.
     - Cam A failed if first 'camera' item failed (or any 'camera' tagged A)
     - Cam B failed if second 'camera' item failed
     - Drone slot if any 'aerial' item failed
     - UW slot if any 'underwater' item failed
     - Lens IDs that failed (per-shot impact) */
  const failedAnalysis = useMemo(() => {
    const cameraKits = state.dopKit.filter((k) => k.category === 'camera');
    const aerialKits = state.dopKit.filter((k) => k.category === 'aerial');
    const uwKits = state.dopKit.filter((k) => k.category === 'underwater');

    const failedSlots: Set<CameraSlot> = new Set();
    if (cameraKits[0] && failedItemIds.has(cameraKits[0].id)) failedSlots.add('A');
    if (cameraKits[1] && failedItemIds.has(cameraKits[1].id)) failedSlots.add('B');
    if (aerialKits.some((k) => failedItemIds.has(k.id))) failedSlots.add('drone');
    if (uwKits.some((k) => failedItemIds.has(k.id))) failedSlots.add('underwater');

    const failedLensIds = new Set(
      [...failedItemIds].filter((id) => {
        const item = state.dopKit.find((k) => k.id === id);
        return item?.category === 'lens';
      })
    );

    return { failedSlots, failedLensIds };
  }, [state.dopKit, failedItemIds]);

  /* Compute impact per shot (only for shots not yet captured) */
  const impacts = useMemo(() => {
    const remaining = state.shots.filter(
      (s) => s.status === 'planned' || s.status === 'deferred'
    );
    const out: ShotImpact[] = [];
    for (const shot of remaining) {
      const lensFailed = shot.lensId ? failedAnalysis.failedLensIds.has(shot.lensId) : false;
      const slotFailed = failedAnalysis.failedSlots.has(shot.cameraSlot);
      if (!lensFailed && !slotFailed) {
        out.push({ shot, status: 'unaffected', reason: '' });
        continue;
      }
      /* Slot has a fallback? */
      const fallback = SLOT_FALLBACK[shot.cameraSlot];
      if (slotFailed && fallback && !failedAnalysis.failedSlots.has(fallback)) {
        out.push({
          shot,
          status: 'salvageable',
          reason: `${SLOT_LABEL[shot.cameraSlot]} down → ${SLOT_LABEL[fallback]} can cover (~70% of framing)`,
          fallbackSlot: fallback,
        });
        continue;
      }
      /* Lens failed but slot ok → swap lens */
      if (lensFailed && !slotFailed) {
        out.push({
          shot,
          status: 'salvageable',
          reason: 'Lens unavailable — swap to alternative',
        });
        continue;
      }
      /* Both gone → lost */
      out.push({
        shot,
        status: 'lost',
        reason: lensFailed && slotFailed
          ? 'Lens + slot both down · no recovery path'
          : `${SLOT_LABEL[shot.cameraSlot]} has no fallback slot`,
      });
    }
    return out;
  }, [state.shots, failedAnalysis]);

  const counts = {
    lost: impacts.filter((i) => i.status === 'lost').length,
    salvageable: impacts.filter((i) => i.status === 'salvageable').length,
    unaffected: impacts.filter((i) => i.status === 'unaffected').length,
  };

  function toggleFailure(id: string) {
    setFailedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reset() {
    setFailedItemIds(new Set());
  }

  /* Group failable items by category */
  const failableCategories: Array<{ label: string; items: DOPKitItem[] }> = [
    {
      label: 'Cameras',
      items: state.dopKit.filter((k) => k.category === 'camera'),
    },
    { label: 'Lenses', items: state.dopKit.filter((k) => k.category === 'lens') },
    { label: 'Drone', items: state.dopKit.filter((k) => k.category === 'aerial') },
    {
      label: 'Underwater',
      items: state.dopKit.filter((k) => k.category === 'underwater'),
    },
    { label: 'Stab', items: state.dopKit.filter((k) => k.category === 'stab') },
  ].filter((g) => g.items.length > 0);

  const hasFailures = failedItemIds.size > 0;

  return (
    <section>
      <header className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] flex items-baseline gap-2">
            <Skull size={16} className="text-[color:var(--color-coral-deep)]" />
            Kit failure simulator
          </h3>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            "What if Cam A floods?" — toggle a failure, see the shot blast radius.
            Builds disaster muscle memory.
          </p>
        </div>
        {hasFailures && (
          <button
            type="button"
            onClick={reset}
            className="flex items-baseline gap-1 label-caps text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)]"
          >
            <X size={11} />
            reset
          </button>
        )}
      </header>

      <div className="grid grid-cols-[320px_1fr] gap-5">
        {/* Failure picker */}
        <aside className="space-y-3">
          {failableCategories.map((g) => (
            <div
              key={g.label}
              className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-3 py-2.5"
            >
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
                {g.label}
              </div>
              <ul className="space-y-1">
                {g.items.map((item) => {
                  const failed = failedItemIds.has(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggleFailure(item.id)}
                        className={`w-full text-left flex items-baseline gap-2 px-2 py-1 rounded-[2px] transition-colors ${
                          failed
                            ? 'bg-[color:var(--color-coral)]/15 text-[color:var(--color-coral-deep)]'
                            : 'hover:bg-[color:var(--color-paper-deep)]/30 text-[color:var(--color-on-paper)]'
                        }`}
                      >
                        <span
                          className={`inline-block w-3 h-3 rounded-[2px] border-[0.5px] shrink-0 translate-y-[2px] ${
                            failed
                              ? 'bg-[color:var(--color-coral)] border-[color:var(--color-coral)]'
                              : 'border-[color:var(--color-border-paper-strong)]'
                          }`}
                        />
                        <span
                          className={`prose-body italic text-[12px] flex-1 truncate ${
                            failed ? 'line-through' : ''
                          }`}
                        >
                          {item.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* Impact display */}
        <div className="space-y-3">
          {!hasFailures ? (
            <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-8 text-center">
              <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
                Click an item to mark it as "failed" — see how many remaining
                shots are affected, what's salvageable, what's lost.
              </p>
            </div>
          ) : (
            <>
              {/* Impact summary */}
              <div className="grid grid-cols-3 gap-3">
                <ImpactTile
                  label="Lost"
                  count={counts.lost}
                  tone="coral"
                  hint="no recovery"
                />
                <ImpactTile
                  label="Salvageable"
                  count={counts.salvageable}
                  tone="warn"
                  hint="fallback path"
                />
                <ImpactTile
                  label="Unaffected"
                  count={counts.unaffected}
                  tone="success"
                  hint="proceed normally"
                />
              </div>

              {/* Failed items recap */}
              <div className="bg-[color:var(--color-coral)]/10 border-l-2 border-[color:var(--color-coral)] px-4 py-3">
                <div className="label-caps text-[color:var(--color-coral-deep)] mb-1">
                  failed kit ({failedItems.length})
                </div>
                <div className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]">
                  {failedItems.map((it) => it.label).join(' · ')}
                </div>
              </div>

              {/* Salvageable & lost shot lists */}
              {counts.lost > 0 && (
                <ImpactList
                  title="Lost shots"
                  tone="coral"
                  impacts={impacts.filter((i) => i.status === 'lost')}
                />
              )}
              {counts.salvageable > 0 && (
                <ImpactList
                  title="Salvageable shots"
                  tone="warn"
                  impacts={impacts.filter((i) => i.status === 'salvageable')}
                />
              )}

              {/* Recovery plan */}
              <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-brass)]/40 rounded-[3px] px-4 py-3">
                <div className="label-caps text-[color:var(--color-brass-deep)] mb-2 flex items-baseline gap-1.5">
                  <Sparkles size={11} />
                  recovery plan
                </div>
                <RecoveryPlan
                  failedSlots={Array.from(failedAnalysis.failedSlots)}
                  lostCount={counts.lost}
                  salvageableCount={counts.salvageable}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function ImpactTile({
  label,
  count,
  tone,
  hint,
}: {
  label: string;
  count: number;
  tone: 'coral' | 'warn' | 'success';
  hint: string;
}) {
  const valueColor =
    tone === 'coral'
      ? 'text-[color:var(--color-coral-deep)]'
      : tone === 'warn'
      ? 'text-[color:var(--color-warn)]'
      : 'text-[color:var(--color-success)]';
  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-3">
      <div className="label-caps text-[color:var(--color-on-paper-muted)] mb-1">
        {label}
      </div>
      <div className={`display-italic text-[28px] tabular-nums leading-none ${valueColor}`}>
        {count}
      </div>
      <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-1">
        {hint}
      </div>
    </article>
  );
}

function ImpactList({
  title,
  tone,
  impacts,
}: {
  title: string;
  tone: 'coral' | 'warn';
  impacts: ShotImpact[];
}) {
  const headerColor =
    tone === 'coral'
      ? 'text-[color:var(--color-coral-deep)]'
      : 'text-[color:var(--color-warn)]';
  return (
    <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
      <header className={`px-4 py-2 label-caps ${headerColor} border-b-[0.5px] border-[color:var(--color-border-paper)]`}>
        {title} ({impacts.length})
      </header>
      <ul className="max-h-[200px] overflow-y-auto">
        {impacts.slice(0, 25).map((i) => {
          const Icon = SLOT_ICON[i.shot.cameraSlot];
          return (
            <li
              key={i.shot.id}
              className="px-4 py-2 grid grid-cols-[80px_1fr_180px] gap-2 items-baseline border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0"
            >
              <span className="display-italic text-[12px] text-[color:var(--color-on-paper)] flex items-baseline gap-1.5">
                <Icon size={9} className="text-[color:var(--color-brass-deep)]" />
                {i.shot.number}
              </span>
              <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] truncate">
                {i.shot.description || '—'}
              </span>
              <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] flex items-baseline gap-1.5 truncate">
                {i.fallbackSlot && (
                  <ArrowRight
                    size={9}
                    className="text-[color:var(--color-brass-deep)] shrink-0"
                  />
                )}
                {i.reason}
              </span>
            </li>
          );
        })}
        {impacts.length > 25 && (
          <li className="px-4 py-2 text-center prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
            …and {impacts.length - 25} more
          </li>
        )}
      </ul>
    </div>
  );
}

function RecoveryPlan({
  failedSlots,
  lostCount,
  salvageableCount,
}: {
  failedSlots: CameraSlot[];
  lostCount: number;
  salvageableCount: number;
}) {
  const plan: string[] = [];

  if (failedSlots.includes('A') && !failedSlots.includes('B')) {
    plan.push(
      'Promote Cam B to primary on all A-cam shots. Brief operator. Re-frame for B-cam character (cooler, sharper).'
    );
  }
  if (failedSlots.includes('drone')) {
    plan.push(
      'Aerial coverage lost — substitute with high-angle handheld from boat mast or rope-up shot from rigging if safe.'
    );
  }
  if (failedSlots.includes('underwater')) {
    plan.push(
      'Underwater coverage lost — substitute with surface POV, splash-cam (waterproof phone in case), or defer UW scenes.'
    );
  }
  if (lostCount > 0) {
    plan.push(
      `${lostCount} shot(s) lost — flag with the editor immediately, plan reshoot windows or write around them in edit.`
    );
  }
  if (salvageableCount > 0) {
    plan.push(
      `${salvageableCount} shot(s) salvageable via fallback — operator briefings + framing adjustments needed before next roll.`
    );
  }
  if (plan.length === 0) {
    plan.push('No remaining shot impact. Failed item only affects past coverage.');
  }

  return (
    <ol className="space-y-1.5">
      {plan.map((step, i) => (
        <li
          key={i}
          className="flex items-baseline gap-2 prose-body italic text-[12px] text-[color:var(--color-on-paper)] leading-relaxed"
        >
          <AlertTriangle
            size={11}
            className="text-[color:var(--color-brass-deep)] shrink-0 translate-y-[2px]"
          />
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}
