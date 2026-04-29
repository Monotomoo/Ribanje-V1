import { useState } from 'react';
import { Anchor, BookOpen, Calendar, Compass, Fish, Printer } from 'lucide-react';
import { useT } from '../../i18n';
import type { StringKey } from '../../i18n';
import { CatchLogTab } from '../almanac/CatchLogTab';
import { WindowsGridTab } from '../almanac/WindowsGridTab';
import { WindowFinderTab } from '../almanac/WindowFinderTab';
import { SpeciesCardsTab } from '../almanac/SpeciesCardsTab';
import { CaptainsCardTab } from '../almanac/CaptainsCardTab';

/* ---------- AlmanacView (Phase 14) ----------
   Top-level view for the Fisherman's Almanac. 5 tabs:
     • Catch Log         Ivan's daily log
     • Catch Windows     species × month heatmap
     • Window Finder     next 48h fishing window per species
     • Species Cards     33 Adriatic species browser
     • Captain's Card    A4 print-ready per-day card */

type TabKey = 'catch' | 'windows' | 'finder' | 'species' | 'captain';

const TABS: { key: TabKey; labelKey: StringKey; Icon: typeof Fish }[] = [
  { key: 'catch',    labelKey: 'almanac.tab.catch',    Icon: Fish },
  { key: 'windows',  labelKey: 'almanac.tab.windows',  Icon: Calendar },
  { key: 'finder',   labelKey: 'almanac.tab.finder',   Icon: Compass },
  { key: 'species',  labelKey: 'almanac.tab.species',  Icon: BookOpen },
  { key: 'captain',  labelKey: 'almanac.tab.captain',  Icon: Printer },
];

export function AlmanacView() {
  const t = useT();
  const [tab, setTab] = useState<TabKey>('catch');

  return (
    <div className="space-y-7 max-w-[1400px]">
      <div>
        <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)] flex items-center gap-2">
          <Anchor size={16} className="text-[color:var(--color-brass)]" />
          {t('almanac.title')}
        </h2>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          {t('almanac.subtitle')}
        </p>
      </div>

      {/* Tab strip */}
      <div className="flex items-baseline gap-1 border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] p-1 w-fit max-w-full overflow-x-auto">
        {TABS.map((tabDef) => {
          const active = tab === tabDef.key;
          const Icon = tabDef.Icon;
          return (
            <button
              key={tabDef.key}
              type="button"
              onClick={() => setTab(tabDef.key)}
              className={`px-3 py-1.5 transition-colors rounded-[2px] flex items-center gap-1.5 ${
                active
                  ? 'bg-[color:var(--color-paper-deep)]/40 text-[color:var(--color-on-paper)]'
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              <Icon size={11} />
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

      {tab === 'catch' && <CatchLogTab />}
      {tab === 'windows' && <WindowsGridTab />}
      {tab === 'finder' && <WindowFinderTab />}
      {tab === 'species' && <SpeciesCardsTab />}
      {tab === 'captain' && <CaptainsCardTab />}
    </div>
  );
}
