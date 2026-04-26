import { useMemo, useState } from 'react';
import { Globe, Plus, Send, Star, Target, Tv, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { newId } from '../episode/shared';
import type {
  Broadcaster,
  BroadcasterStatus,
  Deal,
  DealStatus,
  MarketEvent,
  MarketEventStatus,
  SalesAgent,
  SalesAgentStatus,
} from '../../types';
import { EditableText } from '../primitives/EditableText';
import { FilterableRegister, type RegisterColumn } from '../primitives/FilterableRegister';

type TabKey = 'agents' | 'broadcasters' | 'markets' | 'deals';

export function DistributionView() {
  const { state } = useApp();
  const [tab, setTab] = useState<TabKey>('agents');

  /* Stat tiles */
  const stats = useMemo(() => {
    const signedAgents = state.salesAgents.filter((a) => a.status === 'signed').length;
    const acquiredBroadcasters = state.broadcasters.filter(
      (b) => b.status === 'acquired'
    ).length;
    const upcomingMarkets = state.marketEvents.filter((m) => {
      if (!m.applicationDeadline) return false;
      return new Date(m.applicationDeadline + 'T00:00:00Z').getTime() > Date.now();
    }).length;
    const closedDeals = state.deals.filter((d) => d.status === 'signed' || d.status === 'paid').length;
    return { signedAgents, acquiredBroadcasters, upcomingMarkets, closedDeals };
  }, [state.salesAgents, state.broadcasters, state.marketEvents, state.deals]);

  return (
    <div className="space-y-7 max-w-[1400px]">
      {/* Stat strip */}
      <section className="grid grid-cols-4 gap-5">
        <Tile
          icon={Send}
          label="Sales agents"
          value={state.salesAgents.length}
          sub={stats.signedAgents > 0 ? `${stats.signedAgents} signed` : 'tracked'}
        />
        <Tile
          icon={Tv}
          label="Broadcasters"
          value={state.broadcasters.length}
          sub={stats.acquiredBroadcasters > 0 ? `${stats.acquiredBroadcasters} acquired` : 'mapped'}
        />
        <Tile
          icon={Globe}
          label="Markets"
          value={state.marketEvents.length}
          sub={stats.upcomingMarkets > 0 ? `${stats.upcomingMarkets} upcoming` : 'tracked'}
        />
        <Tile
          icon={Target}
          label="Deals"
          value={state.deals.length}
          sub={stats.closedDeals > 0 ? `${stats.closedDeals} closed` : 'in pipeline'}
        />
      </section>

      {/* Tab strip */}
      <nav
        role="tablist"
        className="flex items-baseline gap-1.5 border-b-[0.5px] border-[color:var(--color-border-paper)]"
      >
        {(
          [
            { key: 'agents', label: 'Sales agents', hint: 'territory · fit · status' },
            { key: 'broadcasters', label: 'Broadcasters', hint: 'country · slot · acquisitions' },
            { key: 'markets', label: 'Markets', hint: 'forums · pitching · co-pro' },
            { key: 'deals', label: 'Deals', hint: 'pipeline · terms · status' },
          ] as { key: TabKey; label: string; hint: string }[]
        ).map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`relative px-4 py-2.5 transition-colors ${
                active
                  ? 'text-[color:var(--color-on-paper)]'
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              <span
                className={
                  active
                    ? 'display-italic text-[19px]'
                    : 'font-sans text-[12px] tracking-[0.12em] uppercase'
                }
              >
                {t.label}
              </span>
              {active && (
                <>
                  <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[color:var(--color-brass)]" />
                  <span className="block prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-0.5">
                    {t.hint}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Tab body */}
      <div>
        {tab === 'agents' && <SalesAgentsTab />}
        {tab === 'broadcasters' && <BroadcastersTab />}
        {tab === 'markets' && <MarketsTab />}
        {tab === 'deals' && <DealsTab />}
      </div>
    </div>
  );
}

/* ---------- Sales agents ---------- */

const AGENT_STATUSES: SalesAgentStatus[] = ['target', 'pitched', 'in-talks', 'signed', 'declined'];
const AGENT_STATUS_TONE: Record<SalesAgentStatus, string> = {
  target: 'text-[color:var(--color-on-paper-muted)]',
  pitched: 'text-[color:var(--color-brass-deep)]',
  'in-talks': 'text-[color:var(--color-warn)]',
  signed: 'text-[color:var(--color-success)]',
  declined: 'text-[color:var(--color-on-paper-faint)] line-through',
};

function SalesAgentsTab() {
  const { state, dispatch } = useApp();

  function add() {
    const agent: SalesAgent = {
      id: newId('sa'),
      name: 'New agent',
      territories: [],
      status: 'target',
    };
    dispatch({ type: 'ADD_SALES_AGENT', agent });
  }

  function patch(id: string, p: Partial<SalesAgent>) {
    dispatch({ type: 'UPDATE_SALES_AGENT', id, patch: p });
  }

  function cycleStatus(a: SalesAgent) {
    const idx = AGENT_STATUSES.indexOf(a.status);
    patch(a.id, { status: AGENT_STATUSES[(idx + 1) % AGENT_STATUSES.length] });
  }

  const columns: RegisterColumn<SalesAgent>[] = [
    {
      key: 'name',
      label: 'Agent',
      width: 'minmax(180px, 1fr)',
      sortValue: (r) => r.name.toLowerCase(),
      render: (r) => (
        <EditableText
          value={r.name}
          onChange={(v) => patch(r.id, { name: v })}
          className="display-italic text-[14px] text-[color:var(--color-on-paper)]"
        />
      ),
    },
    {
      key: 'territories',
      label: 'Territories',
      width: 'minmax(160px, 1.2fr)',
      render: (r) => (
        <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          {r.territories.length > 0 ? r.territories.join(' · ') : '—'}
        </span>
      ),
    },
    {
      key: 'highlights',
      label: 'Catalog highlights',
      width: 'minmax(220px, 1.5fr)',
      render: (r) => (
        <EditableText
          value={r.catalogHighlights ?? ''}
          onChange={(v) => patch(r.id, { catalogHighlights: v || undefined })}
          placeholder="—"
          className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
        />
      ),
    },
    {
      key: 'fit',
      label: 'Fit',
      width: '70px',
      align: 'right',
      sortValue: (r) => r.fitScore ?? 0,
      render: (r) => <FitStars score={r.fitScore ?? 0} onChange={(s) => patch(r.id, { fitScore: s })} />,
    },
    {
      key: 'status',
      label: 'Status',
      width: '110px',
      sortValue: (r) => r.status,
      render: (r) => (
        <button
          type="button"
          onClick={() => cycleStatus(r)}
          className={`label-caps tracking-[0.14em] text-[10px] py-1 px-1.5 rounded-[2px] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors ${AGENT_STATUS_TONE[r.status]}`}
        >
          {r.status}
        </button>
      ),
    },
    {
      key: 'del',
      label: '',
      width: '28px',
      render: (r) => (
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Delete ${r.name}?`)) {
              dispatch({ type: 'DELETE_SALES_AGENT', id: r.id });
            }
          }}
          className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors"
          aria-label="Delete agent"
        >
          <Trash2 size={11} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
          Sales agents take the show to broadcasters and markets. Pre-seeded shortlist —
          edit fit score and status as conversations progress.
        </p>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add agent</span>
        </button>
      </div>
      <FilterableRegister<SalesAgent>
        rows={state.salesAgents}
        columns={columns}
        rowId={(r) => r.id}
        defaultSortKey="fit"
        defaultSortDir="desc"
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: '__all__', label: 'all' },
              ...AGENT_STATUSES.map((s) => ({ value: s, label: s })),
            ],
            match: (r, v) => r.status === v,
          },
        ]}
      />
    </div>
  );
}

/* ---------- Broadcasters ---------- */

const BROADCASTER_STATUSES: BroadcasterStatus[] = ['target', 'pitched', 'in-talks', 'acquired', 'declined'];
const BROADCASTER_STATUS_TONE: Record<BroadcasterStatus, string> = {
  target: 'text-[color:var(--color-on-paper-muted)]',
  pitched: 'text-[color:var(--color-brass-deep)]',
  'in-talks': 'text-[color:var(--color-warn)]',
  acquired: 'text-[color:var(--color-success)]',
  declined: 'text-[color:var(--color-on-paper-faint)] line-through',
};

function BroadcastersTab() {
  const { state, dispatch } = useApp();

  function add() {
    const broadcaster: Broadcaster = {
      id: newId('bc'),
      name: 'New broadcaster',
      country: '',
      slot: 'mixed',
      status: 'target',
    };
    dispatch({ type: 'ADD_BROADCASTER', broadcaster });
  }

  function patch(id: string, p: Partial<Broadcaster>) {
    dispatch({ type: 'UPDATE_BROADCASTER', id, patch: p });
  }

  function cycleStatus(b: Broadcaster) {
    const idx = BROADCASTER_STATUSES.indexOf(b.status);
    patch(b.id, { status: BROADCASTER_STATUSES[(idx + 1) % BROADCASTER_STATUSES.length] });
  }

  const columns: RegisterColumn<Broadcaster>[] = [
    {
      key: 'name',
      label: 'Broadcaster',
      width: 'minmax(160px, 1fr)',
      sortValue: (r) => r.name.toLowerCase(),
      render: (r) => (
        <EditableText
          value={r.name}
          onChange={(v) => patch(r.id, { name: v })}
          className="display-italic text-[14px] text-[color:var(--color-on-paper)]"
        />
      ),
    },
    {
      key: 'country',
      label: 'Country',
      width: '140px',
      sortValue: (r) => r.country,
      render: (r) => (
        <EditableText
          value={r.country}
          onChange={(v) => patch(r.id, { country: v })}
          className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
        />
      ),
    },
    {
      key: 'strand',
      label: 'Strand',
      width: 'minmax(180px, 1.2fr)',
      render: (r) => (
        <EditableText
          value={r.docStrand ?? ''}
          onChange={(v) => patch(r.id, { docStrand: v || undefined })}
          placeholder="—"
          className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
        />
      ),
    },
    {
      key: 'slot',
      label: 'Slot',
      width: '110px',
      sortValue: (r) => r.slot,
      render: (r) => (
        <span className="label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-brass-deep)]">
          {r.slot}
        </span>
      ),
    },
    {
      key: 'fit',
      label: 'Fit',
      width: '70px',
      align: 'right',
      sortValue: (r) => r.fitScore ?? 0,
      render: (r) => <FitStars score={r.fitScore ?? 0} onChange={(s) => patch(r.id, { fitScore: s })} />,
    },
    {
      key: 'status',
      label: 'Status',
      width: '110px',
      sortValue: (r) => r.status,
      render: (r) => (
        <button
          type="button"
          onClick={() => cycleStatus(r)}
          className={`label-caps tracking-[0.14em] text-[10px] py-1 px-1.5 rounded-[2px] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors ${BROADCASTER_STATUS_TONE[r.status]}`}
        >
          {r.status}
        </button>
      ),
    },
    {
      key: 'del',
      label: '',
      width: '28px',
      render: (r) => (
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Delete ${r.name}?`)) {
              dispatch({ type: 'DELETE_BROADCASTER', id: r.id });
            }
          }}
          className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors"
          aria-label="Delete broadcaster"
        >
          <Trash2 size={11} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
          25 broadcasters mapped — strategic anchors (HRT · ARTE · BBC) to streaming. Sort by
          fit; cycle status as you progress.
        </p>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add broadcaster</span>
        </button>
      </div>
      <FilterableRegister<Broadcaster>
        rows={state.broadcasters}
        columns={columns}
        rowId={(r) => r.id}
        defaultSortKey="fit"
        defaultSortDir="desc"
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: '__all__', label: 'all' },
              ...BROADCASTER_STATUSES.map((s) => ({ value: s, label: s })),
            ],
            match: (r, v) => r.status === v,
          },
        ]}
      />
    </div>
  );
}

/* ---------- Markets ---------- */

const MARKET_STATUSES: MarketEventStatus[] = ['target', 'applied', 'accepted', 'attending', 'declined'];
const MARKET_STATUS_TONE: Record<MarketEventStatus, string> = {
  target: 'text-[color:var(--color-on-paper-muted)]',
  applied: 'text-[color:var(--color-brass-deep)]',
  accepted: 'text-[color:var(--color-success)]',
  attending: 'text-[color:var(--color-success)]',
  declined: 'text-[color:var(--color-on-paper-faint)] line-through',
};

function MarketsTab() {
  const { state, dispatch } = useApp();

  function add() {
    const event: MarketEvent = {
      id: newId('me'),
      name: 'New market',
      city: '',
      dates: '',
      fit: '',
      status: 'target',
    };
    dispatch({ type: 'ADD_MARKET_EVENT', event });
  }

  function cycleStatus(m: MarketEvent) {
    const idx = MARKET_STATUSES.indexOf(m.status);
    dispatch({
      type: 'UPDATE_MARKET_EVENT',
      id: m.id,
      patch: { status: MARKET_STATUSES[(idx + 1) % MARKET_STATUSES.length] },
    });
  }

  /* Sort by application deadline (closest first), nulls last. */
  const sorted = [...state.marketEvents].sort((a, b) => {
    if (!a.applicationDeadline && !b.applicationDeadline) return 0;
    if (!a.applicationDeadline) return 1;
    if (!b.applicationDeadline) return -1;
    return a.applicationDeadline.localeCompare(b.applicationDeadline);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
          Doc markets where deals happen. Sorted by upcoming deadline.
        </p>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add market</span>
        </button>
      </div>
      <ul className="grid grid-cols-2 gap-4">
        {sorted.map((m) => {
          const days = m.applicationDeadline
            ? Math.ceil(
                (new Date(m.applicationDeadline + 'T00:00:00Z').getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              )
            : null;
          const overdue = days != null && days < 0;
          const soon = days != null && days >= 0 && days < 30;
          return (
            <li
              key={m.id}
              className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4"
            >
              <header className="flex items-baseline justify-between mb-2">
                <div className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
                  {m.name}
                </div>
                <button
                  type="button"
                  onClick={() => cycleStatus(m)}
                  className={`label-caps tracking-[0.14em] text-[10px] ${MARKET_STATUS_TONE[m.status]}`}
                >
                  {m.status}
                </button>
              </header>
              <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mb-2">
                {m.city} · {m.dates}
                {m.cost && (
                  <>
                    {' · '}
                    <span className="text-[color:var(--color-brass-deep)]">{m.cost}</span>
                  </>
                )}
              </p>
              <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed mb-3">
                {m.fit}
              </p>
              {m.applicationDeadline && (
                <div className="flex items-baseline justify-between pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
                  <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
                    deadline {m.applicationDeadline}
                  </span>
                  <span
                    className={`display-italic text-[14px] tabular-nums ${
                      overdue
                        ? 'text-[color:var(--color-coral-deep)]'
                        : soon
                        ? 'text-[color:var(--color-warn)]'
                        : 'text-[color:var(--color-on-paper-muted)]'
                    }`}
                  >
                    {overdue ? `${Math.abs(days)}d overdue` : `${days}d to file`}
                  </span>
                </div>
              )}
              {m.notes && (
                <p className="prose-body italic text-[11px] text-[color:var(--color-brass-deep)] mt-2">
                  {m.notes}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Deals ---------- */

const DEAL_STATUSES: DealStatus[] = ['in-negotiation', 'in-legal', 'signed', 'paid', 'cancelled'];
const DEAL_STATUS_TONE: Record<DealStatus, string> = {
  'in-negotiation': 'text-[color:var(--color-brass-deep)]',
  'in-legal': 'text-[color:var(--color-warn)]',
  signed: 'text-[color:var(--color-success)]',
  paid: 'text-[color:var(--color-success)] font-semibold',
  cancelled: 'text-[color:var(--color-on-paper-faint)] line-through',
};

function DealsTab() {
  const { state, dispatch } = useApp();

  function add() {
    const deal: Deal = {
      id: newId('deal'),
      party: 'New deal',
      territory: '',
      formatRights: '',
      status: 'in-negotiation',
    };
    dispatch({ type: 'ADD_DEAL', deal });
  }

  function patch(id: string, p: Partial<Deal>) {
    dispatch({ type: 'UPDATE_DEAL', id, patch: p });
  }

  function cycleStatus(d: Deal) {
    const idx = DEAL_STATUSES.indexOf(d.status);
    patch(d.id, { status: DEAL_STATUSES[(idx + 1) % DEAL_STATUSES.length] });
  }

  const totalAdvance = state.deals.reduce((s, d) => s + (d.advanceK ?? 0), 0);

  if (state.deals.length === 0) {
    return (
      <div className="space-y-5">
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-8 py-12 text-center">
          <p className="display-italic text-[20px] text-[color:var(--color-on-paper)] mb-2">
            No deals in flight yet
          </p>
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mb-5 max-w-[480px] mx-auto">
            Once conversations with sales agents and broadcasters move from "pitched" to
            "in talks," log the deal here with territory · format rights · advance · MG ·
            backend · status.
          </p>
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-4 py-2 rounded-[2px] transition-colors"
          >
            <Plus size={12} />
            <span>log first deal</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
          {state.deals.length} deal{state.deals.length === 1 ? '' : 's'} in pipeline ·{' '}
          <span className="text-[color:var(--color-brass-deep)] tabular-nums">
            {totalAdvance}k €
          </span>{' '}
          total advance
        </p>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add deal</span>
        </button>
      </div>
      <ul className="space-y-2">
        {state.deals.map((d) => (
          <li
            key={d.id}
            className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-3 grid grid-cols-[1fr_120px_120px_120px_60px_120px_28px] gap-4 items-baseline"
          >
            <EditableText
              value={d.party}
              onChange={(v) => patch(d.id, { party: v })}
              className="display-italic text-[15px] text-[color:var(--color-on-paper)]"
            />
            <EditableText
              value={d.territory}
              onChange={(v) => patch(d.id, { territory: v })}
              placeholder="territory"
              className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
            />
            <EditableText
              value={d.formatRights}
              onChange={(v) => patch(d.id, { formatRights: v })}
              placeholder="rights"
              className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
            />
            <EditableText
              value={d.term ?? ''}
              onChange={(v) => patch(d.id, { term: v || undefined })}
              placeholder="term"
              className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
            />
            <input
              type="number"
              value={d.advanceK ?? ''}
              onChange={(e) => patch(d.id, { advanceK: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
              placeholder="adv"
              className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums w-full"
            />
            <button
              type="button"
              onClick={() => cycleStatus(d)}
              className={`label-caps tracking-[0.14em] text-[10px] py-1 px-1.5 rounded-[2px] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors ${DEAL_STATUS_TONE[d.status]}`}
            >
              {d.status}
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete deal with ${d.party}?`)) {
                  dispatch({ type: 'DELETE_DEAL', id: d.id });
                }
              }}
              className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors justify-self-end"
              aria-label="Delete deal"
            >
              <Trash2 size={11} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- shared ---------- */

function Tile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Send;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4">
      <div className="flex items-baseline gap-1.5 label-caps text-[color:var(--color-brass-deep)] mb-1.5">
        <Icon size={11} />
        <span>{label}</span>
      </div>
      <div className="display-italic text-[28px] text-[color:var(--color-on-paper)] tabular-nums leading-none">
        {value}
      </div>
      <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1">
        {sub}
      </div>
    </article>
  );
}

function FitStars({ score, onChange }: { score: number; onChange: (s: number) => void }) {
  return (
    <div className="flex items-center gap-0.5 justify-end">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(score === i ? 0 : i)}
          className="text-[color:var(--color-brass-deep)] hover:scale-110 transition-transform"
          aria-label={`${i} of 5 fit`}
        >
          <Star
            size={11}
            fill={i <= score ? 'currentColor' : 'transparent'}
            className={i <= score ? '' : 'opacity-30'}
          />
        </button>
      ))}
    </div>
  );
}
