import { useState } from 'react';
import { Frame } from 'lucide-react';
import { useApp } from '../../state/AppContext';

/* Frame-line composer — overlay delivery aspect ratios on the sensor frame.
   Tom's pre-shoot framing tool. The sensor is 16:9 (most digital cinema cams).
   Frame lines show what crops *to* and *out* in delivery — so framing in-camera
   leaves room for safe action and title-safe zones. */

interface AspectOption {
  key: string;
  label: string;
  ratio: number;          // width / height
  use: string;
  tone: string;           // hex stroke color
}

const ASPECTS: AspectOption[] = [
  {
    key: 'cinemascope',
    label: '2.39 : 1',
    ratio: 2.39,
    use: 'Cinematic anamorphic — feature/festival theatrical',
    tone: '#C9A961',
  },
  {
    key: 'feature',
    label: '1.85 : 1',
    ratio: 1.85,
    use: 'Feature-spec — a softer cinema crop, retains more headroom',
    tone: '#A8884A',
  },
  {
    key: 'broadcast',
    label: '16 : 9',
    ratio: 16 / 9,
    use: 'Broadcast & streaming default — HRT, ARTE, BBC, Apple, Netflix',
    tone: '#788064',
  },
  {
    key: 'square',
    label: '1 : 1',
    ratio: 1,
    use: 'Social square — IG feed, FB, archival',
    tone: '#5B5950',
  },
  {
    key: 'vertical',
    label: '9 : 16',
    ratio: 9 / 16,
    use: 'Vertical social — IG Reels, TikTok, YouTube Shorts',
    tone: '#C26A4A',
  },
];

/* The sensor frame is always 16:9 — it's what the camera records natively. */
const SENSOR_RATIO = 16 / 9;
const SENSOR_W = 640;     // SVG canvas width
const SENSOR_H = SENSOR_W / SENSOR_RATIO;

export function FrameLineComposer() {
  const { state } = useApp();
  const [activeAspects, setActiveAspects] = useState<string[]>(['cinemascope', 'broadcast']);
  const [selectedEp, setSelectedEp] = useState<string>('general');
  const [showActionSafe, setShowActionSafe] = useState(true);
  const [showTitleSafe, setShowTitleSafe] = useState(true);
  const [showThirds, setShowThirds] = useState(true);
  const [showCenter, setShowCenter] = useState(true);

  function toggleAspect(key: string) {
    setActiveAspects((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  /* Compute the inset rect for each aspect ratio, centered on sensor */
  function frameRect(ratio: number) {
    /* If frame is wider than sensor → fit to width, crop vertically */
    if (ratio >= SENSOR_RATIO) {
      const w = SENSOR_W;
      const h = SENSOR_W / ratio;
      const x = 0;
      const y = (SENSOR_H - h) / 2;
      return { x, y, w, h };
    }
    /* If frame is narrower → fit to height, crop horizontally */
    const h = SENSOR_H;
    const w = SENSOR_H * ratio;
    const y = 0;
    const x = (SENSOR_W - w) / 2;
    return { x, y, w, h };
  }

  return (
    <section>
      <header className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] flex items-baseline gap-2">
            <Frame size={16} className="text-[color:var(--color-brass-deep)]" />
            Frame-line composer
          </h3>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Overlay delivery aspect ratios on the 16:9 sensor — leaves no surprises in post.
          </p>
        </div>
        <select
          value={selectedEp}
          onChange={(e) => setSelectedEp(e.target.value)}
          className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[13px] text-[color:var(--color-on-paper)] py-0.5"
        >
          <option value="general">All episodes</option>
          {state.episodes.map((ep) => (
            <option key={ep.id} value={ep.id}>
              Ep {ep.number} · {ep.title}
            </option>
          ))}
        </select>
      </header>

      {/* Aspect-ratio toggles */}
      <div className="flex items-baseline flex-wrap gap-2 mb-4">
        <span className="label-caps text-[color:var(--color-on-paper-faint)] mr-1">
          frame lines
        </span>
        {ASPECTS.map((a) => {
          const active = activeAspects.includes(a.key);
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => toggleAspect(a.key)}
              className={`label-caps tracking-[0.10em] text-[10px] px-2.5 py-1 rounded-[2px] transition-colors border-[0.5px] ${
                active
                  ? 'text-[color:var(--color-on-paper)] border-transparent'
                  : 'text-[color:var(--color-on-paper-faint)] border-[color:var(--color-border-paper)] hover:text-[color:var(--color-on-paper-muted)]'
              }`}
              style={{
                background: active ? `${a.tone}25` : undefined,
                borderColor: active ? a.tone : undefined,
              }}
            >
              {a.label}
            </button>
          );
        })}
      </div>

      {/* Guide toggles */}
      <div className="flex items-baseline flex-wrap gap-3 mb-4">
        <span className="label-caps text-[color:var(--color-on-paper-faint)] mr-1">
          guides
        </span>
        <Toggle label="Action safe (90%)" on={showActionSafe} onChange={setShowActionSafe} />
        <Toggle label="Title safe (80%)" on={showTitleSafe} onChange={setShowTitleSafe} />
        <Toggle label="Rule of thirds" on={showThirds} onChange={setShowThirds} />
        <Toggle label="Center cross" on={showCenter} onChange={setShowCenter} />
      </div>

      {/* SVG canvas */}
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-6 inline-block">
        <svg
          width={SENSOR_W}
          height={SENSOR_H}
          viewBox={`0 0 ${SENSOR_W} ${SENSOR_H}`}
          className="block"
          style={{ background: '#0E1E36' }}
        >
          {/* Sensor frame label */}
          <text
            x={8}
            y={16}
            fill="rgba(244,241,234,0.55)"
            fontSize={9}
            fontFamily="var(--font-sans)"
            letterSpacing="0.10em"
          >
            SENSOR · 16 : 9
          </text>

          {/* Sensor border */}
          <rect
            x={0.5}
            y={0.5}
            width={SENSOR_W - 1}
            height={SENSOR_H - 1}
            fill="none"
            stroke="rgba(244,241,234,0.35)"
            strokeWidth={1}
          />

          {/* Action safe (90%) */}
          {showActionSafe && (
            <rect
              x={SENSOR_W * 0.05}
              y={SENSOR_H * 0.05}
              width={SENSOR_W * 0.9}
              height={SENSOR_H * 0.9}
              fill="none"
              stroke="rgba(244,241,234,0.30)"
              strokeWidth={0.5}
              strokeDasharray="4 4"
            />
          )}

          {/* Title safe (80%) */}
          {showTitleSafe && (
            <rect
              x={SENSOR_W * 0.1}
              y={SENSOR_H * 0.1}
              width={SENSOR_W * 0.8}
              height={SENSOR_H * 0.8}
              fill="none"
              stroke="rgba(244,241,234,0.20)"
              strokeWidth={0.5}
              strokeDasharray="2 4"
            />
          )}

          {/* Rule of thirds */}
          {showThirds && (
            <g stroke="rgba(244,241,234,0.18)" strokeWidth={0.5} strokeDasharray="2 3">
              <line x1={SENSOR_W / 3} y1={0} x2={SENSOR_W / 3} y2={SENSOR_H} />
              <line x1={(SENSOR_W * 2) / 3} y1={0} x2={(SENSOR_W * 2) / 3} y2={SENSOR_H} />
              <line x1={0} y1={SENSOR_H / 3} x2={SENSOR_W} y2={SENSOR_H / 3} />
              <line x1={0} y1={(SENSOR_H * 2) / 3} x2={SENSOR_W} y2={(SENSOR_H * 2) / 3} />
            </g>
          )}

          {/* Center cross */}
          {showCenter && (
            <g stroke="rgba(201,169,97,0.55)" strokeWidth={0.75}>
              <line
                x1={SENSOR_W / 2 - 8}
                y1={SENSOR_H / 2}
                x2={SENSOR_W / 2 + 8}
                y2={SENSOR_H / 2}
              />
              <line
                x1={SENSOR_W / 2}
                y1={SENSOR_H / 2 - 8}
                x2={SENSOR_W / 2}
                y2={SENSOR_H / 2 + 8}
              />
            </g>
          )}

          {/* Active frame lines */}
          {ASPECTS.filter((a) => activeAspects.includes(a.key)).map((a) => {
            const r = frameRect(a.ratio);
            return (
              <g key={a.key}>
                {/* Outer dim mask: parts of sensor outside this frame */}
                <rect
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.h}
                  fill="none"
                  stroke={a.tone}
                  strokeWidth={1.25}
                />
                <text
                  x={r.x + 6}
                  y={r.y + 14}
                  fill={a.tone}
                  fontSize={10}
                  fontFamily="var(--font-sans)"
                  letterSpacing="0.10em"
                >
                  {a.label.replace(' ', '')}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Aspect detail strip */}
      <ul className="grid grid-cols-2 gap-2 mt-4 max-w-[800px]">
        {ASPECTS.filter((a) => activeAspects.includes(a.key)).map((a) => (
          <li
            key={a.key}
            className="bg-[color:var(--color-paper-light)] border-l-2 px-4 py-2"
            style={{ borderColor: a.tone }}
          >
            <div className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums">
              {a.label}
            </div>
            <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] leading-relaxed">
              {a.use}
            </div>
          </li>
        ))}
      </ul>

      <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] mt-4 leading-relaxed max-w-[800px]">
        Frame-in-camera with the widest active line in mind. Action-safe at 90% leaves edge
        margin for any potential broadcast crop; title-safe at 80% guarantees readability of
        any text overlays. Always review framing on the camera's monitor with frame lines
        burned in — both ARRI Alexa 35 and Sony FX cameras support custom frame guides.
      </p>
    </section>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`flex items-baseline gap-1.5 prose-body italic text-[12px] transition-colors ${
        on
          ? 'text-[color:var(--color-on-paper)]'
          : 'text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-on-paper-muted)]'
      }`}
    >
      <span
        className={`inline-block w-3 h-3 rounded-[2px] border-[0.5px] ${
          on
            ? 'bg-[color:var(--color-brass)] border-[color:var(--color-brass)]'
            : 'border-[color:var(--color-border-paper-strong)]'
        }`}
      />
      {label}
    </button>
  );
}
