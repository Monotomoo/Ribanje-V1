import { useMemo, useState } from 'react';
import { Camera, Megaphone, Newspaper, Plus, Scissors, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { newId } from '../episode/shared';
import type {
  BTSCapture,
  PressContact,
  SocialContentType,
  SocialPlatform,
  SocialPost,
  SocialPostStatus,
  TrailerCut,
  TrailerCutFormat,
} from '../../types';
import { EditableText } from '../primitives/EditableText';
import { FilterableRegister, type RegisterColumn } from '../primitives/FilterableRegister';

type TabKey = 'trailers' | 'social' | 'press' | 'bts';

const TRAILER_FORMATS: TrailerCutFormat[] = [
  'teaser-30',
  'teaser-60',
  'trailer-90',
  'trailer-120',
  'tv-spot',
  'social-9-16',
  'social-1-1',
  'social-16-9',
];
const TRAILER_STATUS: TrailerCut['status'][] = ['planned', 'rough', 'cut', 'final'];
const TRAILER_STATUS_TONE: Record<TrailerCut['status'], string> = {
  planned: 'text-[color:var(--color-on-paper-muted)]',
  rough: 'text-[color:var(--color-brass-deep)]',
  cut: 'text-[color:var(--color-warn)]',
  final: 'text-[color:var(--color-success)]',
};

const PLATFORMS: SocialPlatform[] = ['instagram', 'tiktok', 'youtube', 'x', 'linkedin', 'facebook'];
const POST_TYPES: SocialContentType[] = ['bts', 'clip', 'still', 'text', 'article'];
const POST_STATUSES: SocialPostStatus[] = ['idea', 'drafted', 'scheduled', 'posted'];
const POST_STATUS_TONE: Record<SocialPostStatus, string> = {
  idea: 'text-[color:var(--color-on-paper-muted)]',
  drafted: 'text-[color:var(--color-brass-deep)]',
  scheduled: 'text-[color:var(--color-warn)]',
  posted: 'text-[color:var(--color-success)]',
};

const PRESS_STATUSES: PressContact['status'][] = ['cold', 'pitched', 'interviewed', 'wrote', 'declined'];
const PRESS_STATUS_TONE: Record<PressContact['status'], string> = {
  cold: 'text-[color:var(--color-on-paper-muted)]',
  pitched: 'text-[color:var(--color-brass-deep)]',
  interviewed: 'text-[color:var(--color-warn)]',
  wrote: 'text-[color:var(--color-success)]',
  declined: 'text-[color:var(--color-on-paper-faint)] line-through',
};

export function MarketingView() {
  const { state } = useApp();
  const [tab, setTab] = useState<TabKey>('trailers');

  const stats = useMemo(() => {
    const trailerFinals = state.trailerCuts.filter((c) => c.status === 'final').length;
    const postsScheduled = state.socialPosts.filter((p) => p.status === 'scheduled').length;
    const pressWriters = state.pressContacts.filter((p) => p.status === 'wrote').length;
    return {
      trailerFinals,
      postsScheduled,
      pressWriters,
    };
  }, [state.trailerCuts, state.socialPosts, state.pressContacts]);

  return (
    <div className="space-y-7 max-w-[1400px]">
      {/* Stat strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <Tile
          icon={Scissors}
          label="Trailer cuts"
          value={state.trailerCuts.length}
          sub={stats.trailerFinals > 0 ? `${stats.trailerFinals} final` : 'planned'}
        />
        <Tile
          icon={Megaphone}
          label="Social posts"
          value={state.socialPosts.length}
          sub={stats.postsScheduled > 0 ? `${stats.postsScheduled} scheduled` : 'queue'}
        />
        <Tile
          icon={Newspaper}
          label="Press"
          value={state.pressContacts.length}
          sub={stats.pressWriters > 0 ? `${stats.pressWriters} wrote` : 'tracked'}
        />
        <Tile
          icon={Camera}
          label="BTS captures"
          value={state.btsCapture.length}
          sub={state.btsCapture.length > 0 ? 'logged' : 'log per shoot day'}
        />
      </section>

      {/* Tab strip */}
      <nav
        role="tablist"
        className="flex items-baseline gap-1.5 border-b-[0.5px] border-[color:var(--color-border-paper)]"
      >
        {(
          [
            { key: 'trailers', label: 'Trailers', hint: '30s · 60s · 90s · social cuts' },
            { key: 'social', label: 'Social', hint: 'pre-shoot · live · launch arc' },
            { key: 'press', label: 'Press', hint: 'critics · cultural press · trade' },
            { key: 'bts', label: 'BTS', hint: 'who captures what · cleared for social' },
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

      <div>
        {tab === 'trailers' && <TrailersTab />}
        {tab === 'social' && <SocialTab />}
        {tab === 'press' && <PressTab />}
        {tab === 'bts' && <BTSTab />}
      </div>
    </div>
  );
}

/* ---------- Trailers ---------- */

function TrailersTab() {
  const { state, dispatch } = useApp();

  function add() {
    const cut: TrailerCut = {
      id: newId('tr'),
      format: 'teaser-30',
      label: 'New cut',
      beats: [],
      status: 'planned',
    };
    dispatch({ type: 'ADD_TRAILER_CUT', cut });
  }

  function patch(id: string, p: Partial<TrailerCut>) {
    dispatch({ type: 'UPDATE_TRAILER_CUT', id, patch: p });
  }

  function cycleStatus(c: TrailerCut) {
    const idx = TRAILER_STATUS.indexOf(c.status);
    patch(c.id, { status: TRAILER_STATUS[(idx + 1) % TRAILER_STATUS.length] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
          Plan which beats support which trailer format before any actual edit. Six cuts
          pre-seeded — edit beats as the show takes shape.
        </p>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add cut</span>
        </button>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.trailerCuts.map((c) => (
          <li
            key={c.id}
            className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4"
          >
            <header className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-2">
                <select
                  value={c.format}
                  onChange={(e) => patch(c.id, { format: e.target.value as TrailerCutFormat })}
                  className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none label-caps text-[10px] tracking-[0.10em] text-[color:var(--color-brass-deep)]"
                >
                  {TRAILER_FORMATS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => cycleStatus(c)}
                className={`label-caps tracking-[0.14em] text-[10px] py-0.5 px-1.5 rounded-[2px] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors ${TRAILER_STATUS_TONE[c.status]}`}
              >
                {c.status}
              </button>
            </header>
            <EditableText
              value={c.label}
              onChange={(v) => patch(c.id, { label: v })}
              className="display-italic text-[18px] text-[color:var(--color-on-paper)] block mb-1"
            />
            <EditableText
              value={c.audience ?? ''}
              onChange={(v) => patch(c.id, { audience: v || undefined })}
              placeholder="audience · use case"
              className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] block mb-3"
            />
            <div className="border-t-[0.5px] border-[color:var(--color-border-paper)] pt-3">
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
                Supporting beats ({c.beats.length})
              </div>
              <EditableText
                multiline
                rows={2}
                value={c.beats.join('\n')}
                onChange={(v) => patch(c.id, { beats: v.split('\n').filter((b) => b.trim()) })}
                placeholder="Departure shot · First haul · Sunset wide"
                className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] leading-relaxed block w-full"
              />
            </div>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete cut "${c.label}"?`)) {
                    dispatch({ type: 'DELETE_TRAILER_CUT', id: c.id });
                  }
                }}
                className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors"
                aria-label="Delete cut"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Social ---------- */

function SocialTab() {
  const { state, dispatch } = useApp();

  function add() {
    const post: SocialPost = {
      id: newId('post'),
      date: new Date().toISOString().slice(0, 10),
      platform: 'instagram',
      type: 'bts',
      status: 'idea',
    };
    dispatch({ type: 'ADD_SOCIAL_POST', post });
  }

  function patch(id: string, p: Partial<SocialPost>) {
    dispatch({ type: 'UPDATE_SOCIAL_POST', id, patch: p });
  }

  function cycleStatus(p: SocialPost) {
    const idx = POST_STATUSES.indexOf(p.status);
    patch(p.id, { status: POST_STATUSES[(idx + 1) % POST_STATUSES.length] });
  }

  if (state.socialPosts.length === 0) {
    return (
      <div className="space-y-5">
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-8 py-12 text-center">
          <p className="display-italic text-[20px] text-[color:var(--color-on-paper)] mb-2">
            Social calendar empty
          </p>
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mb-5 max-w-[520px] mx-auto leading-relaxed">
            Plan posts across the launch arc — pre-shoot teasers, daily ambient during October,
            edit-room teasers in winter, festival-circuit posts. Each post: date · platform ·
            content type · status.
          </p>
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-4 py-2 rounded-[2px] transition-colors"
          >
            <Plus size={12} />
            <span>add first post</span>
          </button>
        </div>
      </div>
    );
  }

  const sorted = [...state.socialPosts].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
          {state.socialPosts.length} post{state.socialPosts.length === 1 ? '' : 's'} planned ·
          sorted by date
        </p>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add post</span>
        </button>
      </div>
      <ul className="space-y-1.5">
        {sorted.map((p) => (
          <li
            key={p.id}
            className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-2.5 grid grid-cols-[110px_110px_90px_1fr_100px_28px] gap-4 items-baseline"
          >
            <input
              type="date"
              value={p.date}
              onChange={(e) => patch(p.id, { date: e.target.value })}
              className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums py-0.5"
            />
            <select
              value={p.platform}
              onChange={(e) => patch(p.id, { platform: e.target.value as SocialPlatform })}
              className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[12px] text-[color:var(--color-on-paper)] py-0.5"
            >
              {PLATFORMS.map((pl) => (
                <option key={pl} value={pl}>
                  {pl}
                </option>
              ))}
            </select>
            <select
              value={p.type}
              onChange={(e) => patch(p.id, { type: e.target.value as SocialContentType })}
              className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] py-0.5"
            >
              {POST_TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </select>
            <EditableText
              value={p.caption ?? ''}
              onChange={(v) => patch(p.id, { caption: v || undefined })}
              placeholder="caption / hook"
              className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]"
            />
            <button
              type="button"
              onClick={() => cycleStatus(p)}
              className={`label-caps tracking-[0.14em] text-[10px] py-1 px-1.5 rounded-[2px] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors ${POST_STATUS_TONE[p.status]}`}
            >
              {p.status}
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete this post?')) {
                  dispatch({ type: 'DELETE_SOCIAL_POST', id: p.id });
                }
              }}
              className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors justify-self-end"
              aria-label="Delete post"
            >
              <Trash2 size={11} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Press ---------- */

function PressTab() {
  const { state, dispatch } = useApp();

  function add() {
    const contact: PressContact = {
      id: newId('pc'),
      name: 'New press contact',
      outlet: '',
      territory: '',
      status: 'cold',
    };
    dispatch({ type: 'ADD_PRESS_CONTACT', contact });
  }

  function patch(id: string, p: Partial<PressContact>) {
    dispatch({ type: 'UPDATE_PRESS_CONTACT', id, patch: p });
  }

  function cycleStatus(c: PressContact) {
    const idx = PRESS_STATUSES.indexOf(c.status);
    patch(c.id, { status: PRESS_STATUSES[(idx + 1) % PRESS_STATUSES.length] });
  }

  const columns: RegisterColumn<PressContact>[] = [
    {
      key: 'name',
      label: 'Outlet',
      width: 'minmax(180px, 1fr)',
      sortValue: (r) => r.outlet.toLowerCase(),
      render: (r) => (
        <EditableText
          value={r.outlet}
          onChange={(v) => patch(r.id, { outlet: v })}
          className="display-italic text-[14px] text-[color:var(--color-on-paper)]"
        />
      ),
    },
    {
      key: 'territory',
      label: 'Territory',
      width: '140px',
      sortValue: (r) => r.territory,
      render: (r) => (
        <EditableText
          value={r.territory}
          onChange={(v) => patch(r.id, { territory: v })}
          className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
        />
      ),
    },
    {
      key: 'beat',
      label: 'Beat',
      width: 'minmax(140px, 1fr)',
      render: (r) => (
        <EditableText
          value={r.beat ?? ''}
          onChange={(v) => patch(r.id, { beat: v || undefined })}
          placeholder="—"
          className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
        />
      ),
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
          className={`label-caps tracking-[0.14em] text-[10px] py-1 px-1.5 rounded-[2px] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors ${PRESS_STATUS_TONE[r.status]}`}
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
            if (window.confirm(`Delete ${r.outlet}?`)) {
              dispatch({ type: 'DELETE_PRESS_CONTACT', id: r.id });
            }
          }}
          className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors"
          aria-label="Delete contact"
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
          13 outlets pre-seeded — international film trade + cultural critics + Croatian
          mainstream. Cycle status as outreach lands.
        </p>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add contact</span>
        </button>
      </div>
      <FilterableRegister<PressContact>
        rows={state.pressContacts}
        columns={columns}
        rowId={(r) => r.id}
        defaultSortKey="territory"
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: '__all__', label: 'all' },
              ...PRESS_STATUSES.map((s) => ({ value: s, label: s })),
            ],
            match: (r, v) => r.status === v,
          },
        ]}
      />
    </div>
  );
}

/* ---------- BTS ---------- */

function BTSTab() {
  const { state, dispatch } = useApp();

  function add() {
    const capture: BTSCapture = {
      id: newId('bts'),
      date: new Date().toISOString().slice(0, 10),
      description: '',
    };
    dispatch({ type: 'ADD_BTS', capture });
  }

  function patch(id: string, p: Partial<BTSCapture>) {
    dispatch({ type: 'UPDATE_BTS', id, patch: p });
  }

  if (state.btsCapture.length === 0) {
    return (
      <div className="space-y-5">
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-8 py-12 text-center">
          <p className="display-italic text-[20px] text-[color:var(--color-on-paper)] mb-2">
            BTS capture log empty
          </p>
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mb-5 max-w-[520px] mx-auto leading-relaxed">
            Per shoot day, log who was responsible for capturing behind-the-scenes content
            (a phone, a small camera, the stills photographer). Track what was captured,
            where it lives, whether it's cleared for social — so launch-week social comes
            together fast.
          </p>
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-4 py-2 rounded-[2px] transition-colors"
          >
            <Plus size={12} />
            <span>log first BTS capture</span>
          </button>
        </div>
      </div>
    );
  }

  const sorted = [...state.btsCapture].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
          {state.btsCapture.length} capture{state.btsCapture.length === 1 ? '' : 's'} logged
        </p>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add</span>
        </button>
      </div>
      <ul className="space-y-2">
        {sorted.map((c) => (
          <li
            key={c.id}
            className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-3 grid grid-cols-[120px_140px_1fr_80px_28px] gap-4 items-baseline"
          >
            <input
              type="date"
              value={c.date}
              onChange={(e) => patch(c.id, { date: e.target.value })}
              className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums py-0.5"
            />
            <select
              value={c.responsibleId ?? ''}
              onChange={(e) => patch(c.id, { responsibleId: e.target.value || undefined })}
              className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[12px] text-[color:var(--color-on-paper)] py-0.5"
            >
              <option value="">— who —</option>
              {state.crew.map((cr) => (
                <option key={cr.id} value={cr.id}>
                  {cr.name}
                </option>
              ))}
            </select>
            <EditableText
              value={c.description}
              onChange={(v) => patch(c.id, { description: v })}
              placeholder="What was captured · where it lives"
              className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]"
            />
            <button
              type="button"
              onClick={() => patch(c.id, { cleared: !c.cleared })}
              className={`label-caps tracking-[0.14em] text-[10px] py-1 px-1.5 rounded-[2px] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors ${
                c.cleared
                  ? 'text-[color:var(--color-success)]'
                  : 'text-[color:var(--color-on-paper-faint)]'
              }`}
            >
              {c.cleared ? 'cleared' : 'pending'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete BTS capture?')) {
                  dispatch({ type: 'DELETE_BTS', id: c.id });
                }
              }}
              className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors justify-self-end"
              aria-label="Delete capture"
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
  icon: typeof Camera;
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
