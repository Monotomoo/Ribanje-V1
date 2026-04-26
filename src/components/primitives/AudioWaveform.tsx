import { useEffect, useState } from 'react';

interface Props {
  /* Pass either a Blob OR a base64 data URL — both decode the same way. */
  blob?: Blob;
  blobBase64?: string;
  width?: number;
  height?: number;
  bars?: number;
  /* CSS color value — defaults to brass. */
  color?: string;
  /* Center-line stroke. Off by default. */
  showCenter?: boolean;
}

/* SVG audio waveform. Decodes the audio Blob/base64 into an AudioBuffer,
   samples peaks per bar, renders as centred rounded rectangles.
   Designed for voice memos (mono, ~30s) — fast enough for that scale. */
export function AudioWaveform({
  blob,
  blobBase64,
  width = 320,
  height = 48,
  bars = 64,
  color = 'var(--color-brass)',
  showCenter = false,
}: Props) {
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setPeaks(null);

    async function run() {
      try {
        let arrayBuf: ArrayBuffer;
        if (blob) {
          arrayBuf = await blob.arrayBuffer();
        } else if (blobBase64) {
          const res = await fetch(blobBase64);
          arrayBuf = await res.arrayBuffer();
        } else {
          return;
        }
        const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
        const Ctor = w.AudioContext || w.webkitAudioContext;
        if (!Ctor) {
          if (!cancelled) setFailed(true);
          return;
        }
        const ctx = new Ctor();
        const decoded = await ctx.decodeAudioData(arrayBuf);
        const channel = decoded.getChannelData(0);
        const samplesPerBar = Math.max(1, Math.floor(channel.length / bars));
        const out: number[] = [];
        for (let i = 0; i < bars; i++) {
          let max = 0;
          const start = i * samplesPerBar;
          const end = Math.min(start + samplesPerBar, channel.length);
          for (let j = start; j < end; j++) {
            const v = Math.abs(channel[j]);
            if (v > max) max = v;
          }
          out.push(max);
        }
        ctx.close();
        if (!cancelled) setPeaks(out);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [blob, blobBase64, bars]);

  if (failed) {
    return (
      <div
        className="bg-[color:var(--color-paper-deep)]/40 rounded-[2px] flex items-center justify-center prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)]"
        style={{ width, height }}
      >
        no waveform
      </div>
    );
  }

  if (!peaks) {
    return (
      <div
        className="bg-[color:var(--color-paper-deep)]/30 rounded-[2px] animate-pulse"
        style={{ width, height }}
        aria-label="loading waveform"
      />
    );
  }

  const maxPeak = Math.max(...peaks, 0.01);
  const barWidth = width / peaks.length;

  return (
    <svg width={width} height={height} aria-label="audio waveform" style={{ display: 'block' }}>
      {showCenter && (
        <line
          x1={0}
          x2={width}
          y1={height / 2}
          y2={height / 2}
          stroke="var(--color-border-paper)"
          strokeWidth={0.5}
        />
      )}
      {peaks.map((p, i) => {
        const h = Math.max(1, (p / maxPeak) * height);
        return (
          <rect
            key={i}
            x={i * barWidth + barWidth * 0.18}
            y={(height - h) / 2}
            width={barWidth * 0.64}
            height={h}
            fill={color}
            rx={1}
          />
        );
      })}
    </svg>
  );
}
