import { useState } from 'react';
import { ArrowRight, Plus, Printer, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { newId } from '../episode/shared';
import type { MoodMark, WrapEntry } from '../../types';
import { EditableText } from '../primitives/EditableText';
import { resolveShootDay, shootDaysSorted } from './productionSelectors';
import { DailyCallSheetPrint } from './DailyCallSheetPrint';
import { TomorrowsBrief } from './TomorrowsBrief';

const MOODS: MoodMark[] = ['great', 'good', 'ok', 'rough'];
const MOOD_TONE: Record<MoodMark, string> = {
  great: 'text-[color:var(--color-success)]',
  good: 'text-[color:var(--color-on-paper)]',
  ok: 'text-[color:var(--color-on-paper-muted)]',
  rough: 'text-[color:var(--color-coral-deep)]',
};

interface Props {
  previewDateIso?: string;
}

export function WrapTab({ previewDateIso }: Props) {
  const { state, dispatch } = useApp();
  const [printOpen, setPrintOpen] = useState(false);
  const [tomorrowOpen, setTomorrowOpen] = useState(false);

  const resolved = resolveShootDay(state, previewDateIso);
  const allDays = shootDaysSorted(state);
  /* Show wrap entries newest-first for the list view. */
  const sortedEntries = [...state.wrapEntries].sort((a, b) => b.date.localeCompare(a.date));

  /* "Today's wrap" = wrap entry for resolved.day.date (or null). */
  const todayDate = resolved?.day.date;
  const todayWrap = state.wrapEntries.find((w) => w.date === todayDate);

  function ensureWrap(date: string): WrapEntry {
    const existing = state.wrapEntries.find((w) => w.date === date);
    if (existing) return existing;
    const fresh: WrapEntry = {
      id: newId('wrap'),
      date,
      whatWorked: '',
      whatDidnt: '',
      tomorrowTweaks: '',
      moodMarks: {},
    };
    dispatch({ type: 'UPSERT_WRAP', entry: fresh });
    return fresh;
  }

  function patchWrap(date: string, p: Partial<WrapEntry>) {
    const w = ensureWrap(date);
    dispatch({ type: 'UPDATE_WRAP', id: w.id, patch: p });
  }

  function setMood(date: string, crewId: string, mood: MoodMark | null) {
    const w = ensureWrap(date);
    const next = { ...w.moodMarks };
    if (mood === null) delete next[crewId];
    else next[crewId] = mood;
    dispatch({ type: 'UPDATE_WRAP', id: w.id, patch: { moodMarks: next } });
  }

  /* Day-level take stats for variance feel. */
  function takeStatsFor(date: string) {
    const day = allDays.find((d) => d.date === date);
    if (!day) return { ng: 0, ok: 0, print: 0, total: 0 };
    const shotIds = state.shots.filter((s) => s.episodeId === day.episodeId).map((s) => s.id);
    const takes = state.takes.filter((t) => shotIds.includes(t.shotId));
    return {
      ng: takes.filter((t) => t.status === 'NG').length,
      ok: takes.filter((t) => t.status === 'OK').length,
      print: takes.filter((t) => t.status === 'PRINT').length,
      total: takes.length,
    };
  }

  return (
    <div className="space-y-7 max-w-[1200px]">
      {/* Today's wrap editor (auto-resolves to current shoot day) */}
      {resolved && todayDate && (
        <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6">
          <header className="flex items-baseline justify-between mb-5 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
            <div>
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                Day {resolved.index} of {resolved.total}
              </div>
              <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
                Wrap for {fmtIsoDate(todayDate)}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPrintOpen(true)}
                className="flex items-center gap-1.5 label-caps text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-paper-strong)] hover:border-[color:var(--color-brass)] px-3 py-1.5 rounded-[2px] transition-colors"
                title="Print Daily Call Sheet for this day"
              >
                <Printer size={11} />
                <span>call sheet</span>
              </button>
              <button
                type="button"
                onClick={() => setTomorrowOpen(true)}
                className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
                title="Compile tomorrow's brief from today's wrap"
              >
                <span>tomorrow's brief</span>
                <ArrowRight size={11} />
              </button>
            </div>
          </header>

          {/* Three-up debrief */}
          <div className="grid grid-cols-3 gap-7 mb-7">
            <DebriefField
              label="What worked"
              value={todayWrap?.whatWorked ?? ''}
              placeholder="The catch came in by 8am, light held all morning, Marko was a natural…"
              onChange={(v) => patchWrap(todayDate, { whatWorked: v })}
            />
            <DebriefField
              label="What didn't"
              value={todayWrap?.whatDidnt ?? ''}
              placeholder="RF interference on lavs after 10am, drone batteries cut short, lunch ran long…"
              onChange={(v) => patchWrap(todayDate, { whatDidnt: v })}
            />
            <DebriefField
              label="Tomorrow's tweaks"
              value={todayWrap?.tomorrowTweaks ?? ''}
              placeholder="Move first call to 06:30, swap to MKH-50 boom, brief crew on quiet during catch…"
              onChange={(v) => patchWrap(todayDate, { tomorrowTweaks: v })}
            />
          </div>

          {/* Mood marks per crew */}
          <div className="space-y-3 pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            <div className="flex items-baseline justify-between">
              <span className="label-caps text-[color:var(--color-brass-deep)]">
                Mood per crew
              </span>
              <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
                tap a chip · click again to clear
              </span>
            </div>
            {state.crew.length === 0 ? (
              <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)]">
                Add crew to log moods.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {state.crew.map((c) => {
                  const cur = todayWrap?.moodMarks[c.id];
                  return (
                    <li
                      key={c.id}
                      className="grid grid-cols-[1fr_auto] items-center gap-4 py-1.5"
                    >
                      <div>
                        <span className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
                          {c.name}
                        </span>
                        <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] ml-2">
                          {c.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {MOODS.map((m) => {
                          const active = cur === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setMood(todayDate, c.id, active ? null : m)}
                              className={`label-caps tracking-[0.12em] text-[10px] px-2 py-1 rounded-[2px] transition-colors ${
                                active
                                  ? `bg-[color:var(--color-paper-deep)]/40 ${MOOD_TONE[m]}`
                                  : `text-[color:var(--color-on-paper-faint)] hover:${MOOD_TONE[m]}`
                              }`}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Hours + variance */}
          <div className="grid grid-cols-3 gap-5 pt-5 mt-5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            <NumberField
              label="Hours rolled"
              value={todayWrap?.hoursRolled ?? null}
              onChange={(v) => patchWrap(todayDate, { hoursRolled: v ?? undefined })}
            />
            <div>
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
                Take ratio
              </div>
              <TakeRatio stats={takeStatsFor(todayDate)} />
            </div>
            <DebriefField
              compact
              label="Variance"
              value={todayWrap?.variance ?? ''}
              placeholder="dropped scene 2, anchorage swap from Komiža → Vis"
              onChange={(v) => patchWrap(todayDate, { variance: v })}
            />
          </div>
        </section>
      )}

      {/* Past wraps */}
      {sortedEntries.length > 0 && (
        <section>
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] mb-3">
            Wrap log
          </h3>
          <ul className="space-y-2">
            {sortedEntries
              .filter((w) => w.date !== todayDate)
              .map((w) => (
                <PastWrapRow key={w.id} entry={w} stats={takeStatsFor(w.date)} />
              ))}
          </ul>
        </section>
      )}

      {sortedEntries.length === 0 && !resolved && (
        <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
          No shoot days configured. Add shoot days in Schedule to start wrapping.
        </p>
      )}

      {printOpen && resolved && (
        <DailyCallSheetPrint
          shootDay={resolved.day}
          dayIndex={resolved.index}
          totalDays={resolved.total}
          onClose={() => setPrintOpen(false)}
        />
      )}
      {tomorrowOpen && resolved && (
        <TomorrowsBrief
          todayDate={resolved.day.date}
          onClose={() => setTomorrowOpen(false)}
        />
      )}
    </div>
  );
}

/* ---------- Sub components ---------- */

function DebriefField({
  label,
  value,
  placeholder,
  onChange,
  compact,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <div>
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">{label}</div>
      <EditableText
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        multiline={!compact}
        rows={compact ? 1 : 4}
        className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed block w-full"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">{label}</div>
      <input
        type="number"
        step="0.5"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? null : parseFloat(v));
        }}
        placeholder="—"
        className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none display-italic text-[20px] text-[color:var(--color-on-paper)] tabular-nums w-full py-0.5"
      />
    </div>
  );
}

function TakeRatio({
  stats,
}: {
  stats: { ng: number; ok: number; print: number; total: number };
}) {
  if (stats.total === 0) {
    return (
      <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)]">
        No takes logged for this day.
      </p>
    );
  }
  const printPct = Math.round((stats.print / stats.total) * 100);
  return (
    <div>
      <div className="display-italic text-[20px] text-[color:var(--color-on-paper)] tabular-nums">
        {stats.print}/{stats.total}{' '}
        <span className="text-[color:var(--color-brass-deep)]">prints</span>
      </div>
      <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5 tabular-nums">
        {stats.ng} NG · {stats.ok} OK · {printPct}% printed
      </div>
    </div>
  );
}

function PastWrapRow({
  entry,
  stats,
}: {
  entry: WrapEntry;
  stats: { ng: number; ok: number; print: number; total: number };
}) {
  const { dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const moods = Object.values(entry.moodMarks);
  const moodCount = moods.length;
  const positive = moods.filter((m) => m === 'great' || m === 'good').length;

  return (
    <li className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-5 py-3 grid grid-cols-[160px_1fr_auto_28px] items-center gap-5 hover:bg-[color:var(--color-paper-deep)]/15 transition-colors"
      >
        <span className="display-italic text-[15px] text-[color:var(--color-on-paper)]">
          {fmtIsoDate(entry.date)}
        </span>
        <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] truncate">
          {entry.whatWorked || entry.whatDidnt || entry.tomorrowTweaks || (
            <em className="text-[color:var(--color-on-paper-faint)]">no notes yet</em>
          )}
        </span>
        <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums">
          {stats.total > 0 && `${stats.print}/${stats.total} prints`}
          {moodCount > 0 && (
            <span className="ml-2.5 text-[color:var(--color-brass-deep)]">
              {positive}/{moodCount} positive
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Delete wrap for ${entry.date}?`)) {
              dispatch({ type: 'DELETE_WRAP', id: entry.id });
            }
          }}
          className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors justify-self-end"
          aria-label="Delete wrap"
        >
          <Trash2 size={11} />
        </button>
      </button>
      {open && (
        <div className="px-5 py-4 border-t-[0.5px] border-[color:var(--color-border-paper)] grid grid-cols-3 gap-6 prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] leading-relaxed">
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
              What worked
            </div>
            {entry.whatWorked || '—'}
          </div>
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
              What didn't
            </div>
            {entry.whatDidnt || '—'}
          </div>
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
              Tomorrow's tweaks
            </div>
            {entry.tomorrowTweaks || '—'}
          </div>
        </div>
      )}
    </li>
  );
}

function fmtIsoDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/* Workaround: keep `Plus` icon in scope for future variance "add row" UI. */
export const _icons = { Plus };
