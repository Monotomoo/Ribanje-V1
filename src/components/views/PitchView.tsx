import { useState } from 'react';
import { Printer } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { FUNDING_SOURCES } from '../../lib/seed';
import {
  rebate,
  totalCost,
  totalFunding,
  stateAidTotal,
  margin,
} from '../../lib/finance';
import { PitchDeck } from '../pitch/PitchDeck';
import { InvestorLetter } from '../pitch/InvestorLetter';
import { SponsorTemplates } from '../pitch/SponsorTemplates';
import { Lab } from '../pitch/Lab';
import { TreatmentWriter } from '../pitch/TreatmentWriter';
import { FestivalTracker } from '../pitch/FestivalTracker';
import { Applications } from '../pitch/Applications';
import { PressKit } from '../pitch/PressKit';
import { DeckVariants } from '../pitch/DeckVariants';

const TABS = [
  'Lab',
  'Treatment',
  'Decks & letters',
  'Festivals',
  'Applications',
  'Press kit',
] as const;
type Tab = (typeof TABS)[number];

const ARTIFACTS = ['Pitch deck', 'Investor letter', 'Sponsor templates'] as const;
type Artifact = (typeof ARTIFACTS)[number];

export function PitchView() {
  const { state } = useApp();
  const [tab, setTab] = useState<Tab>('Lab');
  const [artifact, setArtifact] = useState<Artifact>('Pitch deck');
  const sc = state.scenarios[state.activeScenario];

  const cost = totalCost(sc.costs);
  const reb = rebate(cost, sc.qualifyingSpendPct, sc.blendedRebateRate);
  const fund = totalFunding(sc.funding, reb);
  const sa = stateAidTotal(sc.funding, reb, FUNDING_SOURCES);
  const mg = margin(fund, cost);
  const figures = { cost, reb, fund, sa, mg };

  return (
    <div className="space-y-7 max-w-[1200px]">
      <div className="flex items-baseline justify-between no-print">
        <div>
          <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
            Pitch
          </h2>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Loglines · treatment · decks &amp; letters · festivals · funding applications · press kit. ⌘P prints any tab cleanly.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] rounded-[2px] px-3 py-1.5 transition-colors"
        >
          <Printer size={11} />
          Print
        </button>
      </div>

      <div className="flex items-baseline gap-1 border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] p-1 w-fit no-print">
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

      {tab === 'Lab' && <Lab />}
      {tab === 'Treatment' && <TreatmentWriter />}
      {tab === 'Decks & letters' && (
        <DecksAndLetters
          artifact={artifact}
          setArtifact={setArtifact}
          figures={figures}
        />
      )}
      {tab === 'Festivals' && <FestivalTracker />}
      {tab === 'Applications' && <Applications />}
      {tab === 'Press kit' && <PressKit />}
    </div>
  );
}

function DecksAndLetters({
  artifact,
  setArtifact,
  figures,
}: {
  artifact: Artifact;
  setArtifact: (a: Artifact) => void;
  figures: { cost: number; reb: number; fund: number; sa: number; mg: number };
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-1 border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] p-1 w-fit no-print">
        {ARTIFACTS.map((a) => {
          const active = artifact === a;
          return (
            <button
              key={a}
              type="button"
              onClick={() => setArtifact(a)}
              className={`px-3 py-1 transition-colors rounded-[2px] ${
                active
                  ? 'bg-[color:var(--color-paper-deep)]/40 text-[color:var(--color-on-paper)]'
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              <span
                className={
                  active
                    ? 'display-italic text-[13px]'
                    : 'font-sans text-[10px] tracking-[0.14em] uppercase'
                }
              >
                {a}
              </span>
            </button>
          );
        })}
      </div>

      <div className="print-page">
        {artifact === 'Pitch deck' && <PitchDeck figures={figures} />}
        {artifact === 'Investor letter' && <InvestorLetter figures={figures} />}
        {artifact === 'Sponsor templates' && <SponsorTemplates />}
      </div>

      {artifact === 'Pitch deck' && (
        <div className="no-print pt-7 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          <DeckVariants />
        </div>
      )}
    </div>
  );
}
