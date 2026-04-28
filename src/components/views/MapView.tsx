import { useState } from 'react';
import { useApp } from '../../state/AppContext';
import { AdriaticChart, EPISODE_COLORS } from '../map/AdriaticChart';
import { LocationDrawer } from '../map/LocationDrawer';
import { BackupLocationChain } from '../locations/BackupLocationChain';

export function MapView() {
  const { state } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = state.locations.find((l) => l.id === selectedId) ?? null;

  /* Episode legend — main + specials + Hektorović reference if any anchorage uses it */
  const refsExist = state.locations.some((l) => l.episodeId === 'hektorovic');
  const episodeEntries = [
    ...state.episodes.map((e) => ({ id: e.id, label: `Ep ${roman(e.number)} · ${e.title}` })),
    ...state.specials.map((e) => ({ id: e.id, label: `${e.title}` })),
    ...(refsExist
      ? [{ id: 'hektorovic', label: 'Hektorović 1568 voyage' }]
      : []),
  ];

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="flex items-baseline justify-between">
        <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
          Adriatic chart
        </h2>
        <div className="label-caps text-[color:var(--color-on-paper-faint)]">
          {state.locations.length} anchorages · {state.routes.length} legs · click any pin
        </div>
      </div>

      <AdriaticChart
        locations={state.locations}
        routes={state.routes}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
      />

      <Legend entries={episodeEntries} />

      {/* Backup chains overview — Phase 12 */}
      <BackupLocationChain />

      <LocationDrawer
        location={selected}
        episodes={[...state.episodes, ...state.specials]}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

interface LegendEntry {
  id: string;
  label: string;
}

function Legend({ entries }: { entries: LegendEntry[] }) {
  return (
    <section>
      <div className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-3">
        Voyage palette
      </div>
      <ul className="grid grid-cols-4 gap-x-8 gap-y-2">
        {entries.map((e) => {
          const color = EPISODE_COLORS[e.id] ?? '#2D4A6B';
          return (
            <li key={e.id} className="flex items-baseline gap-2.5">
              <span
                className="w-3 h-[2px] mt-2 shrink-0"
                style={{ background: color }}
              />
              <span className="prose-body text-[13px] text-[color:var(--color-on-paper)]">
                {e.label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function roman(n: number): string {
  return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][n] ?? String(n);
}
