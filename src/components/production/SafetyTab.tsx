import { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Phone,
  Plus,
  Radio,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { newId } from '../episode/shared';
import type { IncidentEntry, IncidentSeverity, SafetyDay } from '../../types';
import { EditableText } from '../primitives/EditableText';
import { resolveShootDay } from './productionSelectors';

interface Props {
  previewDateIso?: string;
}

const SAFETY_FIELDS: Array<{
  field: keyof Pick<
    SafetyDay,
    'lifeVestsIssued' | 'weatherChecked' | 'mobDrillScheduled' | 'commsOK' | 'briefingComplete'
  >;
  label: string;
  hint?: string;
}> = [
  { field: 'lifeVestsIssued', label: 'Life vests issued', hint: 'count vs crew aboard' },
  { field: 'weatherChecked', label: 'Weather + sea state checked' },
  { field: 'mobDrillScheduled', label: 'MOB drill (if scheduled)' },
  { field: 'commsOK', label: 'Walkies + comms tested' },
  { field: 'briefingComplete', label: 'Briefing complete' },
];

const EMERGENCY_CONTACTS: Array<{ label: string; number: string; sub?: string }> = [
  { label: 'Coast Guard (HR)', number: '195', sub: 'VHF 16 first · then phone' },
  { label: 'EU emergency', number: '112' },
  { label: 'Medical assistance', number: '194' },
  { label: 'Diving emergency (DAN)', number: '+385 1 4940 660' },
  { label: 'Production office', number: '— add Tomo cell' },
  { label: 'Insurance hotline', number: '— add policy phone' },
];

const SEVERITIES: IncidentSeverity[] = ['note', 'minor', 'major', 'critical'];
const SEVERITY_TONE: Record<IncidentSeverity, string> = {
  note: 'text-[color:var(--color-on-paper-muted)]',
  minor: 'text-[color:var(--color-warn)]',
  major: 'text-[color:var(--color-coral-deep)]',
  critical: 'text-[color:var(--color-coral-deep)] font-semibold',
};

export function SafetyTab({ previewDateIso }: Props) {
  const { state, dispatch } = useApp();
  const resolved = resolveShootDay(state, previewDateIso);

  if (!resolved) {
    return (
      <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
        No shoot days configured.
      </p>
    );
  }

  const todayDate = resolved.day.date;
  const today = state.safetyDays.find((s) => s.date === todayDate);

  function ensureToday(): SafetyDay {
    if (today) return today;
    const fresh: SafetyDay = {
      id: `safety-${todayDate}`,
      date: todayDate,
      lifeVestsIssued: false,
      weatherChecked: false,
      mobDrillScheduled: false,
      commsOK: false,
      briefingComplete: false,
    };
    dispatch({ type: 'UPSERT_SAFETY', day: fresh });
    return fresh;
  }

  function toggleField(field: typeof SAFETY_FIELDS[number]['field'], v: boolean) {
    const t = ensureToday();
    dispatch({ type: 'UPDATE_SAFETY', id: t.id, patch: { [field]: v } });
  }

  function patchNotes(v: string) {
    const t = ensureToday();
    dispatch({ type: 'UPDATE_SAFETY', id: t.id, patch: { notes: v || undefined } });
  }

  /* Across-shoot completion summary */
  const completionsByDay = state.safetyDays.map((s) => {
    const fields = SAFETY_FIELDS.map((f) => s[f.field]);
    const done = fields.filter(Boolean).length;
    return { date: s.date, done, total: fields.length };
  });
  const fullyComplete = completionsByDay.filter((c) => c.done === c.total).length;

  return (
    <div className="space-y-7 max-w-[1200px]">
      {/* Today's brief */}
      <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6">
        <header className="flex items-baseline justify-between mb-5 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
              Day {resolved.index} · {fmtIsoDate(todayDate)}
            </div>
            <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
              Today's safety brief
            </h2>
          </div>
          <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
            tap each item · brief crew before first call
          </span>
        </header>

        <ul className="space-y-2">
          {SAFETY_FIELDS.map((f) => {
            const on = today?.[f.field] ?? false;
            return (
              <li key={f.field} className="flex items-baseline gap-3">
                <button
                  type="button"
                  onClick={() => toggleField(f.field, !on)}
                  className={`mt-0.5 w-5 h-5 rounded-[2px] border flex items-center justify-center shrink-0 transition-colors ${
                    on
                      ? 'bg-[color:var(--color-success)] border-[color:var(--color-success)]'
                      : 'bg-transparent border-[color:var(--color-border-paper-strong)] hover:border-[color:var(--color-brass)]'
                  }`}
                  aria-label={`Toggle ${f.label}`}
                >
                  {on && <CheckCircle2 size={14} className="text-[color:var(--color-paper)]" />}
                </button>
                <div className="flex-1 flex items-baseline justify-between">
                  <span
                    className={`prose-body italic text-[14px] ${
                      on
                        ? 'text-[color:var(--color-on-paper)]'
                        : 'text-[color:var(--color-on-paper-muted)]'
                    }`}
                  >
                    {f.label}
                  </span>
                  {f.hint && (
                    <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
                      {f.hint}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 pt-4 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
            Notes
          </div>
          <EditableText
            multiline
            rows={2}
            value={today?.notes ?? ''}
            onChange={patchNotes}
            placeholder="RF check pending — Marko swapping channels. Sea state OK."
            className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed block w-full"
          />
        </div>
      </section>

      {/* Walkie + comms */}
      <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6">
        <header className="flex items-baseline gap-2 mb-4">
          <Radio size={13} className="text-[color:var(--color-brass-deep)]" />
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Walkie + comms plan
          </h3>
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
            primary / backup per crew · coordinate with Sound's RF map
          </span>
        </header>
        {state.walkieChannels.length === 0 ? (
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)]">
            No walkie channels assigned. Assign in seed or via the API.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-7 gap-y-2">
            {state.walkieChannels.map((w) => {
              const c = state.crew.find((x) => x.id === w.crewId);
              return (
                <li
                  key={w.id}
                  className="flex items-baseline justify-between border-b-[0.5px] border-[color:var(--color-border-paper)] pb-2 last:border-b-0"
                >
                  <div>
                    <div className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
                      {c?.name ?? 'unknown crew'}
                    </div>
                    <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
                      {c?.role}
                    </div>
                  </div>
                  <div className="display-italic text-[16px] text-[color:var(--color-brass-deep)] tabular-nums whitespace-nowrap">
                    ch {w.primary}
                    {w.backup && (
                      <span className="text-[color:var(--color-on-paper-faint)] ml-1.5">
                        / {w.backup}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Emergency contacts + incident log side by side */}
      <div className="grid grid-cols-2 gap-6">
        <section className="bg-[color:var(--color-coral-deep)]/8 border-[0.5px] border-[color:var(--color-coral)]/40 rounded-[3px] px-6 py-5">
          <header className="flex items-baseline gap-2 mb-4">
            <Phone size={13} className="text-[color:var(--color-coral-deep)]" />
            <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
              Emergency contacts
            </h3>
          </header>
          <ul className="space-y-2.5">
            {EMERGENCY_CONTACTS.map((c) => (
              <li
                key={c.label}
                className="flex items-baseline justify-between gap-3 border-b-[0.5px] border-[color:var(--color-coral)]/15 pb-2 last:border-b-0"
              >
                <div>
                  <div className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
                    {c.label}
                  </div>
                  {c.sub && (
                    <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
                      {c.sub}
                    </div>
                  )}
                </div>
                <span className="display-italic text-[18px] text-[color:var(--color-coral-deep)] tabular-nums whitespace-nowrap">
                  {c.number}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
          <header className="flex items-baseline gap-2 mb-4">
            <ShieldCheck size={13} className="text-[color:var(--color-brass-deep)]" />
            <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
              Briefing completion
            </h3>
          </header>
          <div className="display-italic text-[36px] text-[color:var(--color-on-paper)] tabular-nums">
            {fullyComplete} / {state.shootDays.length}
          </div>
          <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-1">
            shoot days with all 5 brief items checked
          </p>
          <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-3 leading-relaxed">
            Discipline is the demo. The boat trip will fill these in real time and the
            number rolls forward. Aim for 100% by wrap.
          </p>
        </section>
      </div>

      {/* Incident log */}
      <IncidentLog />
    </div>
  );
}

function IncidentLog() {
  const { state, dispatch } = useApp();
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  function add() {
    const incident: IncidentEntry = {
      id: newId('inc'),
      date: new Date().toISOString().slice(0, 10),
      severity: 'note',
      description: '',
      actionTaken: '',
    };
    dispatch({ type: 'ADD_INCIDENT', incident });
    setOpenIds((s) => new Set([...s, incident.id]));
  }

  function patch(id: string, p: Partial<IncidentEntry>) {
    dispatch({ type: 'UPDATE_INCIDENT', id, patch: p });
  }

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sorted = [...state.incidents].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
      <header className="px-6 py-4 flex items-baseline justify-between border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
        <div className="flex items-baseline gap-2">
          <AlertTriangle size={13} className="text-[color:var(--color-brass-deep)]" />
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Incident log
          </h3>
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
            anyone hurt · close call · equipment fail · log it before tonight
          </span>
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>log incident</span>
        </button>
      </header>
      {sorted.length === 0 ? (
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)] px-6 py-6 text-center">
          Nothing logged. May it stay that way.
        </p>
      ) : (
        <ul>
          {sorted.map((inc) => {
            const open = openIds.has(inc.id);
            return (
              <li
                key={inc.id}
                className="border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => toggle(inc.id)}
                  className="w-full text-left px-6 py-3 grid grid-cols-[24px_120px_120px_1fr_28px] items-baseline gap-4 hover:bg-[color:var(--color-paper-deep)]/15 transition-colors"
                >
                  {open ? (
                    <ChevronDown size={13} className="text-[color:var(--color-on-paper-faint)]" />
                  ) : (
                    <ChevronRight size={13} className="text-[color:var(--color-on-paper-faint)]" />
                  )}
                  <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums">
                    {inc.date}
                  </span>
                  <span className={`label-caps tracking-[0.14em] text-[10px] ${SEVERITY_TONE[inc.severity]}`}>
                    {inc.severity}
                  </span>
                  <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] truncate">
                    {inc.description || (
                      <em className="text-[color:var(--color-on-paper-faint)]">no description</em>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete incident entry?')) {
                        dispatch({ type: 'DELETE_INCIDENT', id: inc.id });
                      }
                    }}
                    className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors justify-self-end"
                    aria-label="Delete incident"
                  >
                    <Trash2 size={12} />
                  </button>
                </button>
                {open && (
                  <div className="px-6 pb-5 pt-1 grid grid-cols-2 gap-5 bg-[color:var(--color-paper)]">
                    <div>
                      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
                        Severity
                      </div>
                      <select
                        value={inc.severity}
                        onChange={(e) => patch(inc.id, { severity: e.target.value as IncidentSeverity })}
                        className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-1"
                      >
                        {SEVERITIES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
                        Date
                      </div>
                      <input
                        type="date"
                        value={inc.date}
                        onChange={(e) => patch(inc.id, { date: e.target.value })}
                        className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
                        What happened
                      </div>
                      <EditableText
                        multiline
                        rows={2}
                        value={inc.description}
                        onChange={(v) => patch(inc.id, { description: v })}
                        placeholder="Describe the incident…"
                        className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed block w-full"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
                        Action taken
                      </div>
                      <EditableText
                        multiline
                        rows={2}
                        value={inc.actionTaken}
                        onChange={(v) => patch(inc.id, { actionTaken: v })}
                        placeholder="What was done immediately…"
                        className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed block w-full"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
                        Lesson learned (what to change)
                      </div>
                      <EditableText
                        multiline
                        rows={2}
                        value={inc.lessonLearned ?? ''}
                        onChange={(v) => patch(inc.id, { lessonLearned: v || undefined })}
                        placeholder="Tweak for tomorrow / change protocol…"
                        className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed block w-full"
                      />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
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
