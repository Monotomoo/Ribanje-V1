import { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import type { Catch } from '../../types';
import { useApp } from '../../state/AppContext';

interface Props {
  catch_: Catch;
  onClose: () => void;
}

const CARD_SIZE = 1080;

/* Catch-of-the-day shareable — 1080×1080 social card.
   Renders directly to canvas using brand fonts + photo background.
   "Save PNG" downloads the file. */
export function CatchOfTheDay({ catch_, onClose }: Props) {
  const { state } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const anchorage = catch_.anchorageId
    ? state.locations.find((l) => l.id === catch_.anchorageId)
    : null;
  const episode = state.episodes.find((e) => e.id === catch_.episodeId);

  /* Lock body scroll */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* Esc closes */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* Render card */
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setBusy(true);
        setError(null);

        /* Wait for brand fonts so canvas picks them up. */
        await Promise.all([
          document.fonts.load('italic 700 96px Fraunces'),
          document.fonts.load('italic 400 32px Fraunces'),
          document.fonts.load('500 22px Inter'),
        ]);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        /* Background — photo OR brand gradient */
        if (catch_.photoBase64) {
          const img = await loadImage(catch_.photoBase64);
          drawCover(ctx, img, 0, 0, CARD_SIZE, CARD_SIZE);
        } else {
          const grad = ctx.createLinearGradient(0, 0, CARD_SIZE, CARD_SIZE);
          grad.addColorStop(0, '#0E1E36');
          grad.addColorStop(1, '#1B3050');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);
        }

        /* Bottom gradient overlay for legibility */
        const overlay = ctx.createLinearGradient(0, CARD_SIZE * 0.45, 0, CARD_SIZE);
        overlay.addColorStop(0, 'rgba(0,0,0,0)');
        overlay.addColorStop(0.5, 'rgba(14,30,54,0.55)');
        overlay.addColorStop(1, 'rgba(14,30,54,0.92)');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, CARD_SIZE * 0.45, CARD_SIZE, CARD_SIZE * 0.55);

        /* Top-left brass marker + project name */
        ctx.fillStyle = '#C9A961';
        ctx.fillRect(80, 80, 3, 80);
        ctx.font = '500 14px Inter';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.fillText('RIBANJE · MMXXVI', 100, 92);

        ctx.fillStyle = 'rgba(244,241,234,0.65)';
        ctx.font = '500 13px Inter';
        ctx.fillText(formatDate(catch_), 100, 116);

        /* Main fish names — Croatian large italic Fraunces */
        ctx.fillStyle = '#F4F1EA';
        ctx.font = 'italic 700 96px Fraunces';
        ctx.textBaseline = 'alphabetic';
        const cro = catch_.fishCro || catch_.fishEng || '—';
        ctx.fillText(cro, 80, 800);

        /* Latin name */
        ctx.font = 'italic 400 32px Fraunces';
        ctx.fillStyle = 'rgba(244,241,234,0.78)';
        if (catch_.fishLat) {
          ctx.fillText(catch_.fishLat, 80, 850);
        }

        /* English name in caps */
        if (catch_.fishEng && catch_.fishEng !== cro) {
          ctx.font = '500 18px Inter';
          ctx.fillStyle = '#C9A961';
          const eng = catch_.fishEng.toUpperCase();
          ctx.fillText(spreadSpaces(eng, 0.16), 80, 890);
        }

        /* Meta row — weight · method · anchorage */
        const meta: string[] = [];
        if (catch_.weightKg) meta.push(`${catch_.weightKg} kg`);
        if (catch_.method) meta.push(catch_.method);
        if (anchorage) meta.push(anchorage.label);
        if (catch_.timeOfDay) meta.push(catch_.timeOfDay);

        if (meta.length > 0) {
          ctx.font = 'italic 400 24px Fraunces';
          ctx.fillStyle = 'rgba(244,241,234,0.85)';
          ctx.fillText(meta.join('  ·  '), 80, 950);
        }

        /* Hektorović verse fragment in upper-right (if present) */
        if (catch_.hektorovicVerseRef) {
          ctx.font = 'italic 400 18px Fraunces';
          ctx.fillStyle = 'rgba(244,241,234,0.55)';
          ctx.textAlign = 'right';
          const verse = catch_.hektorovicVerseRef.split('\n')[0].slice(0, 70);
          ctx.fillText(verse, CARD_SIZE - 80, 110);
          ctx.font = '500 11px Inter';
          ctx.fillStyle = 'rgba(244,241,234,0.4)';
          ctx.fillText('po Hektoroviću · 1568', CARD_SIZE - 80, 132);
        }

        /* Episode badge top-right (if present and no verse competing) */
        if (episode && !catch_.hektorovicVerseRef) {
          ctx.font = '500 12px Inter';
          ctx.fillStyle = 'rgba(244,241,234,0.5)';
          ctx.textAlign = 'right';
          ctx.fillText(
            spreadSpaces(`EP ${episode.number} · ${episode.title.toUpperCase()}`, 0.16),
            CARD_SIZE - 80,
            116
          );
        }

        /* Wordmark bottom-right */
        ctx.font = 'italic 700 32px Fraunces';
        ctx.fillStyle = '#C9A961';
        ctx.textAlign = 'right';
        ctx.fillText('Ribanje', CARD_SIZE - 80, 990);

        /* Hairline separator above wordmark */
        ctx.fillStyle = 'rgba(201,169,97,0.5)';
        ctx.fillRect(CARD_SIZE - 200, 1010, 120, 1);

        const url = canvas.toDataURL('image/png');
        if (!cancelled) {
          setPreviewUrl(url);
          setBusy(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not render card');
          setBusy(false);
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [catch_, anchorage, episode]);

  function download() {
    if (!previewUrl) return;
    const link = document.createElement('a');
    const safeName = (catch_.fishCro || catch_.fishEng || 'catch')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    link.download = `ribanje-catch-${safeName}-${catch_.id.slice(-6)}.png`;
    link.href = previewUrl;
    link.click();
  }

  return (
    <div className="fixed inset-0 z-40 bg-[color:var(--color-chrome-deep)]/85 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper-strong)] rounded-[4px] p-7 w-full max-w-[720px] shadow-[0_8px_32px_rgba(14,30,54,0.18)]">
          <header className="flex items-baseline justify-between mb-5 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
            <div>
              <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
                Catch of the day
              </h2>
              <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-0.5">
                1080 × 1080 social card · save PNG to share
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={download}
                disabled={!previewUrl}
                className="flex items-center gap-1.5 label-caps text-[color:var(--color-paper)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] disabled:opacity-40 disabled:hover:bg-[color:var(--color-brass)] px-3 py-1.5 rounded-[2px] transition-colors"
              >
                <Download size={11} />
                <span>save PNG</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper)] transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Canvas — rendered hidden, preview displayed via image */}
          <canvas
            ref={canvasRef}
            width={CARD_SIZE}
            height={CARD_SIZE}
            className="hidden"
          />

          <div className="aspect-square bg-[color:var(--color-paper-card)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
            {busy && !error && (
              <div className="w-full h-full flex items-center justify-center prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
                rendering card…
              </div>
            )}
            {error && (
              <div className="w-full h-full flex items-center justify-center prose-body italic text-[13px] text-[color:var(--color-coral-deep)] px-8 text-center">
                {error}
              </div>
            )}
            {previewUrl && !error && (
              <img src={previewUrl} alt="catch card preview" className="block w-full h-full" />
            )}
          </div>

          {!catch_.photoBase64 && (
            <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] mt-3 leading-relaxed">
              No photo uploaded — using brand-color background. Drop a photo on the catch
              entry and re-open this card for a hero shot.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const ratio = Math.max(w / img.width, h / img.height);
  const nw = img.width * ratio;
  const nh = img.height * ratio;
  const nx = x - (nw - w) / 2;
  const ny = y - (nh - h) / 2;
  ctx.drawImage(img, nx, ny, nw, nh);
}

function formatDate(c: { id: string }): string {
  /* No date field on Catch — use today as the share-date stamp. */
  void c;
  const d = new Date();
  return d
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase();
}

/* Spread small-cap text with letter spacing — canvas has no letter-spacing,
   so we insert hair spaces. */
function spreadSpaces(text: string, ratio: number): string {
  const interval = Math.max(0, Math.round(ratio * 6));
  if (interval <= 0) return text;
  const sep = ' '.repeat(Math.max(1, Math.round(interval / 3)));
  return text.split('').join(sep);
}
