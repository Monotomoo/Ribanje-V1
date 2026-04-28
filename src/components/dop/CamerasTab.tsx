import { useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { CameraStatusStrip } from './CameraStatusStrip';

/* ---------- Cameras tab (Phase 12) ----------
   Pre-shoot setup + live status. Picks the active shoot day or current
   date, shows the full Camera Status Strip, and lets you fast-toggle
   between days for plan-ahead checks. */

export function CamerasTab() {
  const { state } = useApp();

  /* Pick the most relevant date: next shoot day, else first shoot day, else today. */
  const candidateDates = useMemo(() => {
    const days = state.shootDays.map((d) => d.date).sort();
    return days;
  }, [state.shootDays]);

  const todayIso = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${(t.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${t.getDate().toString().padStart(2, '0')}`;
  }, []);

  const initialDate = useMemo(() => {
    if (candidateDates.length === 0) return todayIso;
    const upcoming = candidateDates.find((d) => d >= todayIso);
    return upcoming ?? candidateDates[candidateDates.length - 1];
  }, [candidateDates, todayIso]);

  const [date, setDate] = useState<string>(initialDate);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div>
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          5-camera status
        </h3>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          Pre-shoot: confirm batteries, cards, sync, WB. During shoot: round-trip
          every 20 minutes and tap a tile if anything changes. Big touch — wet iPad.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Calendar size={14} className="text-[color:var(--color-on-paper-muted)]" />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-2 py-1 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
        />
        {candidateDates.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {candidateDates.slice(0, 6).map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => setDate(d)}
                className={`px-2 py-1 rounded-[3px] text-[10px] tabular-nums display-italic transition-colors ${
                  date === d
                    ? 'bg-[color:var(--color-brass)] text-[color:var(--color-paper)]'
                    : 'bg-[color:var(--color-paper-deep)] text-[color:var(--color-on-paper-muted)] hover:bg-[color:var(--color-brass)]/15'
                }`}
              >
                Day {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      <CameraStatusStrip date={date} />

      <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        Status is per-day — historical days stay so you can review what battery
        you started with last Wednesday vs how the morning round went.
      </div>
    </div>
  );
}
