import { useMemo, useState } from 'react';
import {
  ArrowDown,
  CloudRain,
  Compass,
  GitBranch,
  Lock,
  MapPin,
  Plus,
  Settings2,
  Trash2,
  Waves,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type {
  BackupChainEntry,
  BackupCondition,
  Location,
} from '../../types';

/* ---------- Backup Location Chain (Phase 12) ----------

   For every primary location, an ordered fallback chain. If Stari Grad
   rains, where do we go? Plan B → Plan C. Each entry can be tied to
   a specific condition (rain · wind · sea · permit denied · access ·
   general) and an estimated travel time from the primary.

   Why it matters: weather is a documentary's enemy #1. Pre-baked
   fallbacks let the producer call an audible at 5am instead of
   improvising under pressure.

   Two display modes:
     • Single-location editor (used in LocationDrawer)
     • All-locations overview (used in MapView / Locations tab)

   Travel time is hand-entered for now. Auto-suggest by haversine
   distance is a later improvement.
*/

const CONDITION_META: Record<BackupCondition, { label: string; Icon: LucideIcon; description: string }> = {
  rain:    { label: 'rain',          Icon: CloudRain, description: 'precipitation forecast triggers fallback' },
  wind:    { label: 'wind',           Icon: Wind,      description: 'high wind / bura / jugo conditions' },
  sea:     { label: 'sea state',      Icon: Waves,     description: 'rough sea > 1.5m wave height' },
  permit:  { label: 'permit denied',  Icon: Lock,      description: 'primary permit not approved in time' },
  access:  { label: 'access blocked', Icon: Compass,   description: 'closed road / boat access issue' },
  general: { label: 'general',        Icon: Settings2, description: 'any other reason — discretionary' },
};

interface Props {
  locationId?: string;          // if set, single-location editor; otherwise full overview
  compact?: boolean;
}

export function BackupLocationChain({ locationId, compact = false }: Props) {
  const { state, dispatch } = useApp();

  const targetLocation = locationId
    ? state.locations.find((l) => l.id === locationId)
    : null;

  if (locationId && !targetLocation) {
    return null;
  }

  /* Single-location editor mode */
  if (targetLocation) {
    return (
      <SingleChainEditor
        location={targetLocation}
        allLocations={state.locations}
        onUpdate={(chain) => {
          dispatch({
            type: 'UPDATE_LOCATION',
            id: targetLocation.id,
            patch: { backupChain: chain },
          });
        }}
        compact={compact}
      />
    );
  }

  /* Overview mode — all locations with their chains */
  return (
    <OverviewMode locations={state.locations} compact={compact} />
  );
}

/* ---------- Single chain editor ---------- */

function SingleChainEditor({
  location,
  allLocations,
  onUpdate,
  compact,
}: {
  location: Location;
  allLocations: Location[];
  onUpdate: (chain: BackupChainEntry[]) => void;
  compact?: boolean;
}) {
  const chain = location.backupChain ?? [];
  const otherLocations = allLocations.filter((l) => l.id !== location.id);

  function addEntry() {
    const next: BackupChainEntry = {
      backupLocationId: otherLocations[0]?.id ?? '',
      condition: 'general',
    };
    onUpdate([...chain, next]);
  }

  function patchEntry(idx: number, patch: Partial<BackupChainEntry>) {
    const next = chain.map((e, i) => (i === idx ? { ...e, ...patch } : e));
    onUpdate(next);
  }

  function removeEntry(idx: number) {
    onUpdate(chain.filter((_, i) => i !== idx));
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = chain.slice();
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onUpdate(next);
  }

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
      <header className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="display-italic text-[15px] text-[color:var(--color-on-paper)] leading-tight flex items-center gap-2">
            <GitBranch size={13} className="text-[color:var(--color-brass)]" />
            Backup chain
          </h3>
          {!compact && (
            <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
              if {location.label} fails, fall through in order
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={addEntry}
          disabled={otherLocations.length === 0}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] text-[11px] bg-[color:var(--color-brass)]/15 hover:bg-[color:var(--color-brass)]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={11} />
          <span className="prose-body italic">add backup</span>
        </button>
      </header>

      {/* Primary marker */}
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-[3px] bg-[color:var(--color-success)]/10 border-l-[2px] border-[color:var(--color-success)] mb-1.5">
        <MapPin size={11} className="text-[color:var(--color-success)] shrink-0" />
        <span className="display-italic text-[12px] text-[color:var(--color-on-paper)] flex-1">
          {location.label}
        </span>
        <span className="label-caps text-[9px] text-[color:var(--color-success)]">
          primary
        </span>
      </div>

      {/* Chain entries */}
      {chain.length === 0 ? (
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] py-3 text-center">
          No backups planned. Add one if weather, wind, or permits could
          knock this location out.
        </div>
      ) : (
        chain.map((entry, idx) => {
          const backup = allLocations.find((l) => l.id === entry.backupLocationId);
          const conditionMeta = entry.condition ? CONDITION_META[entry.condition] : null;
          const ConditionIcon = conditionMeta?.Icon ?? Settings2;
          return (
            <div key={idx}>
              <div className="flex justify-center my-1">
                <ArrowDown
                  size={11}
                  className="text-[color:var(--color-on-paper-muted)] opacity-60"
                />
              </div>
              <div className="rounded-[3px] bg-[color:var(--color-paper)] border-l-[2px] border-[color:var(--color-brass)] overflow-hidden">
                <div className="px-2 py-1.5 flex items-center gap-2">
                  <span className="label-caps text-[9px] text-[color:var(--color-brass-deep)] tabular-nums w-7">
                    {idx === 0 ? 'plan B' : idx === 1 ? 'plan C' : `plan ${String.fromCharCode(66 + idx)}`}
                  </span>
                  <select
                    value={entry.backupLocationId}
                    onChange={(e) => patchEntry(idx, { backupLocationId: e.target.value })}
                    className="flex-1 px-1.5 py-0.5 rounded-[2px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
                  >
                    {otherLocations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => moveUp(idx)}
                      className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-brass-deep)] p-0.5 transition-colors"
                      aria-label="move up"
                    >
                      ↑
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeEntry(idx)}
                    className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] p-0.5 transition-colors"
                    aria-label="remove"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                {!compact && (
                  <div className="px-2 pb-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <Field label="trigger">
                      <select
                        value={entry.condition ?? 'general'}
                        onChange={(e) =>
                          patchEntry(idx, { condition: e.target.value as BackupCondition })
                        }
                        className="w-full px-1.5 py-0.5 rounded-[2px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[11px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
                      >
                        {(Object.keys(CONDITION_META) as BackupCondition[]).map((c) => (
                          <option key={c} value={c}>{CONDITION_META[c].label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="travel min">
                      <input
                        type="number"
                        value={entry.travelMinutes ?? ''}
                        onChange={(e) =>
                          patchEntry(idx, {
                            travelMinutes: e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                        placeholder="—"
                        className="w-full px-1.5 py-0.5 rounded-[2px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[11px] tabular-nums focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
                      />
                    </Field>
                    <Field label="notes">
                      <input
                        type="text"
                        value={entry.notes ?? ''}
                        onChange={(e) => patchEntry(idx, { notes: e.target.value || undefined })}
                        placeholder="why this fallback?"
                        className="w-full px-1.5 py-0.5 rounded-[2px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[11px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
                      />
                    </Field>
                  </div>
                )}
                {compact && entry.condition && (
                  <div className="px-2 pb-1.5 flex items-center gap-1.5 prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)]">
                    <ConditionIcon size={9} />
                    <span>{conditionMeta?.label}</span>
                    {entry.travelMinutes != null && (
                      <span className="tabular-nums">· {entry.travelMinutes}min away</span>
                    )}
                    {backup?.lat && backup?.lng && (
                      <span className="tabular-nums">
                        · {backup.lat.toFixed(2)}°, {backup.lng.toFixed(2)}°
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}

/* ---------- Overview ---------- */

function OverviewMode({
  locations,
  compact,
}: {
  locations: Location[];
  compact?: boolean;
}) {
  const [filter, setFilter] = useState<'all' | 'with-chain' | 'no-chain'>('all');

  const ranked = useMemo(() => {
    return locations
      .map((l) => ({
        location: l,
        chainLength: l.backupChain?.length ?? 0,
      }))
      .filter((entry) => {
        if (filter === 'with-chain') return entry.chainLength > 0;
        if (filter === 'no-chain') return entry.chainLength === 0;
        return true;
      })
      .sort((a, b) => b.chainLength - a.chainLength);
  }, [locations, filter]);

  const stats = useMemo(() => {
    const withChain = locations.filter((l) => (l.backupChain?.length ?? 0) > 0).length;
    return { total: locations.length, withChain, missing: locations.length - withChain };
  }, [locations]);

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-4">
      <header className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="display-italic text-[16px] text-[color:var(--color-on-paper)] leading-tight flex items-center gap-2">
            <GitBranch size={14} className="text-[color:var(--color-brass)]" />
            Backup location chains
          </h3>
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5 tabular-nums">
            {stats.withChain}/{stats.total} locations have a fallback
            {stats.missing > 0 && (
              <>
                {' · '}
                <span className="text-[color:var(--color-coral-deep)]">
                  {stats.missing} unprotected
                </span>
              </>
            )}
          </div>
        </div>
        {!compact && (
          <div className="flex items-center gap-1">
            {(['all', 'with-chain', 'no-chain'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`label-caps text-[10px] px-2 py-0.5 rounded-[2px] transition-colors ${
                  filter === f
                    ? 'bg-[color:var(--color-on-paper)] text-[color:var(--color-paper-light)]'
                    : 'text-[color:var(--color-on-paper-muted)] hover:bg-[color:var(--color-paper-deep)]'
                }`}
              >
                {f.replace('-', ' ')}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="space-y-1.5">
        {ranked.map(({ location, chainLength }) => {
          return (
            <ChainSummaryRow
              key={location.id}
              location={location}
              chainLength={chainLength}
              allLocations={locations}
            />
          );
        })}
      </div>

      {ranked.length === 0 && (
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] py-3">
          No locations match the filter.
        </div>
      )}
    </section>
  );
}

/* ---------- Summary row ---------- */

function ChainSummaryRow({
  location,
  chainLength,
  allLocations,
}: {
  location: Location;
  chainLength: number;
  allLocations: Location[];
}) {
  const { dispatch } = useApp();
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-[3px] bg-[color:var(--color-paper)] border-l-[2px] ${
        chainLength === 0
          ? 'border-l-[color:var(--color-coral-deep)]/40'
          : 'border-l-[color:var(--color-brass)]/60'
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-2.5 py-1.5 flex items-center gap-2 text-left hover:bg-[color:var(--color-paper-deep)]/30 transition-colors"
      >
        <MapPin size={11} className="text-[color:var(--color-on-paper-muted)] shrink-0" />
        <span className="display-italic text-[12px] text-[color:var(--color-on-paper)] flex-1 truncate">
          {location.label}
        </span>
        <span
          className={`label-caps text-[9px] tabular-nums ${
            chainLength === 0
              ? 'text-[color:var(--color-coral-deep)]'
              : 'text-[color:var(--color-brass-deep)]'
          }`}
        >
          {chainLength === 0
            ? 'no fallback'
            : `${chainLength} backup${chainLength === 1 ? '' : 's'}`}
        </span>
      </button>

      {expanded && (
        <div className="border-t-[0.5px] border-[color:var(--color-border-paper)] p-2">
          <SingleChainEditor
            location={location}
            allLocations={allLocations}
            onUpdate={(chain) => {
              dispatch({
                type: 'UPDATE_LOCATION',
                id: location.id,
                patch: { backupChain: chain },
              });
            }}
            compact
          />
        </div>
      )}
    </div>
  );
}

/* ---------- Field shim ---------- */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="prose-body italic text-[9px] text-[color:var(--color-on-paper-muted)] mb-1 leading-tight">
        {label}
      </div>
      {children}
    </label>
  );
}
