import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import type { Spark, SparkKind, VoiceMemo } from '../../types';
import { SPARK_KINDS, SPARK_KIND_BY_KIND } from './sparkKinds';
import { AudioRecorder } from '../primitives/AudioRecorder';

/* ---------- SparkCaptureModal (Phase 13) ----------
   Two-step flow:
     1. Kind picker (12-icon grid)
     2. Kind-specific capture form

   Capture forms by kind:
     • text (idea/verse/quote/place/character/taste): headline + body
     • voice (voice/sound):     headline + AudioRecorder primitive
     • image (image/test-shot): headline + file input → base64 data URL
     • sketch (sketch):         headline + simple HTML5 canvas
     • reference (reference):   headline + URL field

   On save, the spark auto-binds:
     • capturedAt = now
     • capturedBy = first crew member (Tomo) — TODO: active operator picker
     • locationId = active anchorage if a shoot day is "today"
     • episodeId = state.selectedEpisodeId if any */

interface Props {
  open: boolean;
  initialKind?: SparkKind;
  onClose: () => void;
}

type CaptureStep = 'pick' | 'capture';

export function SparkCaptureModal({ open, initialKind, onClose }: Props) {
  const { state, dispatch } = useApp();
  const t = useT();
  const [step, setStep] = useState<CaptureStep>(initialKind ? 'capture' : 'pick');
  const [kind, setKind] = useState<SparkKind | null>(initialKind ?? null);

  /* Reset on open. */
  useEffect(() => {
    if (open) {
      setStep(initialKind ? 'capture' : 'pick');
      setKind(initialKind ?? null);
    }
  }, [open, initialKind]);

  /* Auto-resolve current shoot-day anchorage for location auto-binding. */
  const todayShootDay = (() => {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    return state.shootDays.find((d) => d.date === todayIso);
  })();
  const anchorage = todayShootDay?.anchorageId
    ? state.locations.find((l) => l.id === todayShootDay.anchorageId)
    : undefined;

  function pickKind(k: SparkKind) {
    setKind(k);
    setStep('capture');
  }

  function back() {
    setStep('pick');
    setKind(null);
  }

  function commit(partial: Partial<Spark>) {
    if (!kind) return;
    const spark: Spark = {
      id: `spark-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      title: 'Untitled spark',
      capturedAt: new Date().toISOString(),
      capturedBy: state.crew[0]?.id,
      locationId: anchorage?.id,
      episodeId: state.selectedEpisodeId ?? undefined,
      shootDayDate: todayShootDay?.date,
      status: 'raw',
      ...partial,
    };
    dispatch({ type: 'ADD_SPARK', spark });
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[color:var(--color-chrome)]/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] w-full max-w-[640px] overflow-hidden max-h-[90vh] flex flex-col">
        <header className="px-5 py-3 bg-[color:var(--color-paper)] border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between gap-2 shrink-0">
          <div className="flex items-baseline gap-3">
            {step === 'capture' && (
              <button
                type="button"
                onClick={back}
                className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper)]"
                aria-label="back"
              >
                <ArrowLeft size={14} />
              </button>
            )}
            <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
              {step === 'pick'
                ? t('spark.capture.modal.pick.kind')
                : t('spark.capture.modal.title')}
            </h3>
            {step === 'capture' && kind && (
              <span className="prose-body italic text-[12px] text-[color:var(--color-brass-deep)]">
                · {t(SPARK_KIND_BY_KIND[kind].labelKey)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper)]"
            aria-label={t('common.close')}
          >
            <X size={14} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {step === 'pick' && <KindPicker onPick={pickKind} />}
          {step === 'capture' && kind && (
            <CaptureForm
              kind={kind}
              onCommit={commit}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Step 1: kind picker ---------- */

function KindPicker({ onPick }: { onPick: (k: SparkKind) => void }) {
  const t = useT();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {SPARK_KINDS.map((meta) => {
        const Icon = meta.Icon;
        return (
          <button
            key={meta.kind}
            type="button"
            onClick={() => onPick(meta.kind)}
            className="text-left rounded-[3px] border-[0.5px] border-[color:var(--color-border-paper)] bg-[color:var(--color-paper)] hover:border-[color:var(--color-brass)] hover:bg-[color:var(--color-brass)]/5 transition-colors p-3"
          >
            <Icon
              size={14}
              className="text-[color:var(--color-brass-deep)] mb-1.5"
            />
            <div className="display-italic text-[14px] text-[color:var(--color-on-paper)] leading-tight">
              {t(meta.labelKey)}
            </div>
            <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5 leading-tight">
              {t(meta.hintKey)}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Step 2: kind-specific capture form ---------- */

function CaptureForm({
  kind,
  onCommit,
  onCancel,
}: {
  kind: SparkKind;
  onCommit: (partial: Partial<Spark>) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const { state, dispatch } = useApp();
  const meta = SPARK_KIND_BY_KIND[kind];
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [voiceMemoId, setVoiceMemoId] = useState<string | undefined>(undefined);
  const [recordingActive, setRecordingActive] = useState(false);

  /* Sketch canvas refs */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(String(reader.result));
    };
    reader.readAsDataURL(file);
  }

  function handleVoiceCaptured(audio: {
    base64: string;
    mimeType: string;
    durationMs: number;
    transcript?: string;
  }) {
    const memo: VoiceMemo = {
      id: `vm-spark-${Math.random().toString(36).slice(2, 8)}`,
      recordedAt: new Date().toISOString(),
      durationMs: audio.durationMs,
      audioBase64: audio.base64,
      mimeType: audio.mimeType,
      transcript: audio.transcript,
      scope: 'note',
      label: title || 'spark',
    };
    dispatch({ type: 'ADD_VOICE_MEMO', memo });
    setVoiceMemoId(memo.id);
    setRecordingActive(false);
  }

  function startSketchStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    ctx.strokeStyle = 'var(--color-on-paper)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function continueSketchStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function endSketchStroke() {
    drawingRef.current = false;
  }

  function clearSketch() {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  function captureSketchImage(): string | undefined {
    if (!canvasRef.current) return undefined;
    return canvasRef.current.toDataURL('image/png');
  }

  function save() {
    let finalImage = imageDataUrl;
    if (kind === 'sketch') {
      finalImage = captureSketchImage();
    }
    onCommit({
      title: title.trim() || `${meta.kind} spark`,
      body: body.trim() || undefined,
      referenceUrl: referenceUrl.trim() || undefined,
      imageDataUrl: finalImage,
      voiceMemoId,
    });
  }

  /* Common headline + body fields. */
  const headlineField = (
    <div>
      <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
        {t('spark.capture.modal.headline')}
      </div>
      <input
        type="text"
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t(meta.hintKey)}
        className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[14px] display-italic text-[color:var(--color-on-paper)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
      />
    </div>
  );

  const bodyField = (
    <div>
      <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
        {t('spark.capture.modal.body')}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)] resize-none"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {headlineField}

      {meta.defaultMedia === 'voice' && (
        <div>
          {voiceMemoId ? (
            <div className="prose-body italic text-[12px] text-[color:var(--color-success)]">
              ✓ Voice memo attached. You can save the spark.
            </div>
          ) : recordingActive ? (
            <AudioRecorder
              onRecorded={handleVoiceCaptured}
              language="hr-HR"
              maxDurationSec={120}
              hint="speak the spark"
            />
          ) : (
            <button
              type="button"
              onClick={() => setRecordingActive(true)}
              className="px-3 py-1.5 rounded-[3px] bg-[color:var(--color-brass)] text-[color:var(--color-paper-light)] text-[12px] hover:bg-[color:var(--color-brass-deep)] transition-colors"
            >
              ● record voice memo
            </button>
          )}
        </div>
      )}

      {meta.defaultMedia === 'image' && (
        <div>
          {imageDataUrl ? (
            <div className="space-y-2">
              <img
                src={imageDataUrl}
                alt="preview"
                className="w-full rounded-[3px] border-[0.5px] border-[color:var(--color-border-paper)] max-h-[280px] object-contain bg-[color:var(--color-paper)]"
              />
              <button
                type="button"
                onClick={() => setImageDataUrl(undefined)}
                className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-coral-deep)]"
              >
                replace
              </button>
            </div>
          ) : (
            <label className="block">
              <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
                pick a photo
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="block w-full text-[12px] file:mr-3 file:py-1.5 file:px-3 file:rounded-[3px] file:border-0 file:bg-[color:var(--color-brass)] file:text-[color:var(--color-paper-light)] file:cursor-pointer hover:file:bg-[color:var(--color-brass-deep)]"
              />
            </label>
          )}
        </div>
      )}

      {meta.defaultMedia === 'sketch' && (
        <div>
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1 flex items-baseline justify-between">
            <span>quick sketch</span>
            <button
              type="button"
              onClick={clearSketch}
              className="hover:text-[color:var(--color-coral-deep)] transition-colors"
            >
              clear
            </button>
          </div>
          <canvas
            ref={canvasRef}
            width={560}
            height={300}
            onPointerDown={startSketchStroke}
            onPointerMove={continueSketchStroke}
            onPointerUp={endSketchStroke}
            onPointerLeave={endSketchStroke}
            className="w-full rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] touch-none"
            style={{ height: 300, aspectRatio: '560/300' }}
          />
        </div>
      )}

      {meta.defaultMedia === 'reference' && (
        <div>
          <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] mb-1">
            {t('spark.field.url')}
          </div>
          <input
            type="url"
            value={referenceUrl}
            onChange={(e) => setReferenceUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
          />
        </div>
      )}

      {bodyField}

      <div className="flex items-center justify-end gap-2 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        <button
          type="button"
          onClick={onCancel}
          className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] px-3 py-1.5"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={save}
          className="px-4 py-1.5 rounded-[3px] bg-[color:var(--color-brass)] text-[color:var(--color-paper-light)] text-[13px] hover:bg-[color:var(--color-brass-deep)] transition-colors display-italic"
        >
          {t('spark.capture.modal.save')}
        </button>
      </div>
    </div>
  );
}
