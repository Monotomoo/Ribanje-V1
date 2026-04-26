import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Check, Eraser, Pen, RotateCcw, Undo2 } from 'lucide-react';

interface Props {
  width?: number;
  height?: number;
  onSave?: (pngBase64: string) => void;
  initialPng?: string;
  saveLabel?: string;
}

const STROKE_COLORS = [
  { label: 'Ink', value: '#0E1E36' },
  { label: 'Brass', value: '#C9A961' },
  { label: 'Olive', value: '#788064' },
  { label: 'Coral', value: '#C26A4A' },
];

const STROKE_SIZES = [2, 4, 8, 14];

const PAPER = '#FAF7F0';

/* Editorial sketch canvas. Pen / eraser / 4 brand colours / 4 stroke sizes /
   30-step in-memory undo / clear / save-as-PNG. Pointer-event based — works
   for mouse, pen, touch. Aspect-preserving when scaled. */
export function SketchCanvas({
  width = 800,
  height = 480,
  onSave,
  initialPng,
  saveLabel = 'save sketch',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<ImageData[]>([]);

  const [color, setColor] = useState(STROKE_COLORS[0].value);
  const [size, setSize] = useState(STROKE_SIZES[1]);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (initialPng) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        snapshot();
      };
      img.src = initialPng;
    } else {
      snapshot();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [initialPng]);

  function snapshot() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(data);
    if (historyRef.current.length > 30) historyRef.current.shift();
  }

  function pos(ev: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = ev.currentTarget.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * width,
      y: ((ev.clientY - rect.top) / rect.height) * height,
    };
  }

  function down(ev: ReactPointerEvent<HTMLCanvasElement>) {
    drawingRef.current = true;
    lastRef.current = pos(ev);
    ev.currentTarget.setPointerCapture(ev.pointerId);
  }

  function move(ev: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastRef.current) return;
    const p = pos(ev);
    ctx.strokeStyle = tool === 'pen' ? color : PAPER;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastRef.current = p;
  }

  function up() {
    if (drawingRef.current) {
      drawingRef.current = false;
      lastRef.current = null;
      snapshot();
    }
  }

  function undo() {
    if (historyRef.current.length <= 1) return;
    historyRef.current.pop();
    const last = historyRef.current[historyRef.current.length - 1];
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && last) ctx.putImageData(last, 0, 0);
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [];
    snapshot();
  }

  function save() {
    const canvas = canvasRef.current;
    if (!canvas || !onSave) return;
    onSave(canvas.toDataURL('image/png'));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-2 py-1">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`p-1.5 rounded-[2px] transition-colors ${
              tool === 'pen'
                ? 'bg-[color:var(--color-brass)]/30 text-[color:var(--color-on-paper)]'
                : 'text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)]'
            }`}
            aria-label="Pen"
            title="Pen"
          >
            <Pen size={13} />
          </button>
          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-[2px] transition-colors ${
              tool === 'eraser'
                ? 'bg-[color:var(--color-brass)]/30 text-[color:var(--color-on-paper)]'
                : 'text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)]'
            }`}
            aria-label="Eraser"
            title="Eraser"
          >
            <Eraser size={13} />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {STROKE_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`w-6 h-6 rounded-full border-[0.5px] transition-all ${
                color === c.value
                  ? 'border-[color:var(--color-brass)] ring-1 ring-[color:var(--color-brass)] scale-110'
                  : 'border-[color:var(--color-border-paper-strong)] hover:scale-105'
              }`}
              style={{ background: c.value }}
              aria-label={c.label}
              title={c.label}
            />
          ))}
        </div>

        <div className="flex items-center gap-1">
          {STROKE_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`w-7 h-7 flex items-center justify-center rounded-[2px] transition-colors ${
                size === s ? 'bg-[color:var(--color-brass)]/30' : 'hover:bg-[color:var(--color-paper-deep)]/40'
              }`}
              aria-label={`Stroke ${s}px`}
              title={`Stroke ${s}px`}
            >
              <span
                className="rounded-full bg-[color:var(--color-on-paper)]"
                style={{ width: s, height: s }}
              />
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={undo}
            className="flex items-center gap-1 label-caps text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] transition-colors"
            title="Undo last stroke"
          >
            <Undo2 size={11} />
            <span>undo</span>
          </button>
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 label-caps text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-coral-deep)] transition-colors"
            title="Clear canvas"
          >
            <RotateCcw size={11} />
            <span>clear</span>
          </button>
          {onSave && (
            <button
              type="button"
              onClick={save}
              className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
            >
              <Check size={11} />
              <span>{saveLabel}</span>
            </button>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full border-[0.5px] border-[color:var(--color-border-paper-strong)] rounded-[3px] bg-[color:var(--color-paper-card)] touch-none cursor-crosshair"
        style={{ aspectRatio: `${width}/${height}` }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      />
    </div>
  );
}
