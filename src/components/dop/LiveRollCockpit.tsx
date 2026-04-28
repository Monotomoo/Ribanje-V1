import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Camera,
  Circle,
  Disc,
  Mic,
  MicOff,
  Plane,
  Radio,
  Square,
  Waves,
  X,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type {
  CameraSlot,
  ShootDay,
  Shot,
  Take,
  TakeStatus,
} from '../../types';
import { newId } from '../episode/shared';
import { VoiceMemoPerTake } from '../primitives/VoiceMemoPerTake';

/* Live Roll Cockpit — DURING-shoot transformation of Daily Plan top.
   Toggle PLANNING / LIVE. In LIVE mode, each camera lane has ROLL/CUT
   buttons that create + close Take entries with timing, status, notes
   and optional voice memo (SpeechRecognition with textarea fallback).
   Wh + GB consumed are computed from camera spec × roll duration. */

type SlotKey = Exclude<CameraSlot, never>;

const SLOT_ORDER: SlotKey[] = ['A', 'B', 'drone', 'underwater', 'crash'];
const SLOT_LABEL: Record<SlotKey, string> = {
  A: 'Cam A',
  B: 'Cam B',
  drone: 'Drone',
  underwater: 'UW',
  crash: 'Crash',
};
const SLOT_ICON: Record<SlotKey, typeof Camera> = {
  A: Camera,
  B: Camera,
  drone: Plane,
  underwater: Waves,
  crash: Disc,
};
/* Codec → GB per hour for storage estimation (per camera slot default) */
const SLOT_GBPH: Record<SlotKey, number> = {
  A: 280,        // ProRes 4444 default
  B: 28,         // XAVC S-I default
  drone: 50,     // DNG
  underwater: 110, // ProRes 422 HQ
  crash: 8,      // H.265
};

interface ActiveRoll {
  takeId: string;
  startedAtMs: number;
  shotId: string;
}

export function LiveRollCockpit() {
  const { state, dispatch } = useApp();
  const [mode, setMode] = useState<'planning' | 'live'>('planning');
  const [now, setNow] = useState(() => Date.now());

  /* Resolve "today" — the shoot day matching today's date, or the most
     recent past shoot day, or fall back to last shoot day. */
  const sortedDays = useMemo(
    () => [...state.shootDays].sort((a, b) => a.date.localeCompare(b.date)),
    [state.shootDays]
  );
  const today = useMemo(() => {
    const todayStr = new Date(now).toISOString().slice(0, 10);
    const exact = sortedDays.find((d) => d.date === todayStr);
    if (exact) return exact;
    /* Pick the day closest in absolute distance to today */
    let nearest: ShootDay | undefined;
    let nearestDelta = Infinity;
    for (const d of sortedDays) {
      const delta = Math.abs(new Date(d.date).getTime() - now);
      if (delta < nearestDelta) {
        nearest = d;
        nearestDelta = delta;
      }
    }
    return nearest ?? sortedDays[0];
  }, [sortedDays, now]);

  const [selectedDayId, setSelectedDayId] = useState<string>(today?.id ?? '');
  const day =
    sortedDays.find((d) => d.id === selectedDayId) ?? today ?? sortedDays[0];
  const dayIdx = day ? sortedDays.findIndex((d) => d.id === day.id) : -1;

  const episode = day?.episodeId
    ? [...state.episodes, ...state.specials].find((e) => e.id === day.episodeId)
    : null;
  const anchorage = day?.anchorageId
    ? state.locations.find((l) => l.id === day.anchorageId)
    : null;

  /* Today's shots — filtered by scenes assigned to this dayIdx, fallback to ep */
  const todayShots = useMemo(() => {
    if (!day) return [];
    return state.shots.filter((s) => {
      if (s.sceneId) {
        const scene = state.scenes.find((sc) => sc.id === s.sceneId);
        return scene?.dayIdx === dayIdx;
      }
      return s.episodeId === day.episodeId;
    });
  }, [state.shots, state.scenes, day, dayIdx]);

  /* Today's takes */
  const todayTakes = useMemo(() => {
    if (!day) return [];
    const todayShotIds = new Set(todayShots.map((s) => s.id));
    return state.takes
      .filter((t) => todayShotIds.has(t.shotId))
      .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''));
  }, [state.takes, todayShots, day]);

  /* Active rolls per slot */
  const [activeRolls, setActiveRolls] = useState<Record<SlotKey, ActiveRoll | null>>({
    A: null,
    B: null,
    drone: null,
    underwater: null,
    crash: null,
  });

  /* Selected shot per slot — what would roll if user hits ROLL */
  const [selectedShot, setSelectedShot] = useState<Record<SlotKey, string | null>>({
    A: null,
    B: null,
    drone: null,
    underwater: null,
    crash: null,
  });

  /* Cut modal state */
  const [cutModal, setCutModal] = useState<{
    slot: SlotKey;
    takeId: string;
    durationSec: number;
  } | null>(null);

  /* Tick the clock every second when live */
  useEffect(() => {
    if (mode !== 'live') return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [mode]);

  function handleRoll(slot: SlotKey) {
    const shotId = selectedShot[slot];
    if (!shotId) {
      window.alert(`Pick a shot for ${SLOT_LABEL[slot]} first.`);
      return;
    }
    const existing = state.takes.filter((t) => t.shotId === shotId).length;
    const startedAt = new Date().toISOString();
    const take: Take = {
      id: newId('take'),
      shotId,
      takeNum: existing + 1,
      status: 'OK',
      cameraSlot: slot,
      startedAt,
    };
    dispatch({ type: 'ADD_TAKE', take });
    setActiveRolls({
      ...activeRolls,
      [slot]: { takeId: take.id, startedAtMs: Date.now(), shotId },
    });
  }

  function handleCut(slot: SlotKey) {
    const roll = activeRolls[slot];
    if (!roll) return;
    setCutModal({
      slot,
      takeId: roll.takeId,
      durationSec: (Date.now() - roll.startedAtMs) / 1000,
    });
  }

  function commitCut(p: {
    slot: SlotKey;
    takeId: string;
    status: TakeStatus;
    notes: string;
  }) {
    const roll = activeRolls[p.slot];
    if (!roll) return;
    const durationSec = (Date.now() - roll.startedAtMs) / 1000;
    /* Compute Wh + GB consumed */
    const camKits = state.dopKit.filter((k) => k.category === 'camera');
    const cam =
      p.slot === 'A' ? camKits[0] :
      p.slot === 'B' ? camKits[1] :
      p.slot === 'drone' ? state.dopKit.find((k) => k.category === 'aerial') :
      p.slot === 'underwater' ? state.dopKit.find((k) => k.category === 'underwater') :
      undefined;
    const wattsPerHour = cam?.wattsPerHour ?? 0;
    const whConsumed = wattsPerHour * (durationSec / 3600);
    const gbph = SLOT_GBPH[p.slot] ?? 35;
    const gbConsumed = gbph * (durationSec / 3600);

    dispatch({
      type: 'UPDATE_TAKE',
      id: p.takeId,
      patch: {
        status: p.status,
        notes: p.notes,
        endedAt: new Date().toISOString(),
        durationSec,
        whConsumed,
        gbConsumed,
      },
    });
    setActiveRolls({ ...activeRolls, [p.slot]: null });
    setCutModal(null);
  }

  function cancelCut() {
    setCutModal(null);
  }

  /* Total Wh + GB consumed today */
  const todayConsumed = useMemo(() => {
    let wh = 0;
    let gb = 0;
    for (const t of todayTakes) {
      wh += t.whConsumed ?? 0;
      gb += t.gbConsumed ?? 0;
    }
    return { wh, gb };
  }, [todayTakes]);

  /* Recommended next — first planned shot from any slot's queue */
  const recommendedNext = useMemo(() => {
    const planned = todayShots.filter((s) => s.status === 'planned');
    if (planned.length === 0) return null;
    return planned[0];
  }, [todayShots]);

  if (!day) return null;

  const liveCurrentTime = new Date(now);
  const liveTimeStr = liveCurrentTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <section
      className={`bg-[color:var(--color-paper-light)] rounded-[3px] overflow-hidden border-[0.5px] transition-colors ${
        mode === 'live'
          ? 'border-[color:var(--color-coral)]/60'
          : 'border-[color:var(--color-border-paper)]'
      }`}
    >
      {/* Header */}
      <header
        className={`px-5 py-3 flex items-baseline gap-3 transition-colors ${
          mode === 'live'
            ? 'bg-[color:var(--color-coral)]/10'
            : 'bg-[color:var(--color-paper)]'
        }`}
      >
        <Activity
          size={14}
          className={
            mode === 'live'
              ? 'text-[color:var(--color-coral-deep)]'
              : 'text-[color:var(--color-brass-deep)]'
          }
        />
        <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
          Live Roll Cockpit
        </h4>
        {mode === 'live' && (
          <span className="label-caps tracking-[0.18em] text-[10px] text-[color:var(--color-coral-deep)] flex items-baseline gap-1">
            <Circle
              size={6}
              className="fill-current"
              style={{ animation: 'pulse 1.4s ease-in-out infinite' }}
            />
            LIVE
          </span>
        )}
        <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
          {mode === 'live'
            ? 'transformed during shoot · ROLL/CUT buttons capture takes'
            : 'switch to LIVE during the shoot day'}
        </span>
        <select
          value={selectedDayId}
          onChange={(e) => setSelectedDayId(e.target.value)}
          className="ml-auto bg-transparent border-b-[0.5px] border-transparent hover:border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[12px] text-[color:var(--color-on-paper)] py-0.5"
        >
          {sortedDays.map((d, i) => (
            <option key={d.id} value={d.id}>
              Day {i + 1} · {d.date}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setMode(mode === 'live' ? 'planning' : 'live')}
          className={`label-caps tracking-[0.10em] text-[10px] px-3 py-1 rounded-[2px] transition-colors ${
            mode === 'live'
              ? 'bg-[color:var(--color-coral)] hover:bg-[color:var(--color-coral-deep)] text-[color:var(--color-paper)]'
              : 'bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] text-[color:var(--color-paper)]'
          }`}
        >
          {mode === 'live' ? 'end live' : 'go live'}
        </button>
      </header>

      {mode === 'planning' ? (
        <div className="px-5 py-6 prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] leading-relaxed">
          Planning mode. Multi-cam matrix + power/storage compute below show projected
          load. Hit <strong>go live</strong> on the shoot day to transform this surface
          into a roll/cut cockpit — each camera lane gets ROLL and CUT buttons, takes are
          logged with duration, voice memo and consumed Wh/GB.
        </div>
      ) : (
        <div className="px-5 py-4 space-y-4">
          {/* Live time + day hero */}
          <div className="flex items-baseline justify-between border-b-[0.5px] border-[color:var(--color-border-brass)]/40 pb-3">
            <div>
              <div className="display-italic text-[28px] text-[color:var(--color-on-paper)] tabular-nums leading-none">
                {liveTimeStr}
              </div>
              <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-1">
                Day {dayIdx + 1} of {sortedDays.length} ·{' '}
                {episode ? `Ep ${episode.number} · ${episode.title}` : 'no ep'}
                {anchorage && ` · ${anchorage.label}`}
              </div>
            </div>
            <div className="text-right">
              <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mb-0.5">
                today's consumed
              </div>
              <div className="display-italic text-[18px] text-[color:var(--color-on-paper)] tabular-nums leading-none">
                {Math.round(todayConsumed.wh)} Wh ·{' '}
                {todayConsumed.gb >= 1000
                  ? `${(todayConsumed.gb / 1000).toFixed(2)} TB`
                  : `${Math.round(todayConsumed.gb)} GB`}
              </div>
              <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-0.5">
                {todayTakes.length} takes total
              </div>
            </div>
          </div>

          {/* Camera lanes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {SLOT_ORDER.map((slot) => (
              <CameraLane
                key={slot}
                slot={slot}
                shots={todayShots.filter((s) => s.cameraSlot === slot)}
                selectedShot={selectedShot[slot]}
                onSelectShot={(shotId) =>
                  setSelectedShot({ ...selectedShot, [slot]: shotId })
                }
                activeRoll={activeRolls[slot]}
                now={now}
                onRoll={() => handleRoll(slot)}
                onCut={() => handleCut(slot)}
              />
            ))}
          </div>

          {/* Recommended next */}
          {recommendedNext && (
            <div className="bg-[color:var(--color-paper)] border-l-2 border-[color:var(--color-brass)] px-4 py-2.5">
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-0.5">
                recommended next
              </div>
              <div className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]">
                <span className="display-italic mr-2 text-[color:var(--color-brass-deep)]">
                  {recommendedNext.number}
                </span>
                {recommendedNext.description}
                <span className="ml-2 label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-on-paper-muted)]">
                  · {SLOT_LABEL[recommendedNext.cameraSlot]}
                </span>
              </div>
            </div>
          )}

          {/* Take log */}
          {todayTakes.length > 0 && (
            <div>
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
                today's take log ({todayTakes.length})
              </div>
              <ul className="space-y-1 max-h-[200px] overflow-y-auto bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] px-3 py-2">
                {todayTakes.map((t) => (
                  <TakeLogRow key={t.id} take={t} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Cut modal */}
      {cutModal && (
        <CutModal
          slot={cutModal.slot}
          takeId={cutModal.takeId}
          durationSec={cutModal.durationSec}
          onCommit={commitCut}
          onCancel={cancelCut}
        />
      )}
    </section>
  );
}

/* ---------- Camera lane ---------- */

function CameraLane({
  slot,
  shots,
  selectedShot,
  onSelectShot,
  activeRoll,
  now,
  onRoll,
  onCut,
}: {
  slot: SlotKey;
  shots: Shot[];
  selectedShot: string | null;
  onSelectShot: (shotId: string) => void;
  activeRoll: ActiveRoll | null;
  now: number;
  onRoll: () => void;
  onCut: () => void;
}) {
  const Icon = SLOT_ICON[slot];
  const isRolling = !!activeRoll;
  const elapsed = activeRoll ? Math.round((now - activeRoll.startedAtMs) / 1000) : 0;
  const elapsedStr = `${Math.floor(elapsed / 60)
    .toString()
    .padStart(2, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`;

  return (
    <div
      className={`border-[0.5px] rounded-[2px] px-3 py-2.5 transition-colors ${
        isRolling
          ? 'bg-[color:var(--color-coral)]/10 border-[color:var(--color-coral)]/60'
          : 'bg-[color:var(--color-paper)] border-[color:var(--color-border-paper)]'
      }`}
    >
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="flex items-baseline gap-1.5">
          <Icon
            size={11}
            className={
              isRolling
                ? 'text-[color:var(--color-coral-deep)]'
                : 'text-[color:var(--color-brass-deep)]'
            }
          />
          <span className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
            {SLOT_LABEL[slot]}
          </span>
        </span>
        {isRolling && (
          <span className="display-italic text-[14px] text-[color:var(--color-coral-deep)] tabular-nums">
            {elapsedStr}
          </span>
        )}
      </div>

      {/* Shot picker */}
      {!isRolling && (
        <select
          value={selectedShot ?? ''}
          onChange={(e) => onSelectShot(e.target.value)}
          className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[11px] text-[color:var(--color-on-paper)] py-0.5 mb-2"
        >
          <option value="">— pick shot —</option>
          {shots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.number} · {s.description.slice(0, 24)}
            </option>
          ))}
        </select>
      )}

      {isRolling && (
        <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-2 truncate">
          rolling · take in flight
        </div>
      )}

      {/* Big button */}
      {isRolling ? (
        <button
          type="button"
          onClick={onCut}
          className="w-full label-caps tracking-[0.16em] text-[11px] py-2 rounded-[2px] bg-[color:var(--color-coral)] hover:bg-[color:var(--color-coral-deep)] text-[color:var(--color-paper)] transition-colors flex items-center justify-center gap-1.5"
        >
          <Square size={10} className="fill-current" />
          CUT
        </button>
      ) : (
        <button
          type="button"
          onClick={onRoll}
          disabled={!selectedShot}
          className="w-full label-caps tracking-[0.16em] text-[11px] py-2 rounded-[2px] bg-[color:var(--color-success)] hover:opacity-90 text-[color:var(--color-paper)] transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Circle size={10} className="fill-current" />
          ROLL
        </button>
      )}
    </div>
  );
}

/* ---------- Take log row ---------- */

function TakeLogRow({ take }: { take: Take }) {
  const { state } = useApp();
  const shot = state.shots.find((s) => s.id === take.shotId);
  const startedTime = take.startedAt
    ? new Date(take.startedAt).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
  const tone =
    take.status === 'PRINT'
      ? 'text-[color:var(--color-success)]'
      : take.status === 'NG'
      ? 'text-[color:var(--color-coral-deep)]'
      : 'text-[color:var(--color-on-paper)]';
  return (
    <li className="grid grid-cols-[55px_55px_1fr_60px_60px_28px] gap-2 items-center prose-body italic text-[11px]">
      <span className="text-[color:var(--color-on-paper-muted)] tabular-nums">
        {startedTime}
      </span>
      <span className="display-italic text-[12px] text-[color:var(--color-on-paper)]">
        {shot?.number ?? '—'} · T{take.takeNum}
      </span>
      <span className="text-[color:var(--color-on-paper-muted)] truncate">
        {take.notes || shot?.description || '—'}
      </span>
      <span
        className={`label-caps tracking-[0.10em] text-[10px] tabular-nums text-right ${tone}`}
      >
        {take.status}
      </span>
      <span className="text-[color:var(--color-on-paper-muted)] tabular-nums text-right">
        {take.durationSec ? `${Math.round(take.durationSec)}s` : '—'}
      </span>
      <span className="flex justify-end">
        <VoiceMemoPerTake take={take} compact />
      </span>
    </li>
  );
}

/* ---------- Cut modal ---------- */

function CutModal({
  slot,
  takeId,
  durationSec,
  onCommit,
  onCancel,
}: {
  slot: SlotKey;
  takeId: string;
  durationSec: number;
  onCommit: (p: { slot: SlotKey; takeId: string; status: TakeStatus; notes: string }) => void;
  onCancel: () => void;
}) {
  const { state } = useApp();
  const take = state.takes.find((t) => t.id === takeId);
  const [status, setStatus] = useState<TakeStatus>('OK');
  const [notes, setNotes] = useState('');
  const [recognizing, setRecognizing] = useState(false);
  const recognizerRef = useRef<unknown>(null);

  function startListening() {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const SR =
      (typeof window !== 'undefined' &&
        ((window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) {
      window.alert('Speech recognition not available — type notes instead.');
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) transcript += event.results[i][0].transcript + ' ';
      }
      setNotes((prev) => (prev ? prev + ' ' + transcript : transcript).trim());
    };
    rec.onerror = () => setRecognizing(false);
    rec.onend = () => setRecognizing(false);
    rec.start();
    recognizerRef.current = rec;
    setRecognizing(true);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }

  function stopListening() {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const rec = recognizerRef.current as any;
    if (rec && typeof rec.stop === 'function') rec.stop();
    /* eslint-enable @typescript-eslint/no-explicit-any */
    setRecognizing(false);
  }

  function commit() {
    onCommit({ slot, takeId, status, notes });
  }

  return (
    <div className="fixed inset-0 z-50 bg-[color:var(--color-chrome)]/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] w-full max-w-[460px] overflow-hidden">
        <header className="px-5 py-3 bg-[color:var(--color-paper)] border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            CUT · {SLOT_LABEL[slot]}
          </h3>
          <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] tabular-nums">
            {Math.round(durationSec)}s
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper)]"
          >
            <X size={14} />
          </button>
        </header>
        <div className="px-5 py-4 space-y-4">
          {/* Status */}
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
              status
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-2">
              {(['NG', 'OK', 'PRINT'] as TakeStatus[]).map((s) => {
                const active = status === s;
                const tone =
                  s === 'PRINT'
                    ? 'success'
                    : s === 'NG'
                    ? 'coral'
                    : 'brass';
                const bg =
                  active && tone === 'success'
                    ? 'var(--color-success)'
                    : active && tone === 'coral'
                    ? 'var(--color-coral)'
                    : active
                    ? 'var(--color-brass)'
                    : 'transparent';
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`label-caps tracking-[0.14em] text-[11px] py-2 rounded-[2px] transition-colors border-[0.5px] ${
                      active
                        ? 'text-[color:var(--color-paper)] border-transparent'
                        : 'text-[color:var(--color-on-paper-muted)] border-[color:var(--color-border-paper)] hover:border-[color:var(--color-border-paper-strong)]'
                    }`}
                    style={{ background: bg }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice + textarea */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="label-caps text-[color:var(--color-brass-deep)]">
                notes
              </span>
              <button
                type="button"
                onClick={recognizing ? stopListening : startListening}
                className={`flex items-baseline gap-1 label-caps tracking-[0.10em] text-[10px] px-2 py-0.5 rounded-[2px] transition-colors ${
                  recognizing
                    ? 'bg-[color:var(--color-coral)]/15 text-[color:var(--color-coral-deep)]'
                    : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-brass-deep)]'
                }`}
              >
                {recognizing ? <Mic size={10} /> : <MicOff size={10} />}
                {recognizing ? 'listening' : 'voice'}
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="What happened in this take? Speak (mic) or type."
              className="w-full bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none rounded-[2px] px-3 py-2 prose-body italic text-[12px] text-[color:var(--color-on-paper)] leading-relaxed"
            />
          </div>

          {/* Voice memo — Phase 12 — full audio attachment alongside notes */}
          {take && (
            <div>
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
                voice memo
              </div>
              <VoiceMemoPerTake take={take} />
            </div>
          )}

          <div className="flex items-baseline justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="label-caps tracking-[0.10em] text-[11px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] px-3 py-1.5"
            >
              cancel
            </button>
            <button
              type="button"
              onClick={commit}
              className="label-caps tracking-[0.10em] text-[11px] text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-4 py-1.5 rounded-[2px] transition-colors flex items-center gap-1.5"
            >
              <Radio size={11} />
              save take
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* unused-import hint */
export const _liveIcons = { Activity, Camera, Plane, Disc, Waves, Square, Circle, Mic };
