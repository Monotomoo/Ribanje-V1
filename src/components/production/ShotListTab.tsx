import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Filter,
  Plus,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { newId } from '../episode/shared';
import type {
  AudioPlanType,
  CameraSlot,
  Scene,
  Shot,
  ShotFraming,
  ShotMovement,
  ShotStatus,
  Take,
  TakeStatus,
} from '../../types';
import { EditableText } from '../primitives/EditableText';
import { countShotStatus } from './productionSelectors';
import { ProductionHeatmap } from './ProductionHeatmap';

const SHOT_STATUSES: ShotStatus[] = ['planned', 'captured', 'cut', 'deferred'];
const STATUS_TONE: Record<ShotStatus, string> = {
  planned: 'text-[color:var(--color-on-paper)]',
  captured: 'text-[color:var(--color-success)]',
  cut: 'text-[color:var(--color-on-paper-faint)] line-through',
  deferred: 'text-[color:var(--color-coral-deep)]',
};
const STATUS_LABEL: Record<ShotStatus, string> = {
  planned: 'planned',
  captured: 'captured',
  cut: 'cut',
  deferred: 'deferred',
};

const CAMERA_SLOTS: CameraSlot[] = ['A', 'B', 'drone', 'underwater', 'crash'];
const FRAMING: ShotFraming[] = ['ECU', 'CU', 'MCU', 'MS', 'MWS', 'WS', 'EWS'];
const MOVEMENT: ShotMovement[] = ['static', 'handheld', 'trinity', 'gimbal', 'dolly', 'crane', 'drone'];
const AUDIO: AudioPlanType[] = ['boom', 'lav', 'boom+lav', 'ambient', 'MOS', 'wild'];

const TAKE_STATUSES: TakeStatus[] = ['NG', 'OK', 'PRINT'];
const TAKE_TONE: Record<TakeStatus, string> = {
  NG: 'text-[color:var(--color-coral-deep)]',
  OK: 'text-[color:var(--color-on-paper)]',
  PRINT: 'text-[color:var(--color-success)]',
};

export function ShotListTab() {
  const { state, dispatch } = useApp();
  const allEpisodes = [...state.episodes, ...state.specials];
  const [activeEp, setActiveEp] = useState<string>(allEpisodes[0]?.id ?? '');
  const [filterStatus, setFilterStatus] = useState<ShotStatus | 'all'>('all');
  const [openShotIds, setOpenShotIds] = useState<Set<string>>(new Set());

  const epScenes = state.scenes
    .filter((s) => s.episodeId === activeEp)
    .sort((a, b) => a.label.localeCompare(b.label));
  const epShots = state.shots.filter((s) => s.episodeId === activeEp);
  const counts = countShotStatus(epShots);

  function toggleShot(id: string) {
    setOpenShotIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addScene() {
    const scene: Scene = {
      id: newId('scene'),
      episodeId: activeEp,
      label: `Scene ${epScenes.length + 1}`,
      slug: '',
    };
    dispatch({ type: 'ADD_SCENE', scene });
  }

  function addShot(sceneId?: string) {
    const inScope = sceneId
      ? epShots.filter((s) => s.sceneId === sceneId)
      : epShots.filter((s) => !s.sceneId);
    const shot: Shot = {
      id: newId('shot'),
      episodeId: activeEp,
      sceneId,
      number: `${inScope.length + 1}`,
      description: '',
      cameraSlot: 'A',
      status: 'planned',
    };
    dispatch({ type: 'ADD_SHOT', shot });
  }

  function moveShot(scene: Scene | null, shotId: string, dir: -1 | 1) {
    const inScope = epShots
      .filter((s) => (scene ? s.sceneId === scene.id : !s.sceneId))
      .map((s) => s.id);
    const idx = inScope.indexOf(shotId);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= inScope.length) return;
    const reordered = [...inScope];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    if (scene) {
      dispatch({ type: 'REORDER_SHOTS_IN_SCENE', sceneId: scene.id, ids: reordered });
    }
  }

  /* No-scene shots: shots in this episode without a sceneId */
  const looseShots = epShots.filter((s) => !s.sceneId);
  const filteredLoose =
    filterStatus === 'all' ? looseShots : looseShots.filter((s) => s.status === filterStatus);

  return (
    <div className="space-y-7 max-w-[1400px]">
      {/* Production Heatmap — Phase 12 (top of shot list) */}
      <ProductionHeatmap groupBy="scene" />

      {/* Episode tabs */}
      <nav className="flex items-baseline gap-1 flex-wrap pb-3 border-b-[0.5px] border-[color:var(--color-border-paper)]">
        {allEpisodes.map((ep) => {
          const active = activeEp === ep.id;
          const epShotCount = state.shots.filter((s) => s.episodeId === ep.id).length;
          return (
            <button
              key={ep.id}
              type="button"
              onClick={() => setActiveEp(ep.id)}
              className={`px-3 py-1.5 rounded-[2px] transition-colors ${
                active
                  ? 'bg-[color:var(--color-paper-deep)]/40 text-[color:var(--color-on-paper)]'
                  : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
            >
              <span
                className={
                  active ? 'display-italic text-[15px]' : 'font-sans text-[12px] tracking-[0.10em]'
                }
              >
                {ep.number}
              </span>
              <span
                className={`ml-1.5 ${
                  active
                    ? 'display-italic text-[15px]'
                    : 'font-sans text-[12px] tracking-wide'
                }`}
              >
                {ep.title}
              </span>
              {epShotCount > 0 && (
                <span className="ml-2 prose-body italic text-[10px] text-[color:var(--color-brass-deep)] tabular-nums">
                  {epShotCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Filter bar + summary */}
      <div className="flex items-baseline justify-between gap-5">
        <div className="flex items-baseline gap-3">
          <Filter size={11} className="text-[color:var(--color-on-paper-faint)]" />
          <span className="label-caps text-[color:var(--color-on-paper-faint)]">status</span>
          <FilterChip
            active={filterStatus === 'all'}
            onClick={() => setFilterStatus('all')}
          >
            all · {counts.total}
          </FilterChip>
          {SHOT_STATUSES.map((s) => (
            <FilterChip
              key={s}
              active={filterStatus === s}
              onClick={() => setFilterStatus(s)}
            >
              {STATUS_LABEL[s]} · {counts[s]}
            </FilterChip>
          ))}
        </div>
        <button
          type="button"
          onClick={addScene}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
        >
          <Plus size={11} />
          <span>add scene</span>
        </button>
      </div>

      {/* Scenes list */}
      {epScenes.length === 0 && looseShots.length === 0 && (
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-8 py-12 text-center">
          <p className="display-italic text-[20px] text-[color:var(--color-on-paper)] mb-2">
            No scenes yet
          </p>
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mb-5">
            A scene groups shots that belong together. Start with one — first cast, first
            haul, elder interview.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={addScene}
              className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-4 py-2 rounded-[2px] transition-colors"
            >
              <Plus size={12} />
              <span>add scene</span>
            </button>
            <button
              type="button"
              onClick={() => addShot(undefined)}
              className="label-caps text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] transition-colors"
            >
              or skip — add a loose shot
            </button>
          </div>
        </div>
      )}

      <div className="space-y-7">
        {epScenes.map((scene) => (
          <SceneBlock
            key={scene.id}
            scene={scene}
            shots={epShots.filter((s) => s.sceneId === scene.id)}
            filterStatus={filterStatus}
            openShotIds={openShotIds}
            onToggleShot={toggleShot}
            onAddShot={() => addShot(scene.id)}
            onMoveShot={(shotId, dir) => moveShot(scene, shotId, dir)}
          />
        ))}

        {filteredLoose.length > 0 && (
          <SceneBlock
            scene={null}
            shots={filteredLoose}
            filterStatus={filterStatus}
            openShotIds={openShotIds}
            onToggleShot={toggleShot}
            onAddShot={() => addShot(undefined)}
            onMoveShot={() => {
              /* no-op for loose shots in Tier A */
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- Scene block ---------- */

function SceneBlock({
  scene,
  shots,
  filterStatus,
  openShotIds,
  onToggleShot,
  onAddShot,
  onMoveShot,
}: {
  scene: Scene | null;
  shots: Shot[];
  filterStatus: ShotStatus | 'all';
  openShotIds: Set<string>;
  onToggleShot: (id: string) => void;
  onAddShot: () => void;
  onMoveShot: (shotId: string, dir: -1 | 1) => void;
}) {
  const { state, dispatch } = useApp();
  const filtered =
    filterStatus === 'all' ? shots : shots.filter((s) => s.status === filterStatus);

  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
      {/* Scene header */}
      <header className="px-5 py-3.5 border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3 flex-1">
          {scene ? (
            <>
              <EditableText
                value={scene.label}
                onChange={(v) =>
                  dispatch({ type: 'UPDATE_SCENE', id: scene.id, patch: { label: v } })
                }
                className="display-italic text-[20px] text-[color:var(--color-on-paper)]"
              />
              <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
                {shots.length} shot{shots.length === 1 ? '' : 's'}
              </span>
              {scene.dayIdx != null && (
                <span className="label-caps text-[color:var(--color-brass-deep)]">
                  day {scene.dayIdx + 1}
                </span>
              )}
            </>
          ) : (
            <>
              <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper-muted)]">
                Loose shots
              </h3>
              <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)]">
                not yet assigned to a scene · {shots.length} shot{shots.length === 1 ? '' : 's'}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAddShot}
            className="flex items-center gap-1.5 label-caps text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] transition-colors"
          >
            <Plus size={11} />
            <span>add shot</span>
          </button>
          {scene && (
            <button
              type="button"
              onClick={() => {
                if (
                  shots.length > 0 &&
                  !window.confirm(
                    `Delete "${scene.label}"? Its ${shots.length} shot${shots.length === 1 ? '' : 's'} will become loose shots.`
                  )
                ) {
                  return;
                }
                dispatch({ type: 'DELETE_SCENE', id: scene.id });
              }}
              className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors"
              aria-label="Delete scene"
              title="Delete scene"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </header>

      {/* Shots table — Phase 11: 10-col grid wraps in horizontal scroll on phone */}
      {filtered.length === 0 ? (
        <div className="px-5 py-7 text-center">
          <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)]">
            {shots.length === 0
              ? 'No shots in this scene yet.'
              : 'No shots match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto md:overflow-visible">
          <ul className="min-w-[760px] md:min-w-0">
            {filtered.map((shot, idx) => {
              const isOpen = openShotIds.has(shot.id);
              const takes = state.takes.filter((t) => t.shotId === shot.id);
              return (
                <li
                  key={shot.id}
                  className="border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0"
                >
                  <ShotRow
                    shot={shot}
                    takes={takes}
                    isOpen={isOpen}
                    isFirst={idx === 0}
                    isLast={idx === filtered.length - 1}
                    onToggle={() => onToggleShot(shot.id)}
                    onMoveUp={() => onMoveShot(shot.id, -1)}
                    onMoveDown={() => onMoveShot(shot.id, 1)}
                  />
                  {isOpen && <TakeLog shot={shot} takes={takes} />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </article>
  );
}

/* ---------- Shot row ---------- */

function ShotRow({
  shot,
  takes,
  isOpen,
  isFirst,
  isLast,
  onToggle,
  onMoveUp,
  onMoveDown,
}: {
  shot: Shot;
  takes: Take[];
  isOpen: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { dispatch } = useApp();

  function patch(p: Partial<Shot>) {
    dispatch({ type: 'UPDATE_SHOT', id: shot.id, patch: p });
  }

  function cycleStatus() {
    const idx = SHOT_STATUSES.indexOf(shot.status);
    const next = SHOT_STATUSES[(idx + 1) % SHOT_STATUSES.length];
    patch({ status: next });
  }

  const printedTakes = takes.filter((t) => t.status === 'PRINT').length;

  return (
    <div className="grid grid-cols-[28px_50px_1fr_70px_70px_85px_70px_50px_70px_28px] gap-2.5 items-center px-4 py-2.5 hover:bg-[color:var(--color-paper-deep)]/20 transition-colors">
      {/* Expand toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper)] transition-colors"
        aria-label={isOpen ? 'Close take log' : 'Open take log'}
      >
        {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>

      {/* Number */}
      <EditableText
        value={shot.number}
        onChange={(v) => patch({ number: v })}
        placeholder="#"
        className="display-italic text-[13px] text-[color:var(--color-brass-deep)] tabular-nums"
      />

      {/* Description */}
      <EditableText
        value={shot.description}
        onChange={(v) => patch({ description: v })}
        placeholder="describe the shot…"
        className={`prose-body italic text-[13px] ${STATUS_TONE[shot.status]}`}
      />

      {/* Camera */}
      <Selector
        value={shot.cameraSlot}
        options={CAMERA_SLOTS}
        onChange={(v) => patch({ cameraSlot: v as CameraSlot })}
      />

      {/* Framing */}
      <Selector
        value={shot.framing ?? ''}
        options={['', ...FRAMING]}
        onChange={(v) => patch({ framing: (v || undefined) as ShotFraming | undefined })}
        placeholder="—"
      />

      {/* Movement */}
      <Selector
        value={shot.movement ?? ''}
        options={['', ...MOVEMENT]}
        onChange={(v) => patch({ movement: (v || undefined) as ShotMovement | undefined })}
        placeholder="—"
      />

      {/* Audio */}
      <Selector
        value={shot.audioPlan ?? ''}
        options={['', ...AUDIO]}
        onChange={(v) => patch({ audioPlan: (v || undefined) as AudioPlanType | undefined })}
        placeholder="—"
      />

      {/* Takes count */}
      <div className="text-center prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums">
        {takes.length > 0 ? (
          <>
            {takes.length}
            {printedTakes > 0 && (
              <span className="text-[color:var(--color-success)]"> · {printedTakes}P</span>
            )}
          </>
        ) : (
          <span className="text-[color:var(--color-on-paper-faint)]">—</span>
        )}
      </div>

      {/* Status */}
      <button
        type="button"
        onClick={cycleStatus}
        className={`label-caps tracking-[0.14em] text-[10px] py-1 px-1.5 rounded-[2px] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors ${STATUS_TONE[shot.status]}`}
        title="Cycle status"
      >
        {STATUS_LABEL[shot.status]}
      </button>

      {/* Move + delete */}
      <div className="flex items-center gap-0.5 justify-end">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper)] disabled:opacity-30 disabled:hover:text-[color:var(--color-on-paper-faint)] transition-colors"
          aria-label="Move up"
        >
          <ArrowUp size={11} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper)] disabled:opacity-30 disabled:hover:text-[color:var(--color-on-paper-faint)] transition-colors"
          aria-label="Move down"
        >
          <ArrowDown size={11} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Delete shot? Takes will also be removed.')) {
              dispatch({ type: 'DELETE_SHOT', id: shot.id });
            }
          }}
          className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors"
          aria-label="Delete shot"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

function Selector({
  value,
  options,
  onChange,
  placeholder = '',
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] py-0.5 tabular-nums"
    >
      {value === '' && <option value="">{placeholder || '—'}</option>}
      {options
        .filter((o) => o !== '')
        .map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
    </select>
  );
}

/* ---------- Take log (inline expand) ---------- */

function TakeLog({ shot, takes }: { shot: Shot; takes: Take[] }) {
  const { dispatch } = useApp();
  const sorted = [...takes].sort((a, b) => a.takeNum - b.takeNum);

  function addTake() {
    const nextNum = sorted.length > 0 ? sorted[sorted.length - 1].takeNum + 1 : 1;
    const take: Take = {
      id: newId('take'),
      shotId: shot.id,
      takeNum: nextNum,
      status: 'OK',
    };
    dispatch({ type: 'ADD_TAKE', take });
  }

  return (
    <div className="bg-[color:var(--color-paper)] border-t-[0.5px] border-[color:var(--color-border-paper)] px-12 py-4">
      <div className="flex items-baseline justify-between mb-3">
        <span className="label-caps text-[color:var(--color-brass-deep)]">Take log</span>
        <button
          type="button"
          onClick={addTake}
          className="flex items-center gap-1.5 label-caps text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] transition-colors"
        >
          <Plus size={10} />
          <span>add take</span>
        </button>
      </div>
      {sorted.length === 0 ? (
        <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)]">
          No takes logged yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((t) => (
            <TakeRow key={t.id} take={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TakeRow({ take }: { take: Take }) {
  const { dispatch } = useApp();

  function patch(p: Partial<Take>) {
    dispatch({ type: 'UPDATE_TAKE', id: take.id, patch: p });
  }

  function cycleStatus() {
    const idx = TAKE_STATUSES.indexOf(take.status);
    const next = TAKE_STATUSES[(idx + 1) % TAKE_STATUSES.length];
    patch({ status: next });
  }

  return (
    <li className="grid grid-cols-[60px_60px_120px_1fr_28px] gap-3 items-center">
      <span className="display-italic text-[14px] text-[color:var(--color-brass-deep)] tabular-nums">
        T{take.takeNum}
      </span>
      <button
        type="button"
        onClick={cycleStatus}
        className={`label-caps tracking-[0.14em] text-[10px] py-0.5 px-1.5 rounded-[2px] hover:bg-[color:var(--color-paper-deep)]/40 transition-colors ${TAKE_TONE[take.status]}`}
        title="Cycle take status"
      >
        {take.status}
      </button>
      <EditableText
        value={take.timecode ?? ''}
        onChange={(v) => patch({ timecode: v || undefined })}
        placeholder="timecode"
        className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] tabular-nums"
      />
      <EditableText
        value={take.notes ?? ''}
        onChange={(v) => patch({ notes: v || undefined })}
        placeholder="notes…"
        className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
      />
      <button
        type="button"
        onClick={() => {
          if (window.confirm(`Delete take ${take.takeNum}?`)) {
            dispatch({ type: 'DELETE_TAKE', id: take.id });
          }
        }}
        className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] transition-colors justify-self-end"
        aria-label="Delete take"
      >
        <Trash2 size={11} />
      </button>
    </li>
  );
}

/* ---------- Filter chip ---------- */

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`label-caps tracking-[0.12em] text-[10px] px-2 py-0.5 rounded-[2px] transition-colors ${
        active
          ? 'bg-[color:var(--color-brass)]/30 text-[color:var(--color-on-paper)]'
          : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
      }`}
    >
      {children}
    </button>
  );
}
