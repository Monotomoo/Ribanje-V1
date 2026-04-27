import {
  AlertTriangle,
  Aperture,
  AudioWaveform,
  BookOpen,
  CalendarRange,
  Clapperboard,
  Compass,
  Disc3,
  FileText,
  Film,
  Handshake,
  LayoutDashboard,
  Megaphone,
  Notebook,
  Redo2,
  RotateCcw,
  Scroll,
  Send,
  Undo2,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useApp } from '../../state/AppContext';
import type { ViewKey } from '../../types';

interface NavItem {
  key: ViewKey;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: 'Plan',
    items: [
      { key: 'overview', label: 'Overview',  icon: LayoutDashboard },
      { key: 'schedule', label: 'Schedule',  icon: CalendarRange },
      { key: 'sponsors', label: 'Sponsors',  icon: Handshake },
      { key: 'crew',     label: 'Crew',      icon: Users },
      { key: 'risks',    label: 'Risks',     icon: AlertTriangle },
    ],
  },
  {
    label: 'Make',
    items: [
      { key: 'episodes',   label: 'Episodes',       icon: Film },
      { key: 'production', label: 'Production',     icon: Clapperboard },
      { key: 'dop',        label: 'Cinematography', icon: Aperture },
      { key: 'sound',      label: 'Sound',          icon: AudioWaveform },
      { key: 'map',        label: 'Map',            icon: Compass },
    ],
  },
  {
    label: 'Tell',
    items: [
      { key: 'pitch',        label: 'Pitch',           icon: FileText },
      { key: 'journal',      label: 'Journal',         icon: Notebook },
      { key: 'contracts',    label: 'Contracts',       icon: Scroll },
      { key: 'post',         label: 'Post-production', icon: Disc3 },
      { key: 'distribution', label: 'Distribution',    icon: Send },
      { key: 'marketing',    label: 'Marketing',       icon: Megaphone },
    ],
  },
  {
    label: 'Library',
    items: [
      { key: 'research', label: 'Research', icon: BookOpen },
    ],
  },
];

interface SidebarProps {
  /* Phase 11 — drawer-mode props for phone. On md+ these are ignored. */
  drawerOpen?: boolean;
  onCloseDrawer?: () => void;
}

export function Sidebar({ drawerOpen = false, onCloseDrawer }: SidebarProps = {}) {
  const { state, dispatch, undo, redo, canUndo, canRedo } = useApp();

  function setView(view: ViewKey) {
    dispatch({ type: 'SET_VIEW', view });
    /* Close drawer after navigation on phone — desktop ignores this. */
    onCloseDrawer?.();
  }

  function handleReset() {
    if (
      window.confirm(
        'Reset to seed?\n\nThis discards all your edits and restores the original seed data.'
      )
    ) {
      dispatch({ type: 'RESET_TO_SEED' });
    }
  }

  return (
    <aside
      className={`w-[260px] shrink-0 h-full flex flex-col bg-[color:var(--color-chrome)] border-r-[0.5px] border-[color:var(--color-border-chrome-strong)] scrollbar-chrome
        fixed top-0 left-0 z-40 transition-transform duration-200 ease-out
        lg:static lg:z-auto lg:translate-x-0 lg:transition-none
        ${drawerOpen ? 'translate-x-0 shadow-[8px_0_32px_rgba(0,0,0,0.35)]' : '-translate-x-full lg:shadow-none'}
      `}
      aria-hidden={!drawerOpen ? undefined : 'false'}
    >
      {/* Wordmark */}
      <div className="px-7 pt-8 pb-9">
        <h1 className="display-italic text-[34px] text-[color:var(--color-on-chrome)] leading-none">
          Ribanje
        </h1>
        <div className="prose-body italic text-[12px] text-[color:var(--color-brass)] mt-1 tracking-wide">
          two thousand twenty-six
        </div>
        <div className="mt-3 h-px w-12 bg-[color:var(--color-border-brass)]" />
        <div className="prose-body italic text-[11px] text-[color:var(--color-on-chrome-faint)] mt-3 leading-snug">
          a six-episode documentary<br />of the outer Adriatic
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-7">
            <div className="px-3 mb-2.5 flex items-center gap-2.5">
              <span className="label-caps text-[color:var(--color-brass)]/75">
                {group.label}
              </span>
              <div className="flex-1 h-px bg-[color:var(--color-border-brass)]/50" />
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = state.activeView === item.key;
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => setView(item.key)}
                      className={`relative w-full text-left flex items-center gap-3 px-3 py-2 rounded-[3px] transition-colors duration-150 ${
                        active
                          ? 'bg-[color:var(--color-chrome-elevated)] text-[color:var(--color-on-chrome)]'
                          : 'text-[color:var(--color-on-chrome-muted)] hover:text-[color:var(--color-on-chrome)] hover:bg-[color:var(--color-chrome-elevated)]/55'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-2 bottom-2 w-[2px] bg-[color:var(--color-brass)] rounded-r" />
                      )}
                      <Icon size={14} className="shrink-0 opacity-90" />
                      <span
                        className={
                          active
                            ? 'display-italic text-[15px]'
                            : 'font-sans text-[13px] font-normal'
                        }
                      >
                        {item.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t-[0.5px] border-[color:var(--color-border-chrome)] px-7 py-5 space-y-3.5">
        {/* Scenario chip */}
        <div className="flex items-baseline justify-between">
          <span className="label-caps text-[color:var(--color-on-chrome-faint)]">
            Scenario
          </span>
          <span className="display-italic text-[15px] text-[color:var(--color-brass)]">
            {state.activeScenario}
          </span>
        </div>

        {/* Undo / redo */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (⌘Z)"
            className="flex items-center gap-1.5 py-1 font-sans text-[11px] text-[color:var(--color-on-chrome-faint)] hover:text-[color:var(--color-on-chrome)] disabled:opacity-30 disabled:hover:text-[color:var(--color-on-chrome-faint)] transition-colors duration-150"
          >
            <Undo2 size={11} />
            <span className="italic">undo</span>
          </button>
          <span className="text-[color:var(--color-on-chrome-faint)] opacity-40">·</span>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (⌘⇧Z)"
            className="flex items-center gap-1.5 py-1 font-sans text-[11px] text-[color:var(--color-on-chrome-faint)] hover:text-[color:var(--color-on-chrome)] disabled:opacity-30 disabled:hover:text-[color:var(--color-on-chrome-faint)] transition-colors duration-150"
          >
            <Redo2 size={11} />
            <span className="italic">redo</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="w-full flex items-center gap-2 py-1 font-sans text-[12px] text-[color:var(--color-on-chrome-faint)] hover:text-[color:var(--color-coral)] transition-colors duration-150"
        >
          <RotateCcw size={11} />
          <span className="italic">reset to seed</span>
        </button>

        <div className="font-sans text-[10px] tracking-[0.14em] uppercase text-[color:var(--color-on-chrome-faint)] flex items-center gap-2">
          <span className="border-[0.5px] border-[color:var(--color-border-chrome-strong)] rounded px-1.5 py-[1px]">
            ⌘K
          </span>
          <span className="border-[0.5px] border-[color:var(--color-border-chrome-strong)] rounded px-1.5 py-[1px]">
            ⌘1–9
          </span>
          <span className="border-[0.5px] border-[color:var(--color-border-chrome-strong)] rounded px-1.5 py-[1px]">
            ?
          </span>
        </div>
      </div>
    </aside>
  );
}
