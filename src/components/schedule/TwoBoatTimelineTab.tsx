import { useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { TwoBoatTimeline } from './TwoBoatTimeline';

/* ---------- Two boats tab (Phase 12) ----------
   Date picker + timeline. Defaults to next shoot day. Switch dates via
   day chips for fast multi-day planning. */

export function TwoBoatTimelineTab() {
  const { state } = useApp();

  const candidateDates = useMemo(
    () => state.shootDays.map((d) => d.date).sort(),
    [state.shootDays]
  );

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
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          Two-boat coordination
        </h3>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          Talent boat (with subjects + Captain Luka) and camera boat (Tom + crew)
          on a synced clock. The brass tie-line marks the rendezvous — when both
          boats land at the same location in the same hour, that's the hero shot
          window.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Calendar size={14} className="text-[color:var(--color-on-paper-muted)]" />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-2 py-1 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[13px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
        />
        {candidateDates.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {candidateDates.slice(0, 8).map((d, i) => (
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

      <TwoBoatTimeline date={date} />

      <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        Tip: depart waypoints (red dot) on one boat usually pair with arrive
        waypoints on the other — that's how you spot mistimed travel that
        could miss the rendezvous.
      </div>
    </div>
  );
}
