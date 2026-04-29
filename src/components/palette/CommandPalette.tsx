import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
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
  Printer,
  RotateCcw,
  Scroll,
  Search,
  Anchor,
  Send,
  Sparkles,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { ScenarioKey, ViewKey } from '../../types';

interface PaletteItem {
  id: string;
  label: string;
  group: string;
  hint?: string;
  icon?: LucideIcon;
  run: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const VIEW_META: Record<ViewKey, { label: string; icon: LucideIcon }> = {
  overview: { label: 'Overview', icon: LayoutDashboard },
  schedule: { label: 'Schedule', icon: CalendarRange },
  sponsors: { label: 'Sponsors', icon: Handshake },
  crew: { label: 'Crew', icon: Users },
  risks: { label: 'Risks', icon: AlertTriangle },
  episodes: { label: 'Episodes', icon: Film },
  sparks: { label: 'Sparks', icon: Sparkles },
  almanac: { label: 'Almanac', icon: Anchor },
  production: { label: 'Production', icon: Clapperboard },
  map: { label: 'Map', icon: Compass },
  dop: { label: 'Cinematography', icon: Aperture },
  sound: { label: 'Sound', icon: AudioWaveform },
  pitch: { label: 'Pitch', icon: FileText },
  journal: { label: 'Journal', icon: Notebook },
  contracts: { label: 'Contracts', icon: Scroll },
  post: { label: 'Post-production', icon: Disc3 },
  distribution: { label: 'Distribution', icon: Send },
  marketing: { label: 'Marketing', icon: Megaphone },
  research: { label: 'Research', icon: BookOpen },
};

export function CommandPalette({ open, onClose }: Props) {
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  /* Build the item list — views, scenarios, episodes, sponsors, locations, commands */
  const items = useMemo<PaletteItem[]>(() => {
    const out: PaletteItem[] = [];

    /* Views */
    (Object.keys(VIEW_META) as ViewKey[]).forEach((view) => {
      const m = VIEW_META[view];
      out.push({
        id: 'view:' + view,
        label: m.label,
        group: 'Views',
        icon: m.icon,
        run: () => {
          dispatch({ type: 'SELECT_EPISODE', episodeId: null });
          dispatch({ type: 'SET_VIEW', view });
        },
      });
    });

    /* Scenarios */
    (['lean', 'realistic', 'ambitious'] as ScenarioKey[]).forEach((s) => {
      out.push({
        id: 'sc:' + s,
        label: `Switch to ${s} scenario`,
        group: 'Scenarios',
        icon: Zap,
        run: () => dispatch({ type: 'SET_SCENARIO', scenario: s }),
      });
    });

    /* Episodes (open hub) */
    [...state.episodes, ...state.specials].forEach((ep) => {
      out.push({
        id: 'ep:' + ep.id,
        label: `Open episode · ${ep.title}`,
        hint: ep.anchor,
        group: 'Episodes',
        icon: Film,
        run: () => {
          dispatch({ type: 'SET_VIEW', view: 'episodes' });
          dispatch({ type: 'SELECT_EPISODE', episodeId: ep.id });
        },
      });
    });

    /* Sponsors */
    state.sponsors.forEach((sp) => {
      out.push({
        id: 'sp:' + sp.id,
        label: `Sponsor · ${sp.name}`,
        hint: `${sp.category} · tier ${sp.tier}`,
        group: 'Sponsors',
        icon: Handshake,
        run: () => dispatch({ type: 'SET_VIEW', view: 'sponsors' }),
      });
    });

    /* Locations */
    state.locations.forEach((l) => {
      out.push({
        id: 'loc:' + l.id,
        label: `Anchorage · ${l.label}`,
        hint: `${l.lat.toFixed(2)}°N · ${l.lng.toFixed(2)}°E`,
        group: 'Locations',
        icon: Compass,
        run: () => dispatch({ type: 'SET_VIEW', view: 'map' }),
      });
    });

    /* Crew */
    state.crew.forEach((c) => {
      out.push({
        id: 'crew:' + c.id,
        label: `Crew · ${c.name}`,
        hint: c.role,
        group: 'Crew',
        icon: Users,
        run: () => dispatch({ type: 'SET_VIEW', view: 'crew' }),
      });
    });

    /* Risks */
    state.risks.forEach((r) => {
      out.push({
        id: 'risk:' + r.id,
        label: `Risk · ${r.title}`,
        hint: `${r.probability} prob · ${r.impact} impact`,
        group: 'Risks',
        icon: AlertTriangle,
        run: () => dispatch({ type: 'SET_VIEW', view: 'risks' }),
      });
    });

    /* Klapa */
    state.klapa.forEach((k) => {
      out.push({
        id: 'kl:' + k.id,
        label: `Song · ${k.songTitle}`,
        hint: `${k.region.replace('-', ' ')}`,
        group: 'Sound',
        icon: AudioWaveform,
        run: () => dispatch({ type: 'SET_VIEW', view: 'sound' }),
      });
    });

    /* Festivals */
    state.festivals.forEach((f) => {
      out.push({
        id: 'fest:' + f.id,
        label: `Festival · ${f.name}`,
        hint: `${[f.city, f.country].filter(Boolean).join(' · ')} · ${f.status}`,
        group: 'Festivals',
        icon: FileText,
        run: () => dispatch({ type: 'SET_VIEW', view: 'pitch' }),
      });
    });

    /* Funding applications */
    state.applications.forEach((a) => {
      out.push({
        id: 'app:' + a.id,
        label: `Application · ${a.name}`,
        hint: `${a.funder} · ${a.status}${a.amountK ? ' · ' + a.amountK + 'k' : ''}`,
        group: 'Applications',
        icon: FileText,
        run: () => dispatch({ type: 'SET_VIEW', view: 'pitch' }),
      });
    });

    /* Tasks (open + in-progress only) */
    state.tasks
      .filter((t) => t.status !== 'done')
      .forEach((t) => {
        const assignee = t.assigneeId
          ? state.crew.find((c) => c.id === t.assigneeId)?.name
          : null;
        const targetView: ViewKey =
          t.context === 'crew' ? 'crew' : 'crew';
        out.push({
          id: 'task:' + t.id,
          label: `Task · ${t.title}`,
          hint: `${t.status}${assignee ? ' · ' + assignee : ''}${t.dueDate ? ' · due ' + t.dueDate : ''}`,
          group: 'Tasks',
          icon: Users,
          run: () => dispatch({ type: 'SET_VIEW', view: targetView }),
        });
      });

    /* Anti-script moments */
    state.antiScriptMoments.slice(0, 30).forEach((m) => {
      const ep = state.episodes.find((e) => e.id === m.episodeId);
      out.push({
        id: 'mom:' + m.id,
        label: `Moment · ${m.title}`,
        hint: ep ? `Ep ${ep.number} · ${ep.title} · ${m.status}` : m.status,
        group: 'Story',
        icon: Film,
        run: () => {
          dispatch({ type: 'SET_VIEW', view: 'episodes' });
          dispatch({ type: 'SELECT_EPISODE', episodeId: m.episodeId });
        },
      });
    });

    /* Variations (logline / title / synopsis) */
    state.variations.forEach((v) => {
      const preview = v.body.slice(0, 60).replace(/\s+/g, ' ');
      out.push({
        id: 'var:' + v.id,
        label: `${v.category.replace('-', ' ')} · ${preview || '(empty)'}`,
        hint: v.isCurrent ? 'canonical' : v.audience ?? '',
        group: 'Pitch lab',
        icon: FileText,
        run: () => dispatch({ type: 'SET_VIEW', view: 'pitch' }),
      });
    });

    /* Commands */
    out.push({
      id: 'cmd:capture',
      label: 'Open capture',
      hint: '⌘. · voice or text · save anywhere',
      group: 'Commands',
      icon: Zap,
      run: () => dispatch({ type: 'OPEN_CAPTURE', open: true }),
    });
    out.push({
      id: 'cmd:print',
      label: 'Print current view',
      hint: '⌘P · save as PDF',
      group: 'Commands',
      icon: Printer,
      run: () => window.print(),
    });
    out.push({
      id: 'cmd:reset',
      label: 'Reset to seed',
      hint: 'Discards every edit · confirm required',
      group: 'Commands',
      icon: RotateCcw,
      run: () => {
        if (
          window.confirm(
            'Reset to seed?\n\nThis discards all your edits and restores the original seed data.'
          )
        ) {
          dispatch({ type: 'RESET_TO_SEED' });
        }
      },
    });

    return out;
  }, [state, dispatch]);

  /* Fuzzy search */
  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ['label', 'hint', 'group'],
        threshold: 0.34,
        ignoreLocation: true,
      }),
    [items]
  );
  const filtered = useMemo<PaletteItem[]>(() => {
    if (!query.trim()) return items;
    return fuse.search(query).map((r) => r.item);
  }, [query, items, fuse]);

  /* Group filtered items by group, preserving the natural group order */
  const grouped = useMemo<{ group: string; items: PaletteItem[] }[]>(() => {
    const order: string[] = [];
    const map = new Map<string, PaletteItem[]>();
    for (const it of filtered) {
      if (!map.has(it.group)) {
        order.push(it.group);
        map.set(it.group, []);
      }
      map.get(it.group)!.push(it);
    }
    return order.map((g) => ({ group: g, items: map.get(g)! }));
  }, [filtered]);

  const flat = filtered;

  useEffect(() => {
    setActiveIdx(0);
  }, [query, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const it = flat[activeIdx];
      if (it) {
        it.run();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }

  /* Scroll active item into view */
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-idx="${activeIdx}"]`
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="close palette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-[color:var(--color-chrome)]/40 backdrop-blur-[2px] z-[180]"
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[18vh] -translate-x-1/2 w-[min(640px,92vw)] max-h-[64vh] bg-[color:var(--color-paper-card)] border-[0.5px] border-[color:var(--color-border-paper-strong)] rounded-[5px] shadow-[0_24px_60px_rgba(14,30,54,0.28)] z-[190] flex flex-col overflow-hidden"
            onKeyDown={onKeyDown}
          >
            <header className="flex items-center gap-3 px-5 py-4 border-b-[0.5px] border-[color:var(--color-border-paper)]">
              <Search size={16} className="text-[color:var(--color-on-paper-faint)]" />
              <input
                ref={inputRef}
                type="text"
                placeholder="search anything · jump anywhere · run a command"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none prose-body text-[16px] text-[color:var(--color-on-paper)] placeholder:italic placeholder:text-[color:var(--color-on-paper-faint)]"
              />
              <kbd className="label-caps text-[color:var(--color-on-paper-faint)] border-[0.5px] border-[color:var(--color-border-paper-strong)] rounded px-1.5 py-[1px]">
                Esc
              </kbd>
            </header>

            <ul ref={listRef} className="flex-1 overflow-y-auto py-2">
              {grouped.length === 0 && (
                <li className="px-5 py-8 prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] text-center">
                  No matches.
                </li>
              )}
              {grouped.map((g) => (
                <li key={g.group}>
                  <div className="px-5 pt-3 pb-1 label-caps text-[color:var(--color-brass-deep)]">
                    {g.group}
                  </div>
                  <ul>
                    {g.items.map((it) => {
                      const idx = flat.indexOf(it);
                      const active = idx === activeIdx;
                      const Icon = it.icon ?? Search;
                      return (
                        <li
                          key={it.id}
                          data-idx={idx}
                          onMouseEnter={() => setActiveIdx(idx)}
                          onClick={() => {
                            it.run();
                            onClose();
                          }}
                          className={`px-5 py-2 flex items-baseline gap-3 cursor-pointer transition-colors ${
                            active
                              ? 'bg-[color:var(--color-paper-deep)]/55 text-[color:var(--color-on-paper)]'
                              : 'text-[color:var(--color-on-paper-muted)]'
                          }`}
                        >
                          <Icon
                            size={13}
                            className={
                              active
                                ? 'text-[color:var(--color-brass-deep)]'
                                : 'text-[color:var(--color-on-paper-faint)]'
                            }
                          />
                          <span
                            className={`flex-1 ${
                              active
                                ? 'display-italic text-[15px]'
                                : 'prose-body text-[14px]'
                            }`}
                          >
                            {it.label}
                          </span>
                          {it.hint && (
                            <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)]">
                              {it.hint}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>

            <footer className="flex items-center gap-3 px-5 py-2.5 border-t-[0.5px] border-[color:var(--color-border-paper)] label-caps text-[color:var(--color-on-paper-faint)]">
              <span className="flex items-center gap-1">
                <kbd className="border-[0.5px] border-[color:var(--color-border-paper-strong)] rounded px-1.5 py-[1px]">
                  ↑↓
                </kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="border-[0.5px] border-[color:var(--color-border-paper-strong)] rounded px-1.5 py-[1px]">
                  ↵
                </kbd>
                run
              </span>
              <span className="ml-auto">
                {flat.length} {flat.length === 1 ? 'result' : 'results'}
              </span>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
