/* ribanje 2026 — full data model */

/* ---------- Scenarios & finance (from brief) ---------- */

export type ScenarioKey = 'lean' | 'realistic' | 'ambitious';

export interface FundingSourceMeta {
  key: string;
  label: string;
  color: string;
  isStateAid: boolean;
  isCalculated?: boolean;
  tag: 'state' | 'private';
}

export interface CostCategoryMeta {
  key: string;
  label: string;
}

export interface CashflowQuarter {
  quarter: string;
  inflows: Record<string, number>;
  outflow: number;
}

export interface ScenarioData {
  episodes: number;
  funding: Record<string, number>;
  costs: Record<string, number>;
  cashflow: CashflowQuarter[];
  qualifyingSpendPct: number;
  blendedRebateRate: number;
}

/* ---------- Episodes (from brief) ---------- */

export type EpisodeStatus = 'concept' | 'scripted' | 'shot' | 'cut' | 'locked';

export interface Episode {
  id: string;
  number: number;
  title: string;
  anchor: string;
  theme: string;
  synopsis: string;
  runtime: number;
  status: EpisodeStatus;
}

/* ---------- Sponsors (extended for pipeline + brief library) ---------- */

export type SponsorStatus = 'prospect' | 'contacted' | 'pitched' | 'committed';

export interface Sponsor {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  expectedAmount: number;
  category: string;
  status: SponsorStatus;
  notes: string;
  /* Phase 8 brief library extensions (optional). */
  episodeIds?: string[];      // which episodes this sponsor anchors
  valueExchange?: string;     // beyond money — access, locations, integration
  decisionMaker?: string;     // contact at the sponsor side
  briefNotes?: string;        // long-form brief / fit memo
  lastContactDate?: string;   // ISO date of most recent outreach
}

export type OutreachChannel =
  | 'email'
  | 'phone'
  | 'intro'
  | 'meeting'
  | 'event'
  | 'other';

export interface OutreachContact {
  id: string;
  sponsorId: string;
  date: string;
  channel: OutreachChannel;
  reachedOut: string;         // who from our side
  contactedPerson?: string;   // who on their side
  response: string;
  nextStep?: string;
  nextStepDate?: string;
}

/* ---------- Crew (from brief) ---------- */

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  rate?: string;
  contact?: string;
  link?: string;
  notes?: string;
}

/* ---------- Risks (extended ISO 31000-style) ---------- */

export type RiskAxis = 'low' | 'high';

export type RiskCategory =
  | 'weather'
  | 'equipment'
  | 'talent'
  | 'regulatory'
  | 'financial'
  | 'operational'
  | 'post'
  | 'health'
  | 'legal';

export type RiskStatus =
  | 'open'
  | 'mitigating'
  | 'mitigated'
  | 'accepted'
  | 'closed';

/* 1–5 ordinal scale for probability and impact. */
export type RiskScale = 1 | 2 | 3 | 4 | 5;

export interface Risk {
  id: string;
  title: string;
  /* Legacy 2-axis (kept for backwards compat with old seed). */
  probability: RiskAxis;
  impact: RiskAxis;
  description: string;
  mitigation: string;

  /* ISO-style extension (optional with sensible defaults). */
  category?: RiskCategory;
  probabilityScale?: RiskScale;
  impactScale?: RiskScale;
  ownerId?: string;           // crew member id
  residualP?: RiskScale;
  residualI?: RiskScale;
  status?: RiskStatus;
  triggerConditions?: string;
  responsePlan?: string;
}

/* ---------- Schedule (from brief) ---------- */

export interface SchedulePhase {
  id: string;
  label: string;
  start: string; // ISO date
  end: string;
  lane: number;
  color: string;
  /* Phase 9 — Schedule rework */
  ownerId?: string;        // crew member responsible for this phase
  critical?: boolean;      // marked on the critical path
  notes?: string;          // free-form planning notes
}

export type MilestoneCategory =
  | 'havc'
  | 'eu-media'
  | 'hrt'
  | 'festival'
  | 'shoot'
  | 'post'
  | 'internal';

export type MilestoneStatus = 'open' | 'snoozed' | 'done';

export interface Milestone {
  id: string;
  label: string;
  date: string;
  category?: MilestoneCategory;
  /* Phase 9 — Schedule rework */
  ownerId?: string;
  status?: MilestoneStatus;
  notes?: string;
}

/* ---------- Shoot day (October 2026 micro-schedule) ---------- */

export type WeatherWindow = 'clear' | 'mixed' | 'bura' | 'jugo' | 'storm';

export interface ShootDay {
  id: string;
  date: string;            // ISO date
  episodeId?: string;
  anchorageId?: string;
  weatherWindow?: WeatherWindow;
  notes?: string;
  /* Phase 9 — Pre-shoot kit checklist state per day (key → done) */
  kitChecklist?: Record<string, boolean>;
}

/* ---------- Locations & itinerary ---------- */

export type LocationType = 'anchorage' | 'shore' | 'reference' | 'special';

export interface Location {
  id: string;
  label: string;
  episodeId: string | 'general' | 'hektorovic';
  lat: number;
  lng: number;
  type: LocationType;
  notes: string;
  goldenHourNotes?: string;
  /* Phase 10 — Sun-arc + tide overlay */
  bowHeadingDeg?: number;     // typical bow heading at anchor (0=N, 90=E, 180=S, 270=W)
  tideAmplitudeM?: number;    // typical tidal range, meters (Adriatic ~0.3m, head of Adriatic up to 1m)
  tideLowTime?: string;       // approx low-tide local time, free-form e.g. "06:30"
  tideHighTime?: string;      // approx high-tide local time
}

export interface Route {
  id: string;
  episodeId: string;
  fromLocationId: string;
  toLocationId: string;
  distanceNm?: number;
  etaHours?: number;
}

/* ---------- Talent pipeline ---------- */

export type TalentStatus =
  | 'prospect'
  | 'contacted'
  | 'confirmed'
  | 'declined';

export interface Talent {
  id: string;
  name: string;
  role: string;
  episodeId: string | 'general';
  location: string;
  status: TalentStatus;
  contact?: string;
  whyThem: string;
  notes: string;
}

/* ---------- Catch log ---------- */

export type CatchMethod = 'line' | 'spear' | 'net' | 'trap' | 'other';

export interface Catch {
  id: string;
  episodeId: string;
  fishCro: string;
  fishLat: string;
  fishEng: string;
  method: CatchMethod;
  anchorageId?: string;
  timeOfDay: string;
  weather: string;
  weightKg?: number;
  hektorovicVerseRef?: string;
  photoBase64?: string;
  notes: string;
}

/* ---------- Meal log ---------- */

export interface Meal {
  id: string;
  episodeId: string;
  dish: string;
  wineProducer?: string;
  wineRegion?: string;
  fishLinkCatchId?: string;
  recipe: string;
  photoBase64?: string;
  notes: string;
}

/* ---------- Reference film/image/quote ---------- */

export type ReferenceType = 'film' | 'image' | 'quote' | 'book' | 'other';

export interface Reference {
  id: string;
  episodeId: string | 'general';
  type: ReferenceType;
  title: string;
  director?: string;
  year?: number;
  sourceUrl?: string;
  whyItMatters: string;
  imageBase64?: string;
  notes: string;
  /* Phase 9 — scene-tag for shot reference library grouping */
  sceneTag?: string;        // e.g. 'interview' · 'sunset' · 'klapa' · 'catch'
}

/* ---------- Beat templates (cross-episode library) ---------- */

export type BeatIcon =
  | 'departure'
  | 'catch'
  | 'elder'
  | 'meal'
  | 'sunrise'
  | 'sunset'
  | 'homecoming'
  | 'klapa'
  | 'verse'
  | 'storm'
  | 'wine'
  | 'observational'
  | 'aerial'
  | 'underwater'
  | 'custom';

export interface BeatTemplate {
  id: string;
  label: string;
  description: string;
  defaultDurationMin: number;
  iconType: BeatIcon;
}

/* ---------- Anti-script moment cards ---------- */

export type MomentStatus = 'planned' | 'captured' | 'cut';

export interface AntiScriptMoment {
  id: string;
  episodeId: string;
  title: string;
  expectedDurationMin?: number;
  who: string;
  what: string;
  where: string;
  whyItMatters: string;
  status: MomentStatus;
  orderIdx: number;
  /* Phase 9 — per-beat lens prescription (DOPKitItem id) */
  recommendedLensId?: string;
  /* Free-form override note for the lens recommendation */
  lensReasoning?: string;
}

/* ---------- DOP cockpit ---------- */

export type DOPCategory =
  | 'camera'
  | 'lens'
  | 'audio'
  | 'stab'
  | 'aerial'
  | 'underwater'
  | 'storage'
  | 'other';

export type KitStatus =
  | 'ready'
  | 'rolling'
  | 'standby'
  | 'charging'
  | 'drying'
  | 'serviced'
  | 'down';

export interface DOPKitItem {
  id: string;
  category: DOPCategory;
  label: string;
  notes?: string;
  /* Phase 8 spec extensions (all optional). */
  specs?: Record<string, string>; // free-form key/value spec sheet
  weightKg?: number;
  wattsPerHour?: number;          // estimated draw for power planning
  capacityGb?: number;             // for storage items
  characterNotes?: string;         // for lenses — vibe / look
  dailyRateK?: number;             // per-day rental cost (€k)
  /* Phase 9 — Live kit status board (DURING shoot) */
  status?: KitStatus;
  statusUpdatedAt?: string;        // ISO timestamp of last status change
  /* Phase 9 — Lens character numerics for matrix visualization */
  lensWarmth?: number;             // -5 (cool) to +5 (warm)
  lensSharpness?: number;          // 0 (soft/painterly) to 10 (clinical)
  lensContrast?: number;           // 0 (low) to 10 (high)
  lensCloseFocusM?: number;        // close focus distance in meters
}

/* ---------- Color management (LUTs) ---------- */

export interface LUT {
  id: string;
  name: string;
  episodeId?: string | 'general';
  sourceColorspace: string;
  targetColorspace: string;
  notes: string;
}

export interface ColorPalette {
  id: string;
  episodeId: string | 'general';
  label: string;
  colors: string[]; // 5 hex strings
  sourceImageBase64?: string;
  notes: string;
}

/* ---------- Sound cockpit ---------- */

export type KlapaRegion =
  | 'south-dalmatia'
  | 'central-dalmatia'
  | 'north-dalmatia'
  | 'kvarner'
  | 'istria';

export type RightsStatus =
  | 'public-domain'
  | 'arranged-needs-clearance'
  | 'commissioned'
  | 'unknown';

export interface KlapaEntry {
  id: string;
  region: KlapaRegion;
  songTitle: string;
  klapaName?: string;
  rightsStatus: RightsStatus;
  notes: string;
  /* Phase 8 rights extensions */
  feeEstimateK?: number;
  rightsHolderContact?: string;
  episodeIds?: string[];
  /* Phase 9 — Research extensions */
  lyricsHr?: string;
  lyricsEn?: string;
  audioBase64?: string;        // optional audio reference
  sheetMusicBase64?: string;   // optional notation image
  bpm?: number;
  mood?: string;
}

/* ---------- Sound logistics ---------- */

export interface MicPlacement {
  id: string;
  label: string;              // "Boom 1", "Lav · Ivan", etc.
  kitId?: string;             // dop kit item ID for the mic
  position: string;           // "Bow port", "On Ivan, lapel", etc.
  channelMHz?: number;        // RF channel
  episodeId?: string | 'general';
  notes: string;
}

/* ---------- Festivals & funding applications ---------- */

export type FestivalStatus =
  | 'target'
  | 'submitted'
  | 'accepted'
  | 'declined'
  | 'won'
  | 'withdrawn';

export interface FestivalSubmission {
  id: string;
  name: string;
  url?: string;
  city: string;
  country: string;
  category?: string;             // "docs · feature" etc.
  deadline?: string;             // ISO
  feeEur?: number;
  fitScore?: number;             // 1–5
  status: FestivalStatus;
  notes: string;
}

export type ApplicationStatus =
  | 'planning'
  | 'drafting'
  | 'submitted'
  | 'won'
  | 'declined';

export interface FundingApplication {
  id: string;
  name: string;
  funder: string;
  deadline?: string;
  status: ApplicationStatus;
  amountK?: number;
  draftSections: { id: string; label: string; body: string }[];
  notes: string;
}

/* ---------- Per-episode sound brief (lives on EpisodeExtras already) ---------- */

/* ---------- Production journal ---------- */

export type MoodTag = 'great' | 'good' | 'neutral' | 'rough' | 'bad';

export interface JournalEntry {
  id: string;
  date: string;
  shootDayIdx?: number;
  anchorageId?: string;
  weather: string;
  whatHappened: string;
  photoBase64?: string;
  moodTag: MoodTag;
}

/* ---------- Contracts ---------- */

export type ContractType =
  | 'talent-release'
  | 'location-release'
  | 'music-clearance'
  | 'sponsor'
  | 'crew'
  | 'other';

export type ContractStatus = 'drafted' | 'sent' | 'signed' | 'expired';

export interface Contract {
  id: string;
  type: ContractType;
  partyName: string;
  episodeId?: string | 'general';
  status: ContractStatus;
  dateDue?: string;
  notes: string;
}

/* ---------- Tasks (cross-cutting primitive) ---------- */

export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'med' | 'high';
export type TaskContext =
  | 'crew'
  | 'festival'
  | 'application'
  | 'general'
  | 'sound'
  | 'shoot-day'
  | 'sponsor';

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId?: string;          // crew id, or undefined for unassigned/shared
  episodeId?: string;
  status: TaskStatus;
  dueDate?: string;
  priority: TaskPriority;
  tags: string[];
  parentId?: string;
  context: TaskContext;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Notes / threads (cross-cutting primitive) ---------- */

export type NoteTargetType =
  | 'crew'
  | 'episode'
  | 'sponsor'
  | 'risk'
  | 'task'
  | 'location'
  | 'global';

export interface Note {
  id: string;
  authorId?: string;            // crew id, or undefined for self/Tomo
  targetType: NoteTargetType;
  targetId: string;             // 'global' for the global feed
  body: string;
  createdAt: string;
  resolvedAt?: string;
  pinned?: boolean;
}

/* ---------- Variations (cross-cutting primitive) ---------- */

export type VariationCategory =
  | 'logline'
  | 'title'
  | 'synopsis-short'
  | 'synopsis-medium'
  | 'synopsis-long'
  | 'pitch-deck'
  | 'sponsor-pitch';

export type VariationAudience =
  | 'general'
  | 'hrt'
  | 'eu-media'
  | 'sponsor-tier-1'
  | 'sponsor-tier-2'
  | 'sponsor-tier-3'
  | 'festival'
  | 'sales-agent'
  | 'press';

export interface Variation {
  id: string;
  category: VariationCategory;
  audience?: VariationAudience;
  body: string;
  isCurrent?: boolean;
  voteCount?: number;
  /* For sponsor pitchmaker — bind variation to a specific sponsor. */
  sponsorId?: string;
  createdAt: string;
}

/* ---------- Assets (cross-cutting primitive) ---------- */

export type AssetType = 'image' | 'audio' | 'pdf' | 'other';

export interface Asset {
  id: string;
  type: AssetType;
  label: string;
  base64: string;               // data URL
  size: number;                 // bytes
  uploadedAt: string;
  /* Optional refs to attach the asset to specific entities. */
  episodeId?: string;
  catchId?: string;
  mealId?: string;
  journalId?: string;
  noteId?: string;
}

/* ---------- Per-episode extras (Hektorović + craft notes) ---------- */

export interface EpisodeExtras {
  episodeId: string;
  hektorovicVerseCro: string;
  hektorovicVerseEng: string;
  hektorovicParallel: string;
  dopNotes: string;
  soundNotes: string;
}

/* ---------- Production module (the command bridge) ---------- */
/* Phase 9. Drives the on-water shooting cycle: scenes → shots → takes,
   plus per-day boat ops, data wrangling, safety, wrap. */

export type ShotStatus = 'planned' | 'captured' | 'cut' | 'deferred';
export type CameraSlot = 'A' | 'B' | 'drone' | 'underwater' | 'crash';
export type ShotFraming = 'ECU' | 'CU' | 'MCU' | 'MS' | 'MWS' | 'WS' | 'EWS';
export type ShotMovement =
  | 'static'
  | 'handheld'
  | 'trinity'
  | 'gimbal'
  | 'dolly'
  | 'crane'
  | 'drone';
export type AudioPlanType = 'boom' | 'lav' | 'boom+lav' | 'ambient' | 'MOS' | 'wild';
export type TakeStatus = 'NG' | 'OK' | 'PRINT';
export type IncidentSeverity = 'note' | 'minor' | 'major' | 'critical';
export type MoodMark = 'great' | 'good' | 'ok' | 'rough';

export interface Scene {
  id: string;
  episodeId: string;
  label: string;
  slug: string;
  dayIdx?: number;          // optional shoot-day-index assignment
  notes?: string;
}

export interface Shot {
  id: string;
  episodeId: string;
  sceneId?: string;
  number: string;           // free-form (e.g. "12A", "scene 3 / shot 4")
  description: string;
  cameraSlot: CameraSlot;
  lensId?: string;          // links to DOPKitItem.id
  framing?: ShotFraming;
  movement?: ShotMovement;
  audioPlan?: AudioPlanType;
  operator?: string;        // crew member id
  durationEstMin?: number;
  status: ShotStatus;
  notes?: string;
  /* Phase 9 — Continuity extensions (technical metadata for editor handoff) */
  isoValue?: number;
  wbKelvin?: number;
  filter?: string;          // free-form e.g. "IRND 1.2 + CPL"
  frameRate?: string;       // e.g. "24p", "48p", "120p"
  shutterAngle?: number;    // degrees, e.g. 180
}

export interface Take {
  id: string;
  shotId: string;
  takeNum: number;
  status: TakeStatus;
  timecode?: string;        // free-form HH:MM:SS:FF or sequence
  notes?: string;
  retakePlanned?: boolean;
  /* Phase 9 — Live Roll Cockpit timing fields */
  startedAt?: string;       // ISO timestamp when ROLL was hit
  endedAt?: string;         // ISO timestamp when CUT was hit
  durationSec?: number;     // computed duration of this take
  voiceMemoId?: string;     // optional link to a VoiceMemo
  cameraSlot?: CameraSlot;  // which cam was rolling
  whConsumed?: number;      // est. Wh consumed during this take
  gbConsumed?: number;      // est. GB consumed during this take
}

export interface BoatOpsDay {
  id: string;
  date: string;             // ISO YYYY-MM-DD
  anchorageId?: string;
  fuelPct: number;          // 0–100
  waterPct: number;
  provisionsPct: number;
  skipperId?: string;       // crew member id
  watchRotation?: string;
  weatherNotes: string;
  windDir?: string;         // e.g. "WSW 14kn"
  seaStateM?: number;       // wave height meters
}

export interface DataBackupDay {
  id: string;
  date: string;
  drive1OK: boolean;
  drive2OK: boolean;
  cloudOK: boolean;
  tbCaptured: number;
  hashLog: string;
  driveManifest?: string;
}

export interface SafetyDay {
  id: string;
  date: string;
  lifeVestsIssued: boolean;
  weatherChecked: boolean;
  mobDrillScheduled: boolean;
  commsOK: boolean;
  briefingComplete: boolean;
  notes?: string;
}

export interface IncidentEntry {
  id: string;
  date: string;
  severity: IncidentSeverity;
  description: string;
  actionTaken: string;
  lessonLearned?: string;
}

export interface WrapEntry {
  id: string;
  date: string;
  whatWorked: string;
  whatDidnt: string;
  tomorrowTweaks: string;
  moodMarks: Record<string, MoodMark>;   // crewId → mood
  hoursRolled?: number;
  variance?: string;
}

export interface WalkieChannel {
  id: string;
  crewId: string;
  primary: string;
  backup?: string;
}

/* ---------- Post-production module (Phase 9 Tier B) ---------- */

export type EditMilestonePhase =
  | 'assembly'
  | 'rough-cut'
  | 'fine-cut'
  | 'picture-lock'
  | 'online'
  | 'color'
  | 'sound-mix'
  | 'print-master';

export type EditMilestoneStatus =
  | 'pending'
  | 'in-progress'
  | 'review'
  | 'complete'
  | 'blocked';

export interface EditMilestone {
  id: string;
  episodeId: string | 'all';     // 'all' for cross-episode arc milestones
  phase: EditMilestonePhase;
  targetDate?: string;
  actualDate?: string;
  status: EditMilestoneStatus;
  ownerId?: string;              // crewId
  notes?: string;
  deliverables?: string[];       // checklist items
}

export type CueSheetUsage = 'background' | 'featured' | 'theme' | 'end-credit';
export type CueSheetRightsStatus =
  | 'cleared'
  | 'pending'
  | 'public-domain'
  | 'commissioned'
  | 'unknown';

export interface CueSheetEntry {
  id: string;
  episodeId: string;
  tcIn: string;                  // free-form HH:MM:SS:FF
  tcOut: string;
  songTitle: string;
  composer?: string;
  publisher?: string;
  performer?: string;
  usage: CueSheetUsage;
  durationSec?: number;
  territory?: string;
  rightsStatus: CueSheetRightsStatus;
  notes?: string;
}

export type SubtitleStatus =
  | 'not-started'
  | 'in-translation'
  | 'in-review'
  | 'locked';

export interface SubtitleTrack {
  id: string;
  episodeId: string;
  language: string;              // 'HR', 'EN', 'DE', 'FR', etc.
  translator?: string;
  status: SubtitleStatus;
  wordCount?: number;
  costEstimateK?: number;
  format?: string;               // 'SRT' | 'TTML' | 'SDH' | embedded
  notes?: string;
}

export interface DeliverableSpec {
  id: string;
  buyer: string;                 // HRT, BBC Storyville, ARTE, etc.
  format: string;                // ProRes 422 HQ, DCP, H.264
  resolution: string;
  framerate: string;
  audioFormat: string;
  subtitleFormat?: string;
  metadata?: string;
  notes?: string;
}

/* ---------- Voice memos (Phase 9 creative tool) ---------- */

export interface VoiceMemo {
  id: string;
  recordedAt: string;            // ISO timestamp
  durationMs: number;
  audioBase64: string;           // data URL (Opus / webm)
  mimeType: string;
  transcript?: string;
  /* Lightweight tagging — link to entities. */
  episodeId?: string;
  catchId?: string;
  mealId?: string;
  scope?: 'idea' | 'note' | 'observation' | 'beat' | 'interview';
  label?: string;                // optional human label
}

/* ---------- Sketches (Phase 9 creative tool) ---------- */

export interface Sketch {
  id: string;
  episodeId: string;
  beatId?: string;               // optional anti-script-moment link
  label?: string;
  pngBase64: string;
  createdAt: string;
}

/* ---------- Research module (Phase 9 Tier C) ---------- */

export type ResearchSourceType =
  | 'book'
  | 'article'
  | 'archive'
  | 'oral-history'
  | 'film'
  | 'paper'
  | 'other';

export interface ResearchSource {
  id: string;
  type: ResearchSourceType;
  title: string;
  author?: string;
  year?: number;
  url?: string;
  summary?: string;
  episodeId?: string;          // optional link to episode
  whyItMatters?: string;
  notes?: string;
}

export type ProducerKind = 'wine' | 'olive';

export interface Producer {
  id: string;
  kind: ProducerKind;
  name: string;
  region: string;
  contact?: string;
  flagship?: string;           // signature wine / oil
  willingFeature?: 'unknown' | 'reachable' | 'committed' | 'declined';
  episodeId?: string;          // which episode features them
  notes?: string;
}

export interface Subject {
  id: string;
  name: string;
  role: string;                // 'elder fisherman', 'klapa singer', etc.
  episodeId: string;
  location?: string;
  contact?: string;
  releaseStatus?: 'pending' | 'signed' | 'expired';
  releaseContractId?: string;
  greatOnCamera?: boolean;
  followUp?: string;
  notes?: string;
}

/* ---------- Decision register (Phase 9 archival surface) ---------- */

export type DecisionScope = 'creative' | 'production' | 'financial' | 'logistical' | 'other';

export interface DecisionEntry {
  id: string;
  date: string;                   // ISO YYYY-MM-DD
  title: string;
  context?: string;               // what prompted it
  considered?: string;            // options on the table — free text
  chosen: string;                 // what was decided
  why?: string;                   // reasoning
  ownerId?: string;               // crewId
  scope: DecisionScope;
}

/* ---------- Distribution module (Phase 9 Tier B) ---------- */

export type SalesAgentStatus = 'target' | 'pitched' | 'in-talks' | 'signed' | 'declined';
export interface SalesAgent {
  id: string;
  name: string;
  territories: string[];
  catalogHighlights?: string;
  docTrackRecord?: string;
  contact?: string;
  fitScore?: number;          // 1–5
  status: SalesAgentStatus;
  notes?: string;
}

export type BroadcasterSlot =
  | 'prime'
  | 'late-night'
  | 'streaming'
  | 'weekend'
  | 'matinee'
  | 'mixed';
export type BroadcasterStatus =
  | 'target'
  | 'pitched'
  | 'in-talks'
  | 'acquired'
  | 'declined';
export interface Broadcaster {
  id: string;
  name: string;
  country: string;
  slot: BroadcasterSlot;
  docStrand?: string;
  acquisitions?: string;
  pastCroatian?: string;
  fitScore?: number;          // 1–5
  contact?: string;
  status: BroadcasterStatus;
  notes?: string;
}

export type MarketEventStatus =
  | 'target'
  | 'applied'
  | 'accepted'
  | 'attending'
  | 'declined';
export interface MarketEvent {
  id: string;
  name: string;
  city: string;
  dates: string;
  applicationDeadline?: string;   // ISO
  cost?: string;
  fit: string;
  status: MarketEventStatus;
  attendees?: string;
  notes?: string;
}

export type DealStatus =
  | 'in-negotiation'
  | 'in-legal'
  | 'signed'
  | 'paid'
  | 'cancelled';
export interface Deal {
  id: string;
  party: string;
  territory: string;
  formatRights: string;
  term?: string;
  advanceK?: number;
  mgK?: number;
  backendPct?: number;
  status: DealStatus;
  notes?: string;
}

/* ---------- Marketing module (Phase 9 Tier B) ---------- */

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'x'
  | 'linkedin'
  | 'facebook';
export type SocialContentType = 'bts' | 'clip' | 'still' | 'text' | 'article';
export type SocialPostStatus = 'idea' | 'drafted' | 'scheduled' | 'posted';

export interface SocialPost {
  id: string;
  date: string;           // ISO
  platform: SocialPlatform;
  type: SocialContentType;
  status: SocialPostStatus;
  caption?: string;
  ref?: string;           // creative reference / asset link
  notes?: string;
}

export type TrailerCutFormat =
  | 'teaser-30'
  | 'teaser-60'
  | 'trailer-90'
  | 'trailer-120'
  | 'tv-spot'
  | 'social-9-16'
  | 'social-1-1'
  | 'social-16-9';

export interface TrailerCut {
  id: string;
  format: TrailerCutFormat;
  label: string;
  audience?: string;
  beats: string[];        // free-text references to which beats / shots support
  status: 'planned' | 'rough' | 'cut' | 'final';
  notes?: string;
}

export interface PressContact {
  id: string;
  name: string;
  outlet: string;
  territory: string;
  beat?: string;
  contact?: string;
  pastCoverage?: string;
  status: 'cold' | 'pitched' | 'interviewed' | 'wrote' | 'declined';
  notes?: string;
}

export interface BTSCapture {
  id: string;
  date: string;            // ISO
  responsibleId?: string;  // crewId
  description: string;
  cleared?: boolean;
  notes?: string;
}

/* ---------- Rig configurations (Phase 9 · Cinematography) ---------- */

export interface RigConfiguration {
  id: string;
  name: string;             // Tom's vocabulary — "Falkuša handheld", "Sunset wide"
  description?: string;
  cameraSlot?: CameraSlot;  // primary slot this rig fits
  kitItemIds: string[];     // links to DOPKitItem ids (camera + lens + audio + accessories)
  audioRouting?: string;    // free-form, e.g. "boom + lav"
  lightingNotes?: string;
  movementNotes?: string;   // pace, rhythm, walking pattern
  notes?: string;
}

/* ---------- Tier B deepenings (Phase 9) ---------- */

export type SponsorDeliverableType =
  | 'logo-on-screen'
  | 'screen-credit'
  | 'social-post'
  | 'premiere-invite'
  | 'press-mention'
  | 'product-placement'
  | 'other';

export type SponsorDeliverableStatus = 'pending' | 'in-progress' | 'delivered';

export interface SponsorDeliverable {
  id: string;
  sponsorId: string;
  type: SponsorDeliverableType;
  label: string;
  status: SponsorDeliverableStatus;
  dueDate?: string;
  notes?: string;
}

export interface ColorScriptStop {
  id: string;
  episodeId: string;
  runtimeMin: number;             // minutes into the episode (0–50ish)
  color: string;                  // hex
  label?: string;                 // moment label
  notes?: string;
}

export type AudioCommissionType =
  | 'verse-reading'
  | 'klapa-recording'
  | 'ambient-capture'
  | 'narration'
  | 'other';

export type AudioCommissionStatus = 'planned' | 'recorded' | 'edited' | 'final';

export interface AudioCommission {
  id: string;
  type: AudioCommissionType;
  label: string;
  episodeId?: string;
  reader?: string;                // who voices it
  format?: string;                // e.g. '24-bit 48k mono'
  location?: string;              // recording location
  postTreatment?: string;
  status: AudioCommissionStatus;
  notes?: string;
}

/* ---------- View keys ---------- */

export type ViewKey =
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

/* ---------- App state ---------- */

export interface AppState {
  activeScenario: ScenarioKey;
  activeView: ViewKey;
  scenarios: Record<ScenarioKey, ScenarioData>;
  episodes: Episode[];
  specials: Episode[];
  sponsors: Sponsor[];
  crew: CrewMember[];
  risks: Risk[];
  schedulePhases: SchedulePhase[];
  milestones: Milestone[];
  shootDays: ShootDay[];
  locations: Location[];
  routes: Route[];
  talents: Talent[];
  catches: Catch[];
  meals: Meal[];
  references: Reference[];
  antiScriptMoments: AntiScriptMoment[];
  dopKit: DOPKitItem[];
  luts: LUT[];
  colorPalettes: ColorPalette[];
  klapa: KlapaEntry[];
  micPlacements: MicPlacement[];
  journalEntries: JournalEntry[];
  contracts: Contract[];
  episodeExtras: Record<string, EpisodeExtras>;
  /* Phase 8 cross-cutting primitives */
  tasks: Task[];
  notes: Note[];
  variations: Variation[];
  assets: Asset[];
  outreachContacts: OutreachContact[];
  festivals: FestivalSubmission[];
  applications: FundingApplication[];
  /* Phase 9 — Production module */
  scenes: Scene[];
  shots: Shot[];
  takes: Take[];
  boatOpsDays: BoatOpsDay[];
  dataBackupDays: DataBackupDay[];
  safetyDays: SafetyDay[];
  incidents: IncidentEntry[];
  wrapEntries: WrapEntry[];
  walkieChannels: WalkieChannel[];
  /* Phase 9 — Distribution */
  salesAgents: SalesAgent[];
  broadcasters: Broadcaster[];
  marketEvents: MarketEvent[];
  deals: Deal[];
  /* Phase 9 — Marketing */
  socialPosts: SocialPost[];
  trailerCuts: TrailerCut[];
  pressContacts: PressContact[];
  btsCapture: BTSCapture[];
  /* Phase 9 — Post-production */
  editMilestones: EditMilestone[];
  cueSheet: CueSheetEntry[];
  subtitleTracks: SubtitleTrack[];
  deliverableSpecs: DeliverableSpec[];
  /* Phase 9 — Voice memos + sketches + decisions */
  voiceMemos: VoiceMemo[];
  sketches: Sketch[];
  decisions: DecisionEntry[];
  /* Phase 9 — Research module */
  researchSources: ResearchSource[];
  producers: Producer[];
  subjects: Subject[];
  /* Phase 9 — Tier B deepenings */
  sponsorDeliverables: SponsorDeliverable[];
  colorScriptStops: ColorScriptStop[];
  audioCommissions: AudioCommission[];
  /* Phase 9 — Cinematography rig library */
  rigConfigurations: RigConfiguration[];
  /* UI state — not persisted */
  selectedEpisodeId: string | null;
  printMode: boolean;
  paletteOpen: boolean;
  captureOpen: boolean;
}
