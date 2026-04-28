import { useState } from 'react';
import { Power } from 'lucide-react';
import { TodayTab } from './TodayTab';
import { ShotListTab } from './ShotListTab';
import { BoatOpsTab } from './BoatOpsTab';
import { DataTab } from './DataTab';
import { SafetyTab } from './SafetyTab';
import { WrapTab } from './WrapTab';
import { ShowDayShell } from './ShowDayShell';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import type { StringKey } from '../../i18n';

type TabKey = 'today' | 'shots' | 'boat' | 'data' | 'safety' | 'wrap';

interface TabDef {
  key: TabKey;
  labelKey: StringKey;
  hintKey: StringKey;
}

const TABS: TabDef[] = [
  { key: 'today',  labelKey: 'prod.tab.today',  hintKey: 'prod.tab.today.hint' },
  { key: 'shots',  labelKey: 'prod.tab.shots',  hintKey: 'prod.tab.shots.hint' },
  { key: 'boat',   labelKey: 'prod.tab.boat',   hintKey: 'prod.tab.boat.hint' },
  { key: 'data',   labelKey: 'prod.tab.data',   hintKey: 'prod.tab.data.hint' },
  { key: 'safety', labelKey: 'prod.tab.safety', hintKey: 'prod.tab.safety.hint' },
  { key: 'wrap',   labelKey: 'prod.tab.wrap',   hintKey: 'prod.tab.wrap.hint' },
];

export function ProductionShell() {
  const { state, dispatch } = useApp();
  const t = useT();
  const [tab, setTab] = useState<TabKey>('today');
  /* Optional preview-day picker (for demo before October 2026 — lets Tomo
     show "what Day 12 will look like" by jumping forward in time). */
  const [previewDateIso, setPreviewDateIso] = useState<string | undefined>(undefined);

  /* When Show Day Mode is on, render the kiosk shell. */
  if (state.showDayMode) {
    return <ShowDayShell />;
  }

  return (
    <div className="space-y-7 max-w-[1400px]">
      {/* Tab strip */}
      <nav
        role="tablist"
        aria-label="production sections"
        className="flex items-baseline gap-1.5 border-b-[0.5px] border-[color:var(--color-border-paper)]"
      >
        {TABS.map((tabDef) => {
          const active = tab === tabDef.key;
          return (
            <button
              key={tabDef.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(tabDef.key)}
              className={`relative px-4 py-2.5 transition-colors ${
                active
                  ? 'text-[color:var(--color-on-paper)]'
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              <span
                className={
                  active
                    ? 'display-italic text-[19px]'
                    : 'font-sans text-[12px] tracking-[0.12em] uppercase'
                }
              >
                {t(tabDef.labelKey)}
              </span>
              {active && (
                <>
                  <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[color:var(--color-brass)]" />
                  <span className="block prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-0.5">
                    {t(tabDef.hintKey)}
                  </span>
                </>
              )}
            </button>
          );
        })}

        {/* Preview-day picker + Show Day Mode toggle — right edge */}
        <div className="flex-1" />
        <PreviewDatePicker value={previewDateIso} onChange={setPreviewDateIso} />
        <button
          type="button"
          onClick={() => dispatch({ type: 'TOGGLE_SHOW_DAY_MODE', on: true })}
          className="ml-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[color:var(--color-on-paper)] text-[color:var(--color-paper-light)] text-[11px] hover:bg-[color:var(--color-brass-deep)] transition-colors group"
          title="Switch to kiosk-style show-day layout"
        >
          <Power
            size={11}
            className="group-hover:rotate-180 transition-transform duration-300"
          />
          <span className="display-italic text-[12px]">{t('prod.show.day')}</span>
        </button>
      </nav>

      {/* Tab body */}
      <div>
        {tab === 'today' && <TodayTab previewDateIso={previewDateIso} />}
        {tab === 'shots' && <ShotListTab />}
        {tab === 'boat' && <BoatOpsTab previewDateIso={previewDateIso} />}
        {tab === 'data' && <DataTab previewDateIso={previewDateIso} />}
        {tab === 'safety' && <SafetyTab previewDateIso={previewDateIso} />}
        {tab === 'wrap' && <WrapTab previewDateIso={previewDateIso} />}
      </div>
    </div>
  );
}

/* ---------- Preview-day picker ---------- */

function PreviewDatePicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  const t = useT();
  return (
    <div className="flex items-center gap-2 pl-4 border-l-[0.5px] border-[color:var(--color-border-paper)] py-1">
      <span className="label-caps text-[color:var(--color-on-paper-faint)]">
        {t('prod.preview.day')}
      </span>
      <input
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        min="2026-04-01"
        max="2026-12-31"
        className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] py-0.5"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors"
        >
          {t('common.today')}
        </button>
      )}
    </div>
  );
}

