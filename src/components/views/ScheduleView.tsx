import { useState } from 'react';
import { useApp } from '../../state/AppContext';
import {
  PhaseLegend,
  MilestoneLegend,
} from '../schedule/ProductionGantt';
import { EnhancedProductionGantt } from '../schedule/EnhancedProductionGantt';
import { SlipSimulator } from '../schedule/SlipSimulator';
import { ShootCalendar } from '../schedule/ShootCalendar';
import { DeadlineTracker } from '../schedule/DeadlineTracker';
import { ScheduleBurnDown } from '../schedule/ScheduleBurnDown';

const TABS = ['Production timeline', 'Shoot calendar', 'Deadlines'] as const;
type Tab = (typeof TABS)[number];

export function ScheduleView() {
  const { state } = useApp();
  const [tab, setTab] = useState<Tab>('Production timeline');

  return (
    <div className="space-y-7 max-w-[1400px]">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
            Schedule
          </h2>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            macro arc · shoot-month detail · deadline tracker
          </p>
        </div>
      </div>

      <div className="flex items-baseline gap-1 border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] p-1 w-fit">
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

      {tab === 'Production timeline' && (
        <section className="space-y-10">
          <EnhancedProductionGantt />
          <SlipSimulator />
          <ScheduleBurnDown />
          <div className="grid grid-cols-2 gap-10">
            <div>
              <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-3">
                Phases
              </h3>
              <PhaseLegend phases={state.schedulePhases} />
            </div>
            <div>
              <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-3">
                Milestones
              </h3>
              <MilestoneLegend milestones={state.milestones} />
            </div>
          </div>
        </section>
      )}

      {tab === 'Shoot calendar' && <ShootCalendar />}
      {tab === 'Deadlines' && <DeadlineTracker />}
    </div>
  );
}
