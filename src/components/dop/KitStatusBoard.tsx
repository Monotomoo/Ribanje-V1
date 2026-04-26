import { useMemo, useState } from 'react';
import {
  Activity,
  Battery,
  CircleDot,
  Droplets,
  Wrench,
  Zap,
  AlertCircle,
  CheckCircle2,
  Pause,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { DOPKitItem, KitStatus } from '../../types';

/* Live Kit Status Board — DURING-shoot grid showing every kit item's
   live state. Click status pill to cycle through: ready → rolling →
   standby → charging → drying → serviced → down → ready.
   Updated timestamps tracked. Filter chips above. */

const STATUS_ORDER: KitStatus[] = [
  'ready',
  'rolling',
  'standby',
  'charging',
  'drying',
  'serviced',
  'down',
];

const STATUS_TONE: Record<KitStatus, { bg: string; fg: string; icon: typeof Activity }> = {
  ready:    { bg: 'rgba(107,144,128,0.18)', fg: 'rgb(75,110,90)',  icon: CheckCircle2 },
  rolling:  { bg: 'rgba(194,106,74,0.18)',  fg: 'rgb(160,80,55)',  icon: CircleDot },
  standby:  { bg: 'rgba(201,169,97,0.18)',  fg: 'rgb(140,110,55)', icon: Pause },
  charging: { bg: 'rgba(91,163,204,0.18)',  fg: 'rgb(60,120,160)', icon: Battery },
  drying:   { bg: 'rgba(91,163,204,0.10)',  fg: 'rgb(80,140,180)', icon: Droplets },
  serviced: { bg: 'rgba(120,128,100,0.18)', fg: 'rgb(85,95,75)',   icon: Wrench },
  down:     { bg: 'rgba(194,106,74,0.30)',  fg: 'rgb(140,40,30)',  icon: AlertCircle },
};

function nextStatus(current: KitStatus | undefined): KitStatus {
  const cur = current ?? 'ready';
  const idx = STATUS_ORDER.indexOf(cur);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

export function KitStatusBoard() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<KitStatus | 'all'>('all');
  const [collapsed, setCollapsed] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: state.dopKit.length };
    for (const s of STATUS_ORDER) c[s] = 0;
    for (const k of state.dopKit) {
      const s = k.status ?? 'ready';
      c[s] = (c[s] ?? 0) + 1;
    }
    return c;
  }, [state.dopKit]);

  const filtered = useMemo(() => {
    if (filter === 'all') return state.dopKit;
    return state.dopKit.filter((k) => (k.status ?? 'ready') === filter);
  }, [state.dopKit, filter]);

  function cycle(item: DOPKitItem) {
    const ns = nextStatus(item.status);
    dispatch({
      type: 'UPDATE_DOP_KIT',
      id: item.id,
      patch: { status: ns, statusUpdatedAt: new Date().toISOString() },
    });
  }

  /* Issues callout — items down or charging-too-long */
  const issues = state.dopKit.filter(
    (k) => k.status === 'down' || k.status === 'serviced'
  );
  const rollingCount = counts.rolling ?? 0;

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
      <header
        className="px-5 py-3 flex items-baseline gap-3 cursor-pointer hover:bg-[color:var(--color-paper-deep)]/15 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Zap size={14} className="text-[color:var(--color-brass-deep)]" />
        <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
          Kit status board
        </h4>
        {rollingCount > 0 && (
          <span className="label-caps tracking-[0.14em] text-[10px] text-[color:var(--color-coral-deep)] flex items-baseline gap-1">
            <CircleDot
              size={6}
              className="fill-current"
              style={{ animation: 'pulse 1.4s ease-in-out infinite' }}
            />
            {rollingCount} rolling
          </span>
        )}
        {issues.length > 0 && (
          <span className="label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-coral-deep)]">
            ⚠ {issues.length} attention
          </span>
        )}
        <span className="ml-auto prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
          {state.dopKit.length} items · click pill to cycle
        </span>
      </header>

      {!collapsed && (
        <>
          {/* Filter chips */}
          <div className="px-5 py-2 flex items-baseline flex-wrap gap-1.5 border-b-[0.5px] border-[color:var(--color-border-paper)]">
            <FilterChip
              label="all"
              count={counts.all}
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            />
            {STATUS_ORDER.map((s) => (
              <FilterChip
                key={s}
                label={s}
                count={counts[s] ?? 0}
                active={filter === s}
                onClick={() => setFilter(s)}
                tone={STATUS_TONE[s]}
              />
            ))}
          </div>

          {/* Grid */}
          <ul className="px-5 py-4 grid grid-cols-3 gap-2">
            {filtered.map((k) => (
              <KitCard key={k.id} item={k} onCycle={() => cycle(k)} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  tone,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  tone?: { bg: string; fg: string };
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`label-caps tracking-[0.10em] text-[10px] px-2 py-0.5 rounded-[2px] transition-colors border-[0.5px] ${
        active
          ? 'text-[color:var(--color-on-paper)]'
          : 'text-[color:var(--color-on-paper-faint)] border-[color:var(--color-border-paper)] hover:text-[color:var(--color-on-paper-muted)]'
      }`}
      style={{
        background: active && tone ? tone.bg : active ? 'var(--color-brass)/0.20' : undefined,
        borderColor: active && tone ? tone.fg : active ? 'var(--color-brass)' : undefined,
        color: active && tone ? tone.fg : undefined,
      }}
    >
      {label} <span className="opacity-70 ml-1">{count}</span>
    </button>
  );
}

function KitCard({ item, onCycle }: { item: DOPKitItem; onCycle: () => void }) {
  const status: KitStatus = item.status ?? 'ready';
  const tone = STATUS_TONE[status];
  const Icon = tone.icon;

  const updatedAgo = item.statusUpdatedAt
    ? formatAgo(new Date(item.statusUpdatedAt).getTime())
    : null;

  return (
    <li className="bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] px-3 py-2.5 flex items-baseline gap-2">
      <div className="flex-1 min-w-0">
        <div className="display-italic text-[13px] text-[color:var(--color-on-paper)] truncate leading-tight">
          {item.label}
        </div>
        <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] truncate mt-0.5">
          {item.category}
          {updatedAgo && ` · ${updatedAgo}`}
        </div>
      </div>
      <button
        type="button"
        onClick={onCycle}
        className="flex items-baseline gap-1 label-caps tracking-[0.08em] text-[9px] px-1.5 py-0.5 rounded-[2px] transition-opacity hover:opacity-80 shrink-0"
        style={{
          background: tone.bg,
          color: tone.fg,
        }}
        aria-label={`Cycle from ${status}`}
        title={`Click to cycle (currently ${status})`}
      >
        <Icon
          size={8}
          className={status === 'rolling' ? 'fill-current' : ''}
          style={status === 'rolling' ? { animation: 'pulse 1.4s ease-in-out infinite' } : undefined}
        />
        {status}
      </button>
    </li>
  );
}

function formatAgo(timestampMs: number): string {
  const deltaSec = (Date.now() - timestampMs) / 1000;
  if (deltaSec < 60) return 'just now';
  if (deltaSec < 3600) return `${Math.round(deltaSec / 60)}m ago`;
  if (deltaSec < 86400) return `${Math.round(deltaSec / 3600)}h ago`;
  return `${Math.round(deltaSec / 86400)}d ago`;
}
