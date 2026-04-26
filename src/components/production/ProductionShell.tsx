import { useState } from 'react';
import { TodayTab } from './TodayTab';
import { ShotListTab } from './ShotListTab';
import { BoatOpsTab } from './BoatOpsTab';
import { DataTab } from './DataTab';
import { SafetyTab } from './SafetyTab';
import { WrapTab } from './WrapTab';

type TabKey = 'today' | 'shots' | 'boat' | 'data' | 'safety' | 'wrap';

interface TabDef {
  key: TabKey;
  label: string;
  hint: string;
}

const TABS: TabDef[] = [
  { key: 'today', label: 'Today', hint: 'the daily cockpit' },
  { key: 'shots', label: 'Shot list', hint: 'scenes · shots · takes' },
  { key: 'boat', label: 'Boat ops', hint: 'anchorage · fuel · weather' },
  { key: 'data', label: 'Data', hint: 'two-drive rule · backups' },
  { key: 'safety', label: 'Safety', hint: 'briefing · MOB · comms' },
  { key: 'wrap', label: 'Wrap', hint: "today's debrief · call sheet" },
];

export function ProductionShell() {
  const [tab, setTab] = useState<TabKey>('today');
  /* Optional preview-day picker (for demo before October 2026 — lets Tomo
     show "what Day 12 will look like" by jumping forward in time). */
  const [previewDateIso, setPreviewDateIso] = useState<string | undefined>(undefined);

  return (
    <div className="space-y-7 max-w-[1400px]">
      {/* Tab strip */}
      <nav
        role="tablist"
        aria-label="production sections"
        className="flex items-baseline gap-1.5 border-b-[0.5px] border-[color:var(--color-border-paper)]"
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
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
                {t.label}
              </span>
              {active && (
                <>
                  <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[color:var(--color-brass)]" />
                  <span className="block prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-0.5">
                    {t.hint}
                  </span>
                </>
              )}
            </button>
          );
        })}

        {/* Preview-day picker — lives in the tab strip's right edge */}
        <div className="flex-1" />
        <PreviewDatePicker value={previewDateIso} onChange={setPreviewDateIso} />
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
  return (
    <div className="flex items-center gap-2 pl-4 border-l-[0.5px] border-[color:var(--color-border-paper)] py-1">
      <span className="label-caps text-[color:var(--color-on-paper-faint)]">
        preview day
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
          today
        </button>
      )}
    </div>
  );
}

