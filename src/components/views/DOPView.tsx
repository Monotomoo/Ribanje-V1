import { useState } from 'react';
import { KitDashboard } from '../dop/KitDashboard';
import { LensLibrary } from '../dop/LensLibrary';
import { ColorAndLook } from '../dop/ColorAndLook';
import { TimeAndLight } from '../dop/TimeAndLight';
import { DailyPlan } from '../dop/DailyPlan';
import { Continuity } from '../dop/Continuity';
import { SpecialtyTab } from '../dop/SpecialtyTab';
import { CamerasTab } from '../dop/CamerasTab';

const TABS = [
  'Kit',
  'Cameras',
  'Lenses',
  'Color & look',
  'Time & light',
  'Daily plan',
  'Continuity',
  'Specialty',
] as const;
type Tab = (typeof TABS)[number];

export function DOPView() {
  const [tab, setTab] = useState<Tab>('Kit');

  return (
    <div className="space-y-7 max-w-[1400px]">
      <div>
        <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
          Tom's cockpit
        </h2>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          Cinematography. Trinity-anchored package. Verify each line on day one of the boat trip.
        </p>
      </div>

      <div className="flex items-baseline gap-1 border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] p-1 w-fit max-w-full overflow-x-auto">
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 transition-colors rounded-[2px] ${
                active
                  ? 'bg-[color:var(--color-paper-deep)]/40 text-[color:var(--color-on-paper)]'
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              <span
                className={
                  active
                    ? 'display-italic text-[15px]'
                    : 'font-sans text-[11px] tracking-[0.14em] uppercase'
                }
              >
                {t}
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'Kit' && <KitDashboard />}
      {tab === 'Cameras' && <CamerasTab />}
      {tab === 'Lenses' && <LensLibrary />}
      {tab === 'Color & look' && <ColorAndLook />}
      {tab === 'Time & light' && <TimeAndLight />}
      {tab === 'Daily plan' && <DailyPlan />}
      {tab === 'Continuity' && <Continuity />}
      {tab === 'Specialty' && <SpecialtyTab />}
    </div>
  );
}
