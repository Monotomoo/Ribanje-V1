import { useState } from 'react';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Take, VoiceMemo } from '../../types';
import { AudioRecorder } from './AudioRecorder';

/* ---------- Voice Memo Per Take (Phase 12) ----------
   Tap-and-hold attach a voice memo to a take. Browser MediaRecorder via the
   existing AudioRecorder primitive. Memo is stored in state.voiceMemos and
   linked through Take.voiceMemoId.

   Compact mode: tiny mic icon + playback if memo exists. Click expands the
   recorder inline.

   Used in:
     · LiveRollCockpit's TakeLogRow      compact playback
     · CutModal                          full recorder during cut review */

interface Props {
  take: Take;
  /* When true, render the full recorder UI immediately (used in CutModal). */
  expanded?: boolean;
  /* Optional auto-collapse when memo is attached. */
  onMemoAttached?: () => void;
  /* Compact mode: just an icon + playback. */
  compact?: boolean;
}

export function VoiceMemoPerTake({
  take,
  expanded: initialExpanded = false,
  onMemoAttached,
  compact = false,
}: Props) {
  const { state, dispatch } = useApp();
  const [expanded, setExpanded] = useState(initialExpanded);
  const memo = take.voiceMemoId
    ? state.voiceMemos.find((v) => v.id === take.voiceMemoId)
    : undefined;

  function handleRecorded(r: {
    base64: string;
    mimeType: string;
    durationMs: number;
    transcript?: string;
  }) {
    const newMemo: VoiceMemo = {
      id: `vm-take-${take.id}-${Math.random().toString(36).slice(2, 6)}`,
      recordedAt: new Date().toISOString(),
      durationMs: r.durationMs,
      audioBase64: r.base64,
      mimeType: r.mimeType,
      transcript: r.transcript,
      scope: 'note',
      label: `take ${take.takeNum} memo`,
    };
    dispatch({ type: 'ADD_VOICE_MEMO', memo: newMemo });
    dispatch({ type: 'UPDATE_TAKE', id: take.id, patch: { voiceMemoId: newMemo.id } });
    setExpanded(false);
    onMemoAttached?.();
  }

  function removeMemo() {
    if (!memo) return;
    if (!window.confirm('Remove this voice memo?')) return;
    dispatch({ type: 'DELETE_VOICE_MEMO', id: memo.id });
    dispatch({ type: 'UPDATE_TAKE', id: take.id, patch: { voiceMemoId: undefined } });
  }

  /* ---------- Compact: just an icon (used in TakeLogRow) ---------- */
  if (compact) {
    if (memo) {
      return <CompactMemoPlayback memo={memo} onRemove={removeMemo} />;
    }
    return (
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-brass-deep)] transition-colors p-0.5"
        title="Add voice memo"
        aria-label="Add voice memo to this take"
      >
        <Mic size={11} />
      </button>
    );
  }

  /* ---------- Full: recorder UI ---------- */
  if (memo) {
    return (
      <div className="flex items-center gap-2 prose-body italic text-[12px] text-[color:var(--color-on-paper)]">
        <Mic size={11} className="text-[color:var(--color-brass-deep)] shrink-0" />
        <audio
          controls
          src={memo.audioBase64}
          className="h-7 flex-1 min-w-0"
        />
        <button
          type="button"
          onClick={removeMemo}
          className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] p-1 transition-colors"
          aria-label="Remove memo"
        >
          <Trash2 size={11} />
        </button>
        {memo.transcript && (
          <details className="ml-1 max-w-[180px]">
            <summary className="cursor-pointer text-[color:var(--color-on-paper-muted)] text-[10px] list-none">
              transcript
            </summary>
            <div className="mt-1 text-[11px] text-[color:var(--color-on-paper)] absolute right-0 mt-2 max-w-[280px] p-2 bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] z-10">
              {memo.transcript}
            </div>
          </details>
        )}
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[3px] bg-[color:var(--color-brass)]/15 text-[color:var(--color-on-paper)] text-[11px] hover:bg-[color:var(--color-brass)]/25 transition-colors"
      >
        <Mic size={11} />
        <span className="prose-body italic">add voice memo</span>
      </button>
    );
  }

  return (
    <div>
      <AudioRecorder
        onRecorded={handleRecorded}
        language="hr-HR"
        maxDurationSec={120}
        hint="quick note about this take"
      />
      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="mt-1.5 prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-coral-deep)]"
      >
        cancel
      </button>
    </div>
  );
}

/* ---------- Compact playback inline ---------- */

function CompactMemoPlayback({
  memo,
  onRemove,
}: {
  memo: VoiceMemo;
  onRemove: () => void;
}) {
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!audioEl) return;
    if (playing) {
      audioEl.pause();
    } else {
      audioEl.play().catch(() => {
        /* swallow autoplay errors */
      });
    }
  }

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    onRemove();
  }

  return (
    <span className="inline-flex items-center gap-1">
      <audio
        ref={setAudioEl}
        src={memo.audioBase64}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        preload="none"
      />
      <button
        type="button"
        onClick={toggle}
        onContextMenu={onContextMenu}
        title={`Voice memo · ${Math.round(memo.durationMs / 1000)}s · right-click to delete`}
        aria-label={playing ? 'Pause memo' : 'Play memo'}
        className={`p-0.5 transition-colors ${
          playing
            ? 'text-[color:var(--color-coral-deep)]'
            : 'text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)]'
        }`}
      >
        {playing ? <Pause size={11} /> : <Play size={11} />}
      </button>
    </span>
  );
}
