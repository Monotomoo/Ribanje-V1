import { useState } from 'react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import type { StringKey } from '../../i18n';
import {
  PhaseLegend,
  MilestoneLegend,
} from '../schedule/ProductionGantt';
import { EnhancedProductionGantt } from '../schedule/EnhancedProductionGantt';
import { SlipSimulator } from '../schedule/SlipSimulator';
import { ShootCalendar } from '../schedule/ShootCalendar';
import { DeadlineTracker } from '../schedule/DeadlineTracker';
import { ScheduleBurnDown } from '../schedule/ScheduleBurnDown';
import { TwoBoatTimelineTab } from '../schedule/TwoBoatTimelineTab';

type TabKey = 'timeline' | 'calendar' | 'twoboats' | 'deadlines';

const TABS: { key: TabKey; labelKey: StringKey }[] = [
  { key: 'timeline',   labelKey: 'schedule.tab.timeline' },
  { key: 'calendar',   labelKey: 'schedule.tab.calendar' },
  { key: 'twoboats',   labelKey: 'schedule.tab.twoboats' },
  { key: 'deadlines',  labelKey: 'schedule.tab.deadlines' },
];

export function ScheduleView() {
  const { state } = useApp();
  const t = useT();
  const [tab, setTab] = useState<TabKey>('timeline');

  return (
    <div className="space-y-7 max-w-[1400px]">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
            {t('nav.schedule')}
          </h2>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            {t('schedule.subtitle')}
          </p>
        </div>
      </div>

      <div className="flex items-baseline gap-1 border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] p-1 w-fit max-w-full overflow-x-auto">
        {TABS.map((tabDef) => {
          const active = tab === tabDef.key;
          return (
            <button
              key={tabDef.key}
              type="button"
              onClick={() => setTab(tabDef.key)}
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
                {t(tabDef.labelKey)}
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'timeline' && (
        <section className="space-y-10">
          <EnhancedProductionGantt />
          <SlipSimulator />
          <ScheduleBurnDown />
          <div className="grid grid-cols-2 gap-10">
            <div>
              <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-3">
                {t('schedule.phases')}
              </h3>
              <PhaseLegend phases={state.schedulePhases} />
            </div>
            <div>
              <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-3">
                {t('schedule.milestones')}
              </h3>
              <MilestoneLegend milestones={state.milestones} />
            </div>
          </div>
        </section>
      )}

      {tab === 'calendar' && <ShootCalendar />}
      {tab === 'twoboats' && <TwoBoatTimelineTab />}
      {tab === 'deadlines' && <DeadlineTracker />}
    </div>
  );
}
