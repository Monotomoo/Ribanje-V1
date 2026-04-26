import { useMemo, useState } from 'react';
import SunCalc from 'suncalc';
import { useApp } from '../../state/AppContext';

function fmt(d: Date | null | undefined): string {
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function GoldenHourPanel() {
  const { state } = useApp();
  /* Pre-select shoot start, but anchor to anything in 2026 to keep it on a sensible day */
  const [date, setDate] = useState('2026-10-15');
  const [locId, setLocId] = useState<string>(
    state.locations.find((l) => l.episodeId === 'ep1')?.id ?? state.locations[0]?.id ?? ''
  );

  const loc = state.locations.find((l) => l.id === locId);

  const times = useMemo(() => {
    if (!loc) return null;
    const d = new Date(date + 'T12:00:00Z');
    return SunCalc.getTimes(d, loc.lat, loc.lng);
  }, [date, loc]);

  return (
    <section>
      <header className="flex items-baseline justify-between mb-4">
        <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
          Golden hour
        </h2>
        <span className="label-caps text-[color:var(--color-on-paper-faint)]">
          per anchorage × shoot date
        </span>
      </header>

      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Shoot date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[14px] text-[color:var(--color-on-paper)] py-1"
            />
          </Field>
          <Field label="Anchorage">
            <select
              value={locId}
              onChange={(e) => setLocId(e.target.value)}
              className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[14px] text-[color:var(--color-on-paper)] py-1"
            >
              {state.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {times && loc && (
          <div className="pt-4 border-t-[0.5px] border-[color:var(--color-border-paper)] space-y-2.5">
            <Row label="Dawn" value={fmt(times.dawn)} muted />
            <Row label="Sunrise" value={fmt(times.sunrise)} accent="brass" />
            <Row label="Golden hour ends" value={fmt(times.goldenHourEnd)} muted />
            <Row label="Solar noon" value={fmt(times.solarNoon)} muted />
            <Row label="Golden hour begins" value={fmt(times.goldenHour)} muted />
            <Row label="Sunset" value={fmt(times.sunset)} accent="coral" />
            <Row label="Dusk" value={fmt(times.dusk)} muted />
            <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
              {loc.lat.toFixed(3)}°N · {loc.lng.toFixed(3)}°E · times in local time of the device
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  muted,
  accent,
}: {
  label: string;
  value: string;
  muted?: boolean;
  accent?: 'brass' | 'coral';
}) {
  const valueColor =
    accent === 'brass'
      ? 'text-[color:var(--color-brass-deep)]'
      : accent === 'coral'
      ? 'text-[color:var(--color-coral-deep)]'
      : 'text-[color:var(--color-on-paper)]';
  return (
    <div className="flex items-baseline justify-between">
      <span
        className={`label-caps ${
          muted ? 'text-[color:var(--color-on-paper-faint)]' : 'text-[color:var(--color-brass-deep)]'
        }`}
      >
        {label}
      </span>
      <span
        className={`display-italic text-[18px] tabular-nums ${valueColor}`}
      >
        {value}
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">{label}</div>
      {children}
    </div>
  );
}
