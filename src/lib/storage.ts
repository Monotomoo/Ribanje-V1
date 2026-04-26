import type { AppState } from '../types';
import { makeInitialState } from './seed';

const STORAGE_KEY = 'ribanje-dashboard-v1';
const SPLASH_KEY = 'ribanje-splash-seen';

/*
  Load saved state and merge with current defaults.

  Saved states from older sessions may not have keys we've added since
  (variations, tasks, notes, assets, festivals, applications, shootDays,
  luts, micPlacements, outreachContacts, etc.). Without this merge, any
  component that does `state.variations.filter(...)` blows up.

  Strategy: spread defaults first, then loaded — so missing keys fall back
  to default arrays/objects, while existing keys keep their saved values.
  We also ensure the always-required arrays/objects are never `undefined`
  even if a saved state explicitly cleared them.
*/
export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return migrateState(parsed);
  } catch {
    return null;
  }
}

/* One-time migration of legacy crew nicknames → proper full names.
   Only renames if the saved record still holds the legacy placeholder
   string (preserves any user-edited names). */
const CREW_NAME_MIGRATIONS: Record<string, { from: string; to: string }> = {
  c1: { from: 'Tomo',           to: 'Tomislav Kovacic' },
  c5: { from: 'Marko',          to: 'Marko Stanic' },
  c6: { from: "Ivan's brother", to: 'Luka Paladina' },
};

/* One-time clearing of legacy seed rate values + deal-structure notes.
   These were placeholder assumptions baked in before any actual deals
   were made. Only clears if the saved record still holds the original
   seed string — user-entered rates and notes are preserved. */
const LEGACY_CREW_RATES: Record<string, string> = {
  c1: 'Equity + per diem',
  c2: 'DOP day rate + kit',
  c3: 'Per diem + back-end equity',
  c4: 'Per diem + back-end equity',
  c5: 'Day rate',
  c6: 'Project fee',
};

const LEGACY_CREW_NOTES: Record<string, { from: string; to: string }> = {
  c6: {
    from: 'Luka. Family connection to Ivan. In-kind via Ivan, modest fee budgeted.',
    to: 'Luka. Family connection to Ivan.',
  },
};

function migrateCrewNames(crew: AppState['crew']): AppState['crew'] {
  return crew.map((c) => {
    let next = c;
    /* Name migration */
    const nameRule = CREW_NAME_MIGRATIONS[c.id];
    if (nameRule && next.name === nameRule.from) {
      next = { ...next, name: nameRule.to };
    }
    /* Clear legacy rate placeholders */
    const legacyRate = LEGACY_CREW_RATES[c.id];
    if (legacyRate && next.rate === legacyRate) {
      next = { ...next, rate: undefined };
    }
    /* Clean legacy deal-structure notes */
    const noteRule = LEGACY_CREW_NOTES[c.id];
    if (noteRule && next.notes === noteRule.from) {
      next = { ...next, notes: noteRule.to };
    }
    return next;
  });
}

function migrateState(loaded: Partial<AppState>): AppState {
  const defaults = makeInitialState();
  const mergedCrew = loaded.crew ?? defaults.crew;
  const merged: AppState = {
    ...defaults,
    ...loaded,
    /* Hard guarantees — never let these be undefined even if saved state
       has explicit `undefined` (shouldn't happen from JSON, but guard anyway). */
    episodes: loaded.episodes ?? defaults.episodes,
    specials: loaded.specials ?? defaults.specials,
    sponsors: loaded.sponsors ?? defaults.sponsors,
    crew: migrateCrewNames(mergedCrew),
    risks: loaded.risks ?? defaults.risks,
    schedulePhases: loaded.schedulePhases ?? defaults.schedulePhases,
    milestones: loaded.milestones ?? defaults.milestones,
    shootDays: loaded.shootDays ?? defaults.shootDays,
    locations: loaded.locations ?? defaults.locations,
    routes: loaded.routes ?? defaults.routes,
    talents: loaded.talents ?? defaults.talents,
    catches: loaded.catches ?? defaults.catches,
    meals: loaded.meals ?? defaults.meals,
    references: loaded.references ?? defaults.references,
    antiScriptMoments: loaded.antiScriptMoments ?? defaults.antiScriptMoments,
    dopKit: loaded.dopKit ?? defaults.dopKit,
    luts: loaded.luts ?? defaults.luts,
    colorPalettes: loaded.colorPalettes ?? defaults.colorPalettes,
    klapa: loaded.klapa ?? defaults.klapa,
    micPlacements: loaded.micPlacements ?? defaults.micPlacements,
    journalEntries: loaded.journalEntries ?? defaults.journalEntries,
    contracts: loaded.contracts ?? defaults.contracts,
    episodeExtras: loaded.episodeExtras ?? defaults.episodeExtras,
    tasks: loaded.tasks ?? defaults.tasks,
    notes: loaded.notes ?? defaults.notes,
    variations: loaded.variations ?? defaults.variations,
    assets: loaded.assets ?? defaults.assets,
    outreachContacts: loaded.outreachContacts ?? defaults.outreachContacts,
    festivals: loaded.festivals ?? defaults.festivals,
    applications: loaded.applications ?? defaults.applications,
    /* Phase 9 — Production module entities (always default to empty arrays). */
    scenes: loaded.scenes ?? defaults.scenes,
    shots: loaded.shots ?? defaults.shots,
    takes: loaded.takes ?? defaults.takes,
    boatOpsDays: loaded.boatOpsDays ?? defaults.boatOpsDays,
    dataBackupDays: loaded.dataBackupDays ?? defaults.dataBackupDays,
    safetyDays: loaded.safetyDays ?? defaults.safetyDays,
    incidents: loaded.incidents ?? defaults.incidents,
    wrapEntries: loaded.wrapEntries ?? defaults.wrapEntries,
    walkieChannels: loaded.walkieChannels ?? defaults.walkieChannels,
    /* Phase 9 — Distribution + Marketing entities. */
    salesAgents: loaded.salesAgents ?? defaults.salesAgents,
    broadcasters: loaded.broadcasters ?? defaults.broadcasters,
    marketEvents: loaded.marketEvents ?? defaults.marketEvents,
    deals: loaded.deals ?? defaults.deals,
    socialPosts: loaded.socialPosts ?? defaults.socialPosts,
    trailerCuts: loaded.trailerCuts ?? defaults.trailerCuts,
    pressContacts: loaded.pressContacts ?? defaults.pressContacts,
    btsCapture: loaded.btsCapture ?? defaults.btsCapture,
    /* Phase 9 — Post-production + Voice memos + Sketches + Decisions + Research. */
    editMilestones: loaded.editMilestones ?? defaults.editMilestones,
    cueSheet: loaded.cueSheet ?? defaults.cueSheet,
    subtitleTracks: loaded.subtitleTracks ?? defaults.subtitleTracks,
    deliverableSpecs: loaded.deliverableSpecs ?? defaults.deliverableSpecs,
    voiceMemos: loaded.voiceMemos ?? defaults.voiceMemos,
    sketches: loaded.sketches ?? defaults.sketches,
    decisions: loaded.decisions ?? defaults.decisions,
    researchSources: loaded.researchSources ?? defaults.researchSources,
    producers: loaded.producers ?? defaults.producers,
    subjects: loaded.subjects ?? defaults.subjects,
    /* Phase 9 — Tier B deepenings. */
    sponsorDeliverables: loaded.sponsorDeliverables ?? defaults.sponsorDeliverables,
    colorScriptStops: loaded.colorScriptStops ?? defaults.colorScriptStops,
    audioCommissions: loaded.audioCommissions ?? defaults.audioCommissions,
    /* Phase 9 — Cinematography rig library */
    rigConfigurations: loaded.rigConfigurations ?? defaults.rigConfigurations,
    /* Scenarios deserve a per-key merge so a saved state with old funding
       keys doesn't lose the brief's full keyset. Shallow merge is enough
       since the inner shape hasn't changed. */
    scenarios: loaded.scenarios ?? defaults.scenarios,
  };
  return merged;
}

export function saveState(state: AppState): void {
  try {
    /* Strip transient UI state before persisting. */
    const persistable = {
      ...state,
      paletteOpen: false,
      captureOpen: false,
      printMode: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } catch {
    /* Quota exceeded or unavailable — silently degrade. */
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

export function hasSeenSplash(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_KEY) === '1';
  } catch {
    return false;
  }
}

export function markSplashSeen(): void {
  try {
    sessionStorage.setItem(SPLASH_KEY, '1');
  } catch {
    /* noop */
  }
}

/* Approximate localStorage usage in MB. Used to warn when image uploads bloat the store. */
export function estimateStorageMB(): number {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      const v = localStorage.getItem(k) ?? '';
      total += k.length + v.length;
    }
    return total / (1024 * 1024);
  } catch {
    return 0;
  }
}
