import { useMemo, useState } from 'react';
import { Calendar, Plus, Sparkles, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT, useI18n } from '../../i18n';
import type { DemoTrip } from '../../types';

/* ---------- DemoTripBanner (Phase 13 wave 2) ----------

   The trip-aware ribbon at the top of Sparks. Shows:
     • "Demo trip · live · Day 2 of 3" (during trip)
     • "Demo trip · starts in 4 days" (before trip)
     • "Demo trip · ended 2 days ago" (after trip)
     • Spark counts within the trip window
     • End-trip button

   When no trip is set, shows a subtle "Start trip" button. */

export function DemoTripBanner() {
  const { state, dispatch } = useApp();
  const t = useT();
  const { fmtDate } = useI18n();
  const [editing, setEditing] = useState(false);

  const trip = state.demoTrip;

  /* Compute the trip's spark stats and current day. */
  const stats = useMemo(() => {
    if (!trip) return null;
    const start = new Date(trip.startDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayMs = 24 * 60 * 60 * 1000;
    const daysFromStart = Math.floor((today.getTime() - start.getTime()) / dayMs);
    const currentDay = daysFromStart + 1; // 1-indexed
    let phase: 'upcoming' | 'live' | 'past';
    if (currentDay < 1) phase = 'upcoming';
    else if (currentDay > trip.days) phase = 'past';
    else phase = 'live';

    /* Spark counts within the trip date range. */
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + trip.days);
    const inWindow = state.sparks.filter((s) => {
      const captured = new Date(s.capturedAt);
      return captured >= start && captured < endDate;
    });
    const promoted = inWindow.filter((s) => s.status === 'promoted').length;

    return {
      phase,
      currentDay,
      caught: inWindow.length,
      promoted,
      daysUntil: phase === 'upcoming' ? -daysFromStart : 0,
      daysSince: phase === 'past' ? daysFromStart - trip.days + 1 : 0,
    };
  }, [trip, state.sparks]);

  function startTrip(t: DemoTrip) {
    dispatch({ type: 'SET_DEMO_TRIP', trip: t });
    setEditing(false);
  }

  function endTrip() {
    if (!window.confirm('End this demo trip? The sparks remain.')) return;
    dispatch({ type: 'SET_DEMO_TRIP', trip: null });
  }

  /* ---------- No trip set ---------- */
  if (!trip) {
    if (editing) {
      return <TripEditor onSave={startTrip} onCancel={() => setEditing(false)} />;
    }
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[color:var(--color-paper-deep)] hover:bg-[color:var(--color-brass)]/15 text-[color:var(--color-on-paper-muted)] text-[11px] transition-colors"
      >
        <Plus size={11} />
        <span className="prose-body italic">{t('spark.demo.start')}</span>
      </button>
    );
  }

  if (!stats) return null;

  const phaseTone =
    stats.phase === 'live'
      ? 'var(--color-brass)'
      : stats.phase === 'upcoming'
      ? 'var(--color-on-paper-muted)'
      : 'var(--color-on-paper-faint)';
  const phaseBg =
    stats.phase === 'live'
      ? 'var(--color-on-paper)'
      : stats.phase === 'upcoming'
      ? 'var(--color-paper)'
      : 'var(--color-paper-deep)';
  const phaseFg =
    stats.phase === 'live'
      ? 'var(--color-paper-light)'
      : 'var(--color-on-paper)';

  /* ---------- Trip set ---------- */
  return (
    <section
      className="rounded-[3px] px-4 py-3 flex flex-wrap items-center gap-3"
      style={{
        background: phaseBg,
        color: phaseFg,
      }}
    >
      <Sparkles size={14} style={{ color: phaseTone }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="label-caps text-[10px]" style={{ color: phaseTone }}>
            {t('spark.demo.banner')}
          </span>
          <span
            className="label-caps text-[9px] tabular-nums px-1.5 py-0.5 rounded-[2px]"
            style={{
              color: phaseTone,
              background: `color-mix(in oklab, ${phaseTone} 18%, transparent)`,
            }}
          >
            {stats.phase === 'live'
              ? t('spark.demo.live')
              : stats.phase === 'upcoming'
              ? t('spark.demo.upcoming')
              : t('spark.demo.past')}
          </span>
          <span className="display-italic text-[18px] leading-tight">
            {trip.label}
          </span>
        </div>

        <div className="prose-body italic text-[12px] mt-0.5 tabular-nums opacity-80 flex flex-wrap items-baseline gap-x-3 gap-y-0">
          {stats.phase === 'live' && (
            <span>
              {t('spark.demo.day')}{' '}
              <span className="display-italic">
                {stats.currentDay}
              </span>{' '}
              {t('spark.demo.of')} {trip.days}
            </span>
          )}
          {stats.phase === 'upcoming' && (
            <span>
              {t('spark.demo.before.start')}{' '}
              <span className="display-italic">
                {stats.daysUntil}
              </span>{' '}
              {t('spark.demo.days.suffix')}
            </span>
          )}
          {stats.phase === 'past' && (
            <span>
              {t('spark.demo.ended')}{' '}
              <span className="display-italic">
                {stats.daysSince}
              </span>{' '}
              {t('spark.demo.days.ago.suffix')}
            </span>
          )}
          <span>·</span>
          <span>
            <span className="display-italic">{stats.caught}</span>{' '}
            {t('spark.demo.captured')}
          </span>
          {stats.promoted > 0 && (
            <>
              <span>·</span>
              <span>
                <span className="display-italic">{stats.promoted}</span>{' '}
                {t('spark.demo.promoted.suffix')}
              </span>
            </>
          )}
          <span>·</span>
          <span className="opacity-70">
            {fmtDate(trip.startDate)} → {fmtDate(addDays(trip.startDate, trip.days - 1))}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={endTrip}
        className="inline-flex items-center gap-1 prose-body italic text-[11px] opacity-70 hover:opacity-100 transition-opacity px-2 py-1 rounded-[2px] hover:bg-[color:var(--color-coral-deep)]/15"
        title={t('spark.demo.end')}
      >
        <X size={11} />
        {t('spark.demo.end')}
      </button>
    </section>
  );
}

/* ---------- Trip editor (start a new trip) ---------- */

function TripEditor({
  onSave,
  onCancel,
}: {
  onSave: (t: DemoTrip) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const [label, setLabel] = useState('');
  const [startDate, setStartDate] = useState(todayIso);
  const [days, setDays] = useState(3);

  function commit() {
    onSave({
      label: label.trim() || 'Demo trip',
      startDate,
      days: Math.max(1, Math.min(30, days)),
    });
  }

  return (
    <section className="rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-brass)]/40 px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-[color:var(--color-brass)]" />
        <span className="display-italic text-[15px] text-[color:var(--color-on-paper)]">
          {t('spark.demo.start')}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
        <label className="block">
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
            {t('common.notes')}
          </div>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            autoFocus
            placeholder={t('spark.demo.label.placeholder')}
            className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
          />
        </label>
        <label className="block">
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
            <Calendar size={9} className="inline -mt-0.5 mr-0.5" />
            {t('spark.demo.start.date')}
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
          />
        </label>
        <label className="block">
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
            {t('spark.demo.duration')}
          </div>
          <input
            type="number"
            min={1}
            max={30}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-16 px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
          />
        </label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-coral-deep)] px-2 py-1 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={commit}
            className="px-3 py-1.5 rounded-[3px] bg-[color:var(--color-brass)] text-[color:var(--color-paper-light)] text-[12px] hover:bg-[color:var(--color-brass-deep)] transition-colors display-italic"
          >
            {t('spark.demo.start')}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- helpers ---------- */

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${(dt.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')}`;
}
