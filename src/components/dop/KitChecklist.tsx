import { useMemo, useState } from 'react';
import { CheckSquare, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useApp } from '../../state/AppContext';

/* Pre-shoot kit checklist — per shoot day, items grouped by category.
   The discipline that prevents missed o-rings, dead batteries, dirty sensors.
   State persists in ShootDay.kitChecklist as Record<itemKey, boolean>. */

interface ChecklistItem {
  key: string;
  label: string;
  detail: string;
  /* When this should be checked — day-of vs day-before */
  timing: 'day-before' | 'day-of';
}

interface ChecklistGroup {
  category: string;
  items: ChecklistItem[];
}

const CHECKLIST: ChecklistGroup[] = [
  {
    category: 'Sensors & bodies',
    items: [
      {
        key: 'sensor-clean-a',
        label: 'Cam A sensor cleaned',
        detail: 'Eclipse fluid + sensor swab. Inspect with loupe under bright light.',
        timing: 'day-before',
      },
      {
        key: 'sensor-clean-b',
        label: 'Cam B sensor cleaned',
        detail: 'Same protocol — FX bodies attract more dust at sea than studio.',
        timing: 'day-before',
      },
      {
        key: 'firmware',
        label: 'Firmware verified current',
        detail: 'Cross-check Cam A + B + drone + UW. Mid-shoot updates create risk.',
        timing: 'day-before',
      },
      {
        key: 'backup-body',
        label: 'Backup body charged & ready',
        detail: 'Spare body for failure recovery — most likely Cam B as A-cam fallback.',
        timing: 'day-before',
      },
    ],
  },
  {
    category: 'Power',
    items: [
      {
        key: 'batt-cycle',
        label: 'V-mount batteries cycled',
        detail: 'Full discharge → full charge ≥1× per week. Check Wh delivered vs rated.',
        timing: 'day-before',
      },
      {
        key: 'batt-charge-am',
        label: 'All batteries charged AM',
        detail: 'V-mount × 6 minimum (4 active + 2 reserve). Sony NP-FZ100 × 8.',
        timing: 'day-of',
      },
      {
        key: 'drone-batt',
        label: 'Drone batteries 4 fresh',
        detail: 'DJI TB51 × 4 (Inspire 3) or equivalent. Storage charge if not flying.',
        timing: 'day-of',
      },
      {
        key: 'trinity-batt',
        label: 'Trinity batteries × 3',
        detail: 'Trinity is power-hungry — 3 batts per 4-hour shoot day minimum.',
        timing: 'day-of',
      },
    ],
  },
  {
    category: 'Storage & data',
    items: [
      {
        key: 'media-format',
        label: 'All cards/SSDs formatted in-camera',
        detail: 'Format on the body that records to it. Never reuse without format.',
        timing: 'day-before',
      },
      {
        key: 'media-pool',
        label: 'Media pool sized for the day',
        detail: 'Day GB budget × 1.5 safety margin. Match codec settings.',
        timing: 'day-before',
      },
      {
        key: 'backup-drive',
        label: 'DIT drive ready for offload',
        detail: 'Two-drive rule: primary + mirror. Hash log template ready.',
        timing: 'day-of',
      },
    ],
  },
  {
    category: 'Lenses',
    items: [
      {
        key: 'lens-clean',
        label: 'All lens elements cleaned',
        detail: 'Front + rear elements. Inspect for sea-spray salt residue.',
        timing: 'day-before',
      },
      {
        key: 'lens-rings',
        label: 'Focus & iris rings smooth',
        detail: 'Cooke S4i + zoom — exercise rings, listen for grit.',
        timing: 'day-before',
      },
      {
        key: 'follow-focus',
        label: 'Follow focus calibrated',
        detail: 'Marks set per lens. ARRI WCU-4 paired with the FF.',
        timing: 'day-of',
      },
      {
        key: 'mattebox',
        label: 'Mattebox clean · filters in slots',
        detail: 'ND set staged in matte box trays. Polarizer indexed.',
        timing: 'day-of',
      },
    ],
  },
  {
    category: 'Specialty rigs',
    items: [
      {
        key: 'uw-pressure',
        label: 'UW housing pressure-tested',
        detail: 'Nauticam — 30 min in shore-test bath. Check leak alarm.',
        timing: 'day-before',
      },
      {
        key: 'uw-orings',
        label: 'UW o-rings cleaned + greased',
        detail: 'Isopropyl wipe → silicone grease (Nauticam-spec only).',
        timing: 'day-before',
      },
      {
        key: 'drone-props',
        label: 'Drone props inspected',
        detail: 'No nicks, no cracks. Spare set in kit. Sensors calibrated.',
        timing: 'day-of',
      },
      {
        key: 'trinity-bias',
        label: 'Trinity bias-axis trimmed',
        detail: 'Counterweight match camera + lens. No drift in static hold.',
        timing: 'day-of',
      },
      {
        key: 'gimbal-balance',
        label: 'Gimbal balanced for primary lens',
        detail: 'Re-balance after any lens swap. Test all 3 axes.',
        timing: 'day-of',
      },
    ],
  },
  {
    category: 'Audio & monitoring',
    items: [
      {
        key: 'monitor-cal',
        label: 'Director monitor calibrated',
        detail: 'SmallHD or equivalent — Rec.709 LUT loaded, brightness checked outdoors.',
        timing: 'day-before',
      },
      {
        key: 'audio-test',
        label: 'Audio rig tested with cam',
        detail: 'Boom + lav scratch tracks at known levels. Sync confirmed.',
        timing: 'day-of',
      },
      {
        key: 'walkies',
        label: 'Walkie channels assigned & tested',
        detail: 'Per Sound RF plan. No collisions with lav frequencies.',
        timing: 'day-of',
      },
    ],
  },
];

export function KitChecklist() {
  const { state, dispatch } = useApp();
  const sortedDays = useMemo(
    () => [...state.shootDays].sort((a, b) => a.date.localeCompare(b.date)),
    [state.shootDays]
  );
  const [selectedDayId, setSelectedDayId] = useState<string>(
    sortedDays[Math.min(11, sortedDays.length - 1)]?.id ?? sortedDays[0]?.id ?? ''
  );
  const [collapsed, setCollapsed] = useState(false);

  const day = sortedDays.find((d) => d.id === selectedDayId) ?? sortedDays[0];
  if (!day) return null;

  const checks = day.kitChecklist ?? {};
  const allItems = CHECKLIST.flatMap((g) => g.items);
  const totalCount = allItems.length;
  const doneCount = allItems.filter((it) => checks[it.key]).length;
  const completePct = Math.round((doneCount / totalCount) * 100);

  function toggle(itemKey: string) {
    const next = { ...checks, [itemKey]: !checks[itemKey] };
    dispatch({ type: 'UPDATE_SHOOT_DAY', id: day.id, patch: { kitChecklist: next } });
  }

  function reset() {
    if (window.confirm('Reset all checklist items for this day?')) {
      dispatch({ type: 'UPDATE_SHOOT_DAY', id: day.id, patch: { kitChecklist: {} } });
    }
  }

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-brass)]/40 rounded-[3px] overflow-hidden">
      {/* Header */}
      <header
        className="px-5 py-3 flex items-baseline gap-3 cursor-pointer hover:bg-[color:var(--color-paper-deep)]/15 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <CheckSquare size={14} className="text-[color:var(--color-brass-deep)]" />
        <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
          Pre-shoot kit checklist
        </h4>
        <span
          className={`prose-body italic text-[12px] tabular-nums ${
            completePct === 100
              ? 'text-[color:var(--color-success)]'
              : completePct >= 50
              ? 'text-[color:var(--color-brass-deep)]'
              : 'text-[color:var(--color-on-paper-muted)]'
          }`}
        >
          {doneCount} / {totalCount} · {completePct}%
        </span>
        <select
          value={selectedDayId}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setSelectedDayId(e.target.value)}
          className="ml-auto bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[12px] text-[color:var(--color-on-paper)] py-0.5"
        >
          {sortedDays.map((d, i) => (
            <option key={d.id} value={d.id}>
              Day {i + 1} · {d.date}
            </option>
          ))}
        </select>
        {!collapsed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              reset();
            }}
            className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors"
            aria-label="Reset checklist"
            title="Reset all"
          >
            <RefreshCw size={11} />
          </button>
        )}
        {collapsed ? (
          <ChevronDown size={12} className="text-[color:var(--color-on-paper-faint)]" />
        ) : (
          <ChevronUp size={12} className="text-[color:var(--color-on-paper-faint)]" />
        )}
      </header>

      {/* Progress bar */}
      <div className="h-[2px] bg-[color:var(--color-paper-deep)]/30">
        <div
          className="h-full transition-all"
          style={{
            width: `${completePct}%`,
            background:
              completePct === 100
                ? 'var(--color-success)'
                : 'var(--color-brass)',
          }}
        />
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">
          {CHECKLIST.map((g) => {
            const groupDone = g.items.filter((it) => checks[it.key]).length;
            return (
              <div key={g.category}>
                <div className="flex items-baseline gap-2 mb-2 pb-1 border-b-[0.5px] border-[color:var(--color-border-paper)]">
                  <span className="label-caps text-[color:var(--color-brass-deep)]">
                    {g.category}
                  </span>
                  <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] tabular-nums">
                    {groupDone}/{g.items.length}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {g.items.map((it) => {
                    const done = !!checks[it.key];
                    return (
                      <li key={it.key}>
                        <button
                          type="button"
                          onClick={() => toggle(it.key)}
                          className="w-full text-left flex items-baseline gap-2 group"
                        >
                          <span
                            className={`inline-block w-3 h-3 rounded-[2px] border-[0.5px] shrink-0 translate-y-[2px] transition-colors ${
                              done
                                ? 'bg-[color:var(--color-success)] border-[color:var(--color-success)]'
                                : 'border-[color:var(--color-border-paper-strong)] group-hover:border-[color:var(--color-brass)]'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div
                              className={`prose-body italic text-[12px] leading-tight transition-colors ${
                                done
                                  ? 'text-[color:var(--color-on-paper-faint)] line-through'
                                  : 'text-[color:var(--color-on-paper)]'
                              }`}
                            >
                              {it.label}
                              <span
                                className="ml-1.5 label-caps tracking-[0.08em] text-[8px] align-middle"
                                style={{
                                  color:
                                    it.timing === 'day-of'
                                      ? 'var(--color-coral-deep)'
                                      : 'var(--color-brass-deep)',
                                }}
                              >
                                {it.timing === 'day-of' ? 'AM' : 'D-1'}
                              </span>
                            </div>
                            {!done && (
                              <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] leading-tight mt-0.5">
                                {it.detail}
                              </div>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
