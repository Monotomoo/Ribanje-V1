import SunCalc from 'suncalc';
import type {
  AntiScriptMoment,
  AppState,
  Catch,
  CrewMember,
  Episode,
  Location,
  Meal,
  ShootDay,
  Shot,
} from '../../types';
import { SHOOT_END_ISO, SHOOT_START_ISO } from '../../lib/selectors';

/* Production-module selectors. Pure functions. No React. */

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function shootDaysSorted(state: AppState): ShootDay[] {
  return [...state.shootDays].sort((a, b) => a.date.localeCompare(b.date));
}

export interface ResolvedShootDay {
  day: ShootDay;
  index: number;       // 1-based position in sorted shoot days
  total: number;
  /* Relationship to today: */
  daysAway: number;    // positive = upcoming, 0 = today, negative = past
  isToday: boolean;
  isPreShoot: boolean; // today is before the shoot window
  isPostShoot: boolean;// today is after the shoot window
  isInShoot: boolean;  // today is within the shoot window (inclusive)
  episode: Episode | null;
  anchorage: Location | null;
}

/* Resolve which shoot day to display given a target date.
   - If targetDate matches an exact shoot day, that's "today."
   - If targetDate is before any shoot day, return the FIRST upcoming day.
   - If targetDate is after all shoot days, return the LAST day. */
export function resolveShootDay(
  state: AppState,
  targetDateIso?: string
): ResolvedShootDay | null {
  const sorted = shootDaysSorted(state);
  if (sorted.length === 0) return null;

  const target = targetDateIso || todayIso();
  const targetMs = new Date(target + 'T00:00:00Z').getTime();
  const startMs = new Date(SHOOT_START_ISO + 'T00:00:00Z').getTime();
  const endMs = new Date(SHOOT_END_ISO + 'T23:59:59Z').getTime();

  /* Exact match? */
  let idx = sorted.findIndex((d) => d.date === target);
  let isToday = idx >= 0;

  /* Else next upcoming after target */
  if (idx < 0) {
    idx = sorted.findIndex((d) => d.date > target);
  }

  /* Else past — last day */
  if (idx < 0) idx = sorted.length - 1;

  const day = sorted[idx];
  const dayMs = new Date(day.date + 'T00:00:00Z').getTime();
  const daysAway = Math.round((dayMs - targetMs) / (1000 * 60 * 60 * 24));

  const allEpisodes = [...state.episodes, ...state.specials];
  const episode = day.episodeId
    ? allEpisodes.find((e) => e.id === day.episodeId) ?? null
    : null;
  const anchorage = day.anchorageId
    ? state.locations.find((l) => l.id === day.anchorageId) ?? null
    : null;

  return {
    day,
    index: idx + 1,
    total: sorted.length,
    daysAway,
    isToday,
    isPreShoot: targetMs < startMs,
    isPostShoot: targetMs > endMs,
    isInShoot: targetMs >= startMs && targetMs <= endMs,
    episode,
    anchorage,
  };
}

export interface SunTimes {
  sunrise: Date | null;
  goldenMorningEnd: Date | null;     // SunCalc.goldenHourEnd — morning soft-light ends
  solarNoon: Date | null;
  goldenEveningStart: Date | null;   // SunCalc.goldenHour — evening soft-light starts
  sunset: Date | null;
  dusk: Date | null;
}

export function sunTimesFor(dateIso: string, lat: number, lng: number): SunTimes {
  const d = new Date(dateIso + 'T12:00:00Z');
  const t = SunCalc.getTimes(d, lat, lng);
  return {
    sunrise: validate(t.sunrise),
    goldenMorningEnd: validate(t.goldenHourEnd),
    solarNoon: validate(t.solarNoon),
    goldenEveningStart: validate(t.goldenHour),
    sunset: validate(t.sunset),
    dusk: validate(t.dusk),
  };
}

function validate(d: Date | null | undefined): Date | null {
  if (!d) return null;
  return isNaN(d.getTime()) ? null : d;
}

export function fmtTime(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/* Shots filtered to a specific shoot day. Match by scene.dayIdx OR by episode
   for shots without a scene assignment. */
export function shotsForShootDay(state: AppState, shootDay: ShootDay): Shot[] {
  const sorted = shootDaysSorted(state);
  const dayIdx = sorted.findIndex((d) => d.id === shootDay.id);
  const scenesForDay = new Set(
    state.scenes.filter((s) => s.dayIdx === dayIdx).map((s) => s.id)
  );
  return state.shots.filter((s) => {
    if (s.sceneId && scenesForDay.has(s.sceneId)) return true;
    if (!s.sceneId && shootDay.episodeId && s.episodeId === shootDay.episodeId)
      return true;
    return false;
  });
}

/* Anti-script moments scoped to today's episode. */
export function antiScriptForShootDay(
  state: AppState,
  shootDay: ShootDay
): AntiScriptMoment[] {
  if (!shootDay.episodeId) return [];
  return state.antiScriptMoments.filter((m) => m.episodeId === shootDay.episodeId);
}

/* Catches scoped to today's episode (planned-vs-captured both shown). */
export function catchesForShootDay(state: AppState, shootDay: ShootDay): Catch[] {
  if (!shootDay.episodeId) return [];
  return state.catches.filter((c) => c.episodeId === shootDay.episodeId);
}

/* Meals scoped to today's episode. */
export function mealsForShootDay(state: AppState, shootDay: ShootDay): Meal[] {
  if (!shootDay.episodeId) return [];
  return state.meals.filter((m) => m.episodeId === shootDay.episodeId);
}

/* Crew on duty today. Tier A: returns all crew; Tier B will filter by availability. */
export function crewForShootDay(state: AppState, _shootDay: ShootDay): CrewMember[] {
  return state.crew;
}

/* Status counts for the today shot list. */
export interface ShotStatusCounts {
  planned: number;
  captured: number;
  cut: number;
  deferred: number;
  total: number;
}

export function countShotStatus(shots: Shot[]): ShotStatusCounts {
  const out: ShotStatusCounts = {
    planned: 0,
    captured: 0,
    cut: 0,
    deferred: 0,
    total: shots.length,
  };
  for (const s of shots) out[s.status] += 1;
  return out;
}
