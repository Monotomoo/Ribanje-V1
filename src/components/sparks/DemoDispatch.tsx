import { useMemo, useState } from 'react';
import { Calendar, Sparkles } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT, useI18n } from '../../i18n';
import type { Spark } from '../../types';
import { SparkCard } from './SparkCard';
import { SparkCaptureModal } from './SparkCaptureModal';

/* ---------- DemoDispatch (Phase 13) ----------
   Chronological feed of all sparks for a given date, bucketed by
   time-of-day (Morning / Midday / Afternoon / Evening / Night). The
   end-of-day reel — useful for retrospectives and the demo trip's
   final summary. */

const TOD_BUCKETS: { startHour: number; endHour: number; labelKey: 'spark.dispatch.morning' | 'spark.dispatch.midday' | 'spark.dispatch.afternoon' | 'spark.dispatch.evening' | 'spark.dispatch.night' }[] = [
  { startHour: 4, endHour: 11,  labelKey: 'spark.dispatch.morning' },
  { startHour: 11, endHour: 14, labelKey: 'spark.dispatch.midday' },
  { startHour: 14, endHour: 18, labelKey: 'spark.dispatch.afternoon' },
  { startHour: 18, endHour: 22, labelKey: 'spark.dispatch.evening' },
  { startHour: 22, endHour: 28, labelKey: 'spark.dispatch.night' },  // wrap to 4am
];

export function DemoDispatch() {
  const { state, dispatch } = useApp();
  const t = useT();
  const { fmtDate, fmtDateLong } = useI18n();
  const [captureOpen, setCaptureOpen] = useState(false);

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const [date, setDate] = useState<string>(todayIso);

  /* Sparks for the active date. */
  const todaysSparks = useMemo<Spark[]>(() => {
    return state.sparks.filter((s) => s.capturedAt.startsWith(date));
  }, [state.sparks, date]);

  /* Bucket by time of day. */
  const buckets = useMemo(() => {
    const result: Record<string, Spark[]> = {};
    TOD_BUCKETS.forEach((b) => (result[b.labelKey] = []));
    todaysSparks.forEach((s) => {
      const hour = new Date(s.capturedAt).getHours();
      const bucket =
        TOD_BUCKETS.find((b) => {
          const adjustedHour = hour < 4 ? hour + 24 : hour;
          return adjustedHour >= b.startHour && adjustedHour < b.endHour;
        }) ?? TOD_BUCKETS[2];
      result[bucket.labelKey].push(s);
    });
    /* Sort each bucket chronological ASC. */
    Object.keys(result).forEach((k) => {
      result[k].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
    });
    return result;
  }, [todaysSparks]);

  /* Available dates with sparks (for date chips). */
  const datesWithSparks = useMemo(() => {
    const set = new Set<string>();
    state.sparks.forEach((s) => set.add(s.capturedAt.split('T')[0]));
    return Array.from(set).sort().reverse();
  }, [state.sparks]);

  return (
    <div className="space-y-5 max-w-[900px]">
      {/* Header */}
      <header className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] flex items-center gap-2">
            <Sparkles size={14} className="text-[color:var(--color-brass)]" />
            {t('spark.dispatch.title')}
          </h3>
          <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            {t('spark.dispatch.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCaptureOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] text-[color:var(--color-paper-light)] text-[12px] transition-colors"
        >
          <Sparkles size={12} />
          <span className="display-italic">{t('spark.capture.button')}</span>
        </button>
      </header>

      {/* Date picker */}
      <div className="flex items-center gap-3 flex-wrap">
        <Calendar size={12} className="text-[color:var(--color-on-paper-muted)]" />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-2 py-1 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
        />
        <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
          {fmtDateLong(date)}
        </span>
        {datesWithSparks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 ml-3">
            {datesWithSparks.slice(0, 5).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDate(d)}
                className={`px-2 py-0.5 rounded-[2px] text-[10px] tabular-nums display-italic transition-colors ${
                  date === d
                    ? 'bg-[color:var(--color-brass)] text-[color:var(--color-paper-light)]'
                    : 'bg-[color:var(--color-paper-light)] text-[color:var(--color-on-paper-muted)] hover:bg-[color:var(--color-brass)]/15'
                }`}
              >
                {fmtDate(d)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {todaysSparks.length === 0 && (
        <div className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] text-center py-12 border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px]">
          {t('spark.dispatch.empty')}
        </div>
      )}

      {/* Buckets */}
      {todaysSparks.length > 0 && (
        <div className="space-y-6">
          {TOD_BUCKETS.map((b) => {
            const sparks = buckets[b.labelKey];
            if (sparks.length === 0) return null;
            return (
              <section key={b.labelKey}>
                <div className="flex items-baseline gap-3 mb-3 pb-1 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
                  <span className="label-caps text-[color:var(--color-brass-deep)]">
                    {t(b.labelKey)}
                  </span>
                  <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums">
                    {b.startHour.toString().padStart(2, '0')}:00 –{' '}
                    {(b.endHour > 24 ? b.endHour - 24 : b.endHour)
                      .toString()
                      .padStart(2, '0')}
                    :00
                  </span>
                  <div className="flex-1 h-px bg-[color:var(--color-border-paper)]" />
                  <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums">
                    {sparks.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sparks.map((spark) => (
                    <SparkCard key={spark.id} spark={spark} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Day summary footer */}
      {todaysSparks.length > 0 && (
        <footer className="pt-4 border-t-[0.5px] border-[color:var(--color-border-paper)] flex items-baseline justify-between flex-wrap gap-2 prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums">
          <span>
            {todaysSparks.length} {t('spark.demo.captured')} ·{' '}
            {todaysSparks.filter((s) => s.status === 'promoted').length}{' '}
            {t('spark.status.promoted')}
          </span>
          <span>
            {todaysSparks.filter((s) => s.rating && s.rating >= 4).length} ★
          </span>
        </footer>
      )}

      <SparkCaptureModal
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
      />
    </div>
  );
}
