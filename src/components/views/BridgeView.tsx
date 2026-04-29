import { useState } from 'react';
import { Anchor, BookOpen, Compass, ShieldAlert, Wind } from 'lucide-react';
import { useT } from '../../i18n';
import type { StringKey } from '../../i18n';
import { WindAtlasTab } from '../bridge/WindAtlasTab';
import { AnchorHoldingTab } from '../bridge/AnchorHoldingTab';
import { BuraWatchTab } from '../bridge/BuraWatchTab';
import { PassagePlannerTab } from '../bridge/PassagePlannerTab';
import { GlossaryTab } from '../bridge/GlossaryTab';

/* ---------- BridgeView (Phase 15) ----------
   Captain's Bridge / Kapetanski most. Sailor-side operational toolkit.
   5 tabs: Wind Atlas · Anchor · Bura Watch · Passage Planner · Glossary */

type TabKey = 'wind' | 'anchor' | 'bura' | 'passage' | 'glossary';

const TABS: { key: TabKey; labelKey: StringKey; Icon: typeof Wind }[] = [
  { key: 'wind',     labelKey: 'bridge.tab.wind',     Icon: Wind },
  { key: 'anchor',   labelKey: 'bridge.tab.anchor',   Icon: Anchor },
  { key: 'bura',     labelKey: 'bridge.tab.bura',     Icon: ShieldAlert },
  { key: 'passage',  labelKey: 'bridge.tab.passage',  Icon: Compass },
  { key: 'glossary', labelKey: 'bridge.tab.glossary', Icon: BookOpen },
];

export function BridgeView() {
  const t = useT();
  const [tab, setTab] = useState<TabKey>('wind');

  return (
    <div className="space-y-7 max-w-[1400px]">
      <div>
        <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)] flex items-center gap-2">
          <Compass size={16} className="text-[color:var(--color-brass)]" />
          {t('bridge.title')}
        </h2>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          {t('bridge.subtitle')}
        </p>
      </div>

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

      {tab === 'wind' && <WindAtlasTab />}
      {tab === 'anchor' && <AnchorHoldingTab />}
      {tab === 'bura' && <BuraWatchTab />}
      {tab === 'passage' && <PassagePlannerTab />}
      {tab === 'glossary' && <GlossaryTab />}
    </div>
  );
}
