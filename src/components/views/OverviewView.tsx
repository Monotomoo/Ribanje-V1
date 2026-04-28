import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import { PreShootStatusWall } from '../status/PreShootStatusWall';
import { TodayBrief } from '../overview/TodayBrief';
import { CockpitGauges } from '../overview/CockpitGauges';
import { ProductionRibbon } from '../overview/ProductionRibbon';
import { DecisionsInbox } from '../overview/DecisionsInbox';
import { ActivityFeed } from '../overview/ActivityFeed';
import { VoyageStrip } from '../overview/VoyageStrip';
import { FinancialBlock } from '../overview/FinancialBlock';
import { FundingTable } from '../overview/FundingTable';
import { CostTable } from '../overview/CostTable';
import { FundingStackChart } from '../overview/FundingStackChart';
import { CostBreakdownChart } from '../overview/CostBreakdownChart';
import { CashflowChart } from '../overview/CashflowChart';
import { StateAidBanner } from '../overview/StateAidBanner';
import { BridgeFinancingBanner } from '../overview/BridgeFinancingBanner';
import { SectionMarker } from '../overview/SectionMarker';
import {
  rebate,
  totalCost,
  totalFunding,
  stateAidTotal,
} from '../../lib/finance';
import { FUNDING_SOURCES } from '../../lib/seed';
import type { ViewKey } from '../../types';

/* Overview — Tomo's morning cockpit.
   Cockpit-style layout (top-to-bottom):
   1. Today Brief — date, countdown, 3 focus cards (with verse strip)
   2. Cockpit Gauges — 8 production health instruments
   3. 30-Day Production Ribbon — calendar of next 30 days
   4. Voyage Strip — episode cards (kept; already strong)
   5. Decisions Inbox — what needs Tomo's decision
   6. Activity Feed — last events across modules
   7. Finance pill — collapsed accordion with detail
*/
export function OverviewView() {
  const { state, dispatch } = useApp();
  const t = useT();
  const sc = state.scenarios[state.activeScenario];

  const cost = totalCost(sc.costs);
  const reb = rebate(cost, sc.qualifyingSpendPct, sc.blendedRebateRate);
  const fund = totalFunding(sc.funding, reb);
  const sa = stateAidTotal(sc.funding, reb, FUNDING_SOURCES);

  const jump = (view: ViewKey, episodeId?: string) => {
    if (episodeId) {
      dispatch({ type: 'SET_VIEW', view });
      dispatch({ type: 'SELECT_EPISODE', episodeId });
    } else {
      dispatch({ type: 'SELECT_EPISODE', episodeId: null });
      dispatch({ type: 'SET_VIEW', view });
    }
  };

  return (
    <div className="space-y-10 max-w-[1400px]">
      {/* 0. PRE-SHOOT STATUS WALL — meta-overview at the very top */}
      <PreShootStatusWall />

      {/* 1. TODAY BRIEF — date, countdown, focus cards, verse */}
      <TodayBrief onJump={jump} />

      {/* 2. COCKPIT GAUGES — 8 health instruments */}
      <CockpitGauges onJump={jump} />

      {/* 3. PRODUCTION RIBBON — 30-day calendar */}
      <ProductionRibbon onJump={jump} />

      {/* 4. VOYAGE STRIP — six episode cards */}
      <section>
        <SectionMarker
          label={t('overview.voyage')}
          hint={`${state.episodes.length} ${t('overview.voyage.main')} · ${state.specials.length} ${t('overview.voyage.specials')}`}
          ornament
        />
        <VoyageStrip onJump={jump} />
      </section>

      {/* 5. DECISIONS INBOX — what needs Tomo */}
      <DecisionsInbox onJump={jump} />

      {/* 6. ACTIVITY FEED — last events */}
      <ActivityFeed onJump={jump} />

      {/* 7. FINANCE — collapsed pill with detail */}
      <section>
        <SectionMarker
          label={t('overview.finance')}
          hint={`${state.activeScenario} ${t('overview.finance.scenario.suffix')}`}
          ornament
        />
        <div className="space-y-5 mt-3">
          <FinancialBlock onJump={jump} />
          <StateAidBanner stateAid={sa} totalBudget={cost} rebate={reb} />
          <BridgeFinancingBanner cashflow={sc.cashflow} />
        </div>

        {/* Detailed finance editor — collapsed by default */}
        <details className="group mt-7">
          <summary className="flex items-baseline justify-between cursor-pointer pb-3 border-b-[0.5px] border-[color:var(--color-border-paper-strong)]">
            <span className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
              {t('overview.finance.detailed')}
            </span>
            <span className="label-caps text-[color:var(--color-brass-deep)] group-open:text-[color:var(--color-on-paper)]">
              <span className="group-open:hidden">{t('common.expand')}</span>
              <span className="hidden group-open:inline">{t('common.collapse')}</span>
            </span>
          </summary>

          <div className="space-y-12 mt-8">
            <section className="grid grid-cols-2 gap-10">
              <FundingTable rebate={reb} />
              <CostTable />
            </section>

            <section className="space-y-10">
              <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6">
                <FundingStackChart funding={sc.funding} rebate={reb} />
              </div>
              <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6">
                <CostBreakdownChart costs={sc.costs} />
              </div>
              <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6">
                <CashflowChart cashflow={sc.cashflow} />
              </div>
            </section>
          </div>
        </details>
      </section>

      {/* Closing footer */}
      <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] text-center pt-6">
        {t('overview.footer.total.funding')} {fund}k € · {t('overview.footer.thousands')} · {t('overview.footer.scenario.in')} {state.activeScenario}
      </p>
    </div>
  );
}
