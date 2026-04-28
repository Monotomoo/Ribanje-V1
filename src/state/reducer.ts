import type {
  AppState,
  AntiScriptMoment,
  Asset,
  AudioCommission,
  BoatOpsDay,
  BoatWaypoint,
  Broadcaster,
  BTSCapture,
  CameraStatus,
  Catch,
  CrewPosition,
  ColorPalette,
  ColorScriptStop,
  ConditionsForecast,
  Contract,
  CrewMember,
  CueSheetEntry,
  DataBackupDay,
  Deal,
  DecisionEntry,
  DeliverableSpec,
  DOPKitItem,
  EditMilestone,
  Episode,
  EpisodeExtras,
  FestivalSubmission,
  FundingApplication,
  IncidentEntry,
  JournalEntry,
  KlapaEntry,
  Location,
  LUT,
  MarketEvent,
  MicPlacement,
  Meal,
  Milestone,
  Note,
  OutreachContact,
  PermitLegal,
  PressContact,
  Producer,
  Reference,
  ResearchSource,
  RigConfiguration,
  Risk,
  SafetyDay,
  SchedulePhase,
  SalesAgent,
  ScenarioKey,
  Scene,
  ShootDay,
  Shot,
  SocialPost,
  Sketch,
  Sponsor,
  SponsorDeliverable,
  Subject,
  SubtitleTrack,
  Take,
  Talent,
  Task,
  TrailerCut,
  Variation,
  ViewKey,
  VoiceMemo,
  WalkieChannel,
  WrapEntry,
} from '../types';
import { makeInitialState } from '../lib/seed';

/*
  Reducer actions — Phase 1 wires only a small set:
    SET_VIEW, SET_SCENARIO, RESET_TO_SEED, OPEN_PALETTE/CAPTURE, SET_PRINT_MODE,
    SELECT_EPISODE.
  Later phases extend this with entity CRUD across all the seeds.
*/

export type Action =
  | { type: 'SET_VIEW'; view: ViewKey }
  | { type: 'SET_SCENARIO'; scenario: ScenarioKey }
  | { type: 'RESET_TO_SEED' }
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'OPEN_PALETTE'; open: boolean }
  | { type: 'OPEN_CAPTURE'; open: boolean }
  | { type: 'SET_PRINT_MODE'; on: boolean }
  | { type: 'SELECT_EPISODE'; episodeId: string | null }
  | { type: 'SET_FUNDING'; scenario: ScenarioKey; key: string; value: number }
  | { type: 'SET_COST'; scenario: ScenarioKey; key: string; value: number }
  | { type: 'SET_QS_PCT'; scenario: ScenarioKey; value: number }
  | { type: 'SET_REBATE_RATE'; scenario: ScenarioKey; value: number }
  | { type: 'SET_CASHFLOW_INFLOW'; scenario: ScenarioKey; quarterIdx: number; sourceKey: string; value: number }
  | { type: 'SET_CASHFLOW_OUTFLOW'; scenario: ScenarioKey; quarterIdx: number; value: number }
  /* Episodes */
  | { type: 'UPDATE_EPISODE'; episodeId: string; patch: Partial<Episode> }
  | { type: 'REORDER_EPISODES'; ids: string[] }
  | { type: 'UPDATE_EPISODE_EXTRAS'; episodeId: string; patch: Partial<EpisodeExtras> }
  /* Talents */
  | { type: 'ADD_TALENT'; talent: Talent }
  | { type: 'UPDATE_TALENT'; id: string; patch: Partial<Talent> }
  | { type: 'DELETE_TALENT'; id: string }
  /* Catches */
  | { type: 'ADD_CATCH'; entry: Catch }
  | { type: 'UPDATE_CATCH'; id: string; patch: Partial<Catch> }
  | { type: 'DELETE_CATCH'; id: string }
  /* Meals */
  | { type: 'ADD_MEAL'; entry: Meal }
  | { type: 'UPDATE_MEAL'; id: string; patch: Partial<Meal> }
  | { type: 'DELETE_MEAL'; id: string }
  /* References */
  | { type: 'ADD_REFERENCE'; reference: Reference }
  | { type: 'UPDATE_REFERENCE'; id: string; patch: Partial<Reference> }
  | { type: 'DELETE_REFERENCE'; id: string }
  /* Anti-script moments */
  | { type: 'ADD_ANTI_SCRIPT'; moment: AntiScriptMoment }
  | { type: 'UPDATE_ANTI_SCRIPT'; id: string; patch: Partial<AntiScriptMoment> }
  | { type: 'DELETE_ANTI_SCRIPT'; id: string }
  | { type: 'REORDER_ANTI_SCRIPT'; episodeId: string; ids: string[] }
  /* Sponsors */
  | { type: 'ADD_SPONSOR'; sponsor: Sponsor }
  | { type: 'UPDATE_SPONSOR'; id: string; patch: Partial<Sponsor> }
  | { type: 'DELETE_SPONSOR'; id: string }
  /* Crew */
  | { type: 'ADD_CREW'; member: CrewMember }
  | { type: 'UPDATE_CREW'; id: string; patch: Partial<CrewMember> }
  | { type: 'DELETE_CREW'; id: string }
  /* Risks */
  | { type: 'ADD_RISK'; risk: Risk }
  | { type: 'UPDATE_RISK'; id: string; patch: Partial<Risk> }
  | { type: 'DELETE_RISK'; id: string }
  /* Journal */
  | { type: 'ADD_JOURNAL'; entry: JournalEntry }
  | { type: 'UPDATE_JOURNAL'; id: string; patch: Partial<JournalEntry> }
  | { type: 'DELETE_JOURNAL'; id: string }
  /* Contracts */
  | { type: 'ADD_CONTRACT'; contract: Contract }
  | { type: 'UPDATE_CONTRACT'; id: string; patch: Partial<Contract> }
  | { type: 'DELETE_CONTRACT'; id: string }
  /* DOP kit */
  | { type: 'ADD_DOP_KIT'; item: DOPKitItem }
  | { type: 'UPDATE_DOP_KIT'; id: string; patch: Partial<DOPKitItem> }
  | { type: 'DELETE_DOP_KIT'; id: string }
  /* Color palettes */
  | { type: 'ADD_PALETTE'; palette: ColorPalette }
  | { type: 'UPDATE_PALETTE'; id: string; patch: Partial<ColorPalette> }
  | { type: 'DELETE_PALETTE'; id: string }
  /* Klapa */
  | { type: 'ADD_KLAPA'; entry: KlapaEntry }
  | { type: 'UPDATE_KLAPA'; id: string; patch: Partial<KlapaEntry> }
  | { type: 'DELETE_KLAPA'; id: string }
  /* Phase 8 cross-cutting primitives */
  /* Tasks */
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; id: string; patch: Partial<Task> }
  | { type: 'DELETE_TASK'; id: string }
  /* Notes */
  | { type: 'ADD_NOTE'; note: Note }
  | { type: 'UPDATE_NOTE'; id: string; patch: Partial<Note> }
  | { type: 'DELETE_NOTE'; id: string }
  /* Variations */
  | { type: 'ADD_VARIATION'; variation: Variation }
  | { type: 'UPDATE_VARIATION'; id: string; patch: Partial<Variation> }
  | { type: 'DELETE_VARIATION'; id: string }
  | { type: 'SET_CURRENT_VARIATION'; id: string }
  /* Assets */
  | { type: 'ADD_ASSET'; asset: Asset }
  | { type: 'UPDATE_ASSET'; id: string; patch: Partial<Asset> }
  | { type: 'DELETE_ASSET'; id: string }
  /* Outreach */
  | { type: 'ADD_OUTREACH'; contact: OutreachContact }
  | { type: 'UPDATE_OUTREACH'; id: string; patch: Partial<OutreachContact> }
  | { type: 'DELETE_OUTREACH'; id: string }
  /* Schedule — phases + milestones + shoot days */
  | { type: 'ADD_PHASE'; phase: SchedulePhase }
  | { type: 'UPDATE_PHASE'; id: string; patch: Partial<SchedulePhase> }
  | { type: 'DELETE_PHASE'; id: string }
  | { type: 'ADD_MILESTONE'; milestone: Milestone }
  | { type: 'UPDATE_MILESTONE'; id: string; patch: Partial<Milestone> }
  | { type: 'DELETE_MILESTONE'; id: string }
  | { type: 'ADD_SHOOT_DAY'; day: ShootDay }
  | { type: 'UPDATE_SHOOT_DAY'; id: string; patch: Partial<ShootDay> }
  | { type: 'DELETE_SHOOT_DAY'; id: string }
  /* Locations */
  | { type: 'UPDATE_LOCATION'; id: string; patch: Partial<Location> }
  /* LUTs */
  | { type: 'ADD_LUT'; lut: LUT }
  | { type: 'UPDATE_LUT'; id: string; patch: Partial<LUT> }
  | { type: 'DELETE_LUT'; id: string }
  /* Mic placements */
  | { type: 'ADD_MIC'; placement: MicPlacement }
  | { type: 'UPDATE_MIC'; id: string; patch: Partial<MicPlacement> }
  | { type: 'DELETE_MIC'; id: string }
  /* Festivals */
  | { type: 'ADD_FESTIVAL'; festival: FestivalSubmission }
  | { type: 'UPDATE_FESTIVAL'; id: string; patch: Partial<FestivalSubmission> }
  | { type: 'DELETE_FESTIVAL'; id: string }
  /* Funding applications */
  | { type: 'ADD_APPLICATION'; application: FundingApplication }
  | { type: 'UPDATE_APPLICATION'; id: string; patch: Partial<FundingApplication> }
  | { type: 'DELETE_APPLICATION'; id: string }
  /* Phase 9 — Production: scenes / shots / takes */
  | { type: 'ADD_SCENE'; scene: Scene }
  | { type: 'UPDATE_SCENE'; id: string; patch: Partial<Scene> }
  | { type: 'DELETE_SCENE'; id: string }
  | { type: 'ADD_SHOT'; shot: Shot }
  | { type: 'UPDATE_SHOT'; id: string; patch: Partial<Shot> }
  | { type: 'DELETE_SHOT'; id: string }
  | { type: 'REORDER_SHOTS_IN_SCENE'; sceneId: string; ids: string[] }
  | { type: 'ADD_TAKE'; take: Take }
  | { type: 'UPDATE_TAKE'; id: string; patch: Partial<Take> }
  | { type: 'DELETE_TAKE'; id: string }
  /* Phase 9 — Production: per-day boat ops / data / safety / wrap */
  | { type: 'UPSERT_BOAT_OPS'; day: BoatOpsDay }
  | { type: 'UPDATE_BOAT_OPS'; id: string; patch: Partial<BoatOpsDay> }
  | { type: 'DELETE_BOAT_OPS'; id: string }
  | { type: 'UPSERT_DATA_BACKUP'; day: DataBackupDay }
  | { type: 'UPDATE_DATA_BACKUP'; id: string; patch: Partial<DataBackupDay> }
  | { type: 'DELETE_DATA_BACKUP'; id: string }
  | { type: 'UPSERT_SAFETY'; day: SafetyDay }
  | { type: 'UPDATE_SAFETY'; id: string; patch: Partial<SafetyDay> }
  | { type: 'DELETE_SAFETY'; id: string }
  | { type: 'ADD_INCIDENT'; incident: IncidentEntry }
  | { type: 'UPDATE_INCIDENT'; id: string; patch: Partial<IncidentEntry> }
  | { type: 'DELETE_INCIDENT'; id: string }
  | { type: 'UPSERT_WRAP'; entry: WrapEntry }
  | { type: 'UPDATE_WRAP'; id: string; patch: Partial<WrapEntry> }
  | { type: 'DELETE_WRAP'; id: string }
  | { type: 'UPSERT_WALKIE'; channel: WalkieChannel }
  | { type: 'DELETE_WALKIE'; id: string }
  /* Phase 9 — Distribution */
  | { type: 'ADD_SALES_AGENT'; agent: SalesAgent }
  | { type: 'UPDATE_SALES_AGENT'; id: string; patch: Partial<SalesAgent> }
  | { type: 'DELETE_SALES_AGENT'; id: string }
  | { type: 'ADD_BROADCASTER'; broadcaster: Broadcaster }
  | { type: 'UPDATE_BROADCASTER'; id: string; patch: Partial<Broadcaster> }
  | { type: 'DELETE_BROADCASTER'; id: string }
  | { type: 'ADD_MARKET_EVENT'; event: MarketEvent }
  | { type: 'UPDATE_MARKET_EVENT'; id: string; patch: Partial<MarketEvent> }
  | { type: 'DELETE_MARKET_EVENT'; id: string }
  | { type: 'ADD_DEAL'; deal: Deal }
  | { type: 'UPDATE_DEAL'; id: string; patch: Partial<Deal> }
  | { type: 'DELETE_DEAL'; id: string }
  /* Phase 9 — Marketing */
  | { type: 'ADD_SOCIAL_POST'; post: SocialPost }
  | { type: 'UPDATE_SOCIAL_POST'; id: string; patch: Partial<SocialPost> }
  | { type: 'DELETE_SOCIAL_POST'; id: string }
  | { type: 'ADD_TRAILER_CUT'; cut: TrailerCut }
  | { type: 'UPDATE_TRAILER_CUT'; id: string; patch: Partial<TrailerCut> }
  | { type: 'DELETE_TRAILER_CUT'; id: string }
  | { type: 'ADD_PRESS_CONTACT'; contact: PressContact }
  | { type: 'UPDATE_PRESS_CONTACT'; id: string; patch: Partial<PressContact> }
  | { type: 'DELETE_PRESS_CONTACT'; id: string }
  | { type: 'ADD_BTS'; capture: BTSCapture }
  | { type: 'UPDATE_BTS'; id: string; patch: Partial<BTSCapture> }
  | { type: 'DELETE_BTS'; id: string }
  /* Phase 9 — Post-production */
  | { type: 'ADD_EDIT_MILESTONE'; milestone: EditMilestone }
  | { type: 'UPDATE_EDIT_MILESTONE'; id: string; patch: Partial<EditMilestone> }
  | { type: 'DELETE_EDIT_MILESTONE'; id: string }
  | { type: 'ADD_CUE'; entry: CueSheetEntry }
  | { type: 'UPDATE_CUE'; id: string; patch: Partial<CueSheetEntry> }
  | { type: 'DELETE_CUE'; id: string }
  | { type: 'ADD_SUBTITLE'; track: SubtitleTrack }
  | { type: 'UPDATE_SUBTITLE'; id: string; patch: Partial<SubtitleTrack> }
  | { type: 'DELETE_SUBTITLE'; id: string }
  | { type: 'ADD_DELIVERABLE'; spec: DeliverableSpec }
  | { type: 'UPDATE_DELIVERABLE'; id: string; patch: Partial<DeliverableSpec> }
  | { type: 'DELETE_DELIVERABLE'; id: string }
  /* Phase 9 — Voice memos */
  | { type: 'ADD_VOICE_MEMO'; memo: VoiceMemo }
  | { type: 'UPDATE_VOICE_MEMO'; id: string; patch: Partial<VoiceMemo> }
  | { type: 'DELETE_VOICE_MEMO'; id: string }
  /* Phase 9 — Sketches */
  | { type: 'ADD_SKETCH'; sketch: Sketch }
  | { type: 'UPDATE_SKETCH'; id: string; patch: Partial<Sketch> }
  | { type: 'DELETE_SKETCH'; id: string }
  /* Phase 9 — Decisions */
  | { type: 'ADD_DECISION'; decision: DecisionEntry }
  | { type: 'UPDATE_DECISION'; id: string; patch: Partial<DecisionEntry> }
  | { type: 'DELETE_DECISION'; id: string }
  /* Phase 9 — Research module */
  | { type: 'ADD_RESEARCH_SOURCE'; source: ResearchSource }
  | { type: 'UPDATE_RESEARCH_SOURCE'; id: string; patch: Partial<ResearchSource> }
  | { type: 'DELETE_RESEARCH_SOURCE'; id: string }
  | { type: 'ADD_PRODUCER'; producer: Producer }
  | { type: 'UPDATE_PRODUCER'; id: string; patch: Partial<Producer> }
  | { type: 'DELETE_PRODUCER'; id: string }
  | { type: 'ADD_SUBJECT'; subject: Subject }
  | { type: 'UPDATE_SUBJECT'; id: string; patch: Partial<Subject> }
  | { type: 'DELETE_SUBJECT'; id: string }
  /* Phase 9 — Tier B deepenings */
  | { type: 'ADD_SPONSOR_DELIVERABLE'; deliverable: SponsorDeliverable }
  | { type: 'UPDATE_SPONSOR_DELIVERABLE'; id: string; patch: Partial<SponsorDeliverable> }
  | { type: 'DELETE_SPONSOR_DELIVERABLE'; id: string }
  | { type: 'ADD_COLOR_SCRIPT_STOP'; stop: ColorScriptStop }
  | { type: 'UPDATE_COLOR_SCRIPT_STOP'; id: string; patch: Partial<ColorScriptStop> }
  | { type: 'DELETE_COLOR_SCRIPT_STOP'; id: string }
  | { type: 'ADD_AUDIO_COMMISSION'; commission: AudioCommission }
  | { type: 'UPDATE_AUDIO_COMMISSION'; id: string; patch: Partial<AudioCommission> }
  | { type: 'DELETE_AUDIO_COMMISSION'; id: string }
  /* Phase 9 — Cinematography rig configurations */
  | { type: 'ADD_RIG_CONFIG'; config: RigConfiguration }
  | { type: 'UPDATE_RIG_CONFIG'; id: string; patch: Partial<RigConfiguration> }
  | { type: 'DELETE_RIG_CONFIG'; id: string }
  /* Phase 12 — Conditions forecasts (live shoot-day strip) */
  | { type: 'ADD_CONDITIONS'; forecast: ConditionsForecast }
  | { type: 'UPDATE_CONDITIONS'; id: string; patch: Partial<ConditionsForecast> }
  | { type: 'DELETE_CONDITIONS'; id: string }
  | { type: 'BULK_UPSERT_CONDITIONS'; date: string; locationId: string; forecasts: ConditionsForecast[] }
  /* Phase 12 — Camera live status (per slot per day) */
  | { type: 'UPSERT_CAMERA_STATUS'; status: CameraStatus }
  | { type: 'UPDATE_CAMERA_STATUS'; id: string; patch: Partial<CameraStatus> }
  | { type: 'DELETE_CAMERA_STATUS'; id: string }
  /* Phase 12 — Two-Boat Timeline waypoints */
  | { type: 'ADD_BOAT_WAYPOINT'; waypoint: BoatWaypoint }
  | { type: 'UPDATE_BOAT_WAYPOINT'; id: string; patch: Partial<BoatWaypoint> }
  | { type: 'DELETE_BOAT_WAYPOINT'; id: string }
  /* Phase 12 — Crew Position Board (per crew per day) */
  | { type: 'UPSERT_CREW_POSITION'; position: CrewPosition }
  | { type: 'UPDATE_CREW_POSITION'; id: string; patch: Partial<CrewPosition> }
  | { type: 'DELETE_CREW_POSITION'; id: string }
  /* Phase 12 — Show-Day Mode toggle */
  | { type: 'TOGGLE_SHOW_DAY_MODE'; on: boolean }
  /* Phase 12 wave 3 — Permit / Legal Wall */
  | { type: 'ADD_PERMIT'; permit: PermitLegal }
  | { type: 'UPDATE_PERMIT'; id: string; patch: Partial<PermitLegal> }
  | { type: 'DELETE_PERMIT'; id: string }
  /* Phase 12 wave 4 — i18n locale */
  | { type: 'SET_LOCALE'; locale: 'en' | 'hr' };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, activeView: action.view };
    case 'SET_SCENARIO':
      return { ...state, activeScenario: action.scenario };
    case 'RESET_TO_SEED':
      return makeInitialState();
    case 'HYDRATE':
      return action.state;
    case 'OPEN_PALETTE':
      return { ...state, paletteOpen: action.open };
    case 'OPEN_CAPTURE':
      return { ...state, captureOpen: action.open };
    case 'SET_PRINT_MODE':
      return { ...state, printMode: action.on };
    case 'SELECT_EPISODE':
      return { ...state, selectedEpisodeId: action.episodeId };

    case 'SET_FUNDING':
      return updateScenario(state, action.scenario, (sc) => ({
        ...sc,
        funding: { ...sc.funding, [action.key]: action.value },
      }));
    case 'SET_COST':
      return updateScenario(state, action.scenario, (sc) => ({
        ...sc,
        costs: { ...sc.costs, [action.key]: action.value },
      }));
    case 'SET_QS_PCT':
      return updateScenario(state, action.scenario, (sc) => ({
        ...sc,
        qualifyingSpendPct: action.value,
      }));
    case 'SET_REBATE_RATE':
      return updateScenario(state, action.scenario, (sc) => ({
        ...sc,
        blendedRebateRate: action.value,
      }));
    case 'SET_CASHFLOW_INFLOW':
      return updateScenario(state, action.scenario, (sc) => ({
        ...sc,
        cashflow: sc.cashflow.map((q, i) =>
          i === action.quarterIdx
            ? { ...q, inflows: { ...q.inflows, [action.sourceKey]: action.value } }
            : q
        ),
      }));
    case 'SET_CASHFLOW_OUTFLOW':
      return updateScenario(state, action.scenario, (sc) => ({
        ...sc,
        cashflow: sc.cashflow.map((q, i) =>
          i === action.quarterIdx ? { ...q, outflow: action.value } : q
        ),
      }));

    /* Episodes */
    case 'UPDATE_EPISODE': {
      const inMain = state.episodes.some((e) => e.id === action.episodeId);
      const list = inMain ? 'episodes' : 'specials';
      return {
        ...state,
        [list]: state[list].map((e) =>
          e.id === action.episodeId ? { ...e, ...action.patch } : e
        ),
      };
    }
    case 'REORDER_EPISODES': {
      const byId = new Map(state.episodes.map((e) => [e.id, e]));
      const reordered = action.ids
        .map((id) => byId.get(id))
        .filter((e): e is Episode => !!e);
      /* Renumber 1..n to keep visual numbering consistent */
      const numbered = reordered.map((e, i) => ({ ...e, number: i + 1 }));
      return { ...state, episodes: numbered };
    }
    case 'UPDATE_EPISODE_EXTRAS':
      return {
        ...state,
        episodeExtras: {
          ...state.episodeExtras,
          [action.episodeId]: {
            ...(state.episodeExtras[action.episodeId] ?? {
              episodeId: action.episodeId,
              hektorovicVerseCro: '',
              hektorovicVerseEng: '',
              hektorovicParallel: '',
              dopNotes: '',
              soundNotes: '',
            }),
            ...action.patch,
          },
        },
      };

    /* Talents */
    case 'ADD_TALENT':
      return { ...state, talents: [...state.talents, action.talent] };
    case 'UPDATE_TALENT':
      return {
        ...state,
        talents: state.talents.map((t) =>
          t.id === action.id ? { ...t, ...action.patch } : t
        ),
      };
    case 'DELETE_TALENT':
      return { ...state, talents: state.talents.filter((t) => t.id !== action.id) };

    /* Catches */
    case 'ADD_CATCH':
      return { ...state, catches: [...state.catches, action.entry] };
    case 'UPDATE_CATCH':
      return {
        ...state,
        catches: state.catches.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c
        ),
      };
    case 'DELETE_CATCH':
      return { ...state, catches: state.catches.filter((c) => c.id !== action.id) };

    /* Meals */
    case 'ADD_MEAL':
      return { ...state, meals: [...state.meals, action.entry] };
    case 'UPDATE_MEAL':
      return {
        ...state,
        meals: state.meals.map((m) =>
          m.id === action.id ? { ...m, ...action.patch } : m
        ),
      };
    case 'DELETE_MEAL':
      return { ...state, meals: state.meals.filter((m) => m.id !== action.id) };

    /* References */
    case 'ADD_REFERENCE':
      return { ...state, references: [...state.references, action.reference] };
    case 'UPDATE_REFERENCE':
      return {
        ...state,
        references: state.references.map((r) =>
          r.id === action.id ? { ...r, ...action.patch } : r
        ),
      };
    case 'DELETE_REFERENCE':
      return {
        ...state,
        references: state.references.filter((r) => r.id !== action.id),
      };

    /* Anti-script moments */
    case 'ADD_ANTI_SCRIPT':
      return {
        ...state,
        antiScriptMoments: [...state.antiScriptMoments, action.moment],
      };
    case 'UPDATE_ANTI_SCRIPT':
      return {
        ...state,
        antiScriptMoments: state.antiScriptMoments.map((m) =>
          m.id === action.id ? { ...m, ...action.patch } : m
        ),
      };
    case 'DELETE_ANTI_SCRIPT':
      return {
        ...state,
        antiScriptMoments: state.antiScriptMoments.filter((m) => m.id !== action.id),
      };
    case 'REORDER_ANTI_SCRIPT': {
      const inEp = state.antiScriptMoments.filter(
        (m) => m.episodeId === action.episodeId
      );
      const others = state.antiScriptMoments.filter(
        (m) => m.episodeId !== action.episodeId
      );
      const byId = new Map(inEp.map((m) => [m.id, m]));
      const reordered = action.ids
        .map((id, i) => {
          const m = byId.get(id);
          if (!m) return null;
          return { ...m, orderIdx: i };
        })
        .filter((m): m is AntiScriptMoment => !!m);
      return {
        ...state,
        antiScriptMoments: [...others, ...reordered],
      };
    }

    /* Sponsors */
    case 'ADD_SPONSOR':
      return { ...state, sponsors: [...state.sponsors, action.sponsor] };
    case 'UPDATE_SPONSOR':
      return {
        ...state,
        sponsors: state.sponsors.map((s) =>
          s.id === action.id ? { ...s, ...action.patch } : s
        ),
      };
    case 'DELETE_SPONSOR':
      return { ...state, sponsors: state.sponsors.filter((s) => s.id !== action.id) };

    /* Crew */
    case 'ADD_CREW':
      return { ...state, crew: [...state.crew, action.member] };
    case 'UPDATE_CREW':
      return {
        ...state,
        crew: state.crew.map((m) =>
          m.id === action.id ? { ...m, ...action.patch } : m
        ),
      };
    case 'DELETE_CREW':
      return { ...state, crew: state.crew.filter((m) => m.id !== action.id) };

    /* Risks */
    case 'ADD_RISK':
      return { ...state, risks: [...state.risks, action.risk] };
    case 'UPDATE_RISK':
      return {
        ...state,
        risks: state.risks.map((r) =>
          r.id === action.id ? { ...r, ...action.patch } : r
        ),
      };
    case 'DELETE_RISK':
      return { ...state, risks: state.risks.filter((r) => r.id !== action.id) };

    /* Journal */
    case 'ADD_JOURNAL':
      return {
        ...state,
        journalEntries: [...state.journalEntries, action.entry],
      };
    case 'UPDATE_JOURNAL':
      return {
        ...state,
        journalEntries: state.journalEntries.map((j) =>
          j.id === action.id ? { ...j, ...action.patch } : j
        ),
      };
    case 'DELETE_JOURNAL':
      return {
        ...state,
        journalEntries: state.journalEntries.filter((j) => j.id !== action.id),
      };

    /* Contracts */
    case 'ADD_CONTRACT':
      return { ...state, contracts: [...state.contracts, action.contract] };
    case 'UPDATE_CONTRACT':
      return {
        ...state,
        contracts: state.contracts.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c
        ),
      };
    case 'DELETE_CONTRACT':
      return {
        ...state,
        contracts: state.contracts.filter((c) => c.id !== action.id),
      };

    /* DOP kit */
    case 'ADD_DOP_KIT':
      return { ...state, dopKit: [...state.dopKit, action.item] };
    case 'UPDATE_DOP_KIT':
      return {
        ...state,
        dopKit: state.dopKit.map((k) =>
          k.id === action.id ? { ...k, ...action.patch } : k
        ),
      };
    case 'DELETE_DOP_KIT':
      return { ...state, dopKit: state.dopKit.filter((k) => k.id !== action.id) };

    /* Color palettes */
    case 'ADD_PALETTE':
      return { ...state, colorPalettes: [...state.colorPalettes, action.palette] };
    case 'UPDATE_PALETTE':
      return {
        ...state,
        colorPalettes: state.colorPalettes.map((p) =>
          p.id === action.id ? { ...p, ...action.patch } : p
        ),
      };
    case 'DELETE_PALETTE':
      return {
        ...state,
        colorPalettes: state.colorPalettes.filter((p) => p.id !== action.id),
      };

    /* Klapa */
    case 'ADD_KLAPA':
      return { ...state, klapa: [...state.klapa, action.entry] };
    case 'UPDATE_KLAPA':
      return {
        ...state,
        klapa: state.klapa.map((k) =>
          k.id === action.id ? { ...k, ...action.patch } : k
        ),
      };
    case 'DELETE_KLAPA':
      return { ...state, klapa: state.klapa.filter((k) => k.id !== action.id) };

    /* Tasks */
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.task] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id
            ? { ...t, ...action.patch, updatedAt: new Date().toISOString() }
            : t
        ),
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };

    /* Notes */
    case 'ADD_NOTE':
      return { ...state, notes: [...state.notes, action.note] };
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map((n) =>
          n.id === action.id ? { ...n, ...action.patch } : n
        ),
      };
    case 'DELETE_NOTE':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) };

    /* Variations */
    case 'ADD_VARIATION':
      return { ...state, variations: [...state.variations, action.variation] };
    case 'UPDATE_VARIATION':
      return {
        ...state,
        variations: state.variations.map((v) =>
          v.id === action.id ? { ...v, ...action.patch } : v
        ),
      };
    case 'DELETE_VARIATION':
      return {
        ...state,
        variations: state.variations.filter((v) => v.id !== action.id),
      };
    case 'SET_CURRENT_VARIATION': {
      const target = state.variations.find((v) => v.id === action.id);
      if (!target) return state;
      const sameBucket = (v: Variation) =>
        v.category === target.category &&
        (v.audience ?? null) === (target.audience ?? null) &&
        (v.sponsorId ?? null) === (target.sponsorId ?? null);
      return {
        ...state,
        variations: state.variations.map((v) =>
          sameBucket(v) ? { ...v, isCurrent: v.id === action.id } : v
        ),
      };
    }

    /* Assets */
    case 'ADD_ASSET':
      return { ...state, assets: [...state.assets, action.asset] };
    case 'UPDATE_ASSET':
      return {
        ...state,
        assets: state.assets.map((a) =>
          a.id === action.id ? { ...a, ...action.patch } : a
        ),
      };
    case 'DELETE_ASSET':
      return { ...state, assets: state.assets.filter((a) => a.id !== action.id) };

    /* Outreach */
    case 'ADD_OUTREACH':
      return {
        ...state,
        outreachContacts: [...state.outreachContacts, action.contact],
        sponsors: state.sponsors.map((s) =>
          s.id === action.contact.sponsorId
            ? { ...s, lastContactDate: action.contact.date }
            : s
        ),
      };
    case 'UPDATE_OUTREACH':
      return {
        ...state,
        outreachContacts: state.outreachContacts.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c
        ),
      };
    case 'DELETE_OUTREACH':
      return {
        ...state,
        outreachContacts: state.outreachContacts.filter(
          (c) => c.id !== action.id
        ),
      };

    /* Schedule phases */
    case 'ADD_PHASE':
      return { ...state, schedulePhases: [...state.schedulePhases, action.phase] };
    case 'UPDATE_PHASE':
      return {
        ...state,
        schedulePhases: state.schedulePhases.map((p) =>
          p.id === action.id ? { ...p, ...action.patch } : p
        ),
      };
    case 'DELETE_PHASE':
      return {
        ...state,
        schedulePhases: state.schedulePhases.filter((p) => p.id !== action.id),
      };

    /* Milestones */
    case 'ADD_MILESTONE':
      return { ...state, milestones: [...state.milestones, action.milestone] };
    case 'UPDATE_MILESTONE':
      return {
        ...state,
        milestones: state.milestones.map((m) =>
          m.id === action.id ? { ...m, ...action.patch } : m
        ),
      };
    case 'DELETE_MILESTONE':
      return {
        ...state,
        milestones: state.milestones.filter((m) => m.id !== action.id),
      };

    /* Shoot days */
    case 'ADD_SHOOT_DAY':
      return { ...state, shootDays: [...state.shootDays, action.day] };
    case 'UPDATE_SHOOT_DAY':
      return {
        ...state,
        shootDays: state.shootDays.map((d) =>
          d.id === action.id ? { ...d, ...action.patch } : d
        ),
      };
    case 'DELETE_SHOOT_DAY':
      return {
        ...state,
        shootDays: state.shootDays.filter((d) => d.id !== action.id),
      };

    /* Locations */
    case 'UPDATE_LOCATION':
      return {
        ...state,
        locations: state.locations.map((l) =>
          l.id === action.id ? { ...l, ...action.patch } : l
        ),
      };

    /* LUTs */
    case 'ADD_LUT':
      return { ...state, luts: [...state.luts, action.lut] };
    case 'UPDATE_LUT':
      return {
        ...state,
        luts: state.luts.map((l) =>
          l.id === action.id ? { ...l, ...action.patch } : l
        ),
      };
    case 'DELETE_LUT':
      return { ...state, luts: state.luts.filter((l) => l.id !== action.id) };

    /* Mic placements */
    case 'ADD_MIC':
      return {
        ...state,
        micPlacements: [...state.micPlacements, action.placement],
      };
    case 'UPDATE_MIC':
      return {
        ...state,
        micPlacements: state.micPlacements.map((m) =>
          m.id === action.id ? { ...m, ...action.patch } : m
        ),
      };
    case 'DELETE_MIC':
      return {
        ...state,
        micPlacements: state.micPlacements.filter((m) => m.id !== action.id),
      };

    /* Festivals */
    case 'ADD_FESTIVAL':
      return { ...state, festivals: [...state.festivals, action.festival] };
    case 'UPDATE_FESTIVAL':
      return {
        ...state,
        festivals: state.festivals.map((f) =>
          f.id === action.id ? { ...f, ...action.patch } : f
        ),
      };
    case 'DELETE_FESTIVAL':
      return {
        ...state,
        festivals: state.festivals.filter((f) => f.id !== action.id),
      };

    /* Applications */
    case 'ADD_APPLICATION':
      return {
        ...state,
        applications: [...state.applications, action.application],
      };
    case 'UPDATE_APPLICATION':
      return {
        ...state,
        applications: state.applications.map((a) =>
          a.id === action.id ? { ...a, ...action.patch } : a
        ),
      };
    case 'DELETE_APPLICATION':
      return {
        ...state,
        applications: state.applications.filter((a) => a.id !== action.id),
      };

    /* ========== Phase 9 — Production module ========== */

    /* Scenes */
    case 'ADD_SCENE':
      return { ...state, scenes: [...state.scenes, action.scene] };
    case 'UPDATE_SCENE':
      return {
        ...state,
        scenes: state.scenes.map((s) =>
          s.id === action.id ? { ...s, ...action.patch } : s
        ),
      };
    case 'DELETE_SCENE':
      return {
        ...state,
        scenes: state.scenes.filter((s) => s.id !== action.id),
        /* Cascade: orphan shots keep their data but lose sceneId. */
        shots: state.shots.map((sh) =>
          sh.sceneId === action.id ? { ...sh, sceneId: undefined } : sh
        ),
      };

    /* Shots */
    case 'ADD_SHOT':
      return { ...state, shots: [...state.shots, action.shot] };
    case 'UPDATE_SHOT':
      return {
        ...state,
        shots: state.shots.map((sh) =>
          sh.id === action.id ? { ...sh, ...action.patch } : sh
        ),
      };
    case 'DELETE_SHOT':
      return {
        ...state,
        shots: state.shots.filter((sh) => sh.id !== action.id),
        /* Cascade: drop takes belonging to this shot. */
        takes: state.takes.filter((t) => t.shotId !== action.id),
      };
    case 'REORDER_SHOTS_IN_SCENE': {
      const inScene = state.shots.filter((s) => s.sceneId === action.sceneId);
      const others = state.shots.filter((s) => s.sceneId !== action.sceneId);
      const byId = new Map(inScene.map((s) => [s.id, s]));
      const reordered = action.ids
        .map((id) => byId.get(id))
        .filter((s): s is Shot => !!s);
      return { ...state, shots: [...others, ...reordered] };
    }

    /* Takes */
    case 'ADD_TAKE':
      return { ...state, takes: [...state.takes, action.take] };
    case 'UPDATE_TAKE':
      return {
        ...state,
        takes: state.takes.map((t) =>
          t.id === action.id ? { ...t, ...action.patch } : t
        ),
      };
    case 'DELETE_TAKE':
      return { ...state, takes: state.takes.filter((t) => t.id !== action.id) };

    /* Boat ops days — UPSERT replaces by id; UPDATE patches in-place. */
    case 'UPSERT_BOAT_OPS': {
      const exists = state.boatOpsDays.some((d) => d.id === action.day.id);
      return {
        ...state,
        boatOpsDays: exists
          ? state.boatOpsDays.map((d) => (d.id === action.day.id ? action.day : d))
          : [...state.boatOpsDays, action.day],
      };
    }
    case 'UPDATE_BOAT_OPS':
      return {
        ...state,
        boatOpsDays: state.boatOpsDays.map((d) =>
          d.id === action.id ? { ...d, ...action.patch } : d
        ),
      };
    case 'DELETE_BOAT_OPS':
      return {
        ...state,
        boatOpsDays: state.boatOpsDays.filter((d) => d.id !== action.id),
      };

    /* Data backup days */
    case 'UPSERT_DATA_BACKUP': {
      const exists = state.dataBackupDays.some((d) => d.id === action.day.id);
      return {
        ...state,
        dataBackupDays: exists
          ? state.dataBackupDays.map((d) => (d.id === action.day.id ? action.day : d))
          : [...state.dataBackupDays, action.day],
      };
    }
    case 'UPDATE_DATA_BACKUP':
      return {
        ...state,
        dataBackupDays: state.dataBackupDays.map((d) =>
          d.id === action.id ? { ...d, ...action.patch } : d
        ),
      };
    case 'DELETE_DATA_BACKUP':
      return {
        ...state,
        dataBackupDays: state.dataBackupDays.filter((d) => d.id !== action.id),
      };

    /* Safety days */
    case 'UPSERT_SAFETY': {
      const exists = state.safetyDays.some((d) => d.id === action.day.id);
      return {
        ...state,
        safetyDays: exists
          ? state.safetyDays.map((d) => (d.id === action.day.id ? action.day : d))
          : [...state.safetyDays, action.day],
      };
    }
    case 'UPDATE_SAFETY':
      return {
        ...state,
        safetyDays: state.safetyDays.map((d) =>
          d.id === action.id ? { ...d, ...action.patch } : d
        ),
      };
    case 'DELETE_SAFETY':
      return {
        ...state,
        safetyDays: state.safetyDays.filter((d) => d.id !== action.id),
      };

    /* Incidents */
    case 'ADD_INCIDENT':
      return { ...state, incidents: [...state.incidents, action.incident] };
    case 'UPDATE_INCIDENT':
      return {
        ...state,
        incidents: state.incidents.map((i) =>
          i.id === action.id ? { ...i, ...action.patch } : i
        ),
      };
    case 'DELETE_INCIDENT':
      return {
        ...state,
        incidents: state.incidents.filter((i) => i.id !== action.id),
      };

    /* Wrap entries */
    case 'UPSERT_WRAP': {
      const exists = state.wrapEntries.some((w) => w.id === action.entry.id);
      return {
        ...state,
        wrapEntries: exists
          ? state.wrapEntries.map((w) => (w.id === action.entry.id ? action.entry : w))
          : [...state.wrapEntries, action.entry],
      };
    }
    case 'UPDATE_WRAP':
      return {
        ...state,
        wrapEntries: state.wrapEntries.map((w) =>
          w.id === action.id ? { ...w, ...action.patch } : w
        ),
      };
    case 'DELETE_WRAP':
      return {
        ...state,
        wrapEntries: state.wrapEntries.filter((w) => w.id !== action.id),
      };

    /* Walkie channels */
    case 'UPSERT_WALKIE': {
      const exists = state.walkieChannels.some((c) => c.id === action.channel.id);
      return {
        ...state,
        walkieChannels: exists
          ? state.walkieChannels.map((c) => (c.id === action.channel.id ? action.channel : c))
          : [...state.walkieChannels, action.channel],
      };
    }
    case 'DELETE_WALKIE':
      return {
        ...state,
        walkieChannels: state.walkieChannels.filter((c) => c.id !== action.id),
      };

    /* ========== Phase 9 — Distribution ========== */

    case 'ADD_SALES_AGENT':
      return { ...state, salesAgents: [...state.salesAgents, action.agent] };
    case 'UPDATE_SALES_AGENT':
      return {
        ...state,
        salesAgents: state.salesAgents.map((a) =>
          a.id === action.id ? { ...a, ...action.patch } : a
        ),
      };
    case 'DELETE_SALES_AGENT':
      return { ...state, salesAgents: state.salesAgents.filter((a) => a.id !== action.id) };

    case 'ADD_BROADCASTER':
      return { ...state, broadcasters: [...state.broadcasters, action.broadcaster] };
    case 'UPDATE_BROADCASTER':
      return {
        ...state,
        broadcasters: state.broadcasters.map((b) =>
          b.id === action.id ? { ...b, ...action.patch } : b
        ),
      };
    case 'DELETE_BROADCASTER':
      return { ...state, broadcasters: state.broadcasters.filter((b) => b.id !== action.id) };

    case 'ADD_MARKET_EVENT':
      return { ...state, marketEvents: [...state.marketEvents, action.event] };
    case 'UPDATE_MARKET_EVENT':
      return {
        ...state,
        marketEvents: state.marketEvents.map((m) =>
          m.id === action.id ? { ...m, ...action.patch } : m
        ),
      };
    case 'DELETE_MARKET_EVENT':
      return { ...state, marketEvents: state.marketEvents.filter((m) => m.id !== action.id) };

    case 'ADD_DEAL':
      return { ...state, deals: [...state.deals, action.deal] };
    case 'UPDATE_DEAL':
      return {
        ...state,
        deals: state.deals.map((d) =>
          d.id === action.id ? { ...d, ...action.patch } : d
        ),
      };
    case 'DELETE_DEAL':
      return { ...state, deals: state.deals.filter((d) => d.id !== action.id) };

    /* ========== Phase 9 — Marketing ========== */

    case 'ADD_SOCIAL_POST':
      return { ...state, socialPosts: [...state.socialPosts, action.post] };
    case 'UPDATE_SOCIAL_POST':
      return {
        ...state,
        socialPosts: state.socialPosts.map((p) =>
          p.id === action.id ? { ...p, ...action.patch } : p
        ),
      };
    case 'DELETE_SOCIAL_POST':
      return { ...state, socialPosts: state.socialPosts.filter((p) => p.id !== action.id) };

    case 'ADD_TRAILER_CUT':
      return { ...state, trailerCuts: [...state.trailerCuts, action.cut] };
    case 'UPDATE_TRAILER_CUT':
      return {
        ...state,
        trailerCuts: state.trailerCuts.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c
        ),
      };
    case 'DELETE_TRAILER_CUT':
      return { ...state, trailerCuts: state.trailerCuts.filter((c) => c.id !== action.id) };

    case 'ADD_PRESS_CONTACT':
      return { ...state, pressContacts: [...state.pressContacts, action.contact] };
    case 'UPDATE_PRESS_CONTACT':
      return {
        ...state,
        pressContacts: state.pressContacts.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c
        ),
      };
    case 'DELETE_PRESS_CONTACT':
      return { ...state, pressContacts: state.pressContacts.filter((c) => c.id !== action.id) };

    case 'ADD_BTS':
      return { ...state, btsCapture: [...state.btsCapture, action.capture] };
    case 'UPDATE_BTS':
      return {
        ...state,
        btsCapture: state.btsCapture.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c
        ),
      };
    case 'DELETE_BTS':
      return { ...state, btsCapture: state.btsCapture.filter((c) => c.id !== action.id) };

    /* ========== Phase 9 — Post-production ========== */

    case 'ADD_EDIT_MILESTONE':
      return { ...state, editMilestones: [...state.editMilestones, action.milestone] };
    case 'UPDATE_EDIT_MILESTONE':
      return {
        ...state,
        editMilestones: state.editMilestones.map((m) =>
          m.id === action.id ? { ...m, ...action.patch } : m
        ),
      };
    case 'DELETE_EDIT_MILESTONE':
      return {
        ...state,
        editMilestones: state.editMilestones.filter((m) => m.id !== action.id),
      };

    case 'ADD_CUE':
      return { ...state, cueSheet: [...state.cueSheet, action.entry] };
    case 'UPDATE_CUE':
      return {
        ...state,
        cueSheet: state.cueSheet.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c
        ),
      };
    case 'DELETE_CUE':
      return { ...state, cueSheet: state.cueSheet.filter((c) => c.id !== action.id) };

    case 'ADD_SUBTITLE':
      return { ...state, subtitleTracks: [...state.subtitleTracks, action.track] };
    case 'UPDATE_SUBTITLE':
      return {
        ...state,
        subtitleTracks: state.subtitleTracks.map((t) =>
          t.id === action.id ? { ...t, ...action.patch } : t
        ),
      };
    case 'DELETE_SUBTITLE':
      return {
        ...state,
        subtitleTracks: state.subtitleTracks.filter((t) => t.id !== action.id),
      };

    case 'ADD_DELIVERABLE':
      return { ...state, deliverableSpecs: [...state.deliverableSpecs, action.spec] };
    case 'UPDATE_DELIVERABLE':
      return {
        ...state,
        deliverableSpecs: state.deliverableSpecs.map((d) =>
          d.id === action.id ? { ...d, ...action.patch } : d
        ),
      };
    case 'DELETE_DELIVERABLE':
      return {
        ...state,
        deliverableSpecs: state.deliverableSpecs.filter((d) => d.id !== action.id),
      };

    /* ========== Phase 9 — Voice memos ========== */

    case 'ADD_VOICE_MEMO':
      return { ...state, voiceMemos: [...state.voiceMemos, action.memo] };
    case 'UPDATE_VOICE_MEMO':
      return {
        ...state,
        voiceMemos: state.voiceMemos.map((m) =>
          m.id === action.id ? { ...m, ...action.patch } : m
        ),
      };
    case 'DELETE_VOICE_MEMO':
      return {
        ...state,
        voiceMemos: state.voiceMemos.filter((m) => m.id !== action.id),
      };

    /* ========== Phase 9 — Sketches ========== */

    case 'ADD_SKETCH':
      return { ...state, sketches: [...state.sketches, action.sketch] };
    case 'UPDATE_SKETCH':
      return {
        ...state,
        sketches: state.sketches.map((s) =>
          s.id === action.id ? { ...s, ...action.patch } : s
        ),
      };
    case 'DELETE_SKETCH':
      return {
        ...state,
        sketches: state.sketches.filter((s) => s.id !== action.id),
      };

    /* ========== Phase 9 — Decisions ========== */

    case 'ADD_DECISION':
      return { ...state, decisions: [...state.decisions, action.decision] };
    case 'UPDATE_DECISION':
      return {
        ...state,
        decisions: state.decisions.map((d) =>
          d.id === action.id ? { ...d, ...action.patch } : d
        ),
      };
    case 'DELETE_DECISION':
      return {
        ...state,
        decisions: state.decisions.filter((d) => d.id !== action.id),
      };

    /* ========== Phase 9 — Research module ========== */

    case 'ADD_RESEARCH_SOURCE':
      return { ...state, researchSources: [...state.researchSources, action.source] };
    case 'UPDATE_RESEARCH_SOURCE':
      return {
        ...state,
        researchSources: state.researchSources.map((s) =>
          s.id === action.id ? { ...s, ...action.patch } : s
        ),
      };
    case 'DELETE_RESEARCH_SOURCE':
      return {
        ...state,
        researchSources: state.researchSources.filter((s) => s.id !== action.id),
      };

    case 'ADD_PRODUCER':
      return { ...state, producers: [...state.producers, action.producer] };
    case 'UPDATE_PRODUCER':
      return {
        ...state,
        producers: state.producers.map((p) =>
          p.id === action.id ? { ...p, ...action.patch } : p
        ),
      };
    case 'DELETE_PRODUCER':
      return { ...state, producers: state.producers.filter((p) => p.id !== action.id) };

    case 'ADD_SUBJECT':
      return { ...state, subjects: [...state.subjects, action.subject] };
    case 'UPDATE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.map((s) =>
          s.id === action.id ? { ...s, ...action.patch } : s
        ),
      };
    case 'DELETE_SUBJECT':
      return { ...state, subjects: state.subjects.filter((s) => s.id !== action.id) };

    /* ========== Phase 9 — Tier B deepenings ========== */

    case 'ADD_SPONSOR_DELIVERABLE':
      return {
        ...state,
        sponsorDeliverables: [...state.sponsorDeliverables, action.deliverable],
      };
    case 'UPDATE_SPONSOR_DELIVERABLE':
      return {
        ...state,
        sponsorDeliverables: state.sponsorDeliverables.map((d) =>
          d.id === action.id ? { ...d, ...action.patch } : d
        ),
      };
    case 'DELETE_SPONSOR_DELIVERABLE':
      return {
        ...state,
        sponsorDeliverables: state.sponsorDeliverables.filter((d) => d.id !== action.id),
      };

    case 'ADD_COLOR_SCRIPT_STOP':
      return { ...state, colorScriptStops: [...state.colorScriptStops, action.stop] };
    case 'UPDATE_COLOR_SCRIPT_STOP':
      return {
        ...state,
        colorScriptStops: state.colorScriptStops.map((s) =>
          s.id === action.id ? { ...s, ...action.patch } : s
        ),
      };
    case 'DELETE_COLOR_SCRIPT_STOP':
      return {
        ...state,
        colorScriptStops: state.colorScriptStops.filter((s) => s.id !== action.id),
      };

    case 'ADD_AUDIO_COMMISSION':
      return { ...state, audioCommissions: [...state.audioCommissions, action.commission] };
    case 'UPDATE_AUDIO_COMMISSION':
      return {
        ...state,
        audioCommissions: state.audioCommissions.map((a) =>
          a.id === action.id ? { ...a, ...action.patch } : a
        ),
      };
    case 'DELETE_AUDIO_COMMISSION':
      return {
        ...state,
        audioCommissions: state.audioCommissions.filter((a) => a.id !== action.id),
      };

    /* ========== Phase 9 — Rig configurations ========== */

    case 'ADD_RIG_CONFIG':
      return { ...state, rigConfigurations: [...state.rigConfigurations, action.config] };
    case 'UPDATE_RIG_CONFIG':
      return {
        ...state,
        rigConfigurations: state.rigConfigurations.map((r) =>
          r.id === action.id ? { ...r, ...action.patch } : r
        ),
      };
    case 'DELETE_RIG_CONFIG':
      return {
        ...state,
        rigConfigurations: state.rigConfigurations.filter((r) => r.id !== action.id),
      };

    /* Phase 12 — Conditions forecasts */
    case 'ADD_CONDITIONS':
      return {
        ...state,
        conditionsForecasts: [...state.conditionsForecasts, action.forecast],
      };
    case 'UPDATE_CONDITIONS':
      return {
        ...state,
        conditionsForecasts: state.conditionsForecasts.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c
        ),
      };
    case 'DELETE_CONDITIONS':
      return {
        ...state,
        conditionsForecasts: state.conditionsForecasts.filter((c) => c.id !== action.id),
      };
    case 'BULK_UPSERT_CONDITIONS': {
      /* Replace all forecasts for a given date+location, keep the rest. */
      const others = state.conditionsForecasts.filter(
        (c) => !(c.date === action.date && c.locationId === action.locationId)
      );
      return {
        ...state,
        conditionsForecasts: [...others, ...action.forecasts],
      };
    }

    /* Phase 12 — Camera live status */
    case 'UPSERT_CAMERA_STATUS': {
      /* Upsert by (slot + date) — there's only one live status per slot per day. */
      const existingIdx = state.cameraStatuses.findIndex(
        (s) => s.slot === action.status.slot && s.date === action.status.date
      );
      if (existingIdx === -1) {
        return {
          ...state,
          cameraStatuses: [...state.cameraStatuses, action.status],
        };
      }
      const next = state.cameraStatuses.slice();
      next[existingIdx] = action.status;
      return { ...state, cameraStatuses: next };
    }
    case 'UPDATE_CAMERA_STATUS':
      return {
        ...state,
        cameraStatuses: state.cameraStatuses.map((s) =>
          s.id === action.id
            ? { ...s, ...action.patch, updatedAt: new Date().toISOString() }
            : s
        ),
      };
    case 'DELETE_CAMERA_STATUS':
      return {
        ...state,
        cameraStatuses: state.cameraStatuses.filter((s) => s.id !== action.id),
      };

    /* Phase 12 — Two-Boat Timeline waypoints */
    case 'ADD_BOAT_WAYPOINT':
      return {
        ...state,
        boatWaypoints: [...state.boatWaypoints, action.waypoint],
      };
    case 'UPDATE_BOAT_WAYPOINT':
      return {
        ...state,
        boatWaypoints: state.boatWaypoints.map((w) =>
          w.id === action.id ? { ...w, ...action.patch } : w
        ),
      };
    case 'DELETE_BOAT_WAYPOINT':
      return {
        ...state,
        boatWaypoints: state.boatWaypoints.filter((w) => w.id !== action.id),
      };

    /* Phase 12 — Crew Position Board */
    case 'UPSERT_CREW_POSITION': {
      /* Upsert by (crewId + date) — there's only one current position per
         crew per day. Re-upserting overwrites, preserving id if present. */
      const existingIdx = state.crewPositions.findIndex(
        (p) => p.crewId === action.position.crewId && p.date === action.position.date
      );
      if (existingIdx === -1) {
        return {
          ...state,
          crewPositions: [...state.crewPositions, action.position],
        };
      }
      const next = state.crewPositions.slice();
      next[existingIdx] = action.position;
      return { ...state, crewPositions: next };
    }
    case 'UPDATE_CREW_POSITION':
      return {
        ...state,
        crewPositions: state.crewPositions.map((p) =>
          p.id === action.id
            ? { ...p, ...action.patch, updatedAt: new Date().toISOString() }
            : p
        ),
      };
    case 'DELETE_CREW_POSITION':
      return {
        ...state,
        crewPositions: state.crewPositions.filter((p) => p.id !== action.id),
      };

    /* Phase 12 — Show-Day Mode toggle */
    case 'TOGGLE_SHOW_DAY_MODE':
      return { ...state, showDayMode: action.on };

    /* Phase 12 wave 3 — Permit / Legal Wall */
    case 'ADD_PERMIT':
      return {
        ...state,
        permits: [...state.permits, action.permit],
      };
    case 'UPDATE_PERMIT':
      return {
        ...state,
        permits: state.permits.map((p) =>
          p.id === action.id ? { ...p, ...action.patch } : p
        ),
      };
    case 'DELETE_PERMIT':
      return {
        ...state,
        permits: state.permits.filter((p) => p.id !== action.id),
      };

    /* Phase 12 wave 4 — i18n locale */
    case 'SET_LOCALE':
      return { ...state, locale: action.locale };

    default:
      return state;
  }
}

function updateScenario(
  state: AppState,
  scenario: ScenarioKey,
  updater: (sc: AppState['scenarios'][ScenarioKey]) => AppState['scenarios'][ScenarioKey]
): AppState {
  return {
    ...state,
    scenarios: {
      ...state.scenarios,
      [scenario]: updater(state.scenarios[scenario]),
    },
  };
}
