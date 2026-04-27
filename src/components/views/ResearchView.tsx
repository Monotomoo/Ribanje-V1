import { useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  Music,
  Plus,
  Trash2,
  Users,
  Wine,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { newId } from '../episode/shared';
import type {
  KlapaEntry,
  Producer,
  ProducerKind,
  ResearchSource,
  ResearchSourceType,
  Subject,
} from '../../types';
import { EditableText } from '../primitives/EditableText';

type TabKey = 'hektorovic' | 'klapa' | 'producers' | 'subjects';

const SOURCE_TYPES: ResearchSourceType[] = [
  'book',
  'article',
  'archive',
  'oral-history',
  'film',
  'paper',
  'other',
];

const TYPE_TONE: Record<ResearchSourceType, string> = {
  book: 'text-[color:var(--color-on-paper)]',
  article: 'text-[color:var(--color-brass-deep)]',
  archive: 'text-[color:var(--color-olive)]',
  'oral-history': 'text-[color:var(--color-coral-deep)]',
  film: 'text-[color:var(--color-brass-deep)]',
  paper: 'text-[color:var(--color-on-paper-muted)]',
  other: 'text-[color:var(--color-on-paper-faint)]',
};

const PRODUCER_FEATURE_TONE: Record<NonNullable<Producer['willingFeature']>, string> = {
  unknown: 'text-[color:var(--color-on-paper-muted)]',
  reachable: 'text-[color:var(--color-brass-deep)]',
  committed: 'text-[color:var(--color-success)]',
  declined: 'text-[color:var(--color-on-paper-faint)] line-through',
};

const FEATURE_STATES: NonNullable<Producer['willingFeature']>[] = [
  'unknown',
  'reachable',
  'committed',
  'declined',
];

const RELEASE_STATES: NonNullable<Subject['releaseStatus']>[] = ['pending', 'signed', 'expired'];
const RELEASE_TONE: Record<NonNullable<Subject['releaseStatus']>, string> = {
  pending: 'text-[color:var(--color-warn)]',
  signed: 'text-[color:var(--color-success)]',
  expired: 'text-[color:var(--color-coral-deep)]',
};

export function ResearchView() {
  const { state } = useApp();
  const [tab, setTab] = useState<TabKey>('hektorovic');

  return (
    <div className="space-y-7 max-w-[1400px]">
      {/* Stat strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <Tile
          icon={BookOpen}
          label="Sources"
          value={state.researchSources.length}
          sub="Hektorović + scholarship"
        />
        <Tile
          icon={Music}
          label="Klapa songs"
          value={state.klapa.length}
          sub="catalogue · rights · lyrics"
        />
        <Tile
          icon={Wine}
          label="Producers"
          value={state.producers.length}
          sub={`${state.producers.filter((p) => p.kind === 'wine').length} wine · ${state.producers.filter((p) => p.kind === 'olive').length} olive`}
        />
        <Tile
          icon={Users}
          label="Subjects"
          value={state.subjects.length}
          sub={state.subjects.length > 0 ? 'on screen' : 'logged on the boat'}
        />
      </section>

      {/* Tab strip */}
      <nav
        role="tablist"
        className="flex items-baseline gap-1.5 border-b-[0.5px] border-[color:var(--color-border-paper)]"
      >
        {(
          [
            { key: 'hektorovic', label: 'Hektorović', hint: '1568 · sources · scholarship' },
            { key: 'klapa', label: 'Klapa', hint: 'catalogue · lyrics · rights' },
            { key: 'producers', label: 'Producers', hint: "wine + olive · Rene's territory" },
            { key: 'subjects', label: 'Subjects', hint: 'on-camera people · releases · follow-up' },
          ] as { key: TabKey; label: string; hint: string }[]
        ).map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`relative px-4 py-2.5 transition-colors ${
                active
                  ? 'text-[color:var(--color-on-paper)]'
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              <span
                className={
                  active
                    ? 'display-italic text-[19px]'
                    : 'font-sans text-[12px] tracking-[0.12em] uppercase'
                }
              >
                {t.label}
              </span>
              {active && (
                <>
                  <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[color:var(--color-brass)]" />
                  <span className="block prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-0.5">
                    {t.hint}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div>
        {tab === 'hektorovic' && <HektorovicTab />}
        {tab === 'klapa' && <KlapaTab />}
        {tab === 'producers' && <ProducersTab />}
        {tab === 'subjects' && <SubjectsTab />}
      </div>
    </div>
  );
}

/* ---------- Hektorović sources ---------- */

function HektorovicTab() {
  const { state, dispatch } = useApp();
  const allEpisodes = [...state.episodes, ...state.specials];

  function add() {
    const source: ResearchSource = {
      id: newId('rs'),
      type: 'book',
      title: 'New source',
    };
    dispatch({ type: 'ADD_RESEARCH_SOURCE', source });
  }

  function patch(id: string, p: Partial<ResearchSource>) {
    dispatch({ type: 'UPDATE_RESEARCH_SOURCE', id, patch: p });
  }

  return (
    <div className="space-y-7">
      {/* Episode parallels strip — pulls from episodeExtras */}
      <section>
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] mb-3">
          Per-episode spine
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allEpisodes.map((ep) => {
            const extras = state.episodeExtras[ep.id];
            if (!extras) return null;
            const hasReal =
              extras.hektorovicVerseCro &&
              !extras.hektorovicVerseCro.startsWith('[draft');
            return (
              <li
                key={ep.id}
                className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <div className="display-italic text-[16px] text-[color:var(--color-on-paper)]">
                    Ep {ep.number} · {ep.title}
                  </div>
                  <span
                    className={`label-caps tracking-[0.10em] text-[9px] ${
                      hasReal
                        ? 'text-[color:var(--color-success)]'
                        : 'text-[color:var(--color-on-paper-faint)]'
                    }`}
                  >
                    {hasReal ? 'verse confirmed' : 'placeholder'}
                  </span>
                </div>
                {extras.hektorovicVerseCro && (
                  <p className="display-italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed mb-1.5 italic">
                    {extras.hektorovicVerseCro}
                  </p>
                )}
                {extras.hektorovicVerseEng && (
                  <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] leading-relaxed mb-2">
                    {extras.hektorovicVerseEng}
                  </p>
                )}
                {extras.hektorovicParallel && (
                  <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper)] leading-relaxed pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                    {extras.hektorovicParallel}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Source register */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
              Source register
            </h3>
            <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-0.5">
              Primary sources, scholarship, archival material, reference films
            </p>
          </div>
          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
          >
            <Plus size={11} />
            <span>add source</span>
          </button>
        </div>
        <ul className="space-y-3">
          {state.researchSources.map((s) => (
            <li
              key={s.id}
              className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4"
            >
              <div className="grid grid-cols-[100px_1fr_28px] gap-4 mb-2">
                <select
                  value={s.type}
                  onChange={(e) =>
                    patch(s.id, { type: e.target.value as ResearchSourceType })
                  }
                  className={`bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none label-caps text-[10px] tracking-[0.12em] py-0.5 ${TYPE_TONE[s.type]}`}
                >
                  {SOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <EditableText
                  value={s.title}
                  onChange={(v) => patch(s.id, { title: v })}
                  className="display-italic text-[17px] text-[color:var(--color-on-paper)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete "${s.title}"?`)) {
                      dispatch({ type: 'DELETE_RESEARCH_SOURCE', id: s.id });
                    }
                  }}
                  className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors justify-self-end"
                  aria-label="Delete source"
                >
                  <Trash2 size={11} />
                </button>
              </div>
              <div className="grid grid-cols-[1fr_120px] gap-4 mb-2">
                <EditableText
                  value={s.author ?? ''}
                  onChange={(v) => patch(s.id, { author: v || undefined })}
                  placeholder="author"
                  className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]"
                />
                <input
                  type="number"
                  value={s.year ?? ''}
                  onChange={(e) =>
                    patch(s.id, {
                      year: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                    })
                  }
                  placeholder="year"
                  className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] tabular-nums py-0.5 text-right"
                />
              </div>
              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="prose-body italic text-[12px] text-[color:var(--color-brass-deep)] hover:underline flex items-center gap-1.5 mb-2"
                >
                  <ExternalLink size={10} />
                  {s.url}
                </a>
              )}
              <EditableText
                value={s.summary ?? ''}
                onChange={(v) => patch(s.id, { summary: v || undefined })}
                placeholder="summary · what does it contain"
                multiline
                rows={2}
                className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed block w-full mb-2"
              />
              <EditableText
                value={s.whyItMatters ?? ''}
                onChange={(v) => patch(s.id, { whyItMatters: v || undefined })}
                placeholder="why it matters · how it informs the show"
                multiline
                rows={2}
                className="prose-body italic text-[12px] text-[color:var(--color-brass-deep)] leading-relaxed block w-full pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]"
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ---------- Klapa catalogue (extended) ---------- */

function KlapaTab() {
  const { state, dispatch } = useApp();

  function patch(id: string, p: Partial<KlapaEntry>) {
    dispatch({ type: 'UPDATE_KLAPA', id, patch: p });
  }

  /* Group by region for navigation */
  const byRegion = new Map<string, KlapaEntry[]>();
  for (const k of state.klapa) {
    const arr = byRegion.get(k.region) ?? [];
    arr.push(k);
    byRegion.set(k.region, arr);
  }

  return (
    <div className="space-y-7">
      <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] max-w-[700px] leading-relaxed">
        Croatian klapa catalogue with extended metadata — full lyrics in HR + EN translation,
        BPM, mood. Songs in <span className="text-[color:var(--color-brass-deep)]">commissioned</span>{' '}
        / <span className="text-[color:var(--color-success)]">public-domain</span> rights have lower
        clearance friction.
      </p>

      {Array.from(byRegion.entries()).map(([region, songs]) => (
        <section
          key={region}
          className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden"
        >
          <header className="px-5 py-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
            <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
              {region.replace(/-/g, ' ')}
            </h3>
            <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] mt-0.5">
              {songs.length} song{songs.length === 1 ? '' : 's'}
            </p>
          </header>
          <ul>
            {songs.map((s) => (
              <li
                key={s.id}
                className="px-5 py-4 border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0 grid grid-cols-[1.5fr_1fr] gap-6"
              >
                <div>
                  <EditableText
                    value={s.songTitle}
                    onChange={(v) => patch(s.id, { songTitle: v })}
                    className="display-italic text-[16px] text-[color:var(--color-on-paper)] block mb-1"
                  />
                  {s.klapaName && (
                    <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mb-3">
                      performed by {s.klapaName}
                    </p>
                  )}
                  <div className="space-y-2">
                    <div>
                      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                        Lyrics · HR
                      </div>
                      <EditableText
                        value={s.lyricsHr ?? ''}
                        onChange={(v) => patch(s.id, { lyricsHr: v || undefined })}
                        placeholder="Croatian lyrics · stanza per line"
                        multiline
                        rows={3}
                        className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] leading-relaxed block w-full"
                      />
                    </div>
                    <div>
                      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                        Working translation · EN
                      </div>
                      <EditableText
                        value={s.lyricsEn ?? ''}
                        onChange={(v) => patch(s.id, { lyricsEn: v || undefined })}
                        placeholder="English working translation"
                        multiline
                        rows={3}
                        className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] leading-relaxed block w-full"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                        BPM
                      </div>
                      <input
                        type="number"
                        value={s.bpm ?? ''}
                        onChange={(e) =>
                          patch(s.id, {
                            bpm: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                          })
                        }
                        placeholder="—"
                        className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none display-italic text-[15px] text-[color:var(--color-on-paper)] tabular-nums w-full py-0.5"
                      />
                    </div>
                    <div>
                      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                        Mood
                      </div>
                      <EditableText
                        value={s.mood ?? ''}
                        onChange={(v) => patch(s.id, { mood: v || undefined })}
                        placeholder="lament · joy · longing"
                        className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                      Rights
                    </div>
                    <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]">
                      {s.rightsStatus.replace('-', ' ')}
                    </span>
                    {s.feeEstimateK != null && (
                      <span className="prose-body italic text-[12px] text-[color:var(--color-brass-deep)] ml-2 tabular-nums">
                        · {s.feeEstimateK}k €
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                      Notes
                    </div>
                    <EditableText
                      value={s.notes}
                      onChange={(v) => patch(s.id, { notes: v })}
                      placeholder="recording context · who knows who"
                      multiline
                      rows={2}
                      className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] leading-relaxed block w-full"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* ---------- Producers (wine + olive) ---------- */

function ProducersTab() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<ProducerKind | 'all'>('all');

  function add(kind: ProducerKind) {
    const producer: Producer = {
      id: newId('prod'),
      kind,
      name: kind === 'wine' ? 'New winery' : 'New oil mill',
      region: '',
    };
    dispatch({ type: 'ADD_PRODUCER', producer });
  }

  function patch(id: string, p: Partial<Producer>) {
    dispatch({ type: 'UPDATE_PRODUCER', id, patch: p });
  }

  function cycleFeature(p: Producer) {
    const cur = p.willingFeature ?? 'unknown';
    const idx = FEATURE_STATES.indexOf(cur);
    patch(p.id, { willingFeature: FEATURE_STATES[(idx + 1) % FEATURE_STATES.length] });
  }

  const filtered =
    filter === 'all' ? state.producers : state.producers.filter((p) => p.kind === filter);

  const wineCount = state.producers.filter((p) => p.kind === 'wine').length;
  const oliveCount = state.producers.filter((p) => p.kind === 'olive').length;

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] max-w-[700px] leading-relaxed">
          Croatian wine + olive producers Rene knows or wants to know. Episodes flag the most
          relevant. Cycle the feature status as relationships develop.
        </p>
        <div className="flex items-center gap-2">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            all · {state.producers.length}
          </FilterChip>
          <FilterChip active={filter === 'wine'} onClick={() => setFilter('wine')}>
            wine · {wineCount}
          </FilterChip>
          <FilterChip active={filter === 'olive'} onClick={() => setFilter('olive')}>
            olive · {oliveCount}
          </FilterChip>
        </div>
      </div>

      <div className="flex items-baseline gap-3">
        <button
          type="button"
          onClick={() => add('wine')}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add winery</span>
        </button>
        <button
          type="button"
          onClick={() => add('olive')}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add olive mill</span>
        </button>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((p) => {
          const ep = p.episodeId
            ? state.episodes.find((e) => e.id === p.episodeId) ?? null
            : null;
          return (
            <li
              key={p.id}
              className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4"
            >
              <header className="flex items-baseline justify-between mb-2">
                <div className="flex items-baseline gap-2.5">
                  <span
                    className={`label-caps tracking-[0.10em] text-[10px] ${
                      p.kind === 'wine'
                        ? 'text-[color:var(--color-coral-deep)]'
                        : 'text-[color:var(--color-olive)]'
                    }`}
                  >
                    {p.kind}
                  </span>
                  <EditableText
                    value={p.name}
                    onChange={(v) => patch(p.id, { name: v })}
                    className="display-italic text-[17px] text-[color:var(--color-on-paper)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => cycleFeature(p)}
                  className={`label-caps tracking-[0.12em] text-[10px] py-0.5 px-1.5 rounded-[2px] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors ${PRODUCER_FEATURE_TONE[p.willingFeature ?? 'unknown']}`}
                >
                  {p.willingFeature ?? 'unknown'}
                </button>
              </header>
              <EditableText
                value={p.region}
                onChange={(v) => patch(p.id, { region: v })}
                placeholder="region"
                className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] block mb-2"
              />
              <EditableText
                value={p.flagship ?? ''}
                onChange={(v) => patch(p.id, { flagship: v || undefined })}
                placeholder="flagship wine / oil"
                className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] block mb-2"
              />
              <div className="grid grid-cols-2 gap-3 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                <div>
                  <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                    Episode link
                  </div>
                  <select
                    value={p.episodeId ?? ''}
                    onChange={(e) => patch(p.id, { episodeId: e.target.value || undefined })}
                    className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[12px] text-[color:var(--color-on-paper)] py-0.5"
                  >
                    <option value="">— general —</option>
                    {state.episodes.map((e) => (
                      <option key={e.id} value={e.id}>
                        Ep {e.number} · {e.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                    Contact
                  </div>
                  <EditableText
                    value={p.contact ?? ''}
                    onChange={(v) => patch(p.id, { contact: v || undefined })}
                    placeholder="email · phone"
                    className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] block w-full"
                  />
                </div>
              </div>
              {p.notes && (
                <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-2 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)] leading-relaxed">
                  {p.notes}
                </p>
              )}
              {ep && (
                <p className="prose-body italic text-[11px] text-[color:var(--color-brass-deep)] mt-2">
                  → linked to Ep {ep.number} {ep.title}
                </p>
              )}
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete ${p.name}?`)) {
                      dispatch({ type: 'DELETE_PRODUCER', id: p.id });
                    }
                  }}
                  className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors"
                  aria-label="Delete producer"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Subjects ---------- */

function SubjectsTab() {
  const { state, dispatch } = useApp();

  function add() {
    const subject: Subject = {
      id: newId('subj'),
      name: 'New subject',
      role: '',
      episodeId: state.episodes[0]?.id ?? 'ep1',
      releaseStatus: 'pending',
    };
    dispatch({ type: 'ADD_SUBJECT', subject });
  }

  function patch(id: string, p: Partial<Subject>) {
    dispatch({ type: 'UPDATE_SUBJECT', id, patch: p });
  }

  function cycleRelease(s: Subject) {
    const cur = s.releaseStatus ?? 'pending';
    const idx = RELEASE_STATES.indexOf(cur);
    patch(s.id, { releaseStatus: RELEASE_STATES[(idx + 1) % RELEASE_STATES.length] });
  }

  const allEpisodes = [...state.episodes, ...state.specials];

  if (state.subjects.length === 0) {
    return (
      <div className="space-y-4">
        <div className="border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-7 py-12 text-center">
          <p className="display-italic text-[20px] text-[color:var(--color-on-paper)] mb-2">
            Subject database empty
          </p>
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mb-5 max-w-[560px] mx-auto leading-relaxed">
            Distinct from Talent (the pipeline) — Subjects are the people who actually appear
            on camera in the cut. Per subject: name · role · episode · release status · "great
            on camera" tag · follow-up notes.
          </p>
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-4 py-2 rounded-[2px] transition-colors"
          >
            <Plus size={12} />
            <span>add subject</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
          {state.subjects.length} subject{state.subjects.length === 1 ? '' : 's'} ·{' '}
          {state.subjects.filter((s) => s.releaseStatus === 'signed').length} signed releases
        </p>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add subject</span>
        </button>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {state.subjects.map((s) => {
          const ep = allEpisodes.find((e) => e.id === s.episodeId);
          return (
            <li
              key={s.id}
              className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4"
            >
              <header className="flex items-baseline justify-between mb-2">
                <EditableText
                  value={s.name}
                  onChange={(v) => patch(s.id, { name: v })}
                  className="display-italic text-[17px] text-[color:var(--color-on-paper)]"
                />
                <button
                  type="button"
                  onClick={() => cycleRelease(s)}
                  className={`label-caps tracking-[0.12em] text-[10px] py-0.5 px-1.5 rounded-[2px] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors ${RELEASE_TONE[s.releaseStatus ?? 'pending']}`}
                  title="Cycle release status"
                >
                  release · {s.releaseStatus ?? 'pending'}
                </button>
              </header>
              <EditableText
                value={s.role}
                onChange={(v) => patch(s.id, { role: v })}
                placeholder="role · 'elder fisherman' · 'klapa singer' · 'lighthouse keeper'"
                className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] block mb-3"
              />
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                    Episode
                  </div>
                  <select
                    value={s.episodeId}
                    onChange={(e) => patch(s.id, { episodeId: e.target.value })}
                    className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[12px] text-[color:var(--color-on-paper)] py-0.5"
                  >
                    {allEpisodes.map((e) => (
                      <option key={e.id} value={e.id}>
                        Ep {e.number} · {e.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                    Location
                  </div>
                  <EditableText
                    value={s.location ?? ''}
                    onChange={(v) => patch(s.id, { location: v || undefined })}
                    placeholder="anchorage · town"
                    className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] block w-full"
                  />
                </div>
              </div>
              <EditableText
                value={s.followUp ?? ''}
                onChange={(v) => patch(s.id, { followUp: v || undefined })}
                placeholder="follow-up · who's on it · when by"
                className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] block mb-2"
              />
              <div className="flex items-baseline justify-between pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                <button
                  type="button"
                  onClick={() => patch(s.id, { greatOnCamera: !s.greatOnCamera })}
                  className={`label-caps tracking-[0.12em] text-[10px] transition-colors ${
                    s.greatOnCamera
                      ? 'text-[color:var(--color-success)]'
                      : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
                  }`}
                >
                  {s.greatOnCamera ? '★ great on camera' : '☆ tag if great'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete ${s.name}?`)) {
                      dispatch({ type: 'DELETE_SUBJECT', id: s.id });
                    }
                  }}
                  className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors"
                  aria-label="Delete subject"
                >
                  <Trash2 size={11} />
                </button>
              </div>
              {ep && s.greatOnCamera && (
                <p className="prose-body italic text-[11px] text-[color:var(--color-brass-deep)] mt-2">
                  → headline subject for Ep {ep.number}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- shared ---------- */

function Tile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4">
      <div className="flex items-baseline gap-1.5 label-caps text-[color:var(--color-brass-deep)] mb-1.5">
        <Icon size={11} />
        <span>{label}</span>
      </div>
      <div className="display-italic text-[28px] text-[color:var(--color-on-paper)] tabular-nums leading-none">
        {value}
      </div>
      <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1">
        {sub}
      </div>
    </article>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`label-caps tracking-[0.12em] text-[10px] px-2 py-0.5 rounded-[2px] transition-colors ${
        active
          ? 'bg-[color:var(--color-brass)]/30 text-[color:var(--color-on-paper)]'
          : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
      }`}
    >
      {children}
    </button>
  );
}
