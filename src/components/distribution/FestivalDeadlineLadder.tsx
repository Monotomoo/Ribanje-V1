import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Euro,
  Plus,
  Star,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { FestivalStatus, FestivalSubmission } from '../../types';

/* ---------- Festival Deadline Ladder (Phase 12) ----------

   Festivals sorted by deadline ASC, with days-to-deadline countdown
   and status quick-actions. Three sections:

     • urgent       deadline within 30 days, not yet submitted
     • upcoming     deadline 30-180 days out
     • past          deadline gone or already submitted/decided

   Quick-add templates seed Croatian + intl docs-relevant festivals so
   Tom can populate fast without retyping deadlines.
*/

interface Props {
  compact?: boolean;
}

interface FestivalTemplate {
  name: string;
  city: string;
  country: string;
  category?: string;
  deadline?: string;        // typical month-day pattern; we resolve to next year
  feeEur?: number;
  url?: string;
  fitScore?: number;
  notes?: string;
}

/* Common deadlines (approximate month/day — update when actuals confirmed). */
const FESTIVAL_TEMPLATES: FestivalTemplate[] = [
  /* Croatian */
  { name: 'ZagrebDox',         city: 'Zagreb',     country: 'Croatia', category: 'docs · intl', deadline: '01-15', feeEur: 35, fitScore: 5, url: 'https://zagrebdox.net' },
  { name: 'Pula Film Festival', city: 'Pula',       country: 'Croatia', category: 'feature · doc',  deadline: '04-30', feeEur: 0,   fitScore: 5, url: 'https://pulafilmfestival.hr' },
  { name: 'Motovun Film Festival', city: 'Motovun', country: 'Croatia', category: 'docs · indie', deadline: '04-15', feeEur: 25, fitScore: 5, url: 'https://motovunfilmfestival.com' },
  { name: 'LIFF Liburnia',     city: 'Opatija',    country: 'Croatia', category: 'docs · short', deadline: '03-31', feeEur: 0,   fitScore: 4 },
  { name: 'Dalmatia Film Festival', city: 'Šibenik', country: 'Croatia', category: 'docs · regional', deadline: '06-30', feeEur: 0, fitScore: 4 },
  /* Adjacent (Adriatic / Mediterranean) */
  { name: 'Sarajevo Film Festival', city: 'Sarajevo', country: 'Bosnia',     category: 'docs · feature', deadline: '04-30', feeEur: 30, fitScore: 4 },
  { name: 'DokuFest',          city: 'Prizren',    country: 'Kosovo',  category: 'docs · intl',     deadline: '04-15', feeEur: 0,   fitScore: 4 },
  { name: 'Trento Film Festival', city: 'Trento', country: 'Italy',  category: 'docs · maritime',  deadline: '12-31', feeEur: 30, fitScore: 4 },
  /* Europe / intl docs majors */
  { name: 'IDFA',              city: 'Amsterdam',  country: 'Netherlands', category: 'docs · A-list', deadline: '07-01', feeEur: 60, fitScore: 5, url: 'https://idfa.nl' },
  { name: 'Visions du Réel',   city: 'Nyon',       country: 'Switzerland', category: 'docs · A-list', deadline: '11-30', feeEur: 50, fitScore: 4 },
  { name: 'CPH:DOX',           city: 'Copenhagen', country: 'Denmark',     category: 'docs · A-list', deadline: '12-01', feeEur: 50, fitScore: 4 },
  { name: 'Sheffield DocFest', city: 'Sheffield',  country: 'UK',          category: 'docs · A-list', deadline: '02-15', feeEur: 70, fitScore: 4 },
  { name: 'Hot Docs',          city: 'Toronto',    country: 'Canada',      category: 'docs · intl',   deadline: '01-10', feeEur: 80, fitScore: 3 },
  /* Americas */
  { name: 'Sundance',          city: 'Park City',  country: 'USA',         category: 'feature · doc', deadline: '09-26', feeEur: 90, fitScore: 3 },
  { name: 'SXSW',              city: 'Austin',     country: 'USA',         category: 'doc · culture', deadline: '10-15', feeEur: 70, fitScore: 3 },
  { name: 'Tribeca',           city: 'New York',   country: 'USA',         category: 'feature · doc', deadline: '11-15', feeEur: 90, fitScore: 3 },
];

const STATUS_TONE: Record<FestivalStatus, { bg: string; fg: string; label: string }> = {
  target:     { bg: 'var(--color-paper-deep)',   fg: 'var(--color-on-paper-muted)', label: 'target' },
  submitted:  { bg: 'var(--color-brass)',         fg: 'var(--color-paper-light)',    label: 'submitted' },
  accepted:   { bg: 'var(--color-success)',       fg: 'var(--color-paper-light)',    label: 'accepted' },
  declined:   { bg: 'var(--color-on-paper-faint)', fg: 'var(--color-paper-light)',   label: 'declined' },
  won:        { bg: 'var(--color-brass-deep)',    fg: 'var(--color-paper-light)',    label: 'won' },
  withdrawn:  { bg: 'var(--color-coral-deep)',    fg: 'var(--color-paper-light)',    label: 'withdrawn' },
};

export function FestivalDeadlineLadder({ compact = false }: Props) {
  const { state, dispatch } = useApp();
  const [showTemplates, setShowTemplates] = useState(false);
  const [pastExpanded, setPastExpanded] = useState(false);

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const buckets = useMemo(() => {
    const urgent: FestivalSubmission[] = [];
    const upcoming: FestivalSubmission[] = [];
    const past: FestivalSubmission[] = [];

    state.festivals.forEach((f) => {
      const deadlineDays = daysUntil(f.deadline, todayIso);
      const isPastDeadline = deadlineDays != null && deadlineDays < 0;
      const isFinal = ['submitted', 'accepted', 'declined', 'won', 'withdrawn'].includes(f.status);
      if (isPastDeadline || isFinal) {
        past.push(f);
      } else if (deadlineDays != null && deadlineDays <= 30) {
        urgent.push(f);
      } else {
        upcoming.push(f);
      }
    });

    /* Sort each by deadline ASC. */
    const byDeadline = (a: FestivalSubmission, b: FestivalSubmission) => {
      const da = daysUntil(a.deadline, todayIso) ?? Infinity;
      const db = daysUntil(b.deadline, todayIso) ?? Infinity;
      return da - db;
    };
    urgent.sort(byDeadline);
    upcoming.sort(byDeadline);
    past.sort((a, b) => (b.deadline ?? '').localeCompare(a.deadline ?? ''));

    return { urgent, upcoming, past };
  }, [state.festivals, todayIso]);

  function addFromTemplate(tpl: FestivalTemplate) {
    const fest: FestivalSubmission = {
      id: `fest-${Math.random().toString(36).slice(2, 8)}`,
      name: tpl.name,
      city: tpl.city,
      country: tpl.country,
      category: tpl.category,
      deadline: resolveTemplateDeadline(tpl.deadline, today),
      feeEur: tpl.feeEur,
      fitScore: tpl.fitScore,
      url: tpl.url,
      status: 'target',
      notes: tpl.notes ?? '',
    };
    dispatch({ type: 'ADD_FESTIVAL', festival: fest });
    setShowTemplates(false);
  }

  function addBlank() {
    const fest: FestivalSubmission = {
      id: `fest-${Math.random().toString(36).slice(2, 8)}`,
      name: 'New festival',
      city: '',
      country: '',
      status: 'target',
      notes: '',
    };
    dispatch({ type: 'ADD_FESTIVAL', festival: fest });
  }

  function patch(id: string, p: Partial<FestivalSubmission>) {
    dispatch({ type: 'UPDATE_FESTIVAL', id, patch: p });
  }

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
      <header className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="display-italic text-[16px] text-[color:var(--color-on-paper)] leading-tight flex items-center gap-2">
            <CalendarDays size={14} className="text-[color:var(--color-brass)]" />
            Festival deadline ladder
          </h3>
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5 tabular-nums">
            {buckets.urgent.length} urgent · {buckets.upcoming.length} upcoming · {buckets.past.length} past
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[color:var(--color-paper-deep)] hover:bg-[color:var(--color-brass)]/15 text-[11px] transition-colors"
          >
            <Plus size={11} />
            <span className="prose-body italic">templates</span>
          </button>
          <button
            type="button"
            onClick={addBlank}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[color:var(--color-brass)] text-[color:var(--color-paper)] text-[11px] hover:bg-[color:var(--color-brass-deep)] transition-colors"
          >
            <Plus size={11} />
            <span className="prose-body italic">blank</span>
          </button>
        </div>
      </header>

      {showTemplates && (
        <div className="mb-3 p-3 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-brass)]/40">
          <div className="display-italic text-[13px] text-[color:var(--color-on-paper)] mb-2">
            Quick-add festivals (deadlines auto-resolve to next occurrence)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {FESTIVAL_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => addFromTemplate(tpl)}
                className="flex items-baseline justify-between text-left px-2 py-1.5 rounded-[3px] hover:bg-[color:var(--color-brass)]/10 transition-colors"
              >
                <span className="display-italic text-[12px] text-[color:var(--color-on-paper)] truncate">
                  {tpl.name}
                </span>
                <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums whitespace-nowrap ml-2">
                  {tpl.city} · {tpl.deadline}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Urgent bucket */}
      {buckets.urgent.length > 0 && (
        <Bucket
          title="Urgent · within 30 days"
          tone="critical"
          festivals={buckets.urgent}
          todayIso={todayIso}
          onPatch={patch}
        />
      )}

      {/* Upcoming */}
      {buckets.upcoming.length > 0 && (
        <Bucket
          title="Upcoming"
          tone="brass"
          festivals={buckets.upcoming}
          todayIso={todayIso}
          onPatch={patch}
        />
      )}

      {/* Past — collapsed by default */}
      {!compact && buckets.past.length > 0 && (
        <div className="mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          <button
            type="button"
            onClick={() => setPastExpanded(!pastExpanded)}
            className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] flex items-center gap-1 transition-colors"
          >
            {pastExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {pastExpanded ? 'hide past' : `show ${buckets.past.length} past / submitted`}
          </button>
          {pastExpanded && (
            <div className="mt-2">
              <Bucket
                title=""
                tone="muted"
                festivals={buckets.past}
                todayIso={todayIso}
                onPatch={patch}
              />
            </div>
          )}
        </div>
      )}

      {state.festivals.length === 0 && (
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] py-3">
          No festivals tracked yet. Click "templates" for the documentary-festival
          shortlist or "blank" to add manually.
        </div>
      )}
    </section>
  );
}

/* ---------- Bucket ---------- */

function Bucket({
  title,
  tone,
  festivals,
  todayIso,
  onPatch,
}: {
  title: string;
  tone: 'critical' | 'brass' | 'muted';
  festivals: FestivalSubmission[];
  todayIso: string;
  onPatch: (id: string, p: Partial<FestivalSubmission>) => void;
}) {
  const accentColor =
    tone === 'critical'
      ? 'var(--color-coral-deep)'
      : tone === 'brass'
      ? 'var(--color-brass)'
      : 'var(--color-on-paper-muted)';
  return (
    <div className="mb-3">
      {title && (
        <div
          className="label-caps text-[10px] mb-1.5 tracking-[0.10em]"
          style={{ color: accentColor }}
        >
          {title}
        </div>
      )}
      <ul className="space-y-1.5">
        {festivals.map((f) => (
          <FestivalRow key={f.id} festival={f} todayIso={todayIso} onPatch={onPatch} />
        ))}
      </ul>
    </div>
  );
}

/* ---------- Festival row ---------- */

function FestivalRow({
  festival,
  todayIso,
  onPatch,
}: {
  festival: FestivalSubmission;
  todayIso: string;
  onPatch: (id: string, p: Partial<FestivalSubmission>) => void;
}) {
  const days = daysUntil(festival.deadline, todayIso);
  const tone = STATUS_TONE[festival.status];
  const fit = festival.fitScore ?? 0;

  return (
    <li className="rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] overflow-hidden">
      <div className="px-2.5 py-1.5 flex items-center gap-2">
        <input
          type="text"
          value={festival.name}
          onChange={(e) => onPatch(festival.id, { name: e.target.value })}
          className="flex-1 bg-transparent text-[13px] display-italic text-[color:var(--color-on-paper)] focus:outline-none"
        />
        <input
          type="text"
          value={festival.city ?? ''}
          onChange={(e) => onPatch(festival.id, { city: e.target.value })}
          placeholder="city"
          className="w-24 bg-transparent text-[11px] prose-body italic text-[color:var(--color-on-paper-muted)] focus:outline-none focus:bg-[color:var(--color-paper-deep)]/30 rounded-[2px] px-1"
        />
        <input
          type="date"
          value={festival.deadline ?? ''}
          onChange={(e) => onPatch(festival.id, { deadline: e.target.value || undefined })}
          className="w-32 px-1 py-0.5 rounded-[2px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[11px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
        />
        {days != null && (
          <span
            className={`label-caps text-[10px] tabular-nums w-14 text-right ${
              days < 0
                ? 'text-[color:var(--color-on-paper-faint)]'
                : days <= 7
                ? 'text-[color:var(--color-coral-deep)]'
                : days <= 30
                ? 'text-[color:var(--color-brass-deep)]'
                : 'text-[color:var(--color-on-paper-muted)]'
            }`}
          >
            {days < 0 ? `${Math.abs(days)}d ago` : `${days}d left`}
          </span>
        )}
        <select
          value={festival.status}
          onChange={(e) => onPatch(festival.id, { status: e.target.value as FestivalStatus })}
          className="px-1.5 py-0.5 rounded-[2px] text-[10px] label-caps tabular-nums focus:outline-none border-[0.5px]"
          style={{ background: tone.bg, color: tone.fg, borderColor: tone.bg }}
        >
          {(Object.keys(STATUS_TONE) as FestivalStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_TONE[s].label}</option>
          ))}
        </select>
      </div>
      <div className="px-2.5 pb-1.5 flex items-center gap-3 prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums">
        {festival.feeEur != null && (
          <span className="flex items-center gap-1">
            <Euro size={9} />
            {festival.feeEur}
          </span>
        )}
        {fit > 0 && (
          <span className="flex items-center gap-0.5 text-[color:var(--color-brass-deep)]">
            {Array.from({ length: fit }).map((_, i) => (
              <Star key={i} size={8} fill="currentColor" strokeWidth={0} />
            ))}
          </span>
        )}
        {festival.country && <span>· {festival.country}</span>}
        {festival.category && <span>· {festival.category}</span>}
        {festival.status === 'target' && days != null && days >= 0 && (
          <button
            type="button"
            onClick={() => onPatch(festival.id, { status: 'submitted' })}
            className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-[color:var(--color-brass)]/15 hover:bg-[color:var(--color-brass)]/25 text-[color:var(--color-brass-deep)] transition-colors"
          >
            <Check size={9} />
            mark submitted
          </button>
        )}
      </div>
    </li>
  );
}

/* ---------- helpers ---------- */

function daysUntil(deadline: string | undefined, todayIso: string): number | null {
  if (!deadline) return null;
  const [ty, tm, td] = todayIso.split('-').map(Number);
  const [dy, dm, dd] = deadline.split('-').map(Number);
  const today = new Date(ty, (tm ?? 1) - 1, td ?? 1);
  const target = new Date(dy, (dm ?? 1) - 1, dd ?? 1);
  const ms = target.getTime() - today.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function resolveTemplateDeadline(
  monthDay: string | undefined,
  today: Date
): string | undefined {
  if (!monthDay) return undefined;
  const [m, d] = monthDay.split('-').map(Number);
  if (!m || !d) return undefined;
  const thisYear = today.getFullYear();
  const candidate = new Date(thisYear, m - 1, d);
  /* If already passed this year, use next year. */
  if (candidate.getTime() < today.getTime()) {
    candidate.setFullYear(thisYear + 1);
  }
  return `${candidate.getFullYear()}-${(candidate.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${candidate.getDate().toString().padStart(2, '0')}`;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const _unused = { Clock, Trophy, XCircle };
/* eslint-enable @typescript-eslint/no-unused-vars */
