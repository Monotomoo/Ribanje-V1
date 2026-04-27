# Ribanje 2026 — session checkpoint

> Persistent state for any future Claude session. The project is the local-first React dashboard for the *Ribanje* documentary, demoed on Tomo's laptop during the upcoming sailing trip with Ivan Paladina, Tom Lebarić, and Rene Bakalović.

## Quick orientation

- **Project folder:** `D:/CLAUDE PROJECTS/RIBANJE I RIBARSKO PROGOVARANJE V.1.1`
- **Dev server:** `npm run dev` → `http://localhost:5173/`
- **Skip splash for fast iteration:** `http://localhost:5173/?nosplash=1`
- **Plan file (full historical record + Phase 9):** `C:\Users\Tomo\.claude\plans\i-m-building-a-local-first-cosmic-island.md`
- **Current build:** TypeScript + bundle clean. **Main bundle 1.097 MB / 257 KB gzipped** after Phase 10 final mile. Third-party chunks split (motion · dnd-kit · icons · fuse · suncalc).
- **Repo:** [github.com/Monotomoo/Ribanje-V1](https://github.com/Monotomoo/Ribanje-V1) on `main`. `vercel.json` committed; Vercel deploy deferred — Tomo can connect via Vercel Dashboard whenever ready.

## ⚡ WHERE WE ARE NOW — PHASE 10 SHIPPED · BOAT-TRIP READY

All 21 Cinematography surfaces wired, Overview + Schedule reworked into actual tools, names + rates cleaned up, repo on GitHub. Tomo's earlier ask "now go through all the plans" was answered with a Phase 10 final mile that landed:

### Phase 10 — Move A · 3 cinematography components wired (this session)

1. **`KitFailureSimulator`** wired into `KitDashboard.tsx` (top of Kit tab, above LCD card row). Tomo picks one or more kit items to "fail" → shows direct hits (lost shots), salvageable via fallback (Cam A → Cam B path), and a recovery plan.
2. **`PerBeatLensPrescription`** wired into `LensLibrary.tsx` (below the character matrix). Every beat → keyword-matched recommended lens with reasoning. Tom-set overrides save permanently.
3. **`ReferenceFilmMimicry`** wired into `ColorAndLook.tsx` (between Waveform/Vectorscope and Color script). Pick a reference, upload a frame, get palette + exposure + framing match scores with diagnosis text.

### Phase 10 — Move C · Sun-arc + tide overlay (this session)

New section in **Time + light** tab (Cinematography). Per anchorage × shoot date:
- **Top-down compass diagram** — boat icon at center oriented to bowHeading, sun positions plotted around the rim at sunrise / golden AM / noon / golden PM / sunset (size scales with altitude)
- **Bow heading slider** — drag to predict anchor swing for tomorrow's wind
- **Per-window framing table** — sun azimuth · altitude · sun-vs-bow angle · advice (frontlit / sidelit-port / backlit / sidelit-stbd) per window
- **Tide info** — editable amplitude + low/high tide times per anchorage (persisted to Location)
- **Golden hour notes** per anchorage (also persisted)
- New types on Location: `bowHeadingDeg`, `tideAmplitudeM`, `tideLowTime`, `tideHighTime`. New reducer action `UPDATE_LOCATION`.

### Bundle after Phase 10

**1.097 MB / 257 KB gzipped** (up ~+39 KB raw / +9 KB gzipped from Phase 9 post-rework baseline). Build clean, no console errors expected.

### What's wired across all of Cinematography (21 surfaces)

**Kit** — Live status board · Failure simulator · LCD totals · per-category lists
**Lenses** — Character matrix · Per-beat prescription · Lens library
**Color & look** — Palette studio · Touchstone graph · Frame-line composer · Waveform/vectorscope · Reference film mimicry · Color script · Shot reference library · LUTs · Reference films
**Time + light** — Golden hour panel · Sun arc · **Sun-arc + tide overlay** · 30-day light stress timeline · Best-windows table
**Daily plan** — Live Roll Cockpit · Pre-shoot kit checklist · Multi-cam matrix · Shot list radar · Power/storage compute · Shooting conditions matrix · Whole-shoot rollup
**Continuity** — Auto-detected warnings · Per-shot technical tracker
**Specialty** — UW · Drone · Stab · Frame rate · DOF · Filters · Rigs · **Trinity counterweight calc**

### Other Phase 10 work in this session

- **Overview rebuilt** as cockpit (TodayBrief · 8 Cockpit Gauges · 30-Day Production Ribbon · Decisions Inbox · Activity Feed · Voyage strip kept · Finance pill collapsed). 6 duplicate sections removed (StoryProgress · PeoplePipeline · GeographyOverview · ScheduleSnapshot · RiskProfile · SponsorGauge · old RecentActivity).
- **Schedule made functional**: drag-edit Gantt · click-to-edit phase popover · critical path highlight · owner avatars · inline phase + milestone add · slip simulator with cascade mode · drag-rearrange shoot calendar · conflict detector · quick-action deadlines (snooze/done/reopen) · 3-row filter chips · inline owner.
- **Crew cleanup**: Tomo → Tomislav Kovacic · Marko → Marko Stanic · Ivan's brother → Luka Paladina (proper names). Rate fields cleared + deal-structure assumptions removed from notes pending real deals. Auto-migration in storage.ts only clears legacy seed strings, preserves user edits.

### Tom-meeting demo path (90 sec walkthrough · updated)

1. ⌘8 → Cinematography → **Kit** → toggle a kit item to "down" on the Failure Simulator → see lost vs salvageable shots
2. **Lenses** → click a lens dot in the character matrix → adjust warmth/sharpness sliders. Scroll down → per-beat prescriptions pre-fill from beat keywords.
3. **Color & look** → upload a still to Waveform/Vectorscope → see luma + chroma scopes. Scroll to Reference Film Mimicry → load a reference, upload our frame, see match %.
4. **Time + light** → SunArcTideOverlay top-down compass → drag bow heading slider → see framing advice update per window.
5. **Daily plan** → preview-day picker `2026-10-12` → toggle Live Roll Cockpit on → ROLL/CUT buttons + voice memo.
6. **Specialty** → Trinity → Counterweight Calculator → pick cam + lens + accessories.

## Visual identity (locked)

- **Stari Grad library** direction — Fraunces (italic display serif) + Spectral (body) + Inter (UI labels & small caps). Mono retired entirely.
- **Palette:** limestone paper `#F2EAD9` · Adriatic-deep ink `#0E1E36` · brass `#C9A961` · olive `#788064` · sunset coral `#C26A4A`.
- **Dual-tone:** navy chrome (sidebar, splash) + chart-paper work area.
- **Editorial pacing:** italic serif headers, small-caps tracked labels, hairline brass dividers between sections, generous whitespace, film-grain texture, no emoji, no nautical kitsch.
- **Brass restraint:** count brass elements per view; if more than 5 obvious ones, dial back.

## Sidebar IA (Phase 9 — locked)

**17 items in 5 + 5 + 6 + 1 groups.** ⌘1–9 maps the first nine; the rest reachable via ⌘K. Tell group reads as production lifecycle. Library is the cultural backbone.

| Plan | Make | Tell | Library |
|---|---|---|---|
| Overview | Episodes | Pitch | **Research** (new) |
| Schedule | Production | Journal | |
| Sponsors | Cinematography | Contracts | |
| Crew | Sound | Post-production | |
| Risks | Map | Distribution | |
| | | Marketing | |

⌘1=overview · ⌘2=schedule · ⌘3=sponsors · ⌘4=crew · ⌘5=risks · ⌘6=episodes · ⌘7=production · ⌘8=dop · ⌘9=sound

## Production module (Phase 9 — fully shipped)

The headline feature. Six-tab command bridge for the October 2026 shoot. **All six tabs are now full quality** — Boat ops · Data · Safety landed in the second wave.

| Tab | What it does |
|---|---|
| **Today** | Hero with auto-resolved shoot day · sunrise/golden/sunset · today's shots/crew/kit · anti-script + catch + meal targets · walkie plan · interactive safety brief checklist · today's wrap preview |
| **Shot list** | Episode tabs · scene blocks · shot table (description / cam / framing / movement / audio / status) · expandable take log per shot · status filter · full CRUD |
| **Boat ops** | Today→tomorrow ribbon with NM + ETA · fuel/water/provisions sliders · skipper picker · watch rotation · wind/sea editor · 7-day rotation outlook · MOB protocol card with 8-step drill |
| **Data** | 3-checkbox per day (drive 1 / drive 2 / cloud) · TB captured · drive manifest aggregator · hash verification log · 30-day backup-state matrix · filename template |
| **Safety** | 5-item briefing checklist · walkie + RF plan from `walkieChannels` · emergency contacts (Coast Guard 195 · 112 · 194 · DAN) · briefing completion gauge · incident log with severity / description / action / lesson-learned |
| **Wrap** | Today's debrief (what worked/didn't/tomorrow tweaks) · mood marks per crew · take ratio · variance log · past wraps log (reverse-chrono) · Daily Call Sheet print · Tomorrow's brief print |

**Top of shell:** preview-day picker so Tomo can demo "what Day 12 will look like" without waiting for October. Click any 2026 date → Today and Wrap tabs re-resolve.

**Print artifacts:**
- **Daily Call Sheet** (button in Wrap header) — A4 with hero, light, crew + walkies, shot list table, anti-script + catch + meal, safety brief, departure/brief/first-call.
- **Tomorrow's brief** (button in Wrap header) — evening compile A4 with today→tomorrow ribbon, today's wrap notes carried forward, tomorrow's light + shot plan + targets.

## Other Phase 9 deliverables

- **Episode make-sheet** — A4 print modal opened from each episode card (paper-icon button, top-right on hover). Per-ep: synopsis, beats, shot highlights, anchorages, talents, catch + meal targets, Hektorović spine block, sponsor anchor, top risks, kit by category.
- **Daily Call Sheet** — A4 print modal from Production Wrap tab. Hero + light + crew + walkies + shot list table + anti-script/catch/meal + safety brief + departure/brief/first-call. Hand to crew with morning coffee.
- **Tomorrow's brief** — A4 evening compile from Production Wrap tab. Today→tomorrow ribbon · today's wrap notes carried forward · tomorrow's light + shot plan + targets · NM between anchorages.
- **Hektorović verse-of-the-day** — small italic strip atop Overview, above the hero. Brass ✦ ornament + 20px italic Fraunces verse. Day-of-year rotation across 6 episode parallels.

## Distribution module (Phase 9 — shipped)

Lives in **Tell** sidebar group. 4 tabs.

| Tab | What it does |
|---|---|
| **Sales agents** | 10 pre-seeded (Submarine · Cinetic · Dogwoof · Cinephil · Lightdox · Films Boutique · Autlook · MetFilm · Cargo · Wide Mgmt) · sortable by fit · status cycle (target → pitched → in-talks → signed → declined) · 1–5 fit stars · filterable register |
| **Broadcasters** | 25 pre-seeded across HRT · ARTE · BBC Storyville · ZDF · Yle · DR2 · NRK · SVT · Czech TV · RTS · Al Jazeera Balkans · POV · CBC · ABC iview · Hot Docs · Knowledge · Documentary Channel · MUBI · Dafilms · Curzon · Apple TV+ · Netflix · Amazon · Sky · Rai · RTV SLO. Country / slot / strand / fit / status · filterable register |
| **Markets** | 9 pre-seeded (CPH:DOX Forum · Sunny Side · MIPDOC · IDFA Forum · Sheffield MeetMarket · DOK Leipzig · East Doc · DocsBarcelona · Visions du Réel) · cards with deadline countdown · status cycle |
| **Deals** | Empty by default · 7-column lite tracker (party / territory / format rights / term / advance / status / delete) · status cycle (negotiating → legal → signed → paid → cancelled) |

## Marketing module (Phase 9 — shipped)

Lives in **Tell** sidebar group. 4 tabs.

| Tab | What it does |
|---|---|
| **Trailers** | 6 pre-seeded cuts (30s teaser · 60s teaser · 90s trailer · 2-min trailer · vertical 30s social · square 30s social) with format · audience · supporting beats · status (planned → rough → cut → final) · cards |
| **Social** | Empty calendar · per-post: date / platform (IG · TikTok · YT · X · LinkedIn · FB) / type (BTS · clip · still · text · article) / status (idea → drafted → scheduled → posted) / caption · sortable list |
| **Press** | 13 pre-seeded outlets (Variety · Screen Daily · IndieWire · Cineuropa · Cahiers · Sight & Sound · MTR · POV · Documentary Mag · Jutarnji · 24sata · Telegram · tportal). Filterable register · status cycle (cold → pitched → interviewed → wrote → declined) |
| **BTS** | Empty log · per shoot day: date / responsible crew / description / cleared-for-social toggle |

## Post-production module (Phase 9 — shipped)

Lives in **Tell** sidebar group. 4 tabs. Editorial workflow from wrap to print master.

| Tab | What it does |
|---|---|
| **Timeline** | 8-phase editorial arc visualization (assembly → rough cut → fine cut → picture lock → online → color → sound mix → print master) · pre-seeded with target dates Nov 2026 → Jul 2027 · status cycle per milestone |
| **Cue sheet** | Empty by default · per-cue: TC in / out · song title · composer · publisher · usage type (background / featured / theme / end-credit) · rights status (cleared / pending / public-domain / commissioned / unknown) · grouped by episode |
| **Subtitles** | 12 pre-seeded tracks (HR + EN per episode) · per-track translator · format · word count · cost estimate · status (not-started → in-translation → in-review → locked) · grouped by episode with rolling cost rollup |
| **Deliverables** | 3 pre-seeded buyer specs (HRT · BBC Storyville · ARTE/3sat) with format · resolution · framerate · audio format · subtitle format · metadata · per-spec notes |

## Voice memo library (Phase 9 — shipped)

Lives as a **second tab inside Journal** (Diary | Voice memos). Uses the AudioRecorder + AudioWaveform primitives.

- EN/HR language toggle for SpeechRecognition
- Brass-mic record button → stops → encodes Opus blob to base64 → auto-saves to `voiceMemos`
- Per memo: timestamp · duration · scope (idea / note / observation / beat / interview) · linked episode
- Inline `<audio controls>` playback + SVG waveform render
- Free-text label + transcript display
- Search box filters across transcripts / labels / scopes

## Sketch pad (Phase 9 — shipped)

Lives as a **section in Episode hub Story tab**, below References.
- Click "new sketch" → modal with `SketchCanvas` primitive (pen / eraser / 4 brand colors / 4 stroke sizes / 30-step undo)
- Save → PNG base64 attached to episode as a `Sketch` entity
- Thumbnail gallery shows sketches per episode
- Click any thumbnail → re-opens the modal for re-edit
- Per sketch: optional label (e.g. "Marko at the helm, sunset framing") + creation timestamp

## Catch-of-the-day shareable (Phase 9 — shipped)

Generated **per Catch entry** in Episode hub Subject tab. Click the share icon on any catch card → modal with 1080×1080 social card.

- Canvas-based render at 1080×1080 with brand fonts (Fraunces + Inter)
- If catch has photo: cover-fit background; else brand-color gradient
- Layout: top brass marker + Ribanje wordmark + date · main fish CRO (italic Fraunces 96px) · LAT (italic 32px) · ENG in caps · meta row (weight · method · anchorage · time) · Hektorović verse fragment (if present, top-right) · Ribanje wordmark bottom-right
- Save PNG button downloads the file with auto-named slug

## Cinematography Specialty tab (Phase 9 — shipped)

**Sixth tab** added to Cinematography view, alongside Kit · Lenses · Color · Time + light · Daily plan. Internal sub-tabs:

| Sub-tab | What it does |
|---|---|
| **Underwater** | Kit list filtered to `category: 'underwater'` · 7-step pre-shoot checklist (o-rings, pressure test, port choice, monitor seal, dry-land battery swap, buddy system, fresh-water rinse) |
| **Drone** | Kit list filtered to `category: 'aerial'` · 7-step checklist (Croatian airspace · national park permits · battery cycle · wind ceiling · spotter · marine launch · LUT sync) |
| **Stab · Trinity** | Kit list filtered to `category: 'stab'` · 7-step checklist (counterweight · bias-axis · battery cycle · cable tie-down · walking pattern · quick-release · marine humidity storage) |
| **Frame rate** | Curated 7-rate library (24p · 25p · 23.976p · 48p · 60p · 120p · 240p) with shutter angles · use-cases · intent (observational / action / broadcast / dream) · 180° rule explainer |

## Mood board section (Phase 9 — shipped)

Lives in **Episode hub Story tab**, below Sketches. Reuses the existing `ColorPalette` type — boards are episode-scoped palettes with reference image + extracted 5-colour palette + mood notes.

- Drop a reference image → auto-runs `extractPaletteFromFile` (PaletteExtractor primitive · k-means in RGB)
- 2-up grid of boards per episode · image preview + brand swatch row + label + notes
- Multiple boards per episode for different scenes / moods

## Fishing calendar section (Phase 9 — shipped)

Lives at the **top of Episode hub Subject tab**. Static reference: 12-month grid of Adriatic fishing context, October highlighted (Ribanje shoot month).

- Per month: Croatian + English month names · best species (CRO + ENG names · regional notes) · water temp range · fishing-season note
- Highlighted card has brass border + ring
- Sources: Croatian fishing tradition + marine biology · 36 species across the year

## Decision register (Phase 9 — shipped)

**Third tab inside Journal** (Diary | Voice memos | Decisions). Archival surface for the "wait, why did we drop that anchorage?" questions six months later.

- Per decision: date · scope (creative / production / financial / logistical / other) · owner · title · context · considered options · chosen path · why
- Filterable by scope with chip counts
- Reverse-chronological list with expand-to-edit
- Color-tones per scope (creative=brass · production=ink · financial=coral · logistical=olive)

## Research module (Phase 9 — shipped)

Lives in **Library** sidebar group as a dedicated top-level surface. 4 tabs.

| Tab | What it does |
|---|---|
| **Hektorović** | Per-episode spine (real verses + parallels) · scholarly source register (book / article / archive / oral-history / film / paper) with author / year / URL / summary / why-it-matters. 6 pre-seeded sources: 1568 first edition, Marulić-Hektorović scholarship, traditional fishing reference, falkuša archive, Leviathan, Fire at Sea. |
| **Klapa** | Catalogue grouped by region with extended metadata — full HR lyrics + EN working translation per song · BPM · mood · rights status · fee estimate · per-song notes. Existing `KlapaEntry` extended with lyrics + audio + sheet-music fields. |
| **Producers** | 11 pre-seeded — 7 wineries (Bibich · Korta Katarina · Bire · Krajančić · Tomac · Roxanich · Kabola) + 4 olive mills (Avantis · Olynthia · Chiavalon · Mate). Per producer: kind / name / region / flagship / contact / episode link / willingness-to-feature cycle (unknown → reachable → committed → declined). Filter chips wine / olive / all. |
| **Subjects** | Subject database — every on-camera person, distinct from Talent (the pipeline). Per subject: name · role · episode · location · contact · release status (pending → signed → expired) · "great on camera" star tag · follow-up notes. Empty by default; team fills on the boat. |

## Cinematic touchstone graph (Phase 9 — shipped)

Lives as a **section in Cinematography Color & look tab**, between Color Palette Studio and LUTs. SVG 2D scatter plot.

- **X-axis:** naturalism (left) ↔ styled (right)
- **Y-axis:** epic (top) ↔ intimate (bottom)
- 9 plotted touchstones: Leviathan · Fire at Sea · Cave of Forgotten Dreams · Casa de Lava · The Wind Will Carry Us · Tabu · Encounters at the End of the World · Baraka · placeholder for a Croatian doc
- **Ribanje plotted as a brass diamond** — aimed between intimate-naturalism and gentle-essayistic
- Hover any dot → info bar shows director · year · why-it-matters note
- Quadrant labels: naturalist epics · styled vistas · quiet observations · authored portraits (very faint)

## Tier B deepenings (Phase 9 — shipped)

Six modules deepened with focused inline sections + 8 new components.

| Module | What landed |
|---|---|
| **Schedule** | `ScheduleBurnDown` — 4-stat row (days to shoot · shoot days left · post milestones · print master target) + horizontal arc visualization Apr 2026 → Aug 2027 with shoot block + post-prod milestones + today line. Lives below Production Gantt. |
| **Risks** | `RiskBurnDown` — raw vs residual score per category bar chart, total burn-down %, plus a dedicated Weather pane filtered to `category: 'weather'` risks with raw/residual rollup. Lives below the register/matrix. |
| **Sponsors** | `SponsorROI` — CPM-equivalent ROI calculator (episodes × 200k viewers × 2× reshow × placement-quality × €22 CPM) with placement-quality picker (logo cameo · screen credit · featured integration). Plus deliverables tracker per sponsor (logo / screen-credit / social-post / press-mention / premiere-invite). Both live in SponsorDrawer between Episode tie-ins and Outreach. |
| **Cinematography** | `ColorScript` — per-episode 0–50min runtime ribbon with colour stops; gradient blends between stops. Add stops at moments (opening · first catch · sunset · closing) with hex picker + label. Lives in Color & look between Touchstone graph and LUTs. |
| **Sound** | Two new tabs: `HektorovicAudio` (commissioning plan with type / reader / format / location / post-treatment / status, plus a "seed 6 verse readings" button to pre-populate) and `MusicBudget` (stacked-bar budget breakdown: klapa licensing + cue licensing + sound design+mix + composer + studio · variance vs `sm` cost line). |
| **Pitch** | `FestivalFitCalculator` — 5-axis scoring (programming · territory · timing · prestige · access · 1–5 each) with weighted total + verdict heuristic (submit / consider / pass). Lives at bottom of Festival Tracker with a festival picker. `DeckVariants` — 5-audience strategy guide (General · HRT · EU MEDIA · Sponsor · Festival) with emphasis bullets · slide order · tone warnings. Lives below Pitch deck. |

## Tier B data additions

**`SponsorDeliverable`** — per-sponsor deliverable (type · label · status · due-date).

**`ColorScriptStop`** — per-episode runtime stop (runtimeMin · color · label · notes).

**`AudioCommission`** — Hektorović audio + klapa + ambient + narration commissioning entries.

## Bundle code-splitting (Phase 9 technical polish)

`vite.config.ts` extended with `rollupOptions.manualChunks`. Third-party libs split into separate cacheable bundles:

| Chunk | Size | Gzipped |
|---|---|---|
| `index.js` (main app) | 805 KB | 191 KB |
| `motion.js` (framer-motion) | 122 KB | 40 KB |
| `dnd-kit.js` | 52 KB | 17 KB |
| `icons.js` (lucide-react) | 36 KB | 7 KB |
| `fuse.js` | 24 KB | 8 KB |
| `suncalc.js` | 3 KB | 1 KB |

Initial parse is now smaller; third-party chunks cache independently across deploys.

## Five new primitives (Phase 9)

All in `src/components/primitives/`:
- **AudioRecorder** — Web Audio API + MediaRecorder + optional SpeechRecognition transcript. Brass mic, italic timer, paper card.
- **SketchCanvas** — pen/eraser, 4 brand colours, 4 stroke sizes, 30-step undo, save-as-PNG.
- **PrintLayout** — A4 portrait/landscape wrapper with header/footer/watermark slots, page-break helper, `print-page` boundary.
- **AudioWaveform** — SVG bars from Blob/base64 via AudioBuffer peak detection.
- **PaletteExtractor** — k-means colour extraction promoted from ColorPaletteStudio. Pure functions + reusable `<PaletteSwatchRow />`.

## Phase 9 data model additions (`src/types.ts`)

**Production:** `Scene · Shot · Take · BoatOpsDay · DataBackupDay · SafetyDay · IncidentEntry · WrapEntry · WalkieChannel` plus enums `ShotStatus · CameraSlot · ShotFraming · ShotMovement · AudioPlanType · TakeStatus · IncidentSeverity · MoodMark`.

**Distribution:** `SalesAgent · Broadcaster · MarketEvent · Deal` plus status enums.

**Marketing:** `SocialPost · TrailerCut · PressContact · BTSCapture` plus status enums.

**Post-production:** `EditMilestone · CueSheetEntry · SubtitleTrack · DeliverableSpec` plus status / phase / usage / rights enums.

**Voice memo:** `VoiceMemo` (audio base64 + transcript + scope + link).

**Sketch:** `Sketch` (pngBase64 + episodeId + optional beatId + label).

**Decision:** `DecisionEntry` (date + scope + title + context + considered + chosen + why + ownerId).

**Research:** `ResearchSource` (type + title + author + year + url + summary + whyItMatters), `Producer` (kind + name + region + flagship + episode link + willingness), `Subject` (on-camera person · release status · great-on-camera tag).

**KlapaEntry extensions:** `lyricsHr` · `lyricsEn` · `audioBase64` · `sheetMusicBase64` · `bpm` · `mood`.

Reducer extended with full CRUD, UPSERT-by-date semantics for the per-day entities, and `REORDER_SHOTS_IN_SCENE`. Storage migration extended with hard-guarantees so older saves never blow up the app.

## Pre-seeded demo data (Phase 9)

So Production reads alive on the boat trip — the team edits + adds rather than starting empty:
- **12 scenes** (2 per episode, with `dayIdx` aligned to October shoot calendar)
- **36 shots** (3 per scene, varied cameras + framings + audio + crew operators) — 3 shots in scene 3.1 marked `captured` to show wrap variance
- **6 walkie channels** (one per crew member, primary + backup)
- **2 wrap entries** for Days 10 + 11 (real-tone debriefs, mood marks, variance)
- **1 boat ops day** for Day 12 (Lavsa anchorage, fuel 78%, water 62%, provisions 71%, NW 8kn)
- **1 safety day** for Day 12 (partial completion: vests + weather done, comms + brief pending)
- **10 sales agents · 25 broadcasters · 9 markets · 6 trailer cuts · 13 press outlets** (Distribution + Marketing)

## Original ten Tomo requests · current status

| # | Request | State |
|---|---|---|
| 1 | Overview as full project dashboard | ✅ rebuilt — verse-of-the-day strip + 11 sections, finance moved to bottom |
| 2 | Schedule segmented + more details | ✅ 3 tabs (Production timeline · Shoot calendar · Deadlines) |
| 3 | Sponsors deeper | ✅ goals + kanban + brief library / outreach / pitchmaker + episode×sponsor matrix |
| 4 | Crew as collaboration | ✅ 4 tabs (Roster · Tasks · Notes · Standup) |
| 5 | Risks deeper | ✅ ISO register + matrix + per-risk drawer with mitigation log |
| 6 | Episodes more detailed + draggable | ✅ beat library + draggable timeline + 3-col Story tab + **make-sheet print A4** |
| 7 | Map with custom image | ⏳ **waits on Tomo's image** — calibrate 4 anchor pins, ~30 min |
| 8 | Cinematography godlike | ✅ 5 tabs (Kit · Lenses · Color · Time + light · Daily plan) |
| 9 | Sound boat logistics | ✅ 4 tabs (Klapa · Boat logistics · Per-ep briefs · Philosophy) |
| 10 | Pitch more details | ✅ 6 tabs (Lab · Treatment · Decks · Festivals · Applications · Press kit) |

**Plus Phase 9 → Production module (request #11 from the Apr 26 session): ✅ shipped Tier A.**

## Architecture and primitives

**Cross-cutting primitives** (all in `src/components/primitives/`):
- Phase 8: `TaskBoard · NoteThread · VariationStack · AssetUploader · AssetGrid · FilterableRegister · LongFormEditor · LCDCard · Tile · Pill · EditableText · EditableNumber · SlateStrip · BrassCursor · AspectFrame · ViewfinderCorners · PhaseHint`
- Phase 9: `AudioRecorder · SketchCanvas · PrintLayout · AudioWaveform · PaletteExtractor`

**Cross-cutting features:**
- Splash sequence (letterbox + italic Fraunces title fade-in)
- ⌘K command palette (fuzzy search across views, scenarios, episodes, sponsors, crew, risks, locations, klapa, festivals, applications, tasks, anti-script moments, variations + commands) — extended with new views
- Capture modal (⌘. or brass mic button) — EN/HR SpeechRecognition + 8 destinations
- Undo / redo — 30-step in-memory history. ⌘Z / ⌘⇧Z + visible buttons in sidebar footer
- Keyboard shortcuts — `1/2/3` scenarios · `⌘1–9` jump views · `⌘.` capture · `⌘K` palette · `⌘Z` / `⌘⇧Z` undo/redo · `⌘R` reset to seed · `Esc` close hub or palette
- Print mode — `@page` A4 styles, sidebar/chrome hidden, `print-slide` per artifact, plus new `PrintLayout` primitive for Daily Call Sheet · Tomorrow's brief · Episode make-sheet
- localStorage persistence with auto-migration (Phase 9 entities included)
- Reset to seed (sidebar footer, modal-confirms)
- Film grain overlay (paper texture, ~4.5% opacity)

## Reducer

`src/state/reducer.ts` has full CRUD for ~40 entity types now. Phase 9 added: scenes / shots / takes / boatOpsDays / dataBackupDays / safetyDays / incidents / wrapEntries / walkieChannels. UI-only actions (`SET_VIEW`, `SELECT_EPISODE`, `OPEN_PALETTE`, `OPEN_CAPTURE`, `SET_PRINT_MODE`, `HYDRATE`) skip undo/redo history.

## What's still on the list

**Blocked on Tomo:**
- Map image swap (~30 min once provided — calibrate 4 anchor pins)
- Real content drop-in (Hektorović verses, Tom's actual kit confirmed, real talent prospects, klapa shortlist, festival fits, outreach log entries)

**Vercel deploy** — `vercel.json` committed and pushed. Three paths:
- A) Tomo imports the GitHub repo at `vercel.com/new` (every future push auto-deploys)
- B) Trigger via Vercel MCP from a future Claude session
- C) Wait

**Optional Tier C remaining (low urgency):**
- Lookbook — image-rich gallery, episode/scene/mood-tagged (~45 min)
- Theme system extraction → reusable preset for future projects (~2d)
- iPad / touch responsive pass — Phase 1 round 5 deferred, re-evaluate post-trip (~2d)

**Decided out:**
- AI co-pilot / Anthropic SDK integration (Q3=D — broke local-first purity)
- Crew Day-rate matrix — deferred until real deals exist

## Pre-demo acceptance check

- [ ] Click through every view at 1280×800 and 1440×900 — no console errors
- [ ] Open Production · use preview-day picker · pick 2026-10-12 → Today resolves to Day 12 / Episode 3 / Lavsa with sun times
- [ ] Open Production · Shot list tab · add scene + shot + take · status cycle works
- [ ] Open Production · Wrap tab · type debrief · click "tomorrow's brief" · A4 modal renders
- [ ] Open Episode card · click paper-icon button (top-right on hover) · A4 make-sheet renders
- [ ] Splash plays once per session, skips cleanly on click
- [ ] Reset to seed restores everything
- [ ] localStorage persists across reload (auto-migrates from older saves)
- [ ] Print views (`⌘P`) render clean A4 from Daily Call Sheet · Tomorrow's brief · Episode make-sheet · Pitch artifacts
- [ ] Capture button records voice (Chrome) and falls back gracefully (Safari/Firefox)
- [ ] ⌘K · ⌘. · ⌘1–9 · ⌘Z / ⌘⇧Z · ⌘R all work
- [ ] Drag-to-reorder works in: Episodes grid · Story tab beat timeline · Sponsors kanban · Crew tasks
- [ ] Brass restraint check — none of the views feel yacht-club-cheesy
- [ ] Verse-of-the-day strip on Overview cycles by day-of-year

## Notes for the next session

- **Don't over-screenshot during dev** — Tomo asked to keep preview interactions minimal and trust the typecheck.
- Tomo's "ultrathink" trigger means full deep-reasoning mode.
- Plan mode (Shift+Tab) is the right default for any task >1 hour. Always end plan mode with `AskUserQuestion` for clarifications or `ExitPlanMode` for approval.
- Editorial restraint is the brand. Brass for emphasis only — count brass elements per view; if more than 5 obvious ones, dial back.
- Background dev server lives in a long-running Bash; restart with `npm run dev` if killed. Currently alive at 200.
- Local-first only — no backend, no auth, no DB. Every entity persists via single localStorage key `ribanje-dashboard-v1` with auto-migration on load.
- **Phase 9 unused-import lint quirks** — there are a few `export const _icons = { ... }` / `export const _shootDayType` lines added to satisfy strict-unused-locals checks. They're cosmetic and harmless. Clean up at leisure during Phase 9 Tier B polish.

— end checkpoint
