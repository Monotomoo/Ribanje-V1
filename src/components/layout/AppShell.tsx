import type { ReactNode } from 'react';
import { Mic } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { PageHeader } from './PageHeader';
import { useApp } from '../../state/AppContext';
import type { ScenarioKey, ViewKey } from '../../types';

const VIEW_NAMES: Record<ViewKey, string> = {
  overview: 'Overview',
  schedule: 'Schedule',
  sponsors: 'Sponsors',
  crew: 'Crew',
  risks: 'Risks',
  episodes: 'Episodes',
  production: 'Production',
  map: 'Map',
  dop: 'Cinematography',
  sound: 'Sound',
  pitch: 'Pitch',
  journal: 'Journal',
  contracts: 'Contracts',
  post: 'Post-production',
  distribution: 'Distribution',
  marketing: 'Marketing',
  research: 'Research',
};

const VIEW_SUBTITLES: Partial<Record<ViewKey, string>> = {
  overview: 'the project at a glance · production-first',
  schedule: 'phases · milestones · shoot calendar · deadlines',
  sponsors: 'pipeline · tiers · committed',
  crew: 'team · tasks · notes · standup',
  risks: 'probability × impact · mitigation',
  episodes: 'six episodes · two specials · drag to reorder',
  production: 'the command bridge · today · shots · wrap',
  map: 'Adriatic chart · anchorages · routes',
  dop: "Tom's cockpit · kit · lenses · color · time + light",
  sound: 'klapa · boat logistics · per-episode briefs',
  pitch: 'lab · treatment · decks · festivals · applications · press kit',
  journal: 'production diary · per shoot day',
  contracts: 'releases · clearances · status',
  post: 'editorial · cue sheet · subtitles · deliverables',
  distribution: 'sales · broadcasters · markets · deals',
  marketing: 'trailers · social · press · EPK',
  research: 'Hektorović · klapa · producers · subjects',
};

const SCENARIOS: ScenarioKey[] = ['lean', 'realistic', 'ambitious'];

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
  const { state, dispatch } = useApp();

  return (
    <div className="h-screen w-screen flex bg-[color:var(--color-paper)] text-[color:var(--color-on-paper)] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <div className="px-14 pt-9 pb-2 flex items-end justify-between gap-10 shrink-0 no-print">
          <PageHeader
            name={VIEW_NAMES[state.activeView]}
            subtitle={VIEW_SUBTITLES[state.activeView]}
          />
          <div
            className="flex items-center pb-4 border-b-[0.5px] border-transparent"
            role="tablist"
            aria-label="scenario"
          >
            {SCENARIOS.map((s, i) => {
              const active = state.activeScenario === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => dispatch({ type: 'SET_SCENARIO', scenario: s })}
                  className={`px-3.5 py-2 transition-colors duration-150 ${
                    i > 0 ? 'border-l-[0.5px] border-[color:var(--color-border-paper)]' : ''
                  } ${
                    active
                      ? 'text-[color:var(--color-on-paper)]'
                      : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
                  }`}
                >
                  <span
                    className={
                      active
                        ? 'display-italic text-[18px]'
                        : 'font-sans text-[12px] tracking-[0.14em] uppercase'
                    }
                  >
                    {s}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-14 pt-7 pb-14">{children}</div>

        {/* Floating capture button — opens the capture modal (⌘. shortcut also works) */}
        <button
          type="button"
          aria-label="open capture"
          title="capture (⌘.)"
          onClick={() => dispatch({ type: 'OPEN_CAPTURE', open: true })}
          className="no-print absolute bottom-8 right-8 w-12 h-12 rounded-full bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] text-[color:var(--color-chrome)] flex items-center justify-center shadow-[0_4px_22px_rgba(14,30,54,0.22)] transition-colors duration-150 z-10"
        >
          <Mic size={18} strokeWidth={2.25} />
        </button>
      </main>
    </div>
  );
}
