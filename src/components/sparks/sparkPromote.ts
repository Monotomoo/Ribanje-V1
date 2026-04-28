import type { Dispatch } from 'react';
import type {
  AntiScriptMoment,
  AppState,
  Reference,
  Shot,
  Spark,
  SparkPromotionType,
  Task,
} from '../../types';
import type { Action } from '../../state/reducer';

/* ---------- sparkPromote (Phase 13) ----------
   Convert a Spark into a real planning entity. The spark stays in
   state.sparks with status='promoted' + promotedTo metadata; the new
   entity carries inherited content. */

export function promoteSpark(
  spark: Spark,
  state: AppState,
  dispatch: Dispatch<Action>,
  type: SparkPromotionType
): { ok: true; entityId: string } | { ok: false; reason: string } {
  switch (type) {
    case 'beat':
      return promoteToBeat(spark, state, dispatch);
    case 'shot':
      return promoteToShot(spark, state, dispatch);
    case 'reference':
      return promoteToReference(spark, dispatch);
    case 'task':
      return promoteToTask(spark, dispatch);
    case 'location':
      return { ok: false, reason: 'location promotion not implemented yet' };
  }
}

function markPromoted(
  sparkId: string,
  type: SparkPromotionType,
  targetId: string,
  dispatch: Dispatch<Action>
) {
  dispatch({
    type: 'UPDATE_SPARK',
    id: sparkId,
    patch: {
      status: 'promoted',
      promotedTo: { type, targetId, promotedAt: new Date().toISOString() },
    },
  });
}

/* ---------- Beat (AntiScriptMoment) ---------- */

function promoteToBeat(
  spark: Spark,
  state: AppState,
  dispatch: Dispatch<Action>
): { ok: true; entityId: string } | { ok: false; reason: string } {
  /* Need an episode. Use spark.episodeId if present, else the first
     concept episode, else fail. */
  const episodeId =
    spark.episodeId ??
    state.episodes[0]?.id ??
    state.specials[0]?.id;
  if (!episodeId) {
    return { ok: false, reason: 'no episode to attach beat to' };
  }
  const orderIdx =
    Math.max(0, ...state.antiScriptMoments.map((m) => m.orderIdx)) + 1;
  const moment: AntiScriptMoment = {
    id: `mom-${spark.id}`,
    episodeId,
    title: spark.title,
    expectedDurationMin: 5,
    who: '',
    what: spark.body ?? '',
    where: state.locations.find((l) => l.id === spark.locationId)?.label ?? '',
    whyItMatters: '',
    status: 'planned',
    orderIdx,
    isSurprise: spark.kind === 'verse' || spark.kind === 'quote',
    capturedAt: spark.kind === 'test-shot' ? spark.capturedAt : undefined,
    capturedAtLocationId: spark.locationId,
    voiceMemoId: spark.voiceMemoId,
    beatTags: spark.beatTags,
  };
  dispatch({ type: 'ADD_ANTI_SCRIPT', moment });
  markPromoted(spark.id, 'beat', moment.id, dispatch);
  return { ok: true, entityId: moment.id };
}

/* ---------- Shot ---------- */

function promoteToShot(
  spark: Spark,
  state: AppState,
  dispatch: Dispatch<Action>
): { ok: true; entityId: string } | { ok: false; reason: string } {
  /* Find a scene to attach it to — first scene of episode, else fail. */
  const episodeId =
    spark.episodeId ??
    state.episodes[0]?.id ??
    state.specials[0]?.id;
  if (!episodeId) return { ok: false, reason: 'no episode' };
  const scene = state.scenes.find((s) => s.episodeId === episodeId);
  if (!scene) {
    return { ok: false, reason: 'no scene in episode — create one first' };
  }
  const sceneShots = state.shots.filter((s) => s.sceneId === scene.id);
  const shot: Shot = {
    id: `shot-${spark.id}`,
    sceneId: scene.id,
    episodeId,
    number: `${scene.slug}.${sceneShots.length + 1}`,
    description: spark.title + (spark.body ? ' — ' + spark.body : ''),
    cameraSlot: 'A',
    framing: 'MS',
    movement: 'static',
    audioPlan: 'boom+lav',
    notes: spark.notes,
    status: 'planned',
  };
  dispatch({ type: 'ADD_SHOT', shot });
  markPromoted(spark.id, 'shot', shot.id, dispatch);
  return { ok: true, entityId: shot.id };
}

/* ---------- Reference ---------- */

function promoteToReference(
  spark: Spark,
  dispatch: Dispatch<Action>
): { ok: true; entityId: string } {
  const reference: Reference = {
    id: `ref-${spark.id}`,
    episodeId: spark.episodeId ?? 'general',
    type: 'film',
    title: spark.title,
    whyItMatters: spark.body ?? '',
    notes: spark.notes ?? '',
    sceneTag: spark.beatTags?.[0],
  };
  dispatch({ type: 'ADD_REFERENCE', reference });
  markPromoted(spark.id, 'reference', reference.id, dispatch);
  return { ok: true, entityId: reference.id };
}

/* ---------- Task ---------- */

function promoteToTask(
  spark: Spark,
  dispatch: Dispatch<Action>
): { ok: true; entityId: string } {
  const now = new Date().toISOString();
  const task: Task = {
    id: `task-${spark.id}`,
    title: spark.title,
    description: spark.body ?? '',
    assigneeId: spark.capturedBy,
    episodeId: spark.episodeId,
    status: 'todo',
    priority: 'med',
    context: 'general',
    tags: spark.beatTags ?? [],
    createdAt: now,
    updatedAt: now,
  };
  dispatch({ type: 'ADD_TASK', task });
  markPromoted(spark.id, 'task', task.id, dispatch);
  return { ok: true, entityId: task.id };
}
