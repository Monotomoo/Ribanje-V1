import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type {
  DecisionEntry,
  DecisionScope,
  JournalEntry,
  MoodTag,
  VoiceMemo,
} from '../../types';
import { EditableText } from '../primitives/EditableText';
import { AudioRecorder } from '../primitives/AudioRecorder';
import { AudioWaveform } from '../primitives/AudioWaveform';
import { newId } from '../episode/shared';

const MOOD_CYCLE: MoodTag[] = ['great', 'good', 'neutral', 'rough', 'bad'];

const MOOD_TONE: Record<MoodTag, string> = {
  great: 'text-[color:var(--color-success)]',
  good: 'text-[color:var(--color-success)]',
  neutral: 'text-[color:var(--color-on-paper-muted)]',
  rough: 'text-[color:var(--color-warn)]',
  bad: 'text-[color:var(--color-coral-deep)]',
};

const SHOOT_START = new Date('2026-10-01T00:00:00Z').getTime();

function shootDayFor(iso: string): number | undefined {
  const t = new Date(iso + 'T00:00:00Z').getTime();
  if (isNaN(t)) return undefined;
  if (t < SHOOT_START) return undefined;
  const days = Math.floor((t - SHOOT_START) / (1000 * 60 * 60 * 24)) + 1;
  return days <= 60 ? days : undefined;
}

function timeOfDayFromHour(hour: number): string {
  if (hour < 5) return 'night';
  if (hour < 8) return 'sunrise';
  if (hour < 11) return 'morning';
  if (hour < 14) return 'midday';
  if (hour < 18) return 'afternoon';
  if (hour < 21) return 'sunset';
  return 'night';
}

type TabKey = 'diary' | 'memos' | 'decisions';

export function JournalView() {
  const { state } = useApp();
  const [tab, setTab] = useState<TabKey>('diary');

  return (
    <div className="space-y-7 max-w-[1100px]">
      <nav
        role="tablist"
        className="flex items-baseline gap-1.5 border-b-[0.5px] border-[color:var(--color-border-paper)]"
      >
        {(
          [
            { key: 'diary', label: 'Diary', hint: 'one slate per shoot day' },
            { key: 'memos', label: 'Voice memos', hint: 'dictate · transcribe · search' },
            { key: 'decisions', label: 'Decisions', hint: 'why we chose what we chose' },
          ] as { key: TabKey; label: string; hint: string }[]
        ).map((t) => {
          const active = tab === t.key;
          const count =
            t.key === 'diary'
              ? state.journalEntries.length
              : t.key === 'memos'
              ? state.voiceMemos.length
              : state.decisions.length;
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
              {count > 0 && (
                <span className="ml-2 prose-body italic text-[11px] text-[color:var(--color-brass-deep)] tabular-nums">
                  {count}
                </span>
              )}
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

      {tab === 'diary' && <DiaryTab />}
      {tab === 'memos' && <VoiceMemosTab />}
      {tab === 'decisions' && <DecisionsTab />}
    </div>
  );
}

/* ---------- Decisions tab ---------- */

const DECISION_SCOPES: DecisionScope[] = ['creative', 'production', 'financial', 'logistical', 'other'];
const SCOPE_TONE: Record<DecisionScope, string> = {
  creative: 'text-[color:var(--color-brass-deep)]',
  production: 'text-[color:var(--color-on-paper)]',
  financial: 'text-[color:var(--color-coral-deep)]',
  logistical: 'text-[color:var(--color-olive)]',
  other: 'text-[color:var(--color-on-paper-muted)]',
};

function DecisionsTab() {
  const { state, dispatch } = useApp();
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [filterScope, setFilterScope] = useState<DecisionScope | 'all'>('all');

  function add() {
    const decision: DecisionEntry = {
      id: newId('dec'),
      date: new Date().toISOString().slice(0, 10),
      title: 'New decision',
      chosen: '',
      scope: 'creative',
    };
    dispatch({ type: 'ADD_DECISION', decision });
    setOpenIds((s) => new Set([...s, decision.id]));
  }

  function patch(id: string, p: Partial<DecisionEntry>) {
    dispatch({ type: 'UPDATE_DECISION', id, patch: p });
  }

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sorted = [...state.decisions].sort((a, b) => b.date.localeCompare(a.date));
  const filtered =
    filterScope === 'all' ? sorted : sorted.filter((d) => d.scope === filterScope);

  const counts: Record<DecisionScope | 'all', number> = {
    all: sorted.length,
    creative: sorted.filter((d) => d.scope === 'creative').length,
    production: sorted.filter((d) => d.scope === 'production').length,
    financial: sorted.filter((d) => d.scope === 'financial').length,
    logistical: sorted.filter((d) => d.scope === 'logistical').length,
    other: sorted.filter((d) => d.scope === 'other').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
            Decision register
          </h2>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5 max-w-[640px] leading-relaxed">
            Every meaningful choice — what we considered, what we picked, why. Six months from
            now, when "wait, why did we drop that anchorage?", the answer is here.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>log decision</span>
        </button>
      </div>

      {/* Scope filter chips */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">scope</span>
        <FilterChip
          active={filterScope === 'all'}
          onClick={() => setFilterScope('all')}
        >
          all · {counts.all}
        </FilterChip>
        {DECISION_SCOPES.map((s) => (
          <FilterChip
            key={s}
            active={filterScope === s}
            onClick={() => setFilterScope(s)}
          >
            {s} · {counts[s]}
          </FilterChip>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-7 py-10 text-center">
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
            {sorted.length === 0
              ? 'No decisions logged yet. Click "log decision" when you make one worth remembering.'
              : `No decisions in ${filterScope} scope.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((d) => {
            const open = openIds.has(d.id);
            return (
              <li
                key={d.id}
                className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(d.id)}
                  className="w-full text-left px-5 py-3 grid grid-cols-[28px_120px_110px_1fr_28px] items-baseline gap-4 hover:bg-[color:var(--color-paper-deep)]/15 transition-colors"
                >
                  {open ? (
                    <ChevronDown size={13} className="text-[color:var(--color-on-paper-faint)]" />
                  ) : (
                    <ChevronRight size={13} className="text-[color:var(--color-on-paper-faint)]" />
                  )}
                  <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums">
                    {d.date}
                  </span>
                  <span className={`label-caps tracking-[0.12em] text-[10px] ${SCOPE_TONE[d.scope]}`}>
                    {d.scope}
                  </span>
                  <span className="display-italic text-[15px] text-[color:var(--color-on-paper)] truncate">
                    {d.title}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete decision?')) {
                        dispatch({ type: 'DELETE_DECISION', id: d.id });
                      }
                    }}
                    className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors justify-self-end"
                    aria-label="Delete decision"
                  >
                    <Trash2 size={11} />
                  </button>
                </button>
                {open && (
                  <div className="px-5 pb-5 pt-1 space-y-4 bg-[color:var(--color-paper)]">
                    <div className="grid grid-cols-3 gap-5">
                      <DecisionField label="Date">
                        <input
                          type="date"
                          value={d.date}
                          onChange={(e) => patch(d.id, { date: e.target.value })}
                          className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-1"
                        />
                      </DecisionField>
                      <DecisionField label="Scope">
                        <select
                          value={d.scope}
                          onChange={(e) => patch(d.id, { scope: e.target.value as DecisionScope })}
                          className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-1"
                        >
                          {DECISION_SCOPES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </DecisionField>
                      <DecisionField label="Owner">
                        <select
                          value={d.ownerId ?? ''}
                          onChange={(e) => patch(d.id, { ownerId: e.target.value || undefined })}
                          className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-1"
                        >
                          <option value="">— who decided —</option>
                          {state.crew.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </DecisionField>
                    </div>

                    <DecisionField label="Title">
                      <EditableText
                        value={d.title}
                        onChange={(v) => patch(d.id, { title: v })}
                        placeholder="One line — what was decided?"
                        className="display-italic text-[18px] text-[color:var(--color-on-paper)] block w-full"
                      />
                    </DecisionField>

                    <DecisionField label="Context · what prompted this">
                      <EditableText
                        value={d.context ?? ''}
                        onChange={(v) => patch(d.id, { context: v || undefined })}
                        placeholder="The situation that forced the decision."
                        multiline
                        rows={2}
                        className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed block w-full"
                      />
                    </DecisionField>

                    <DecisionField label="Considered · what was on the table">
                      <EditableText
                        value={d.considered ?? ''}
                        onChange={(v) => patch(d.id, { considered: v || undefined })}
                        placeholder="A: ___ · B: ___ · C: ___"
                        multiline
                        rows={3}
                        className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed block w-full"
                      />
                    </DecisionField>

                    <DecisionField label="Chosen · what we picked">
                      <EditableText
                        value={d.chosen}
                        onChange={(v) => patch(d.id, { chosen: v })}
                        placeholder="The path we took."
                        multiline
                        rows={2}
                        className="prose-body text-[14px] text-[color:var(--color-on-paper)] leading-relaxed block w-full"
                      />
                    </DecisionField>

                    <DecisionField label="Why">
                      <EditableText
                        value={d.why ?? ''}
                        onChange={(v) => patch(d.id, { why: v || undefined })}
                        placeholder="The reasoning. Future-you will thank past-you."
                        multiline
                        rows={3}
                        className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed block w-full"
                      />
                    </DecisionField>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DecisionField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">{label}</div>
      {children}
    </div>
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

/* ---------- Diary tab (the original journal) ---------- */

function DiaryTab() {
  const { state, dispatch } = useApp();

  function add() {
    const today = new Date().toISOString().slice(0, 10);
    const entry: JournalEntry = {
      id: newId('j'),
      date: today,
      shootDayIdx: shootDayFor(today),
      anchorageId: state.locations[0]?.id,
      weather: '',
      whatHappened: '',
      moodTag: 'neutral',
    };
    dispatch({ type: 'ADD_JOURNAL', entry });
  }

  const entries = [...state.journalEntries].sort((a, b) =>
    a.date < b.date ? 1 : -1
  );

  return (
    <div className="space-y-7">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
            Production diary
          </h2>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Log a day on the boat. Slate-stamped, mood-tagged, anchorage-anchored.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] rounded-[2px] px-3 py-1.5 transition-colors"
        >
          <Plus size={11} />
          New entry
        </button>
      </div>

      {entries.length === 0 && (
        <div className="border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-7 py-12 text-center">
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
            No entries yet. The first one lands on shoot day one — October 2026.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {entries.map((e) => (
          <EntryCard key={e.id} entry={e} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Voice memos tab ---------- */

const SCOPES: NonNullable<VoiceMemo['scope']>[] = [
  'idea',
  'note',
  'observation',
  'beat',
  'interview',
];

function VoiceMemosTab() {
  const { state, dispatch } = useApp();
  const [language, setLanguage] = useState<'en-US' | 'hr-HR'>('en-US');
  const [search, setSearch] = useState('');

  function handleRecorded(data: {
    blob: Blob;
    base64: string;
    durationMs: number;
    transcript?: string;
    mimeType: string;
  }) {
    const memo: VoiceMemo = {
      id: newId('memo'),
      recordedAt: new Date().toISOString(),
      durationMs: data.durationMs,
      audioBase64: data.base64,
      mimeType: data.mimeType,
      transcript: data.transcript,
      scope: 'note',
    };
    dispatch({ type: 'ADD_VOICE_MEMO', memo });
  }

  function patch(id: string, p: Partial<VoiceMemo>) {
    dispatch({ type: 'UPDATE_VOICE_MEMO', id, patch: p });
  }

  const sorted = [...state.voiceMemos].sort((a, b) =>
    b.recordedAt.localeCompare(a.recordedAt)
  );

  const filtered = search.trim()
    ? sorted.filter((m) => {
        const q = search.toLowerCase();
        return (
          (m.transcript ?? '').toLowerCase().includes(q) ||
          (m.label ?? '').toLowerCase().includes(q) ||
          (m.scope ?? '').toLowerCase().includes(q)
        );
      })
    : sorted;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
            Voice memos
          </h2>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Dictate ideas, observations, beat fragments. Auto-transcribed in EN or HR.
            Searchable across the library.
          </p>
        </div>
        <div className="flex items-center gap-2 label-caps">
          <span className="text-[color:var(--color-on-paper-faint)]">language</span>
          <button
            type="button"
            onClick={() => setLanguage('en-US')}
            className={`px-2 py-0.5 rounded-[2px] transition-colors ${
              language === 'en-US'
                ? 'bg-[color:var(--color-brass)]/30 text-[color:var(--color-on-paper)]'
                : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hr-HR')}
            className={`px-2 py-0.5 rounded-[2px] transition-colors ${
              language === 'hr-HR'
                ? 'bg-[color:var(--color-brass)]/30 text-[color:var(--color-on-paper)]'
                : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
            }`}
          >
            HR
          </button>
        </div>
      </div>

      {/* Recorder */}
      <AudioRecorder
        onRecorded={handleRecorded}
        language={language}
        showTranscript
        hint={`click the mic to dictate · ${language === 'hr-HR' ? 'Croatian' : 'English'} transcription`}
      />

      {/* Search */}
      {sorted.length > 0 && (
        <div className="flex items-baseline gap-3">
          <span className="label-caps text-[color:var(--color-on-paper-faint)]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="transcript · label · scope"
            className="flex-1 bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-1"
          />
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] tabular-nums">
            {filtered.length} of {sorted.length}
          </span>
        </div>
      )}

      {/* Memo list */}
      {sorted.length === 0 ? (
        <div className="border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-7 py-10 text-center">
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
            No memos yet. Tap the brass mic to record your first.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((m) => (
            <MemoCard
              key={m.id}
              memo={m}
              onPatch={(p) => patch(m.id, p)}
              onDelete={() => {
                if (window.confirm('Delete memo?')) {
                  dispatch({ type: 'DELETE_VOICE_MEMO', id: m.id });
                }
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function MemoCard({
  memo,
  onPatch,
  onDelete,
}: {
  memo: VoiceMemo;
  onPatch: (p: Partial<VoiceMemo>) => void;
  onDelete: () => void;
}) {
  const { state } = useApp();
  const allEpisodes = [...state.episodes, ...state.specials];
  const ep = memo.episodeId ? allEpisodes.find((e) => e.id === memo.episodeId) : null;

  return (
    <li className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-3">
          <span className="display-italic text-[16px] text-[color:var(--color-on-paper)] tabular-nums">
            {fmtDateTime(memo.recordedAt)}
          </span>
          <span className="label-caps text-[color:var(--color-brass-deep)] tabular-nums">
            {fmtDuration(memo.durationMs)}
          </span>
          <select
            value={memo.scope ?? ''}
            onChange={(e) =>
              onPatch({ scope: (e.target.value || undefined) as VoiceMemo['scope'] })
            }
            className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none label-caps text-[10px] tracking-[0.10em] text-[color:var(--color-on-paper-muted)] py-0.5"
          >
            <option value="">— scope —</option>
            {SCOPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={memo.episodeId ?? ''}
            onChange={(e) => onPatch({ episodeId: e.target.value || undefined })}
            className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none label-caps text-[10px] tracking-[0.10em] text-[color:var(--color-on-paper-muted)] py-0.5"
          >
            <option value="">— episode —</option>
            {allEpisodes.map((e) => (
              <option key={e.id} value={e.id}>
                Ep {e.number} · {e.title}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors"
          aria-label="Delete memo"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <audio controls src={memo.audioBase64} className="h-8 max-w-[280px]" />
        <AudioWaveform blobBase64={memo.audioBase64} width={200} height={32} bars={48} />
      </div>

      <EditableText
        value={memo.label ?? ''}
        onChange={(v) => onPatch({ label: v || undefined })}
        placeholder="optional label · what's the takeaway"
        className="display-italic text-[15px] text-[color:var(--color-on-paper)] block mb-2"
      />
      {memo.transcript ? (
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] leading-relaxed pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          {memo.transcript}
        </p>
      ) : (
        <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          No transcript captured.{ep ? ` · linked to ${ep.title}` : ''}
        </p>
      )}
      {ep && memo.transcript && (
        <p className="prose-body italic text-[11px] text-[color:var(--color-brass-deep)] mt-1.5">
          → linked to Ep {ep.number} {ep.title}
        </p>
      )}
    </li>
  );
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

/* ---------- Diary entry card (unchanged from original) ---------- */

function EntryCard({ entry }: { entry: JournalEntry }) {
  const { state, dispatch } = useApp();
  const loc = state.locations.find((l) => l.id === entry.anchorageId);
  function patch(p: Partial<JournalEntry>) {
    dispatch({ type: 'UPDATE_JOURNAL', id: entry.id, patch: p });
  }
  function cycleMood() {
    const i = MOOD_CYCLE.indexOf(entry.moodTag);
    patch({ moodTag: MOOD_CYCLE[(i + 1) % MOOD_CYCLE.length] });
  }
  const day = shootDayFor(entry.date);
  const dayLabel = day ? `Day ${String(day).padStart(2, '0')}` : 'Pre-shoot';
  const todHour = new Date().getHours();
  const tod = timeOfDayFromHour(todHour);

  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
      {/* Slate stamp */}
      <header
        className="px-7 py-3 flex items-baseline gap-4"
        style={{ background: 'linear-gradient(180deg, #14253A 0%, #1B3050 50%, #14253A 100%)' }}
      >
        <span className="label-caps text-[color:var(--color-brass)]">{entry.date}</span>
        <span className="text-[color:var(--color-on-chrome-faint)]">·</span>
        <span className="label-caps text-[color:var(--color-on-chrome)]">{dayLabel}</span>
        <span className="text-[color:var(--color-on-chrome-faint)]">·</span>
        <span className="label-caps text-[color:var(--color-on-chrome-muted)]">{tod}</span>
        <span className="ml-auto label-caps text-[color:var(--color-on-chrome-faint)]">
          {loc?.label ?? '—'}
        </span>
      </header>

      <div className="px-7 py-5 space-y-4">
        <div className="grid grid-cols-3 gap-5">
          <Field label="Date">
            <input
              type="date"
              value={entry.date}
              onChange={(e) => {
                const date = e.target.value;
                patch({ date, shootDayIdx: shootDayFor(date) });
              }}
              className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[14px] text-[color:var(--color-on-paper)] py-1"
            />
          </Field>
          <Field label="Anchorage">
            <select
              value={entry.anchorageId ?? ''}
              onChange={(e) => patch({ anchorageId: e.target.value || undefined })}
              className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[14px] text-[color:var(--color-on-paper)] py-1"
            >
              <option value="">— shore / unspecified —</option>
              {state.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Weather">
            <EditableText
              value={entry.weather}
              onChange={(v) => patch({ weather: v })}
              placeholder="bura · jugo · calm"
              className="prose-body italic text-[14px] text-[color:var(--color-on-paper)]"
            />
          </Field>
        </div>

        <Field label="What happened">
          <EditableText
            value={entry.whatHappened}
            onChange={(v) => patch({ whatHappened: v })}
            multiline
            rows={4}
            placeholder="The day, in your own words."
            className="prose-body text-[15px] text-[color:var(--color-on-paper)] leading-[1.6]"
          />
        </Field>

        <div className="flex items-center justify-between pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          <button
            type="button"
            onClick={cycleMood}
            className={`label-caps border-[0.5px] border-current rounded-full px-3 py-[3px] hover:opacity-80 transition-opacity ${MOOD_TONE[entry.moodTag]}`}
            title="cycle mood"
          >
            {entry.moodTag}
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'DELETE_JOURNAL', id: entry.id })}
            aria-label="Delete entry"
            className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] p-1"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}
