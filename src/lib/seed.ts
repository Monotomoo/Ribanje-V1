import type {
  AppState,
  BeatTemplate,
  BoatOpsDay,
  Broadcaster,
  RigConfiguration,
  CostCategoryMeta,
  DeliverableSpec,
  EditMilestone,
  FundingSourceMeta,
  MarketEvent,
  PressContact,
  Producer,
  ResearchSource,
  ScenarioData,
  ScenarioKey,
  Episode,
  Sponsor,
  CrewMember,
  Risk,
  SafetyDay,
  SalesAgent,
  Scene,
  SchedulePhase,
  Milestone,
  ShootDay,
  Shot,
  SubtitleTrack,
  Location,
  Route,
  Talent,
  Catch,
  Meal,
  Reference,
  AntiScriptMoment,
  DOPKitItem,
  LUT,
  ColorPalette,
  KlapaEntry,
  MicPlacement,
  JournalEntry,
  Contract,
  EpisodeExtras,
  FestivalSubmission,
  FundingApplication,
  TrailerCut,
  WalkieChannel,
  WrapEntry,
} from '../types';

/* ---------- Funding & costs metadata ---------- */

export const FUNDING_SOURCES: FundingSourceMeta[] = [
  { key: 'ivan',     label: 'Ivan private investment',         color: '#5BA3CC', isStateAid: false, tag: 'private' },
  { key: 'havcDev',  label: 'HAVC development',                color: '#8B7CFC', isStateAid: true,  tag: 'state' },
  { key: 'havcProd', label: 'HAVC production',                 color: '#6F5FE8', isStateAid: true,  tag: 'state' },
  { key: 'hrt',      label: 'HRT co-production',               color: '#6B9080', isStateAid: true,  tag: 'state' },
  { key: 'rebate',   label: 'Filming in Croatia rebate',       color: '#1D9E75', isStateAid: true,  isCalculated: true, tag: 'state' },
  { key: 'tourism',  label: 'Tourism boards (HTZ + counties)', color: '#C9A961', isStateAid: true,  tag: 'state' },
  { key: 'sponsors', label: 'Brand sponsors',                  color: '#D9A93E', isStateAid: false, tag: 'private' },
  { key: 'euMedia',  label: 'EU MEDIA / Creative Europe',      color: '#993556', isStateAid: true,  tag: 'state' },
  { key: 'intl',     label: 'International co-prod (non-EEA)', color: '#D4537E', isStateAid: false, tag: 'private' },
];

export const COST_CATEGORIES: CostCategoryMeta[] = [
  { key: 'tom',  label: "Tom's package (DOP + kit, 30 days)" },
  { key: 'eq',   label: 'Other equipment (B-cam, audio, drones)' },
  { key: 'crew', label: 'Crew (assistants)' },
  { key: 'tal',  label: 'Talent fees (per diems + guests)' },
  { key: 'fuel', label: 'Fuel + dockage (both boats)' },
  { key: 'tf',   label: 'Travel / accommodation / food' },
  { key: 'ins',  label: 'Insurance / permits / legal' },
  { key: 'pre',  label: 'Pre-production' },
  { key: 'ed',   label: 'Editor' },
  { key: 'col',  label: 'Color grading' },
  { key: 'sm',   label: 'Sound design + mix + music' },
  { key: 'ai',   label: 'AI tooling + historical VFX' },
  { key: 'mk',   label: 'Marketing / festivals' },
  { key: 'ct',   label: 'Contingency 8%' },
];

/* ---------- Scenarios ---------- */

export const SCENARIOS: Record<ScenarioKey, ScenarioData> = {
  lean: {
    episodes: 6,
    qualifyingSpendPct: 80,
    blendedRebateRate: 27,
    funding: { ivan: 100, havcDev: 0, havcProd: 0, hrt: 70, tourism: 5, sponsors: 30, euMedia: 0, intl: 0 },
    costs: { tom: 45, eq: 18, crew: 32, tal: 20, fuel: 10, tf: 16, ins: 12, pre: 14, ed: 20, col: 10, sm: 16, ai: 12, mk: 12, ct: 23 },
    cashflow: [
      { quarter: 'Q2 26', inflows: { ivan: 50 },                                            outflow: 22 },
      { quarter: 'Q3 26', inflows: { ivan: 50, hrt: 25, tourism: 5, sponsors: 15 },         outflow: 38 },
      { quarter: 'Q4 26', inflows: { hrt: 25, sponsors: 10 },                               outflow: 130 },
      { quarter: 'Q1 27', inflows: { sponsors: 5 },                                         outflow: 45 },
      { quarter: 'Q2 27', inflows: { hrt: 20 },                                             outflow: 18 },
      { quarter: 'Q3 27', inflows: { rebate: 56 },                                          outflow: 7 },
    ],
  },
  realistic: {
    episodes: 6,
    qualifyingSpendPct: 80,
    blendedRebateRate: 28,
    funding: { ivan: 100, havcDev: 20, havcProd: 20, hrt: 70, tourism: 15, sponsors: 130, euMedia: 0, intl: 0 },
    costs: { tom: 70, eq: 28, crew: 52, tal: 35, fuel: 14, tf: 28, ins: 18, pre: 22, ed: 32, col: 18, sm: 38, ai: 22, mk: 35, ct: 35 },
    cashflow: [
      { quarter: 'Q2 26', inflows: { ivan: 50, havcDev: 20 },                               outflow: 32 },
      { quarter: 'Q3 26', inflows: { ivan: 50, hrt: 25, tourism: 10, sponsors: 50 },        outflow: 65 },
      { quarter: 'Q4 26', inflows: { hrt: 25, havcProd: 10, sponsors: 50 },                 outflow: 218 },
      { quarter: 'Q1 27', inflows: { tourism: 5, sponsors: 30 },                            outflow: 90 },
      { quarter: 'Q2 27', inflows: { hrt: 20, havcProd: 10 },                               outflow: 35 },
      { quarter: 'Q3 27', inflows: { rebate: 100 },                                         outflow: 15 },
    ],
  },
  ambitious: {
    episodes: 8,
    qualifyingSpendPct: 80,
    blendedRebateRate: 28,
    funding: { ivan: 100, havcDev: 30, havcProd: 50, hrt: 100, tourism: 27, sponsors: 175, euMedia: 0, intl: 100 },
    costs: { tom: 100, eq: 50, crew: 90, tal: 55, fuel: 22, tf: 55, ins: 30, pre: 38, ed: 60, col: 30, sm: 70, ai: 35, mk: 60, ct: 60 },
    cashflow: [
      { quarter: 'Q2 26', inflows: { ivan: 50, havcDev: 30, intl: 30 },                                outflow: 55 },
      { quarter: 'Q3 26', inflows: { ivan: 50, hrt: 35, tourism: 17, sponsors: 70, intl: 30 },         outflow: 115 },
      { quarter: 'Q4 26', inflows: { hrt: 35, havcProd: 25, sponsors: 70, intl: 25 },                  outflow: 360 },
      { quarter: 'Q1 27', inflows: { tourism: 10, sponsors: 35, intl: 15 },                            outflow: 145 },
      { quarter: 'Q2 27', inflows: { hrt: 30, havcProd: 25 },                                          outflow: 60 },
      { quarter: 'Q3 27', inflows: { rebate: 168 },                                                    outflow: 30 },
    ],
  },
};

/* ---------- Episodes ---------- */

export const SEED_EPISODES: Episode[] = [
  { id: 'ep1', number: 1, title: 'Lov',      anchor: 'Dubrovnik → Mljet → Lastovo',          theme: 'lov',      synopsis: 'The catch — opening voyage, first fish, first elder.',           runtime: 50, status: 'concept' },
  { id: 'ep2', number: 2, title: 'Vjetar',   anchor: 'Vis → Biševo → Palagruža',             theme: 'vjetar',   synopsis: 'Open sea, the falkuša route, the regatta of 1593.',              runtime: 50, status: 'concept' },
  { id: 'ep3', number: 3, title: 'Kamen',    anchor: 'Šibenik → Kornati',                    theme: 'kamen',    synopsis: 'Stone walls, abandoned konobe, what remains.',                   runtime: 50, status: 'concept' },
  { id: 'ep4', number: 4, title: 'Sol',      anchor: 'Zadar islands (Silba, Olib, Premuda)', theme: 'sol',      synopsis: 'Salt, preservation, things that last.',                          runtime: 50, status: 'concept' },
  { id: 'ep5', number: 5, title: 'Glas',     anchor: 'Cres → Lošinj → Susak',                theme: 'glas',     synopsis: 'The voice — dialects, klapa, the language of the islands.',     runtime: 50, status: 'concept' },
  { id: 'ep6', number: 6, title: 'Povratak', anchor: 'Istra outer islets',                   theme: 'povratak', synopsis: 'Homecoming, closing voyage, the letter delivered.',              runtime: 50, status: 'concept' },
];

export const SEED_SPECIALS: Episode[] = [
  { id: 'sp1', number: 7, title: 'Po Hektoroviću', anchor: 'Hvar → Brač → Šolta', theme: 'special', synopsis: 'The literal three-day voyage of 1556 retraced.', runtime: 75, status: 'concept' },
  { id: 'sp2', number: 8, title: 'Wildcard',       anchor: 'TBD',                  theme: 'special', synopsis: 'Reserve slot — Žene mora? Falkuša construction?', runtime: 75, status: 'concept' },
];

/* ---------- Sponsors ---------- */

export const SEED_SPONSORS: Sponsor[] = [
  { id: 's1',  name: 'HTZ (Hrvatska turistička zajednica)', tier: 1, expectedAmount: 30, category: 'national tourism board',         status: 'prospect',  notes: 'Cultural-tourism budget line. All-year-round Croatia strategy fit.' },
  { id: 's2',  name: 'Adris / Sardina Postira',             tier: 1, expectedAmount: 40, category: 'fish processing — heritage',     status: 'prospect',  notes: 'Sardina since 1907. Locations + access + funding triple play.' },
  { id: 's3',  name: 'A1 Hrvatska',                         tier: 1, expectedAmount: 25, category: 'telecom — connectivity story',   status: 'prospect',  notes: 'Starlink-on-the-boat narrative. CSR sponsorship route.' },
  { id: 's4',  name: 'TZ Splitsko-dalmatinske županije',    tier: 1, expectedAmount: 20, category: 'county DMO',                     status: 'prospect',  notes: 'Episode 2 (Vis archipelago) territory funding.' },
  { id: 's5',  name: 'Croatia Yachting Charter',            tier: 2, expectedAmount: 12, category: 'marine industry',                status: 'prospect',  notes: '' },
  { id: 's6',  name: 'Bibich (Skradin)',                    tier: 2, expectedAmount: 8,  category: 'wine — family producer',         status: 'prospect',  notes: 'Episode 3 fit, eco ethos aligned.' },
  { id: 's7',  name: 'Krauthaker (Kutjevo)',                tier: 2, expectedAmount: 8,  category: 'wine — family producer',         status: 'prospect',  notes: '' },
  { id: 's8',  name: 'Stancija Meneghetti (Istria)',        tier: 2, expectedAmount: 10, category: 'wine + olive oil',               status: 'prospect',  notes: 'Episode 6 closing-arc partner.' },
  { id: 's9',  name: 'Kabola (Istria)',                     tier: 2, expectedAmount: 8,  category: 'wine — family producer',         status: 'prospect',  notes: '' },
  { id: 's10', name: 'Jamnica / Jana',                      tier: 2, expectedAmount: 15, category: 'beverage',                       status: 'prospect',  notes: '' },
  { id: 's11', name: 'Slam Croatia',                        tier: 2, expectedAmount: 6,  category: 'marine apparel',                 status: 'prospect',  notes: 'Crew kit + on-screen presence.' },
  { id: 's12', name: 'Helly Hansen Croatia',                tier: 2, expectedAmount: 8,  category: 'marine apparel',                 status: 'prospect',  notes: '' },
  { id: 's13', name: 'Garmin / Raymarine',                  tier: 3, expectedAmount: 4,  category: 'navigation tech',                status: 'prospect',  notes: 'Chartplotter on screen.' },
  { id: 's14', name: 'SanDisk Pro',                         tier: 3, expectedAmount: 3,  category: 'storage — equipment partner',    status: 'prospect',  notes: 'Product credit for SSDs.' },
  { id: 's15', name: 'Sennheiser Croatia',                  tier: 3, expectedAmount: 4,  category: 'audio — equipment partner',      status: 'prospect',  notes: '' },
  { id: 's16', name: 'Franck Caffé',                        tier: 3, expectedAmount: 5,  category: 'coffee — narrative partner',     status: 'prospect',  notes: "Croatia's open-sea coffee partner." },
];

/* ---------- Crew ---------- */

export const SEED_CREW: CrewMember[] = [
  { id: 'c1', name: 'Tomislav Kovacic', role: 'Producer / Director',              link: 'https://terminimal.com',  notes: 'Tomo. Production lead. Bridges creative and execution.' },
  { id: 'c2', name: 'Tom Lebarić',      role: 'Director of Photography',          link: 'https://tom-lebaric.com', notes: 'Trinity owner / underwater specialist / ACO/SOC/SOA.' },
  { id: 'c3', name: 'Ivan Paladina',    role: 'Principal / Lead talent / Sailor',                                  notes: 'Show owner. Permits and access. Lead fisherman.' },
  { id: 'c4', name: 'Rene Bakalović',   role: 'Principal / Co-host',                                               notes: 'Wine and food encyclopedist. Storytelling principal.' },
  { id: 'c6', name: 'Luka Paladina',    role: 'Captain (talent boat) / Sailor',                                    notes: 'Luka. Family connection to Ivan.' },
];

/* ---------- Risks ---------- */

export const SEED_RISKS: Risk[] = [
  { id: 'r1',  title: 'October weather (bura / jugo)',  probability: 'high', impact: 'high', description: 'Adriatic October weather can shut production down for 5+ consecutive days.',           mitigation: '30–40% schedule buffer. Pre-designed weather-stranded shore content. Bonus episode opportunity for unreachable areas.', category: 'weather',     probabilityScale: 5, impactScale: 5, residualP: 4, residualI: 3, status: 'mitigating' },
  { id: 'r2',  title: 'Equipment overboard',             probability: 'high', impact: 'low',  description: 'Statistically certain at least once across 30 days at sea.',                              mitigation: 'Marine production insurance. Tethers on critical kit. Backup B-cam.',                                                     category: 'equipment',   probabilityScale: 5, impactScale: 2, residualP: 5, residualI: 1, status: 'mitigating' },
  { id: 'r3',  title: 'Talent fatigue',                  probability: 'high', impact: 'low',  description: '6+ weeks at sea wears down even experienced sailors.',                                   mitigation: 'Mandatory shore days. Rotation discipline. Catering budget for morale.',                                                  category: 'talent',      probabilityScale: 4, impactScale: 2, residualP: 3, residualI: 2, status: 'mitigating' },
  { id: 'r4',  title: 'Permit / access surprises',       probability: 'low',  impact: 'low',  description: 'National park fees, lighthouse access, military zone clearances.',                       mitigation: 'Ivan owns permits. Buffer in insurance budget for unexpected fees.',                                                      category: 'regulatory',  probabilityScale: 2, impactScale: 2, residualP: 1, residualI: 2, status: 'mitigated' },
  { id: 'r5',  title: 'Klapa music rights',              probability: 'low',  impact: 'high', description: 'Traditional songs are public domain but specific arrangements and recordings are not.', mitigation: 'Commission new arrangements. Clear all recordings explicitly. Composer of record handles licensing.',                       category: 'legal',       probabilityScale: 2, impactScale: 4, residualP: 1, residualI: 3, status: 'mitigating' },
  { id: 'r6',  title: 'Fish welfare on camera',          probability: 'high', impact: 'low',  description: 'International audiences increasingly sensitive to on-camera fishing practices.',         mitigation: 'Documented mixed catch-and-eat / catch-and-release policy. Transparent in all materials.',                                category: 'operational', probabilityScale: 4, impactScale: 2, residualP: 2, residualI: 2, status: 'mitigating' },
  { id: 'r7',  title: 'Underwater filming legality',     probability: 'low',  impact: 'high', description: 'Croatia tightened spearfishing regulations recently. Filming + fishing line is thin.',  mitigation: "Verify Ivan's licenses for on-camera underwater fishing. Document compliance.",                                          category: 'regulatory',  probabilityScale: 2, impactScale: 5, residualP: 1, residualI: 4, status: 'mitigating' },
  { id: 'r8',  title: 'Post-production schedule slip',   probability: 'high', impact: 'high', description: 'Observational doc post is 30–50% longer than planned doc post.',                          mitigation: '20-week post buffer minimum. In-house edit allows flexibility. Festival deadlines mapped early.',                          category: 'post',        probabilityScale: 5, impactScale: 4, residualP: 3, residualI: 3, status: 'open' },
  { id: 'r9',  title: 'Sponsor delivery shortfall',      probability: 'high', impact: 'low',  description: "Soft commitments don't convert to wire transfers.",                                       mitigation: 'Pipeline 2× what budget needs. Sign in writing, not handshake. Sponsor outreach starts post-pilot trailer.',              category: 'financial',   probabilityScale: 4, impactScale: 2, residualP: 2, residualI: 2, status: 'open' },
  { id: 'r10', title: 'HRT slot timing slip',            probability: 'low',  impact: 'high', description: 'Public broadcaster scheduling can shift by quarters.',                                    mitigation: 'Lock HRT co-production agreement with target air date written in. Festival circuit as parallel distribution path.',          category: 'operational', probabilityScale: 2, impactScale: 4, residualP: 2, residualI: 3, status: 'open' },
];

/* ---------- Schedule & milestones ---------- */

export const SEED_SCHEDULE_PHASES: SchedulePhase[] = [
  { id: 'ph1',  label: 'Development',     start: '2026-04-01', end: '2026-06-30', lane: 0, color: '#8B7CFC' },
  { id: 'ph2',  label: 'Pilot',           start: '2026-05-15', end: '2026-06-30', lane: 1, color: '#5BA3CC' },
  { id: 'ph3',  label: 'Pre-production',  start: '2026-07-01', end: '2026-09-30', lane: 0, color: '#8B7CFC' },
  { id: 'ph4',  label: 'Main shoot',      start: '2026-10-01', end: '2026-10-31', lane: 1, color: '#C9A961' },
  { id: 'ph5',  label: 'Post-production', start: '2026-11-01', end: '2027-04-30', lane: 0, color: '#6B9080' },
  { id: 'ph6',  label: 'Delivery to HRT', start: '2027-05-01', end: '2027-06-15', lane: 1, color: '#6B9080' },
  { id: 'ph7',  label: 'Festival circuit', start: '2027-04-01', end: '2027-12-31', lane: 2, color: '#D4537E' },
  { id: 'ph8',  label: 'Broadcast window', start: '2027-09-01', end: '2027-12-31', lane: 1, color: '#C84B4B' },
];

export const SEED_MILESTONES: Milestone[] = [
  { id: 'm1', label: 'HAVC dev application',           date: '2026-09-12', category: 'havc' },
  { id: 'm2', label: 'HRT co-prod LOI',                date: '2026-07-15', category: 'hrt' },
  { id: 'm3', label: 'Pilot wrap',                     date: '2026-06-30', category: 'internal' },
  { id: 'm4', label: 'Filming in Croatia application', date: '2026-09-01', category: 'havc' },
  { id: 'm5', label: 'Shoot start',                    date: '2026-10-01', category: 'shoot' },
  { id: 'm6', label: 'Picture lock',                   date: '2027-03-15', category: 'post' },
  { id: 'm7', label: 'HRT delivery',                   date: '2027-06-01', category: 'hrt' },
  { id: 'm8', label: 'Festival premiere',              date: '2027-10-01', category: 'festival' },
];

/* ---------- Shoot days — October 2026 micro-schedule ---------- */
/* Rough draft: 5 days per episode, with weather/anchorage placeholders. */
export const SEED_SHOOT_DAYS: ShootDay[] = [
  /* Episode 1 — Lov · Dubrovnik → Mljet → Lastovo · Oct 1–5 */
  { id: 'sd-1',  date: '2026-10-01', episodeId: 'ep1', anchorageId: 'loc-dubrovnik',   weatherWindow: 'clear', notes: 'Departure from Dubrovnik. First-day calibration.' },
  { id: 'sd-2',  date: '2026-10-02', episodeId: 'ep1', anchorageId: 'loc-mljet-pol',   weatherWindow: 'clear' },
  { id: 'sd-3',  date: '2026-10-03', episodeId: 'ep1', anchorageId: 'loc-mljet-pom',   weatherWindow: 'mixed' },
  { id: 'sd-4',  date: '2026-10-04', episodeId: 'ep1', anchorageId: 'loc-lastovo-skr', weatherWindow: 'clear' },
  { id: 'sd-5',  date: '2026-10-05', episodeId: 'ep1', anchorageId: 'loc-lastovo-ubl', weatherWindow: 'clear' },

  /* Episode 2 — Vjetar · Vis → Biševo → Palagruža · Oct 6–10 */
  { id: 'sd-6',  date: '2026-10-06', episodeId: 'ep2', anchorageId: 'loc-vis-town',    weatherWindow: 'clear' },
  { id: 'sd-7',  date: '2026-10-07', episodeId: 'ep2', anchorageId: 'loc-komiza',      weatherWindow: 'mixed' },
  { id: 'sd-8',  date: '2026-10-08', episodeId: 'ep2', anchorageId: 'loc-bisevo',      weatherWindow: 'clear' },
  { id: 'sd-9',  date: '2026-10-09', episodeId: 'ep2', anchorageId: 'loc-palagruza',   weatherWindow: 'mixed', notes: 'Most exposed leg — weather window critical.' },
  { id: 'sd-10', date: '2026-10-10', episodeId: 'ep2', anchorageId: 'loc-vis-town',    weatherWindow: 'jugo' },

  /* Episode 3 — Kamen · Šibenik → Kornati · Oct 11–15 */
  { id: 'sd-11', date: '2026-10-11', episodeId: 'ep3', anchorageId: 'loc-sibenik',     weatherWindow: 'clear' },
  { id: 'sd-12', date: '2026-10-12', episodeId: 'ep3', anchorageId: 'loc-lavsa',       weatherWindow: 'clear' },
  { id: 'sd-13', date: '2026-10-13', episodeId: 'ep3', anchorageId: 'loc-zakan',       weatherWindow: 'bura', notes: 'Buffer day — abandoned konobe interiors.' },
  { id: 'sd-14', date: '2026-10-14', episodeId: 'ep3', anchorageId: 'loc-lavsa',       weatherWindow: 'clear' },
  { id: 'sd-15', date: '2026-10-15', episodeId: 'ep3', anchorageId: 'loc-sibenik',     weatherWindow: 'mixed' },

  /* Episode 4 — Sol · Silba / Olib / Premuda · Oct 16–20 */
  { id: 'sd-16', date: '2026-10-16', episodeId: 'ep4', anchorageId: 'loc-silba',       weatherWindow: 'clear' },
  { id: 'sd-17', date: '2026-10-17', episodeId: 'ep4', anchorageId: 'loc-olib',        weatherWindow: 'clear' },
  { id: 'sd-18', date: '2026-10-18', episodeId: 'ep4', anchorageId: 'loc-premuda',     weatherWindow: 'mixed' },
  { id: 'sd-19', date: '2026-10-19', episodeId: 'ep4', anchorageId: 'loc-silba',       weatherWindow: 'jugo', notes: 'Salt-preservation traditions on shore.' },
  { id: 'sd-20', date: '2026-10-20', episodeId: 'ep4', anchorageId: 'loc-olib',        weatherWindow: 'clear' },

  /* Episode 5 — Glas · Cres → Lošinj → Susak · Oct 21–25 */
  { id: 'sd-21', date: '2026-10-21', episodeId: 'ep5', anchorageId: 'loc-cres',        weatherWindow: 'clear' },
  { id: 'sd-22', date: '2026-10-22', episodeId: 'ep5', anchorageId: 'loc-mali-losinj', weatherWindow: 'clear', notes: 'Klapa session — main music capture.' },
  { id: 'sd-23', date: '2026-10-23', episodeId: 'ep5', anchorageId: 'loc-susak',       weatherWindow: 'mixed' },
  { id: 'sd-24', date: '2026-10-24', episodeId: 'ep5', anchorageId: 'loc-mali-losinj', weatherWindow: 'clear' },
  { id: 'sd-25', date: '2026-10-25', episodeId: 'ep5', anchorageId: 'loc-cres',        weatherWindow: 'clear' },

  /* Episode 6 — Povratak · Istra outer islets · Oct 26–30 */
  { id: 'sd-26', date: '2026-10-26', episodeId: 'ep6', anchorageId: 'loc-brijuni',     weatherWindow: 'clear' },
  { id: 'sd-27', date: '2026-10-27', episodeId: 'ep6', anchorageId: 'loc-rovinj',      weatherWindow: 'mixed' },
  { id: 'sd-28', date: '2026-10-28', episodeId: 'ep6', anchorageId: 'loc-brijuni',     weatherWindow: 'bura', notes: 'Closing voyage. Letter delivered.' },
  { id: 'sd-29', date: '2026-10-29', episodeId: 'ep6', anchorageId: 'loc-rovinj',      weatherWindow: 'clear' },
  { id: 'sd-30', date: '2026-10-30', episodeId: 'ep6', anchorageId: 'loc-brijuni',     weatherWindow: 'clear', notes: 'Wrap day. Cap off with crew dinner.' },
];

/* ---------- Locations (anchorages) ---------- */

export const SEED_LOCATIONS: Location[] = [
  /* Episode 1 — Dubrovnik → Mljet → Lastovo */
  { id: 'loc-dubrovnik',   label: 'Dubrovnik harbour',     episodeId: 'ep1', lat: 42.65,  lng: 18.09, type: 'anchorage', notes: 'Departure port. Old town shoreline backdrop.' },
  { id: 'loc-mljet-pol',   label: 'Mljet — Polače',        episodeId: 'ep1', lat: 42.79,  lng: 17.39, type: 'anchorage', notes: 'National park entry. Roman ruins on shore.' },
  { id: 'loc-mljet-pom',   label: 'Mljet — Pomena',        episodeId: 'ep1', lat: 42.79,  lng: 17.34, type: 'anchorage', notes: '' },
  { id: 'loc-lastovo-skr', label: 'Lastovo — Skrivena Luka', episodeId: 'ep1', lat: 42.72, lng: 16.84, type: 'anchorage', notes: 'Hidden bay; protected from southerly winds.' },
  { id: 'loc-lastovo-ubl', label: 'Lastovo — Ubli',        episodeId: 'ep1', lat: 42.74,  lng: 16.81, type: 'anchorage', notes: 'Elder fishermen reachable here.' },

  /* Episode 2 — Vis → Biševo → Palagruža */
  { id: 'loc-vis-town',    label: 'Vis town',              episodeId: 'ep2', lat: 43.06,  lng: 16.18, type: 'anchorage', notes: '' },
  { id: 'loc-komiza',      label: 'Komiža',                episodeId: 'ep2', lat: 43.04,  lng: 16.10, type: 'anchorage', notes: 'Falkuša cradle. Regatta of 1593 origin.' },
  { id: 'loc-bisevo',      label: 'Biševo — Modra špilja', episodeId: 'ep2', lat: 42.97,  lng: 16.01, type: 'anchorage', notes: 'Blue cave — narrow window for filming light.' },
  { id: 'loc-palagruza',   label: 'Palagruža lighthouse',  episodeId: 'ep2', lat: 42.39,  lng: 16.26, type: 'shore',     notes: 'Most distant Croatian point. Lighthouse keeper.' },

  /* Episode 3 — Šibenik → Kornati */
  { id: 'loc-sibenik',     label: 'Šibenik harbour',       episodeId: 'ep3', lat: 43.73,  lng: 15.90, type: 'anchorage', notes: '' },
  { id: 'loc-lavsa',       label: 'Kornati — Lavsa',       episodeId: 'ep3', lat: 43.78,  lng: 15.43, type: 'anchorage', notes: 'Stone walls on terraced slopes.' },
  { id: 'loc-zakan',       label: 'Kornati — Žakan',       episodeId: 'ep3', lat: 43.85,  lng: 15.34, type: 'anchorage', notes: 'Abandoned konobe.' },

  /* Episode 4 — Silba / Olib / Premuda */
  { id: 'loc-silba',       label: 'Silba',                 episodeId: 'ep4', lat: 44.39,  lng: 14.71, type: 'anchorage', notes: 'No cars. Salt-preservation traditions persist.' },
  { id: 'loc-olib',        label: 'Olib',                  episodeId: 'ep4', lat: 44.34,  lng: 14.79, type: 'anchorage', notes: '' },
  { id: 'loc-premuda',     label: 'Premuda',               episodeId: 'ep4', lat: 44.34,  lng: 14.62, type: 'anchorage', notes: '' },

  /* Episode 5 — Cres → Lošinj → Susak */
  { id: 'loc-cres',        label: 'Cres town',             episodeId: 'ep5', lat: 44.95,  lng: 14.41, type: 'anchorage', notes: '' },
  { id: 'loc-mali-losinj', label: 'Mali Lošinj',           episodeId: 'ep5', lat: 44.53,  lng: 14.47, type: 'anchorage', notes: 'Klapa scene strong here.' },
  { id: 'loc-susak',       label: 'Susak',                 episodeId: 'ep5', lat: 44.51,  lng: 14.30, type: 'anchorage', notes: "Sandy island; women's traditional dress." },

  /* Episode 6 — Istra outer islets */
  { id: 'loc-brijuni',     label: 'Brijuni outer islets',  episodeId: 'ep6', lat: 44.92,  lng: 13.76, type: 'anchorage', notes: 'Permission required.' },
  { id: 'loc-rovinj',      label: 'Rovinj outer reefs',    episodeId: 'ep6', lat: 45.08,  lng: 13.63, type: 'anchorage', notes: 'Closing voyage waters.' },

  /* Hektorović reference voyage (1556) */
  { id: 'loc-hvar-stari',  label: 'Hvar — Stari Grad',     episodeId: 'hektorovic', lat: 43.18, lng: 16.59, type: 'reference', notes: "Hektorović's home. Voyage origin and return point." },
  { id: 'loc-brac-bol',    label: 'Brač — Bol',            episodeId: 'hektorovic', lat: 43.26, lng: 16.66, type: 'reference', notes: 'Day 1 destination per the 1556 poem.' },
  { id: 'loc-solta-mas',   label: 'Šolta — Maslinica',     episodeId: 'hektorovic', lat: 43.40, lng: 16.20, type: 'reference', notes: 'Day 2 turn.' },
];

/* ---------- Routes ---------- */

export const SEED_ROUTES: Route[] = [
  { id: 'rt-ep1-1', episodeId: 'ep1', fromLocationId: 'loc-dubrovnik',   toLocationId: 'loc-mljet-pol' },
  { id: 'rt-ep1-2', episodeId: 'ep1', fromLocationId: 'loc-mljet-pol',   toLocationId: 'loc-mljet-pom' },
  { id: 'rt-ep1-3', episodeId: 'ep1', fromLocationId: 'loc-mljet-pom',   toLocationId: 'loc-lastovo-skr' },
  { id: 'rt-ep1-4', episodeId: 'ep1', fromLocationId: 'loc-lastovo-skr', toLocationId: 'loc-lastovo-ubl' },

  { id: 'rt-ep2-1', episodeId: 'ep2', fromLocationId: 'loc-vis-town',    toLocationId: 'loc-komiza' },
  { id: 'rt-ep2-2', episodeId: 'ep2', fromLocationId: 'loc-komiza',      toLocationId: 'loc-bisevo' },
  { id: 'rt-ep2-3', episodeId: 'ep2', fromLocationId: 'loc-bisevo',      toLocationId: 'loc-palagruza' },

  { id: 'rt-ep3-1', episodeId: 'ep3', fromLocationId: 'loc-sibenik',     toLocationId: 'loc-lavsa' },
  { id: 'rt-ep3-2', episodeId: 'ep3', fromLocationId: 'loc-lavsa',       toLocationId: 'loc-zakan' },

  { id: 'rt-ep4-1', episodeId: 'ep4', fromLocationId: 'loc-silba',       toLocationId: 'loc-olib' },
  { id: 'rt-ep4-2', episodeId: 'ep4', fromLocationId: 'loc-olib',        toLocationId: 'loc-premuda' },

  { id: 'rt-ep5-1', episodeId: 'ep5', fromLocationId: 'loc-cres',        toLocationId: 'loc-mali-losinj' },
  { id: 'rt-ep5-2', episodeId: 'ep5', fromLocationId: 'loc-mali-losinj', toLocationId: 'loc-susak' },

  { id: 'rt-ep6-1', episodeId: 'ep6', fromLocationId: 'loc-brijuni',     toLocationId: 'loc-rovinj' },
];

/* ---------- Beat templates (library used by Episode Story tab) ---------- */

export const BEAT_TEMPLATES: BeatTemplate[] = [
  {
    id: 'tpl-departure',
    label: 'Departure / mooring',
    description: 'Wide of the boat leaving port. Sets up the journey.',
    defaultDurationMin: 2,
    iconType: 'departure',
  },
  {
    id: 'tpl-firstcatch',
    label: 'First catch',
    description: 'Hand on line, fish coming up. The hook of the episode.',
    defaultDurationMin: 4,
    iconType: 'catch',
  },
  {
    id: 'tpl-elder',
    label: 'Elder interview',
    description: 'A fisherman or island elder speaks. Cut down to 3–5 min from a longer roll.',
    defaultDurationMin: 5,
    iconType: 'elder',
  },
  {
    id: 'tpl-meal',
    label: 'Meal at anchor',
    description: 'Rene cooks the catch. Wine pours. Quiet voices.',
    defaultDurationMin: 6,
    iconType: 'meal',
  },
  {
    id: 'tpl-sunrise',
    label: 'Sunrise / golden hour',
    description: 'Anchorage waking. Camera on Trinity, slow.',
    defaultDurationMin: 2,
    iconType: 'sunrise',
  },
  {
    id: 'tpl-homecoming',
    label: 'Homecoming',
    description: 'Mooring back, lines tied, day ends. The closing register.',
    defaultDurationMin: 3,
    iconType: 'homecoming',
  },
];

/* ---------- Talent / Catches / Meals / Anti-script / Refs / Color palettes / Journal — empty by default ---------- */

export const SEED_TALENTS: Talent[] = [];
export const SEED_CATCHES: Catch[] = [];
export const SEED_MEALS: Meal[] = [];
export const SEED_ANTI_SCRIPT_MOMENTS: AntiScriptMoment[] = [];
export const SEED_COLOR_PALETTES: ColorPalette[] = [];
export const SEED_JOURNAL_ENTRIES: JournalEntry[] = [];

/* ---------- Reference films (touchstones) ---------- */

export const SEED_REFERENCES: Reference[] = [
  { id: 'rf1', episodeId: 'general', type: 'film',  title: 'Leviathan',                       director: 'Lucien Castaing-Taylor & Véréna Paravel', year: 2012, sourceUrl: '', whyItMatters: 'Visceral observational fishing-boat documentary. Camera embedded in labor.', notes: '' },
  { id: 'rf2', episodeId: 'general', type: 'film',  title: 'Fire at Sea',                     director: 'Gianfranco Rosi',                          year: 2016, sourceUrl: '', whyItMatters: 'Mediterranean island patience, observational discipline, no narration.', notes: '' },
  { id: 'rf3', episodeId: 'general', type: 'film',  title: 'Encounters at the End of the World', director: 'Werner Herzog',                         year: 2007, sourceUrl: '', whyItMatters: 'Voice-of-author + landscape philosophy. Dialogue with elders.', notes: '' },
  { id: 'rf4', episodeId: 'general', type: 'film',  title: 'The Wind Will Carry Us',          director: 'Abbas Kiarostami',                         year: 1999, sourceUrl: '', whyItMatters: 'Outsider observing village life. Long takes. Time as a character.', notes: '' },
  { id: 'rf5', episodeId: 'general', type: 'film',  title: 'Casa de Lava',                    director: 'Pedro Costa',                              year: 1994, sourceUrl: '', whyItMatters: 'Island isolation. Faces. Refusal of plot.', notes: '' },
  { id: 'rf6', episodeId: 'general', type: 'film',  title: 'Stop-Zemlia',                     director: 'Kateryna Gornostai',                       year: 2021, sourceUrl: '', whyItMatters: 'Naturalistic teen-drama techniques applicable to elder interview style.', notes: '' },
  { id: 'rf7', episodeId: 'general', type: 'film',  title: 'Sweetgrass',                      director: 'Lucien Castaing-Taylor & Ilisa Barbash',   year: 2009, sourceUrl: '', whyItMatters: 'Pastoral observational doc. Texture of working life.', notes: '' },
  { id: 'rf8', episodeId: 'general', type: 'book',  title: 'Ribanje i ribarsko prigovaranje', director: 'Petar Hektorović',                          year: 1568, sourceUrl: '', whyItMatters: 'Source text. The 3-day fishing voyage poem the show is named for.', notes: 'Public domain.' },
];

/* ---------- DOP kit (Tom's likely setup — verify on Day 1) ---------- */

export const SEED_DOP_KIT: DOPKitItem[] = [
  {
    id: 'kit-cam-a',
    category: 'camera',
    label: 'ARRI Alexa 35',
    notes: '4.6K Super 35. Verify with Tom.',
    specs: {
      sensor: 'Super 35 ALEV 4',
      codec: 'ProRes / ARRIRAW',
      'max resolution': '4.6K',
      'max ISO': '6400 (1600 native)',
      'dynamic range': '17 stops',
      'max FPS': '120 (4K) / 75 (4.6K)',
      mount: 'LPL · PL via adapter',
    },
    weightKg: 2.9,
    wattsPerHour: 90,
    dailyRateK: 0.5,
  },
  {
    id: 'kit-cam-b',
    category: 'camera',
    label: 'Sony FX3',
    notes: 'B-camera; agile in tight quarters.',
    specs: {
      sensor: 'Full-frame Exmor R',
      codec: 'XAVC HS / S-I / S-Log3',
      'max resolution': '4K',
      'max ISO': '102400 (640 / 12800 dual native)',
      'dynamic range': '15+ stops',
      'max FPS': '120 (4K) / 240 (HD)',
      mount: 'E',
    },
    weightKg: 0.7,
    wattsPerHour: 12,
    dailyRateK: 0.12,
  },
  {
    id: 'kit-lens-1',
    category: 'lens',
    label: 'Cooke S4/i 32mm',
    notes: '',
    specs: {
      focal: '32mm',
      'max aperture': 'T2.0',
      'close focus': '0.36m',
      'filter thread': '110mm',
    },
    weightKg: 1.6,
    characterNotes:
      'Cooke softness in falloff. Skin tones warm. Goes well with Tom Lebarić\'s natural-light approach.',
    dailyRateK: 0.18,
  },
  {
    id: 'kit-lens-2',
    category: 'lens',
    label: 'Cooke S4/i 50mm',
    notes: '',
    specs: {
      focal: '50mm',
      'max aperture': 'T2.0',
      'close focus': '0.51m',
      'filter thread': '110mm',
    },
    weightKg: 1.7,
    characterNotes: 'The "everywhere" focal. Two faces in a frame, hands on a line.',
    dailyRateK: 0.18,
  },
  {
    id: 'kit-lens-3',
    category: 'lens',
    label: 'Cooke S4/i 85mm',
    notes: '',
    specs: {
      focal: '85mm',
      'max aperture': 'T2.0',
      'close focus': '0.86m',
      'filter thread': '110mm',
    },
    weightKg: 1.8,
    characterNotes: 'Elder interview lens. Compression isolates subject from boat chaos.',
    dailyRateK: 0.18,
  },
  {
    id: 'kit-lens-4',
    category: 'lens',
    label: 'Atlas Orion 1.5× anamorphic 65mm',
    notes: 'Selectively per episode.',
    specs: {
      focal: '65mm (≈43mm equivalent)',
      'max aperture': 'T2',
      'close focus': '0.79m',
      squeeze: '1.5×',
    },
    weightKg: 2.7,
    characterNotes:
      'Wide vista frames. Use for opening/closing of each episode and Hektorović verse cutaways.',
    dailyRateK: 0.25,
  },
  {
    id: 'kit-stab',
    category: 'stab',
    label: 'ARRI Trinity',
    notes: "Tom's signature rig. The reason his shots have that quality.",
    specs: {
      type: 'Hybrid stabiliser (gimbal + arm)',
      payload: 'up to 13 kg',
    },
    weightKg: 11,
    wattsPerHour: 25,
    dailyRateK: 0.55,
  },
  {
    id: 'kit-aud-1',
    category: 'audio',
    label: 'Sennheiser MKH 416 (shotgun)',
    notes: '',
    specs: { polar: 'Super-cardioid', sensitivity: '25 mV/Pa' },
    weightKg: 0.16,
    wattsPerHour: 0.5,
    dailyRateK: 0.04,
  },
  {
    id: 'kit-aud-2',
    category: 'audio',
    label: 'Sanken COS-11 lavs ×4',
    notes: '',
    specs: { polar: 'Omnidirectional', diameter: '5mm' },
    weightKg: 0.04,
    wattsPerHour: 0.2,
    dailyRateK: 0.04,
  },
  {
    id: 'kit-aud-3',
    category: 'audio',
    label: 'Sound Devices Scorpio (recorder)',
    notes: '32-input mixer-recorder, our spine on the boat.',
    specs: {
      inputs: '16 mic/line + 16 returns',
      tracks: '36 simultaneous',
      formats: 'ISO + mix · BWF / MP3',
    },
    weightKg: 1.45,
    wattsPerHour: 18,
    dailyRateK: 0.18,
  },
  {
    id: 'kit-aerial',
    category: 'aerial',
    label: 'DJI Inspire 3',
    notes: 'Aerial / boat-pursuit shots.',
    specs: {
      sensor: 'Full-frame Zenmuse X9-8K',
      codec: 'CinemaDNG / ProRes',
      'max FPS': '8K@75 / 4K@120',
      'flight time': '~28 min',
    },
    weightKg: 4,
    wattsPerHour: 0,
    dailyRateK: 0.32,
  },
  {
    id: 'kit-uw',
    category: 'underwater',
    label: 'Nauticam underwater housing (FX3)',
    notes: 'Match to FX3 body.',
    specs: { depth: '100m', port: 'Wide-angle WACP-1', monitor: 'Atomos external' },
    weightKg: 5.2,
    dailyRateK: 0.22,
  },
  {
    id: 'kit-storage',
    category: 'storage',
    label: 'SanDisk Pro G-DRIVE SSD ×8',
    notes: 'Sponsor opportunity (s14).',
    specs: { 'capacity per drive': '4TB', interface: 'USB 4 / Thunderbolt 4' },
    weightKg: 1.6,
    capacityGb: 8 * 4000,
  },
];

/* ---------- Mic placements (boat sound logistics) ---------- */

export const SEED_MIC_PLACEMENTS: MicPlacement[] = [
  { id: 'mic1', label: 'Boom 1 · Sennheiser MKH 416',  kitId: 'kit-aud-1', position: 'Camera-side, on cradle stand · stern-facing', channelMHz: undefined, episodeId: 'general', notes: 'Primary dialogue boom. Wind protection blimp in light bura conditions.' },
  { id: 'mic2', label: 'Lav · Ivan',                    kitId: 'kit-aud-2', position: 'On Ivan · concealed under linen shirt',          channelMHz: 470.500, episodeId: 'general', notes: 'Active during fishing scenes. Sweat-proof patch.' },
  { id: 'mic3', label: 'Lav · Rene',                    kitId: 'kit-aud-2', position: 'On Rene · lapel during meal & wine scenes',     channelMHz: 470.700, episodeId: 'general', notes: 'Backup wind cover for outdoor service.' },
  { id: 'mic4', label: 'Plant · galley',                kitId: 'kit-aud-2', position: 'Inside galley · attached under counter',         channelMHz: 471.100, episodeId: 'general', notes: 'For ambience: knife, pan, water — Rene at work.' },
  { id: 'mic5', label: 'Plant · bow',                   kitId: 'kit-aud-2', position: 'Bow rail · weather-housed',                      channelMHz: 471.300, episodeId: 'general', notes: 'Catch ambient: water break, line tension, gear.' },
  { id: 'mic6', label: 'Stereo pair · ambient',         kitId: undefined,    position: 'Mast top · ORTF',                                channelMHz: undefined, episodeId: 'general', notes: 'Wide stereo of sea + sky. Recorded continuously when safe.' },
];

/* ---------- LUTs / color management ---------- */

export const SEED_LUTS: LUT[] = [
  {
    id: 'lut-arri-rec709',
    name: 'ARRI LogC3 → Rec.709',
    episodeId: 'general',
    sourceColorspace: 'ARRI LogC3 / AWG',
    targetColorspace: 'Rec.709 BT.1886',
    notes:
      'Default delivery LUT for HRT broadcast. Apply after grade for monitor reference.',
  },
  {
    id: 'lut-print',
    name: 'Soft film-print emulation',
    episodeId: 'general',
    sourceColorspace: 'ARRI LogC3',
    targetColorspace: 'Rec.709',
    notes:
      'Slightly desaturated, lifted blacks, warm highlights. The closing register.',
  },
];

/* ---------- Klapa map ---------- */

export const SEED_KLAPA: KlapaEntry[] = [
  { id: 'kl1', region: 'south-dalmatia',   songTitle: 'Vilo moja',          klapaName: 'Trad. (multiple klape)', rightsStatus: 'public-domain',           notes: 'Common in Lastovo–Korčula belt.' },
  { id: 'kl2', region: 'south-dalmatia',   songTitle: 'Galeb i ja',          klapaName: 'Klapa Iskon (arr.)',     rightsStatus: 'arranged-needs-clearance', notes: 'Arrangement rights need clearing.' },
  { id: 'kl3', region: 'central-dalmatia', songTitle: 'Ribar plete mrižu',  klapaName: 'Trad.',                  rightsStatus: 'public-domain',           notes: 'Komiža area. Episode 2 fit.' },
  { id: 'kl4', region: 'central-dalmatia', songTitle: 'Bili cvitak',         klapaName: 'Klapa Cambi (arr.)',     rightsStatus: 'arranged-needs-clearance', notes: '' },
  { id: 'kl5', region: 'north-dalmatia',   songTitle: 'Kornatska barka',     klapaName: 'Trad.',                  rightsStatus: 'public-domain',           notes: 'Episode 3 fit.' },
  { id: 'kl6', region: 'kvarner',          songTitle: 'Lošinjska serenada',  klapaName: 'Klapa Lošinj',           rightsStatus: 'arranged-needs-clearance', notes: 'Episode 5 — voice episode anchor.' },
  { id: 'kl7', region: 'kvarner',          songTitle: 'Susački vapor',       klapaName: 'Trad.',                  rightsStatus: 'unknown',                  notes: 'Verify with Susak elder ensemble.' },
  { id: 'kl8', region: 'istria',           songTitle: 'Bujština',            klapaName: 'Trad. (Istrian scale)',  rightsStatus: 'public-domain',           notes: 'Episode 6 closing arc.' },
];

/* ---------- Contracts (placeholder) ---------- */

export const SEED_CONTRACTS: Contract[] = [
  { id: 'ct1', type: 'talent-release',    partyName: 'Ivan Paladina',   episodeId: 'general', status: 'drafted', notes: 'Lead-talent release covering all 6 episodes.' },
  { id: 'ct2', type: 'talent-release',    partyName: 'Rene Bakalović',  episodeId: 'general', status: 'drafted', notes: 'Co-host release.' },
  { id: 'ct3', type: 'talent-release',    partyName: 'Luka Paladina',   episodeId: 'general', status: 'drafted', notes: 'Captain release.' },
  { id: 'ct4', type: 'crew',              partyName: 'Tom Lebarić',     episodeId: 'general', status: 'drafted', notes: 'DOP agreement + kit rental.' },
  { id: 'ct6', type: 'location-release',  partyName: 'Mljet NP authority', episodeId: 'ep1',  status: 'drafted', notes: 'National park filming permit.' },
  { id: 'ct7', type: 'location-release',  partyName: 'Kornati NP authority', episodeId: 'ep3', status: 'drafted', notes: '' },
  { id: 'ct8', type: 'music-clearance',   partyName: 'Klapa rights bundle', episodeId: 'general', status: 'drafted', notes: 'Per Risk #5 — bundle clearance via composer of record.' },
];

/* ---------- Per-episode extras (Hektorović verses + craft notes) ---------- */

export const SEED_EPISODE_EXTRAS: Record<string, EpisodeExtras> = {
  ep1: {
    episodeId: 'ep1',
    hektorovicVerseCro: '[draft — verse for Lov, Tomo to confirm]',
    hektorovicVerseEng: '[working translation — the catch, the hook, the elder]',
    hektorovicParallel: 'In 1556 the first day was the first cast. In our episode 1, the first cast is the show itself testing the water.',
    dopNotes: '',
    soundNotes: '',
  },
  ep2: {
    episodeId: 'ep2',
    hektorovicVerseCro: '[draft — verse for Vjetar, Tomo to confirm]',
    hektorovicVerseEng: '[working translation — the wind, the open passage]',
    hektorovicParallel: 'The 1556 voyage stayed coastal. Our Vjetar episode goes further — Palagruža, the open Adriatic — same caution, larger frame.',
    dopNotes: '',
    soundNotes: '',
  },
  ep3: {
    episodeId: 'ep3',
    hektorovicVerseCro: '[draft — verse for Kamen, Tomo to confirm]',
    hektorovicVerseEng: '[working translation — stone walls, what remains]',
    hektorovicParallel: 'Hektorović wrote walls into his garden in Stari Grad. Kornati walls were built by hands, not poets. Same stone, different labor.',
    dopNotes: '',
    soundNotes: '',
  },
  ep4: {
    episodeId: 'ep4',
    hektorovicVerseCro: '[draft — verse for Sol, Tomo to confirm]',
    hektorovicVerseEng: '[working translation — salt, preservation, time]',
    hektorovicParallel: 'Salt preserves what would otherwise vanish. The poem is salt. The episode looks at the salt itself.',
    dopNotes: '',
    soundNotes: '',
  },
  ep5: {
    episodeId: 'ep5',
    hektorovicVerseCro: '[draft — verse for Glas, Tomo to confirm]',
    hektorovicVerseEng: '[working translation — voice, song, dialect]',
    hektorovicParallel: 'Hektorović transcribed fishermen speaking. Glas listens to who still speaks that way — and where the language is shifting.',
    dopNotes: '',
    soundNotes: '',
  },
  ep6: {
    episodeId: 'ep6',
    hektorovicVerseCro: '[draft — verse for Povratak, Tomo to confirm]',
    hektorovicVerseEng: '[working translation — homecoming, the letter delivered]',
    hektorovicParallel: 'The 1556 voyage ended where it began. Our Povratak does too — different mooring, same horizon.',
    dopNotes: '',
    soundNotes: '',
  },
};

/* ---------- Festival submissions (pre-seeded shortlist) ---------- */

export const SEED_FESTIVALS: FestivalSubmission[] = [
  { id: 'fest-idfa',     name: 'IDFA',                            city: 'Amsterdam',  country: 'Netherlands', category: 'feature doc · main',          deadline: '2027-06-15', feeEur: 75,  fitScore: 5, status: 'target', notes: 'The big one for European observational doc. Aim for main competition.' },
  { id: 'fest-cphdox',   name: 'CPH:DOX',                         city: 'Copenhagen', country: 'Denmark',     category: 'feature doc · DOX:AWARD',     deadline: '2027-11-30', feeEur: 65,  fitScore: 4, status: 'target', notes: '' },
  { id: 'fest-ji',       name: 'Ji.hlava IDFF',                   city: 'Jihlava',    country: 'Czechia',     category: 'feature doc · Opus Bonum',    deadline: '2027-06-30', feeEur: 0,   fitScore: 5, status: 'target', notes: 'Strong on observational, Eastern European focus.' },
  { id: 'fest-zagdox',   name: 'Zagreb Dox',                      city: 'Zagreb',     country: 'Croatia',     category: 'feature doc · regional',      deadline: '2026-12-15', feeEur: 0,   fitScore: 5, status: 'target', notes: 'Home-territory premiere candidate.' },
  { id: 'fest-sarafm',   name: 'Sarajevo Film Festival',          city: 'Sarajevo',   country: 'Bosnia',      category: 'feature doc',                 deadline: '2027-04-10', feeEur: 0,   fitScore: 5, status: 'target', notes: '' },
  { id: 'fest-pula',     name: 'Pula Film Festival',              city: 'Pula',       country: 'Croatia',     category: 'national',                    deadline: '2027-04-15', feeEur: 0,   fitScore: 4, status: 'target', notes: '' },
  { id: 'fest-cannes',   name: 'Cannes · ACID / Quinzaine',       city: 'Cannes',     country: 'France',      category: 'sidebars',                    deadline: '2027-03-15', feeEur: 0,   fitScore: 3, status: 'target', notes: 'Long shot. Sidebars more realistic than main comp.' },
  { id: 'fest-tff',      name: 'Thessaloniki Documentary',        city: 'Thessaloniki', country: 'Greece',    category: 'feature doc',                 deadline: '2027-12-10', feeEur: 0,   fitScore: 4, status: 'target', notes: 'Mediterranean focus.' },
  { id: 'fest-docsbcn',  name: 'DocsBarcelona',                   city: 'Barcelona',  country: 'Spain',       category: 'feature doc',                 deadline: '2027-12-15', feeEur: 50,  fitScore: 3, status: 'target', notes: '' },
  { id: 'fest-trueFalse',name: 'True / False',                    city: 'Columbia, MO', country: 'USA',       category: 'feature doc',                 deadline: '2027-09-01', feeEur: 70,  fitScore: 4, status: 'target', notes: 'Curated, observational-friendly programmers.' },
  { id: 'fest-hotdocs',  name: 'Hot Docs',                        city: 'Toronto',    country: 'Canada',      category: 'feature doc',                 deadline: '2027-12-01', feeEur: 70,  fitScore: 3, status: 'target', notes: '' },
  { id: 'fest-leipzig',  name: 'DOK Leipzig',                     city: 'Leipzig',    country: 'Germany',     category: 'feature doc · ICDF',          deadline: '2027-07-31', feeEur: 30,  fitScore: 4, status: 'target', notes: '' },
  { id: 'fest-visions',  name: 'Visions du Réel',                 city: 'Nyon',       country: 'Switzerland', category: 'feature doc · main',          deadline: '2027-12-31', feeEur: 60,  fitScore: 4, status: 'target', notes: '' },
];

/* ---------- Funding applications ---------- */

export const SEED_APPLICATIONS: FundingApplication[] = [
  {
    id: 'app-havc-dev',
    name: 'HAVC Development support',
    funder: 'HAVC (Croatian Audiovisual Centre)',
    deadline: '2026-09-12',
    status: 'planning',
    amountK: 30,
    draftSections: [
      { id: 'lf-app1-1', label: 'Project synopsis', body: '' },
      { id: 'lf-app1-2', label: 'Director\'s vision', body: '' },
      { id: 'lf-app1-3', label: 'Production approach', body: '' },
      { id: 'lf-app1-4', label: 'Budget summary', body: '' },
      { id: 'lf-app1-5', label: 'Schedule', body: '' },
    ],
    notes: '',
  },
  {
    id: 'app-havc-prod',
    name: 'HAVC Production support',
    funder: 'HAVC (Croatian Audiovisual Centre)',
    deadline: '2027-03-15',
    status: 'planning',
    amountK: 100,
    draftSections: [
      { id: 'lf-app2-1', label: 'Project synopsis', body: '' },
      { id: 'lf-app2-2', label: 'Production plan', body: '' },
      { id: 'lf-app2-3', label: 'Distribution strategy', body: '' },
      { id: 'lf-app2-4', label: 'Detailed budget', body: '' },
    ],
    notes: 'Submitted after dev grant outcome.',
  },
  {
    id: 'app-eu-media',
    name: 'EU MEDIA Single project development',
    funder: 'Creative Europe MEDIA',
    deadline: '2027-04-15',
    status: 'planning',
    amountK: 50,
    draftSections: [
      { id: 'lf-app3-1', label: 'European dimension', body: '' },
      { id: 'lf-app3-2', label: 'Treatment', body: '' },
      { id: 'lf-app3-3', label: 'Strategy', body: '' },
      { id: 'lf-app3-4', label: 'Financing plan', body: '' },
    ],
    notes: 'Tougher application — needs EU partner.',
  },
  {
    id: 'app-hrt',
    name: 'HRT co-production',
    funder: 'HRT (Croatian Radiotelevision)',
    deadline: '2026-07-15',
    status: 'planning',
    amountK: 70,
    draftSections: [
      { id: 'lf-app4-1', label: 'Letter of intent', body: '' },
      { id: 'lf-app4-2', label: 'Show pitch', body: '' },
      { id: 'lf-app4-3', label: 'Slot proposal', body: '' },
    ],
    notes: '',
  },
  {
    id: 'app-fic',
    name: 'Filming in Croatia rebate',
    funder: 'HAVC · Filming in Croatia programme',
    deadline: '2026-09-01',
    status: 'planning',
    amountK: 100,
    draftSections: [
      { id: 'lf-app5-1', label: 'Qualifying spend breakdown', body: '' },
      { id: 'lf-app5-2', label: 'Cultural test', body: '' },
      { id: 'lf-app5-3', label: 'Production schedule', body: '' },
    ],
    notes: 'Auto-rebate at 25–30%. Computed against qualifying spend.',
  },
];

/* ---------- Splash epigraph ---------- */

export const HEKTOROVIC_EPIGRAPH = {
  line: '— po Hektoroviću · 1568',
  attribution: 'after Hektorović · Ribanje i ribarsko prigovaranje',
};

/* ---------- Phase 9 — Production demo seeds ---------- */
/* Pre-seeded scenes + shots so the Production module reads alive on the
   boat trip demo. The team will edit / add / refine on the boat. */

export const SEED_SCENES: Scene[] = [
  /* Episode 1 — Lov */
  { id: 'sc-1-1', episodeId: 'ep1', label: 'Departure from Dubrovnik', slug: 'departure', dayIdx: 0 },
  { id: 'sc-1-2', episodeId: 'ep1', label: 'First haul · Mljet',       slug: 'first-haul', dayIdx: 1 },
  /* Episode 2 — Vjetar */
  { id: 'sc-2-1', episodeId: 'ep2', label: 'Crossing to Palagruža',    slug: 'crossing',   dayIdx: 8 },
  { id: 'sc-2-2', episodeId: 'ep2', label: 'Lighthouse keeper',        slug: 'keeper',     dayIdx: 8 },
  /* Episode 3 — Kamen */
  { id: 'sc-3-1', episodeId: 'ep3', label: 'Stone walls · Lavsa',      slug: 'walls',      dayIdx: 11 },
  { id: 'sc-3-2', episodeId: 'ep3', label: 'Abandoned konobe',         slug: 'konobe',     dayIdx: 12 },
  /* Episode 4 — Sol */
  { id: 'sc-4-1', episodeId: 'ep4', label: 'Salt traditions · Silba',  slug: 'salt',       dayIdx: 18 },
  { id: 'sc-4-2', episodeId: 'ep4', label: 'Solo fishing · Olib',      slug: 'olib-fish',  dayIdx: 16 },
  /* Episode 5 — Glas */
  { id: 'sc-5-1', episodeId: 'ep5', label: 'Klapa session · Mali Lošinj', slug: 'klapa',   dayIdx: 21 },
  { id: 'sc-5-2', episodeId: 'ep5', label: 'Susak · women in dress',   slug: 'susak',      dayIdx: 22 },
  /* Episode 6 — Povratak */
  { id: 'sc-6-1', episodeId: 'ep6', label: 'Brijuni return',           slug: 'return',     dayIdx: 25 },
  { id: 'sc-6-2', episodeId: 'ep6', label: 'Closing · crew dinner',    slug: 'dinner',     dayIdx: 29 },
];

export const SEED_SHOTS: Shot[] = [
  /* 1.1 Departure */
  { id: 'sh-1-1-1', episodeId: 'ep1', sceneId: 'sc-1-1', number: '1', description: 'Lines off the bollard · close on knot release',         cameraSlot: 'A',     framing: 'ECU', movement: 'static',   audioPlan: 'ambient', operator: 'c2', durationEstMin: 1, status: 'planned' },
  { id: 'sh-1-1-2', episodeId: 'ep1', sceneId: 'sc-1-1', number: '2', description: 'Ivan at the helm · old town receding behind',           cameraSlot: 'A',     framing: 'MS',  movement: 'handheld', audioPlan: 'lav',     operator: 'c2', durationEstMin: 2, status: 'planned' },
  { id: 'sh-1-1-3', episodeId: 'ep1', sceneId: 'sc-1-1', number: '3', description: 'Drone wide · boat clearing harbour mouth',              cameraSlot: 'drone', framing: 'EWS', movement: 'drone',    audioPlan: 'MOS',     operator: 'c2', durationEstMin: 1, status: 'planned' },
  /* 1.2 First haul */
  { id: 'sh-1-2-1', episodeId: 'ep1', sceneId: 'sc-1-2', number: '1', description: 'Hands on net · pull · weight in the hands',             cameraSlot: 'A',     framing: 'MCU', movement: 'handheld', audioPlan: 'boom+lav', operator: 'c2', durationEstMin: 3, status: 'planned' },
  { id: 'sh-1-2-2', episodeId: 'ep1', sceneId: 'sc-1-2', number: '2', description: 'Fish in the net · silver against the morning',          cameraSlot: 'B',     framing: 'CU',  movement: 'static',   audioPlan: 'wild',     operator: 'c2', durationEstMin: 2, status: 'planned' },
  { id: 'sh-1-2-3', episodeId: 'ep1', sceneId: 'sc-1-2', number: '3', description: 'Catch presentation to Ivan · half-laughing',           cameraSlot: 'A',     framing: 'MS',  movement: 'handheld', audioPlan: 'boom+lav', operator: 'c2', durationEstMin: 2, status: 'planned' },
  /* 2.1 Crossing */
  { id: 'sh-2-1-1', episodeId: 'ep2', sceneId: 'sc-2-1', number: '1', description: 'Spray on the bow · slow-motion emphasis',               cameraSlot: 'A',     framing: 'MS',  movement: 'handheld', audioPlan: 'wild',    operator: 'c2', durationEstMin: 2, status: 'planned' },
  { id: 'sh-2-1-2', episodeId: 'ep2', sceneId: 'sc-2-1', number: '2', description: "Compass needle · macro · crossing 16°20'",              cameraSlot: 'B',     framing: 'ECU', movement: 'static',   audioPlan: 'ambient', operator: 'c2', durationEstMin: 1, status: 'planned' },
  { id: 'sh-2-1-3', episodeId: 'ep2', sceneId: 'sc-2-1', number: '3', description: 'Open sea · drone reveal · only Palagruža in frame',    cameraSlot: 'drone', framing: 'EWS', movement: 'drone',    audioPlan: 'MOS',     operator: 'c2', durationEstMin: 1, status: 'planned' },
  /* 2.2 Keeper */
  { id: 'sh-2-2-1', episodeId: 'ep2', sceneId: 'sc-2-2', number: '1', description: 'Keeper at the door · wind in the cypresses',           cameraSlot: 'A',     framing: 'MS',  movement: 'static',   audioPlan: 'lav',     operator: 'c2', durationEstMin: 3, status: 'planned' },
  { id: 'sh-2-2-2', episodeId: 'ep2', sceneId: 'sc-2-2', number: '2', description: 'Hands turning the manual lens crank',                  cameraSlot: 'B',     framing: 'MCU', movement: 'handheld', audioPlan: 'boom',    operator: 'c2', durationEstMin: 2, status: 'planned' },
  { id: 'sh-2-2-3', episodeId: 'ep2', sceneId: 'sc-2-2', number: '3', description: 'Lighthouse exterior · golden hour · solitude',         cameraSlot: 'A',     framing: 'WS',  movement: 'static',   audioPlan: 'ambient', operator: 'c2', durationEstMin: 1, status: 'planned' },
  /* 3.1 Stone walls */
  { id: 'sh-3-1-1', episodeId: 'ep3', sceneId: 'sc-3-1', number: '1', description: 'Terraced walls · drone descending along the slope',    cameraSlot: 'drone', framing: 'WS',  movement: 'drone',    audioPlan: 'MOS',     operator: 'c2', durationEstMin: 2, status: 'captured' },
  { id: 'sh-3-1-2', episodeId: 'ep3', sceneId: 'sc-3-1', number: '2', description: 'Stone joinery · macro · centuries-old fit',            cameraSlot: 'A',     framing: 'MCU', movement: 'static',   audioPlan: 'wild',    operator: 'c2', durationEstMin: 1, status: 'captured' },
  { id: 'sh-3-1-3', episodeId: 'ep3', sceneId: 'sc-3-1', number: '3', description: 'Ivan walking the wall · contemplative',                cameraSlot: 'A',     framing: 'MS',  movement: 'trinity',  audioPlan: 'lav',     operator: 'c2', durationEstMin: 3, status: 'captured' },
  /* 3.2 Konobe */
  { id: 'sh-3-2-1', episodeId: 'ep3', sceneId: 'sc-3-2', number: '1', description: 'Interior · wide · light through closed shutters',      cameraSlot: 'A',     framing: 'WS',  movement: 'static',   audioPlan: 'ambient', operator: 'c2', durationEstMin: 2, status: 'planned' },
  { id: 'sh-3-2-2', episodeId: 'ep3', sceneId: 'sc-3-2', number: '2', description: 'Door hinge · rust · close',                            cameraSlot: 'B',     framing: 'ECU', movement: 'static',   audioPlan: 'wild',    operator: 'c2', durationEstMin: 1, status: 'planned' },
  { id: 'sh-3-2-3', episodeId: 'ep3', sceneId: 'sc-3-2', number: '3', description: 'Rene tasting old bottle · disbelief into laughter',    cameraSlot: 'A',     framing: 'MS',  movement: 'handheld', audioPlan: 'boom+lav', operator: 'c2', durationEstMin: 4, status: 'planned' },
  /* 4.1 Salt */
  { id: 'sh-4-1-1', episodeId: 'ep4', sceneId: 'sc-4-1', number: '1', description: 'Hands working salt into rough piles',                  cameraSlot: 'A',     framing: 'CU',  movement: 'static',   audioPlan: 'wild',    operator: 'c2', durationEstMin: 2, status: 'planned' },
  { id: 'sh-4-1-2', episodeId: 'ep4', sceneId: 'sc-4-1', number: '2', description: 'Elderly woman at table · she explains in dialect',     cameraSlot: 'A',     framing: 'MS',  movement: 'static',   audioPlan: 'lav',     operator: 'c2', durationEstMin: 5, status: 'planned' },
  { id: 'sh-4-1-3', episodeId: 'ep4', sceneId: 'sc-4-1', number: '3', description: 'Shore at dusk · salt pans · the colour goes',          cameraSlot: 'A',     framing: 'WS',  movement: 'static',   audioPlan: 'ambient', operator: 'c2', durationEstMin: 1, status: 'planned' },
  /* 4.2 Olib fishing */
  { id: 'sh-4-2-1', episodeId: 'ep4', sceneId: 'sc-4-2', number: '1', description: 'Bay wide · single boat in centre frame',               cameraSlot: 'A',     framing: 'WS',  movement: 'static',   audioPlan: 'ambient', operator: 'c2', durationEstMin: 1, status: 'planned' },
  { id: 'sh-4-2-2', episodeId: 'ep4', sceneId: 'sc-4-2', number: '2', description: 'Solo casting · concentration',                          cameraSlot: 'A',     framing: 'MCU', movement: 'handheld', audioPlan: 'boom',    operator: 'c2', durationEstMin: 2, status: 'planned' },
  { id: 'sh-4-2-3', episodeId: 'ep4', sceneId: 'sc-4-2', number: '3', description: 'Rod bending · the strike',                             cameraSlot: 'B',     framing: 'CU',  movement: 'static',   audioPlan: 'wild',    operator: 'c2', durationEstMin: 1, status: 'planned' },
  /* 5.1 Klapa */
  { id: 'sh-5-1-1', episodeId: 'ep5', sceneId: 'sc-5-1', number: '1', description: 'Klapa group on the konoba terrace · wide',             cameraSlot: 'A',     framing: 'WS',  movement: 'static',   audioPlan: 'boom+lav', operator: 'c2', durationEstMin: 4, status: 'planned' },
  { id: 'sh-5-1-2', episodeId: 'ep5', sceneId: 'sc-5-1', number: '2', description: 'Mouths singing · breath · the close vowels',           cameraSlot: 'B',     framing: 'CU',  movement: 'static',   audioPlan: 'lav',     operator: 'c2', durationEstMin: 3, status: 'planned' },
  { id: 'sh-5-1-3', episodeId: 'ep5', sceneId: 'sc-5-1', number: '3', description: 'Audience listening · old men remembering',             cameraSlot: 'A',     framing: 'MS',  movement: 'handheld', audioPlan: 'ambient', operator: 'c2', durationEstMin: 2, status: 'planned' },
  /* 5.2 Susak */
  { id: 'sh-5-2-1', episodeId: 'ep5', sceneId: 'sc-5-2', number: '1', description: 'Women in traditional dress walking sandy path',        cameraSlot: 'A',     framing: 'MS',  movement: 'static',   audioPlan: 'ambient', operator: 'c2', durationEstMin: 3, status: 'planned' },
  { id: 'sh-5-2-2', episodeId: 'ep5', sceneId: 'sc-5-2', number: '2', description: 'Embroidery · close on hands and thread',               cameraSlot: 'B',     framing: 'ECU', movement: 'static',   audioPlan: 'wild',    operator: 'c2', durationEstMin: 2, status: 'planned' },
  { id: 'sh-5-2-3', episodeId: 'ep5', sceneId: 'sc-5-2', number: '3', description: 'Sandy island wide · footprints in late light',         cameraSlot: 'A',     framing: 'WS',  movement: 'static',   audioPlan: 'ambient', operator: 'c2', durationEstMin: 1, status: 'planned' },
  /* 6.1 Brijuni */
  { id: 'sh-6-1-1', episodeId: 'ep6', sceneId: 'sc-6-1', number: '1', description: 'Approaching Brijuni · drone wide · the closing horizon', cameraSlot: 'drone', framing: 'EWS', movement: 'drone',  audioPlan: 'MOS',     operator: 'c2', durationEstMin: 2, status: 'planned' },
  { id: 'sh-6-1-2', episodeId: 'ep6', sceneId: 'sc-6-1', number: '2', description: 'Ivan reading the letter · paper in his hands',         cameraSlot: 'A',     framing: 'MCU', movement: 'static',   audioPlan: 'lav',     operator: 'c2', durationEstMin: 4, status: 'planned' },
  { id: 'sh-6-1-3', episodeId: 'ep6', sceneId: 'sc-6-1', number: '3', description: 'Wax seal · the verse closing',                         cameraSlot: 'B',     framing: 'ECU', movement: 'static',   audioPlan: 'wild',    operator: 'c2', durationEstMin: 1, status: 'planned' },
  /* 6.2 Dinner */
  { id: 'sh-6-2-1', episodeId: 'ep6', sceneId: 'sc-6-2', number: '1', description: 'Crew dinner around long table · wide',                 cameraSlot: 'A',     framing: 'WS',  movement: 'static',   audioPlan: 'boom+lav', operator: 'c2', durationEstMin: 5, status: 'planned' },
  { id: 'sh-6-2-2', episodeId: 'ep6', sceneId: 'sc-6-2', number: '2', description: 'Wine glasses clinking · the moment of recognition',    cameraSlot: 'A',     framing: 'CU',  movement: 'static',   audioPlan: 'wild',    operator: 'c2', durationEstMin: 1, status: 'planned' },
  { id: 'sh-6-2-3', episodeId: 'ep6', sceneId: 'sc-6-2', number: '3', description: 'Sunset over Istra · final wide · letterbox',           cameraSlot: 'A',     framing: 'EWS', movement: 'static',   audioPlan: 'ambient', operator: 'c2', durationEstMin: 2, status: 'planned' },
];

export const SEED_WALKIE_CHANNELS: WalkieChannel[] = [
  { id: 'w-c1', crewId: 'c1', primary: '1',  backup: '2'  }, // Tomo
  { id: 'w-c2', crewId: 'c2', primary: '3',  backup: '4'  }, // Tom
  { id: 'w-c3', crewId: 'c3', primary: '5',  backup: '6'  }, // Ivan
  { id: 'w-c4', crewId: 'c4', primary: '7',  backup: '8'  }, // Rene
  { id: 'w-c6', crewId: 'c6', primary: '11', backup: '12' }, // Captain
];

/* Sample wrap entries — yesterday + today, so the Wrap log reads alive
   and the Production demo has variance to look at. */
export const SEED_WRAP_ENTRIES: WrapEntry[] = [
  {
    id: 'wrap-d10',
    date: '2026-10-10',
    whatWorked: 'Vis town to Komiža in clean morning. Klapa rehearsal in the konoba — incredible texture for ambient bed. Ivan natural in the falkuša conversation.',
    whatDidnt: 'Lost two hours to a charter boat parked over our planned anchor swing. Had to repo to the second pin.',
    tomorrowTweaks: 'Lock the prime anchorage by 06:30 tomorrow. Brief Tom on the alternate framing if we lose the Vis town silhouette.',
    moodMarks: { c1: 'good', c2: 'good', c3: 'great', c4: 'great', c5: 'good', c6: 'ok' },
    hoursRolled: 7.0,
    variance: 'Anchorage shift mid-day; on schedule.',
  },
  {
    id: 'wrap-d11',
    date: '2026-10-11',
    whatWorked: "Drone over the terraced walls in clean morning light. Ivan walked the wall in one take. Tom's LogC + low-contrast LUT held all the stone tone.",
    whatDidnt: "RF interference on the lav after 11am — likely a charter boat in the bay running on overlapping freq. Crashed audio on scene 3.1 shot 3.",
    tomorrowTweaks: 'Move first call to 06:30 to catch konobe interior before sun gets harsh. Swap to MKH-50 boom on scene 3.2 — boom only, drop the lavs.',
    moodMarks: { c1: 'good', c2: 'great', c3: 'good', c4: 'great', c5: 'rough', c6: 'good' },
    hoursRolled: 8.5,
    variance: 'Anchorage held; on schedule.',
  },
];

/* Sample boat ops day — today (Day 12) so the Boat ops tab has data
   when Tomo demos the preview-day picker on 2026-10-12. */
export const SEED_BOAT_OPS_DAYS: BoatOpsDay[] = [
  {
    id: 'bo-d12',
    date: '2026-10-12',
    anchorageId: 'loc-lavsa',
    fuelPct: 78,
    waterPct: 62,
    provisionsPct: 71,
    skipperId: 'c6',
    watchRotation: '00–04 captain · 04–08 Tomo · 08–12 DOP',
    weatherNotes: 'Clear morning, NW 8kn forecast climbing to 14kn by 14:00. Good window 06:30–11:00.',
    windDir: 'NW 8kn → 14kn pm',
    seaStateM: 0.8,
  },
];

/* Sample safety day — partial completion so the demo shows the live state. */
export const SEED_SAFETY_DAYS: SafetyDay[] = [
  {
    id: 'safety-d12',
    date: '2026-10-12',
    lifeVestsIssued: true,
    weatherChecked: true,
    mobDrillScheduled: false,
    commsOK: false,
    briefingComplete: false,
    notes: 'RF check pending — operator swapping to backup channel.',
  },
];

/* ---------- Distribution seeds (Phase 9 Tier B) ---------- */

export const SEED_SALES_AGENTS: SalesAgent[] = [
  { id: 'sa-submarine',  name: 'Submarine',          territories: ['North America', 'Worldwide'], catalogHighlights: 'Strong doc track record · The Square, Honeyland', docTrackRecord: 'Sundance + Oscar pipeline.', fitScore: 5, status: 'target', notes: 'High prestige · selective.' },
  { id: 'sa-cinetic',    name: 'Cinetic Media',      territories: ['North America'], catalogHighlights: 'Indie + doc · CITIZENFOUR, RBG', fitScore: 5, status: 'target' },
  { id: 'sa-dogwoof',    name: 'Dogwoof',            territories: ['UK', 'Europe', 'Worldwide'], catalogHighlights: 'Doc-only specialist · The Cove, Blackfish', docTrackRecord: 'EU + UK festival doc anchor.', fitScore: 5, status: 'target', notes: 'Strong fit for cultural doc.' },
  { id: 'sa-cinephil',   name: 'Cinephil',           territories: ['Europe', 'Israel', 'Worldwide'], catalogHighlights: 'IDFA-aligned · The Gatekeepers', fitScore: 4, status: 'target' },
  { id: 'sa-lightdox',   name: 'Lightdox',           territories: ['Europe'], catalogHighlights: 'Independent · documentary-focused', fitScore: 4, status: 'target' },
  { id: 'sa-films-bout', name: 'Films Boutique',     territories: ['Worldwide'], catalogHighlights: 'Award-track · Berlinale alumni', fitScore: 4, status: 'target' },
  { id: 'sa-autlook',    name: 'Autlook Filmsales',  territories: ['Worldwide'], catalogHighlights: 'Doc specialist · Vienna-based', fitScore: 4, status: 'target' },
  { id: 'sa-metfilm',    name: 'MetFilm Sales',      territories: ['UK', 'Worldwide'], catalogHighlights: 'Doc + indie · Sheffield-aligned', fitScore: 3, status: 'target' },
  { id: 'sa-cargo',      name: 'Cargo Film & Releasing', territories: ['North America'], catalogHighlights: 'Boutique theatrical · POV pipeline', fitScore: 3, status: 'target' },
  { id: 'sa-wide-mgmt',  name: 'Wide Management',    territories: ['Worldwide'], catalogHighlights: 'Doc + arthouse · Paris-based', fitScore: 3, status: 'target' },
];

export const SEED_BROADCASTERS: Broadcaster[] = [
  /* Tier 1 — strategic anchors */
  { id: 'bc-hrt',    name: 'HRT',                country: 'Croatia',     slot: 'mixed',       docStrand: 'HRT 3 doc strand', acquisitions: 'Acquisitions desk via funding deck',                       pastCroatian: 'Default home broadcaster', fitScore: 5, status: 'target', notes: 'National anchor. Funding line tied here.' },
  { id: 'bc-arte',   name: 'ARTE / 3sat',        country: 'France/DE',   slot: 'prime',       docStrand: 'La Lucarne · Themas',                                                                       pastCroatian: 'Selective European doc',   fitScore: 5, status: 'target', notes: 'Cultural prestige + EU MEDIA aligned.' },
  { id: 'bc-bbc',    name: 'BBC Storyville',     country: 'UK',          slot: 'late-night',  docStrand: 'Storyville · BBC Four',                                                                     pastCroatian: 'Has acquired Balkan docs',  fitScore: 5, status: 'target', notes: 'English-language anchor.' },
  { id: 'bc-zdf',    name: 'ZDF / 3sat Doku',    country: 'Germany',     slot: 'prime',       docStrand: 'kleines Fernsehspiel · 37°',                                                                fitScore: 4, status: 'target' },
  /* Tier 2 — Nordic + central + south European doc strands */
  { id: 'bc-yle',    name: 'Yle (FI)',           country: 'Finland',     slot: 'streaming',   docStrand: 'Yle Areena docs',     fitScore: 3, status: 'target' },
  { id: 'bc-dr2',    name: 'DR2 / DR Doks',      country: 'Denmark',     slot: 'late-night',  docStrand: 'DR Doks',             fitScore: 3, status: 'target' },
  { id: 'bc-nrk',    name: 'NRK Brennpunkt',     country: 'Norway',      slot: 'prime',                                          fitScore: 3, status: 'target' },
  { id: 'bc-svt',    name: 'SVT Dokument',       country: 'Sweden',      slot: 'prime',                                          fitScore: 3, status: 'target' },
  { id: 'bc-czech',  name: 'Czech TV / ČT2',     country: 'Czech Rep.',  slot: 'mixed',                                          fitScore: 3, status: 'target' },
  { id: 'bc-rts',    name: 'RTS Doc',            country: 'Switzerland', slot: 'mixed',                                          fitScore: 3, status: 'target' },
  { id: 'bc-aljaz',  name: 'Al Jazeera Balkans', country: 'Qatar/HR',    slot: 'mixed',                                          fitScore: 4, status: 'target', notes: 'Regional reach across former Yugoslavia.' },
  /* Tier 3 — North American + streaming + premium */
  { id: 'bc-pov',    name: 'POV (PBS)',          country: 'USA',         slot: 'late-night',  docStrand: 'POV',                 fitScore: 3, status: 'target' },
  { id: 'bc-cbc',    name: 'CBC POV',            country: 'Canada',      slot: 'late-night',                                     fitScore: 3, status: 'target' },
  { id: 'bc-abc-au', name: 'ABC iview',          country: 'Australia',   slot: 'streaming',                                      fitScore: 2, status: 'target' },
  { id: 'bc-hot',    name: 'Hot Docs Channel',   country: 'Canada',      slot: 'streaming',                                      fitScore: 3, status: 'target' },
  { id: 'bc-knowl',  name: 'Knowledge Network',  country: 'Canada',      slot: 'streaming',                                      fitScore: 2, status: 'target' },
  { id: 'bc-mubi',   name: 'MUBI',               country: 'Worldwide',   slot: 'streaming',                                      fitScore: 4, status: 'target', notes: 'Curated streaming · arthouse fit.' },
  { id: 'bc-dafilms',name: 'Dafilms',            country: 'Europe',      slot: 'streaming',   docStrand: 'European doc-only',   fitScore: 3, status: 'target' },
  { id: 'bc-curzon', name: 'Curzon',             country: 'UK',          slot: 'streaming',                                      fitScore: 3, status: 'target' },
  { id: 'bc-apple',  name: 'Apple TV+',          country: 'Worldwide',   slot: 'streaming',                                      fitScore: 2, status: 'target', notes: 'Premium tier · highly selective.' },
  { id: 'bc-netflix',name: 'Netflix',            country: 'Worldwide',   slot: 'streaming',                                      fitScore: 2, status: 'target', notes: 'Selective for European doc.' },
  { id: 'bc-amazon', name: 'Amazon / Prime',     country: 'Worldwide',   slot: 'streaming',                                      fitScore: 2, status: 'target' },
  { id: 'bc-sky',    name: 'Sky Documentaries',  country: 'UK/EU',       slot: 'mixed',                                          fitScore: 3, status: 'target' },
  { id: 'bc-rai',    name: 'Rai 3 Doc',          country: 'Italy',       slot: 'late-night',                                     fitScore: 3, status: 'target', notes: 'Adriatic neighbour reach.' },
  { id: 'bc-rtsi',   name: 'RTS / Slovenian TV', country: 'Slovenia',    slot: 'mixed',                                          fitScore: 4, status: 'target', notes: 'Regional cultural fit.' },
];

export const SEED_MARKET_EVENTS: MarketEvent[] = [
  { id: 'me-cphdox',  name: 'CPH:DOX Forum',           city: 'Copenhagen',  dates: 'March 2027',     applicationDeadline: '2026-12-15', cost: '~€500',  fit: 'European co-pro · arthouse + cultural docs',          status: 'target' },
  { id: 'me-sunny',   name: 'Sunny Side of the Doc',  city: 'La Rochelle', dates: 'June 2027',      applicationDeadline: '2027-03-15', cost: '~€650',  fit: 'EU buyers · pitch-friendly format',                   status: 'target' },
  { id: 'me-mipdoc',  name: 'MIPDOC',                  city: 'Cannes',      dates: 'April 2027',     applicationDeadline: '2027-02-01', cost: '~€800',  fit: 'TV broadcaster acquisitions',                          status: 'target' },
  { id: 'me-idfa',    name: 'IDFA Forum',              city: 'Amsterdam',   dates: 'November 2026',  applicationDeadline: '2026-09-01', cost: '~€450',  fit: 'World-class doc forum · pitch + co-pro',              status: 'target', notes: 'Late application possible — file before shoot wrap.' },
  { id: 'me-sheff',   name: 'Sheffield MeetMarket',    city: 'Sheffield',   dates: 'June 2027',      applicationDeadline: '2027-03-30', cost: '~€350',  fit: 'UK + EU broadcasters · documentary-focused',          status: 'target' },
  { id: 'me-leipzig', name: 'DOK Leipzig Co-Pro',      city: 'Leipzig',     dates: 'October 2027',   applicationDeadline: '2027-07-15', cost: '~€400',  fit: 'Central + Eastern European focus',                    status: 'target' },
  { id: 'me-east-doc',name: 'East Doc Platform',       city: 'Prague',      dates: 'March 2027',     applicationDeadline: '2026-12-01', cost: '~€300',  fit: 'Eastern European cultural doc · strong regional fit', status: 'target', notes: 'Strong fit · file early.' },
  { id: 'me-docsbcn', name: 'DocsBarcelona',           city: 'Barcelona',   dates: 'May 2027',       applicationDeadline: '2027-02-15', cost: '~€350',  fit: 'Mediterranean focus · pitching forum',                status: 'target' },
  { id: 'me-vdr',     name: 'Visions du Réel Pitching', city: 'Nyon',       dates: 'April 2027',     applicationDeadline: '2027-01-15', cost: '~€400',  fit: 'Swiss arthouse · cultural anthropology',              status: 'target' },
];

/* ---------- Marketing seeds (Phase 9 Tier B) ---------- */

export const SEED_TRAILER_CUTS: TrailerCut[] = [
  { id: 'tr-30',  format: 'teaser-30',  label: '30-second teaser',  audience: 'social cold start',           beats: ['Departure shot', 'First haul', 'Sunset over Istra'], status: 'planned' },
  { id: 'tr-60',  format: 'teaser-60',  label: '60-second teaser',  audience: 'press + festival announce',   beats: ['Departure', 'Klapa fragment', 'Stone walls', 'Letter delivered'], status: 'planned' },
  { id: 'tr-90',  format: 'trailer-90', label: '90-second trailer', audience: 'distribution + buyers',       beats: ['Voyage frame', 'Hektorović verse fragment', 'Catch in hand', 'Sunset wide'], status: 'planned' },
  { id: 'tr-120', format: 'trailer-120',label: '2-minute trailer',  audience: 'broadcaster pitch',           beats: ['Full voyage arc', 'Klapa', 'Elder dialogue', 'Crew dinner', 'Closing'], status: 'planned' },
  { id: 'tr-vert',format: 'social-9-16',label: 'Vertical 30s · social',     audience: 'IG Reels · TikTok',   beats: ['Spray on bow', 'Catch close-up', 'Sunset'], status: 'planned' },
  { id: 'tr-sq',  format: 'social-1-1', label: 'Square 30s · social',       audience: 'IG feed · LinkedIn',  beats: ['Hands working', 'Stone walls', 'Klapa'], status: 'planned' },
];

export const SEED_PRESS_CONTACTS: PressContact[] = [
  { id: 'pc-variety',     name: 'Variety',           outlet: 'Variety',            territory: 'USA / Worldwide', beat: 'Film + doc',          status: 'cold' },
  { id: 'pc-screen',      name: 'Screen Daily',      outlet: 'Screen Daily',       territory: 'UK / Worldwide',  beat: 'Film industry',       status: 'cold' },
  { id: 'pc-indiewire',   name: 'IndieWire',         outlet: 'IndieWire',          territory: 'USA',             beat: 'Indie + doc',         status: 'cold' },
  { id: 'pc-cineuropa',   name: 'Cineuropa',         outlet: 'Cineuropa',          territory: 'EU',              beat: 'European film',       status: 'cold' },
  { id: 'pc-cahiers',     name: 'Cahiers du Cinéma', outlet: 'Cahiers',            territory: 'France',          beat: 'Cinema criticism',    status: 'cold' },
  { id: 'pc-sight',       name: 'Sight & Sound',     outlet: 'Sight & Sound',      territory: 'UK',              beat: 'Cinema criticism',    status: 'cold' },
  { id: 'pc-mtr',         name: 'Modern Times Review', outlet: 'Modern Times Review', territory: 'EU',           beat: 'Documentary',         status: 'cold' },
  { id: 'pc-pov',         name: 'POV Magazine',      outlet: 'POV Magazine',       territory: 'Canada',          beat: 'Documentary',         status: 'cold' },
  { id: 'pc-doc-mag',     name: 'Documentary Magazine', outlet: 'IDA Documentary', territory: 'USA',             beat: 'Documentary',         status: 'cold' },
  { id: 'pc-jutarnji',    name: 'Jutarnji list',     outlet: 'Jutarnji list',      territory: 'Croatia',         beat: 'Cultural · film',     status: 'cold' },
  { id: 'pc-24sata',      name: '24sata',            outlet: '24sata',             territory: 'Croatia',         beat: 'Mainstream + culture', status: 'cold' },
  { id: 'pc-telegram',    name: 'Telegram.hr',       outlet: 'Telegram',           territory: 'Croatia',         beat: 'Long-form cultural',   status: 'cold' },
  { id: 'pc-tportal',     name: 'tportal.hr',        outlet: 'tportal',            territory: 'Croatia',         beat: 'Cultural',             status: 'cold' },
];

/* ---------- Post-production seeds (Phase 9 Tier B) ---------- */
/* Cross-episode editorial arc — 8 phases from wrap to print master,
   roughly Nov 2026 → Jul 2027. Per-episode milestones can be added later. */

export const SEED_EDIT_MILESTONES: EditMilestone[] = [
  { id: 'em-assembly', episodeId: 'all', phase: 'assembly',     targetDate: '2026-11-15', status: 'pending', notes: 'Editor sorts footage by episode → scene → take. First viewing.' },
  { id: 'em-rough',    episodeId: 'all', phase: 'rough-cut',    targetDate: '2026-12-15', status: 'pending', notes: 'First assembly cut. ~75 min per episode. Story arc visible.' },
  { id: 'em-fine',     episodeId: 'all', phase: 'fine-cut',     targetDate: '2027-02-15', status: 'pending', notes: 'Trim to runtime · scene order locked · voice-over recorded if any.' },
  { id: 'em-lock',     episodeId: 'all', phase: 'picture-lock', targetDate: '2027-03-15', status: 'pending', notes: 'No more picture changes from this point.' },
  { id: 'em-online',   episodeId: 'all', phase: 'online',       targetDate: '2027-04-01', status: 'pending', notes: 'Conform from offline · titles · graphics · transitions.' },
  { id: 'em-color',    episodeId: 'all', phase: 'color',        targetDate: '2027-05-01', status: 'pending', notes: 'LogC3 → Rec.709 grade · custom film print emulation per Tom\'s look.' },
  { id: 'em-mix',      episodeId: 'all', phase: 'sound-mix',    targetDate: '2027-06-01', status: 'pending', notes: '5.1 + stereo · M&E (music + effects) for foreign dubs.' },
  { id: 'em-master',   episodeId: 'all', phase: 'print-master', targetDate: '2027-07-01', status: 'pending', notes: 'All deliverables · per-buyer specs · QC pass.' },
];

/* Subtitle tracks — 6 episodes × 2 base languages (HR + EN). DE/FR added if ARTE picks up. */
export const SEED_SUBTITLE_TRACKS: SubtitleTrack[] = [
  { id: 'st-1-hr', episodeId: 'ep1', language: 'HR', status: 'not-started', format: 'SRT' },
  { id: 'st-1-en', episodeId: 'ep1', language: 'EN', status: 'not-started', format: 'SRT' },
  { id: 'st-2-hr', episodeId: 'ep2', language: 'HR', status: 'not-started', format: 'SRT' },
  { id: 'st-2-en', episodeId: 'ep2', language: 'EN', status: 'not-started', format: 'SRT' },
  { id: 'st-3-hr', episodeId: 'ep3', language: 'HR', status: 'not-started', format: 'SRT' },
  { id: 'st-3-en', episodeId: 'ep3', language: 'EN', status: 'not-started', format: 'SRT' },
  { id: 'st-4-hr', episodeId: 'ep4', language: 'HR', status: 'not-started', format: 'SRT' },
  { id: 'st-4-en', episodeId: 'ep4', language: 'EN', status: 'not-started', format: 'SRT' },
  { id: 'st-5-hr', episodeId: 'ep5', language: 'HR', status: 'not-started', format: 'SRT' },
  { id: 'st-5-en', episodeId: 'ep5', language: 'EN', status: 'not-started', format: 'SRT' },
  { id: 'st-6-hr', episodeId: 'ep6', language: 'HR', status: 'not-started', format: 'SRT' },
  { id: 'st-6-en', episodeId: 'ep6', language: 'EN', status: 'not-started', format: 'SRT' },
];

/* Deliverable specs — three target buyers seeded with real-world tech specs. */
export const SEED_DELIVERABLE_SPECS: DeliverableSpec[] = [
  {
    id: 'ds-hrt',
    buyer: 'HRT',
    format: 'ProRes 422 HQ',
    resolution: '1920×1080',
    framerate: '25p',
    audioFormat: 'stereo 24-bit 48k + 5.1 24-bit 48k',
    subtitleFormat: 'SRT (HR original + EN subtitle)',
    metadata: 'XML slate · HRT-spec',
    notes: 'National broadcaster · Croatian-language original. Delivery slot tied to HRT funding line.',
  },
  {
    id: 'ds-bbc',
    buyer: 'BBC Storyville',
    format: 'ProRes 422 HQ',
    resolution: '1920×1080',
    framerate: '23.976p',
    audioFormat: '5.1 24-bit 48k + stereo M&E',
    subtitleFormat: 'TTML SDH (English)',
    metadata: 'XML BBC-spec',
    notes: 'M&E (music + effects) track required for dub. Captions SDH per BBC AS-11.',
  },
  {
    id: 'ds-arte',
    buyer: 'ARTE / 3sat',
    format: 'ProRes 422 HQ',
    resolution: '1920×1080',
    framerate: '25p',
    audioFormat: '5.1 24-bit 48k + stereo + M&E',
    subtitleFormat: 'TTML SDH (DE + FR + EN)',
    metadata: 'EBU XML',
    notes: 'ARTE/ZDF dual-strand. DE + FR dubs likely commissioned. EBU subtitle spec.',
  },
];

/* ---------- Research seeds (Phase 9 Tier C) ---------- */

export const SEED_RESEARCH_SOURCES: ResearchSource[] = [
  {
    id: 'rs-hektorovic-1568',
    type: 'book',
    title: 'Ribanje i ribarsko prigovaranje',
    author: 'Petar Hektorović',
    year: 1568,
    summary:
      'The 1568 first edition. A travel poem in three days · Hvar fishermen + Hektorović in dialogue across Adriatic islands. The source text for the show.',
    whyItMatters:
      'The poem we are responding to. Every episode echoes a fragment of Hektorović\'s 1568 voyage.',
    notes: 'Petrarchan stanza form · ekavian-ikavian-čakavian mix · the first vernacular Croatian travel poem.',
  },
  {
    id: 'rs-marulic-context',
    type: 'paper',
    title: 'Marulić, Hektorović, and Dalmatian Humanism',
    author: 'Various',
    year: 2015,
    summary:
      'Modern scholarly framing — Hektorović sits in the Dalmatian humanist tradition with Marulić, Petar Zoranić. Vernacular language as cultural anchor.',
    whyItMatters:
      'For Pitch + festival context — situate the show against Dalmatian humanism, not just a 16th-century voyage.',
  },
  {
    id: 'rs-fishing-tradition',
    type: 'book',
    title: 'Tradicijsko ribarstvo na Jadranu',
    author: 'Croatian Maritime Museum',
    year: 2008,
    summary:
      'Reference work on traditional Adriatic fishing techniques — falkuša craft of Komiža, line + spear + net traditions per region, seasonal calendars.',
    whyItMatters:
      'Background for catch-log accuracy. Falkuša + Komiža is a direct line into Episode 2 (Vjetar).',
  },
  {
    id: 'rs-vis-falkusa',
    type: 'archive',
    title: 'Falkuša regatta archive · Komiža',
    author: 'Komiža Maritime Heritage Society',
    summary:
      'The 1593 origin of the Komiža falkuša regatta — the historical race that defines Vis maritime culture.',
    whyItMatters:
      'Episode 2 anchor. May yield archival material if we can secure access during shoot.',
  },
  {
    id: 'rs-leviathan-castaing',
    type: 'film',
    title: 'Leviathan',
    author: 'Castaing-Taylor & Paravel',
    year: 2012,
    summary:
      'GoPros mounted on a New Bedford fishing trawler. Pure observational. No dialogue, no music for long stretches.',
    whyItMatters:
      'Touchstone for the observational fishing-doc tradition. Not the model — Ribanje is more cultural-essayistic — but a key reference point for Tom + the editor.',
  },
  {
    id: 'rs-fire-at-sea',
    type: 'film',
    title: 'Fire at Sea',
    author: 'Gianfranco Rosi',
    year: 2016,
    summary:
      'Lampedusa documentary blending fishing-island life with the migration crisis. Patient observation, italianate quiet.',
    whyItMatters:
      'Reference for slow rhythm + patience. The show should breathe like this in places.',
  },
];

export const SEED_PRODUCERS: Producer[] = [
  /* Wine — Croatian regional flagships, Rene Bakalović\'s territory */
  { id: 'pw-bibich',      kind: 'wine',  name: 'Bibich',          region: 'Skradin / Šibenik', flagship: 'Lučica · Debit + Lasin', willingFeature: 'reachable',  episodeId: 'ep3', notes: 'Rene knows the family. Top fit for Episode 3 / Kornati.' },
  { id: 'pw-korta',       kind: 'wine',  name: 'Korta Katarina',  region: 'Pelješac',          flagship: 'Plavac Mali Reuben',     willingFeature: 'unknown',    episodeId: 'ep1', notes: 'Premium Pelješac. Possible Episode 1 link.' },
  { id: 'pw-bire',        kind: 'wine',  name: 'Bire',            region: 'Korčula',           flagship: 'Pošip Smokvica',          willingFeature: 'unknown',    episodeId: 'ep1', notes: 'Pošip — the white that defines Korčula.' },
  { id: 'pw-krajancic',   kind: 'wine',  name: 'Krajančić',       region: 'Korčula',           flagship: 'Pošip Sur Lie',           willingFeature: 'unknown',    episodeId: 'ep1', notes: 'Natural-leaning · sur lie methods · island terroir.' },
  { id: 'pw-tomac',       kind: 'wine',  name: 'Tomac',           region: 'Plešivica',         flagship: 'Tomac Amfora',            willingFeature: 'unknown',    notes: 'Continental detour but landmark amphora wines.' },
  { id: 'pw-roxanich',    kind: 'wine',  name: 'Roxanich',        region: 'Istria · Motovun',  flagship: 'Antica Malvazija',        willingFeature: 'reachable',  episodeId: 'ep6', notes: 'Episode 6 / Istra · long-skin-contact flagbearer.' },
  { id: 'pw-kabola',      kind: 'wine',  name: 'Kabola',          region: 'Istria · Momjan',   flagship: 'Malvazija Amfora',        willingFeature: 'unknown',    episodeId: 'ep6', notes: 'Tall hilltop terraces · amphora program.' },
  /* Olive oil */
  { id: 'po-avantis',     kind: 'olive', name: 'Avantis',         region: 'Brač',              flagship: 'Brač Levantin · early harvest', willingFeature: 'unknown',    notes: 'Brač oil from native cultivars.' },
  { id: 'po-olynthia',    kind: 'olive', name: 'Olynthia',        region: 'Šolta',             flagship: 'Šoltanka EVOO',          willingFeature: 'unknown',    notes: 'Šolta. Award-circuit regular.' },
  { id: 'po-chiavalon',   kind: 'olive', name: 'Chiavalon',       region: 'Istria · Vodnjan',  flagship: 'Ex Albis EVOO',          willingFeature: 'reachable',  episodeId: 'ep6', notes: 'Istria flagship · Episode 6 candidate.' },
  { id: 'po-mate',        kind: 'olive', name: 'Mate',            region: 'Korčula',           flagship: 'Mate EVOO Korčula',      willingFeature: 'unknown',    episodeId: 'ep1', notes: 'Lumbarda olive groves.' },
];

/* ---------- Rig configurations (Phase 9 · Tom's vocabulary) ---------- */

export const SEED_RIG_CONFIGURATIONS: RigConfiguration[] = [
  {
    id: 'rig-falkusa',
    name: 'Falkuša handheld',
    description:
      "Tom's go-to for boat-deck observational work. Light, agile, ready-for-anything. Walks the pace of the sea.",
    cameraSlot: 'A',
    kitItemIds: ['kit-cam-a', 'kit-lens-1', 'kit-audio-boom', 'kit-audio-lav'],
    audioRouting: 'Boom (MKH-416) + lav (Sanken COS-11) split, mixed at recorder',
    lightingNotes: 'Available + bounce off sail or deck. No artificial unless overcast forces it.',
    movementNotes:
      "Tom's walking pattern — even pace, knees soft to absorb deck movement. Pre-walk the path before the take.",
    notes: 'Default rig for episodes 1, 2, 5. Workhorse.',
  },
  {
    id: 'rig-sunset-wide',
    name: 'Sunset wide',
    description:
      'Trinity-anchored, longer focal, deliberate movement. The mood-establishing shots. Slower exposure margin.',
    cameraSlot: 'A',
    kitItemIds: ['kit-cam-a', 'kit-lens-3', 'kit-stab-trinity'],
    audioRouting: 'Wild ambient capture · ocean + wind only',
    lightingNotes: 'Golden hour disciplined — 20 min before / after. Underexpose 1/3 stop for color saturation.',
    movementNotes: 'Long Trinity walks · 15-30 second takes. Anchor point fixed.',
    notes: 'Episode 6 closing shots. Episode 4 salt-pan dusks. The colour script signature shots.',
  },
  {
    id: 'rig-elder-interview',
    name: 'Elder interview',
    description:
      "Static, patient, isolated. Subject in soft frame. The 85mm portrait of Tom Lebarić's signature.",
    cameraSlot: 'A',
    kitItemIds: ['kit-cam-a', 'kit-lens-3', 'kit-audio-boom', 'kit-audio-lav'],
    audioRouting: 'Lav primary (radio mic on subject) + boom backup overhead',
    lightingNotes: 'Window light if interior · soft bounce if exterior. Negative fill on shaded side.',
    movementNotes: 'Static. Subject moves; camera does not. Tripod or sandbag support.',
    notes:
      'Used for Lighthouse keeper (Ep 2) · Salt-tradition elder (Ep 4) · Klapa interviews (Ep 5).',
  },
  {
    id: 'rig-drone-establish',
    name: 'Drone establish',
    description:
      'Aerial wide reveals. Pre-flight discipline. Croatian-airspace + national-park-permit aware.',
    cameraSlot: 'drone',
    kitItemIds: ['kit-aerial-drone'],
    audioRouting: 'MOS · ambient laid in post',
    lightingNotes: 'Cross-light (low sun) for terrain texture. Avoid backlit harsh midday.',
    movementNotes:
      'Slow descend reveals · orbit rate 6-10 sec/360°. Cinematic mode locked. Battery cutoff at 25%.',
    notes:
      'Spotter on deck mandatory. Return-to-home set on the boat\'s GPS. Mljet · Kornati · Brijuni need permits.',
  },
];

/* ---------- Initial app state ---------- */

export function makeInitialState(): AppState {
  return {
    activeScenario: 'realistic',
    activeView: 'overview',
    scenarios: SCENARIOS,
    episodes: SEED_EPISODES,
    specials: SEED_SPECIALS,
    sponsors: SEED_SPONSORS,
    crew: SEED_CREW,
    risks: SEED_RISKS,
    schedulePhases: SEED_SCHEDULE_PHASES,
    milestones: SEED_MILESTONES,
    shootDays: SEED_SHOOT_DAYS,
    locations: SEED_LOCATIONS,
    routes: SEED_ROUTES,
    talents: SEED_TALENTS,
    catches: SEED_CATCHES,
    meals: SEED_MEALS,
    references: SEED_REFERENCES,
    antiScriptMoments: SEED_ANTI_SCRIPT_MOMENTS,
    dopKit: SEED_DOP_KIT,
    luts: SEED_LUTS,
    colorPalettes: SEED_COLOR_PALETTES,
    klapa: SEED_KLAPA,
    micPlacements: SEED_MIC_PLACEMENTS,
    journalEntries: SEED_JOURNAL_ENTRIES,
    contracts: SEED_CONTRACTS,
    episodeExtras: SEED_EPISODE_EXTRAS,
    tasks: [],
    notes: [],
    variations: [],
    assets: [],
    outreachContacts: [],
    festivals: SEED_FESTIVALS,
    applications: SEED_APPLICATIONS,
    /* Phase 9 — Production. Demo-seeded with 12 scenes / 36 shots /
       walkie channels / sample wraps / boat ops / safety so the cockpit
       reads alive on the boat trip. Team will edit + add on the boat. */
    scenes: SEED_SCENES,
    shots: SEED_SHOTS,
    takes: [],
    boatOpsDays: SEED_BOAT_OPS_DAYS,
    dataBackupDays: [],
    safetyDays: SEED_SAFETY_DAYS,
    incidents: [],
    wrapEntries: SEED_WRAP_ENTRIES,
    walkieChannels: SEED_WALKIE_CHANNELS,
    /* Phase 9 — Distribution + Marketing seeds. */
    salesAgents: SEED_SALES_AGENTS,
    broadcasters: SEED_BROADCASTERS,
    marketEvents: SEED_MARKET_EVENTS,
    deals: [],
    socialPosts: [],
    trailerCuts: SEED_TRAILER_CUTS,
    pressContacts: SEED_PRESS_CONTACTS,
    btsCapture: [],
    /* Phase 9 — Post-production + Voice memos + Sketches + Decisions + Research. */
    editMilestones: SEED_EDIT_MILESTONES,
    cueSheet: [],
    subtitleTracks: SEED_SUBTITLE_TRACKS,
    deliverableSpecs: SEED_DELIVERABLE_SPECS,
    voiceMemos: [],
    sketches: [],
    decisions: [],
    researchSources: SEED_RESEARCH_SOURCES,
    producers: SEED_PRODUCERS,
    subjects: [],
    /* Phase 9 — Tier B deepenings. Empty defaults; team fills as relationships develop. */
    sponsorDeliverables: [],
    colorScriptStops: [],
    audioCommissions: [],
    /* Phase 9 — Cinematography rig library · Tom's vocabulary pre-seeded */
    rigConfigurations: SEED_RIG_CONFIGURATIONS,
    /* Phase 12 — Shoot-day live surfaces (empty until first shoot day) */
    conditionsForecasts: [],
    cameraStatuses: [],
    boatWaypoints: [],
    crewPositions: [],
    /* Phase 12 wave 3 — planning ammo */
    permits: [],
    /* Phase 13 — Spark Wall (creative capture) */
    sparks: [],
    demoTrip: null,
    showDayMode: false,
    locale: 'en',
    selectedEpisodeId: null,
    printMode: false,
    paletteOpen: false,
    captureOpen: false,
  };
}
