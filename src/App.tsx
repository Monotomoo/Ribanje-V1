import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './state/AppContext';
import { AppShell } from './components/layout/AppShell';
import { Splash } from './components/layout/Splash';
import { hasSeenSplash } from './lib/storage';
import { isEditableTarget, isMod, SCENARIO_KEYS, VIEW_ORDER } from './lib/shortcuts';
import { CommandPalette } from './components/palette/CommandPalette';
import { CaptureModal } from './components/capture/CaptureModal';
import { OverviewView } from './components/views/OverviewView';
import { ScheduleView } from './components/views/ScheduleView';
import { SponsorsView } from './components/views/SponsorsView';
import { CrewView } from './components/views/CrewView';
import { RisksView } from './components/views/RisksView';
import { EpisodesView } from './components/views/EpisodesView';
import { SparksView } from './components/views/SparksView';
import { AlmanacView } from './components/views/AlmanacView';
import { ProductionView } from './components/views/ProductionView';
import { MapView } from './components/views/MapView';
import { DOPView } from './components/views/DOPView';
import { SoundView } from './components/views/SoundView';
import { PitchView } from './components/views/PitchView';
import { JournalView } from './components/views/JournalView';
import { ContractsView } from './components/views/ContractsView';
import { PostProductionView } from './components/views/PostProductionView';
import { DistributionView } from './components/views/DistributionView';
import { MarketingView } from './components/views/MarketingView';
import { ResearchView } from './components/views/ResearchView';
import type { ViewKey } from './types';

function ViewSwitch() {
  const { state } = useApp();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state.activeView + (state.selectedEpisodeId ?? '')}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        {renderView(state.activeView)}
      </motion.div>
    </AnimatePresence>
  );
}

function renderView(view: ViewKey) {
  switch (view) {
    case 'overview':     return <OverviewView />;
    case 'schedule':     return <ScheduleView />;
    case 'sponsors':     return <SponsorsView />;
    case 'crew':         return <CrewView />;
    case 'risks':        return <RisksView />;
    case 'episodes':     return <EpisodesView />;
    case 'sparks':       return <SparksView />;
    case 'almanac':      return <AlmanacView />;
    case 'production':   return <ProductionView />;
    case 'map':          return <MapView />;
    case 'dop':          return <DOPView />;
    case 'sound':        return <SoundView />;
    case 'pitch':        return <PitchView />;
    case 'journal':      return <JournalView />;
    case 'contracts':    return <ContractsView />;
    case 'post':         return <PostProductionView />;
    case 'distribution': return <DistributionView />;
    case 'marketing':    return <MarketingView />;
    case 'research':     return <ResearchView />;
  }
}

function GlobalShortcuts({
  onOpenPalette,
  onOpenCapture,
  paletteOpen,
  captureOpen,
}: {
  onOpenPalette: () => void;
  onOpenCapture: () => void;
  paletteOpen: boolean;
  captureOpen: boolean;
}) {
  const { dispatch, undo, redo } = useApp();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      /* ⌘K → open palette (works even from inputs) */
      if (isMod(e) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenPalette();
        return;
      }

      /* ⌘. → open capture (works even from inputs) */
      if (isMod(e) && e.key === '.') {
        e.preventDefault();
        onOpenCapture();
        return;
      }

      /* ⌘Z / ⌘⇧Z → undo / redo (works from inputs too — standard browser behaviour) */
      if (isMod(e) && e.key.toLowerCase() === 'z') {
        /* Don't intercept inside contenteditable / textarea / input — let the browser
           do its native intra-field undo. We only override when no editable focused. */
        if (!isEditableTarget(e.target)) {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
          return;
        }
      }

      if (isEditableTarget(e.target)) return;
      if (paletteOpen || captureOpen) return;

      /* ⌘1–9 → jump views */
      if (isMod(e) && /^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const view = VIEW_ORDER[idx];
        if (view) {
          e.preventDefault();
          dispatch({ type: 'SET_VIEW', view });
        }
        return;
      }

      /* 1/2/3 → scenarios (no modifier) */
      if (!isMod(e) && SCENARIO_KEYS[e.key]) {
        e.preventDefault();
        dispatch({ type: 'SET_SCENARIO', scenario: SCENARIO_KEYS[e.key] });
        return;
      }

      /* ⌘R → reset to seed (with confirm) */
      if (isMod(e) && e.key.toLowerCase() === 'r' && !e.shiftKey) {
        e.preventDefault();
        if (
          window.confirm(
            'Reset to seed?\n\nThis discards all your edits and restores the original seed data.'
          )
        ) {
          dispatch({ type: 'RESET_TO_SEED' });
        }
        return;
      }

      /* Escape → close any open episode hub */
      if (e.key === 'Escape') {
        dispatch({ type: 'SELECT_EPISODE', episodeId: null });
        return;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    dispatch,
    onOpenPalette,
    onOpenCapture,
    paletteOpen,
    captureOpen,
    undo,
    redo,
  ]);

  return null;
}

function AppInner() {
  const { state, dispatch } = useApp();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const openCapture = useCallback(
    () => dispatch({ type: 'OPEN_CAPTURE', open: true }),
    [dispatch]
  );
  const closeCapture = useCallback(
    () => dispatch({ type: 'OPEN_CAPTURE', open: false }),
    [dispatch]
  );

  return (
    <>
      <GlobalShortcuts
        onOpenPalette={openPalette}
        onOpenCapture={openCapture}
        paletteOpen={paletteOpen}
        captureOpen={state.captureOpen}
      />
      <AppShell>
        <ViewSwitch />
      </AppShell>
      <CommandPalette open={paletteOpen} onClose={closePalette} />
      <CaptureModal open={state.captureOpen} onClose={closeCapture} />
    </>
  );
}

export function App() {
  const skipSplash =
    hasSeenSplash() ||
    new URLSearchParams(window.location.search).get('nosplash') === '1';
  const [splashDone, setSplashDone] = useState(skipSplash);
  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  return (
    <AppProvider>
      {!splashDone && <Splash onComplete={handleSplashComplete} />}
      <AppInner />
    </AppProvider>
  );
}

export default App;
