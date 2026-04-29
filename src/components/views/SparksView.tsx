import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useT } from '../../i18n';
import type { StringKey } from '../../i18n';
import type { Spark } from '../../types';
import { SparkWall } from '../sparks/SparkWall';
import { DemoDispatch } from '../sparks/DemoDispatch';
import { SparkCompare } from '../sparks/SparkCompare';
import { DemoTripBanner } from '../sparks/DemoTripBanner';

/* ---------- SparksView (Phase 13) ----------
   Top-level view. Three tabs:
     • Wall      3-column status board (default)
     • Dispatch  chronological day-feed
     • Compare   A/B/C side-by-side picker

   Lifted compare-selection state lives here so cards on the Wall can
   tag-into the Compare tab seamlessly. */

type TabKey = 'wall' | 'dispatch' | 'compare';

const TABS: { key: TabKey; labelKey: StringKey }[] = [
  { key: 'wall',     labelKey: 'spark.tab.wall' },
  { key: 'dispatch', labelKey: 'spark.tab.dispatch' },
  { key: 'compare',  labelKey: 'spark.tab.compare' },
];

export function SparksView() {
  const t = useT();
  const [tab, setTab] = useState<TabKey>('wall');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  function toggleCompareSelection(spark: Spark) {
    setCompareIds((prev) => {
      if (prev.includes(spark.id)) {
        return prev.filter((id) => id !== spark.id);
      }
      if (prev.length >= 4) return prev; // hard cap
      return [...prev, spark.id];
    });
  }

  return (
    <div className="space-y-7 max-w-[1400px]">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)] flex items-center gap-2">
            <Sparkles size={16} className="text-[color:var(--color-brass)]" />
            {t('spark.wall.title')}
          </h2>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            {t('spark.wall.subtitle')}
          </p>
        </div>
        {compareIds.length > 0 && (
          <button
            type="button"
            onClick={() => setTab('compare')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[color:var(--color-brass)]/15 hover:bg-[color:var(--color-brass)]/25 text-[color:var(--color-brass-deep)] text-[12px] transition-colors"
          >
            <span className="prose-body italic">
              {compareIds.length} {t('spark.compare.title').toLowerCase()}
            </span>
            <span className="display-italic">→</span>
          </button>
        )}
      </div>

      {/* Demo trip banner — Phase 13 wave 2 */}
      <DemoTripBanner />

      {/* Tab strip */}
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

      {/* Tab body */}
      {tab === 'wall' && (
        <SparkWall
          selectedForCompareIds={new Set(compareIds)}
          onToggleCompareSelection={toggleCompareSelection}
        />
      )}
      {tab === 'dispatch' && <DemoDispatch />}
      {tab === 'compare' && (
        <SparkCompare
          selectedIds={compareIds}
          onClearSelection={() => setCompareIds([])}
        />
      )}
    </div>
  );
}
