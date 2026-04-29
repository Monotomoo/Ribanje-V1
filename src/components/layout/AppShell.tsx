import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Menu, Mic, X } from 'lucide-react';
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
  sparks: 'Sparks',
  almanac: 'Almanac',
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
  sparks: 'creative capture · for the moments before they\'re moments',
  almanac: 'fisherman\'s almanac · 33 Adriatic species · catch log · captain\'s card',
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

  /* Phase 11 — sidebar drawer state for phone (<md). Desktop ignores. */
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* Auto-close drawer when active view changes (e.g. navigation tap). */
  const prevViewRef = useRef(state.activeView);
  useEffect(() => {
    if (state.activeView !== prevViewRef.current) {
      setDrawerOpen(false);
      prevViewRef.current = state.activeView;
    }
  }, [state.activeView]);

  /* Lock body scroll while drawer is open. */
  useEffect(() => {
    if (drawerOpen) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [drawerOpen]);

  /* Close drawer on Escape. */
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className="h-screen w-screen flex bg-[color:var(--color-paper)] text-[color:var(--color-on-paper)] overflow-hidden">
      <Sidebar drawerOpen={drawerOpen} onCloseDrawer={() => setDrawerOpen(false)} />

      {/* Phone + iPad-portrait backdrop — closes drawer on tap */}
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-[color:var(--color-chrome)]/55 backdrop-blur-[2px] transition-opacity"
        />
      )}

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <div className="px-5 pt-5 pb-2 md:px-8 md:pt-7 lg:px-14 lg:pt-9 flex items-end justify-between gap-3 md:gap-10 shrink-0 no-print">
          {/* Hamburger — visible on phone + iPad portrait */}
          <button
            type="button"
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setDrawerOpen((v) => !v)}
            className="lg:hidden flex items-center justify-center w-11 h-11 -ml-2 rounded-[3px] text-[color:var(--color-on-paper)] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors duration-150 shrink-0"
          >
            {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex-1 min-w-0">
            <PageHeader
              name={VIEW_NAMES[state.activeView]}
              subtitle={VIEW_SUBTITLES[state.activeView]}
            />
          </div>

          <div
            className="flex items-center pb-2 md:pb-4 border-b-[0.5px] border-transparent shrink-0"
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
                  className={`px-2.5 py-2 md:px-3.5 transition-colors duration-150 ${
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
                        ? 'display-italic text-[15px] md:text-[18px]'
                        : 'font-sans text-[10px] md:text-[12px] tracking-[0.14em] uppercase'
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
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-20 md:px-8 md:pb-16 lg:px-14 lg:pt-7 lg:pb-14">
          {children}
        </div>

        {/* Floating capture button — opens the capture modal (⌘. shortcut also works) */}
        <button
          type="button"
          aria-label="open capture"
          title="capture (⌘.)"
          onClick={() => dispatch({ type: 'OPEN_CAPTURE', open: true })}
          className="no-print fixed lg:absolute bottom-5 right-5 lg:bottom-8 lg:right-8 w-14 h-14 lg:w-12 lg:h-12 rounded-full bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] text-[color:var(--color-chrome)] flex items-center justify-center shadow-[0_4px_22px_rgba(14,30,54,0.22)] transition-colors duration-150 z-20"
        >
          <Mic size={20} strokeWidth={2.25} />
        </button>
      </main>
    </div>
  );
}
