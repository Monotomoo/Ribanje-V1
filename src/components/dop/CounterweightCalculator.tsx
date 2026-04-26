import { useMemo, useState } from 'react';
import { Scale, Sparkles } from 'lucide-react';
import { useApp } from '../../state/AppContext';

/* Trinity Counterweight Calculator — input camera + lens + accessories,
   computes recommended Trinity counterweight (front + rear) and bias-axis
   trim. Saves the trial-and-error rebalance time after every lens swap.

   Trinity uses a 4-axis movement with center of gravity behind the camera.
   Heavier camera/lens = more counterweight at the rear. The math here is
   approximate — Trinity arms have ~45cm leverage front-to-rear pivot,
   but real-world it's about matching head moment with rear moment. */

interface KitWeight {
  id: string;
  label: string;
  weightKg: number;
  /* Distance from pivot in cm (positive = front, negative = rear) */
  positionCm: number;
}

const ACCESSORY_PRESETS: { label: string; weightKg: number; positionCm: number }[] = [
  { label: 'Mattebox (3-stage)',          weightKg: 1.2, positionCm: 35 },
  { label: 'Follow focus (manual)',       weightKg: 0.6, positionCm: 25 },
  { label: 'Wireless follow focus',       weightKg: 1.4, positionCm: 25 },
  { label: 'On-board monitor (5")',       weightKg: 0.6, positionCm: 22 },
  { label: 'On-board monitor (7")',       weightKg: 1.1, positionCm: 22 },
  { label: 'V-mount battery (150Wh)',     weightKg: 1.4, positionCm: -18 },
  { label: 'V-mount battery (98Wh)',      weightKg: 0.9, positionCm: -18 },
  { label: 'Wireless TX',                 weightKg: 0.4, positionCm: -10 },
  { label: 'Audio recorder bag',          weightKg: 1.5, positionCm: -22 },
  { label: 'Top handle',                  weightKg: 0.3, positionCm: 12 },
];

/* Trinity arm lengths and physics */
const TRINITY_PIVOT_CM = 30;          // approx pivot point from front of head
const TRINITY_ARM_BACK_CM = 35;       // counterweight rod length

export function CounterweightCalculator() {
  const { state } = useApp();
  const cameras = state.dopKit.filter((k) => k.category === 'camera');
  const lenses = state.dopKit.filter((k) => k.category === 'lens');

  const [selectedCameraId, setSelectedCameraId] = useState<string>(
    cameras[0]?.id ?? ''
  );
  const [selectedLensId, setSelectedLensId] = useState<string>(
    lenses[0]?.id ?? ''
  );
  const [accessories, setAccessories] = useState<KitWeight[]>([]);

  function addAccessory(preset: { label: string; weightKg: number; positionCm: number }) {
    setAccessories([
      ...accessories,
      {
        id: `acc-${Date.now()}-${Math.random()}`,
        label: preset.label,
        weightKg: preset.weightKg,
        positionCm: preset.positionCm,
      },
    ]);
  }

  function removeAccessory(id: string) {
    setAccessories(accessories.filter((a) => a.id !== id));
  }

  const cam = cameras.find((c) => c.id === selectedCameraId);
  const lens = lenses.find((l) => l.id === selectedLensId);

  /* Compute moments. Camera body sits at pivot+5cm typically.
     Lens position depends on lens length — approximate 18cm front-of-pivot. */
  const computation = useMemo(() => {
    const camWeight = cam?.weightKg ?? 0;
    const camPos = 5; // 5cm front of pivot
    const lensWeight = lens?.weightKg ?? 0;
    const lensPos = 18; // 18cm front of pivot

    /* Total moment (kg·cm) — front positive, rear negative */
    let totalMoment = camWeight * camPos + lensWeight * lensPos;
    let totalWeight = camWeight + lensWeight;

    for (const a of accessories) {
      totalMoment += a.weightKg * a.positionCm;
      totalWeight += a.weightKg;
    }

    /* Required counterweight to balance: place at rear arm (-35cm) */
    const requiredCounterweightKg = -totalMoment / TRINITY_ARM_BACK_CM;
    /* Negative = need rear weight, positive = need front weight (impossible normally) */
    const recommendedRearWeight = Math.max(0, -requiredCounterweightKg);

    /* Bias-axis trim suggestion based on imbalance magnitude */
    const moment = Math.abs(totalMoment);
    const trimGuidance =
      moment < 3 ? 'Negligible · centerline trim'
      : moment < 8 ? 'Mild front-heavy · 1–2 turns rear bias'
      : moment < 20 ? 'Front-heavy · 3–4 turns rear bias'
      : 'Significant front weight · adjust counterweight rod position + bias';

    return {
      totalWeight,
      totalMoment,
      requiredCounterweightKg: Math.abs(requiredCounterweightKg),
      recommendedRearWeight,
      trimGuidance,
      camWeight,
      camPos,
      lensWeight,
      lensPos,
    };
  }, [cam, lens, accessories]);

  /* Total weight Trinity needs to support — if > Trinity rated capacity (~25kg), warn */
  const TRINITY_CAPACITY_KG = 25;
  const overloaded = computation.totalWeight + computation.recommendedRearWeight > TRINITY_CAPACITY_KG;

  return (
    <section className="space-y-7 max-w-[1200px]">
      <header className="flex items-start gap-5">
        <div className="w-12 h-12 rounded-full bg-[color:var(--color-paper-deep)]/40 flex items-center justify-center shrink-0">
          <Scale size={20} className="text-[color:var(--color-brass-deep)]" />
        </div>
        <div className="flex-1">
          <h2 className="display-italic text-[28px] text-[color:var(--color-on-paper)] leading-tight">
            Counterweight calculator
          </h2>
          <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mt-1.5 leading-relaxed">
            Pick camera + lens + accessories. Computes Trinity rear counterweight and
            bias-axis guidance. Saves 20 minutes of trial-and-error after every lens swap.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[1fr_400px] gap-6">
        {/* Inputs */}
        <div className="space-y-5">
          <Section label="Camera">
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[14px] text-[color:var(--color-on-paper)] py-1"
            >
              <option value="">— pick camera —</option>
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                  {c.weightKg ? ` · ${c.weightKg}kg` : ''}
                </option>
              ))}
            </select>
            {cam && cam.weightKg === undefined && (
              <p className="prose-body italic text-[11px] text-[color:var(--color-coral-deep)] mt-1">
                ⚠ no weight set — fill in Kit tab for accuracy
              </p>
            )}
          </Section>

          <Section label="Lens">
            <select
              value={selectedLensId}
              onChange={(e) => setSelectedLensId(e.target.value)}
              className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[14px] text-[color:var(--color-on-paper)] py-1"
            >
              <option value="">— pick lens —</option>
              {lenses.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                  {l.weightKg ? ` · ${l.weightKg}kg` : ''}
                </option>
              ))}
            </select>
            {lens && lens.weightKg === undefined && (
              <p className="prose-body italic text-[11px] text-[color:var(--color-coral-deep)] mt-1">
                ⚠ no weight set — fill in Kit tab
              </p>
            )}
          </Section>

          <Section label={`Accessories (${accessories.length})`}>
            {accessories.length > 0 && (
              <ul className="space-y-1.5 mb-3">
                {accessories.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-baseline gap-2 bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] px-3 py-1.5"
                  >
                    <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] flex-1 truncate">
                      {a.label}
                    </span>
                    <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums">
                      {a.weightKg.toFixed(2)}kg
                    </span>
                    <span className="prose-body italic text-[10px] text-[color:var(--color-brass-deep)] tabular-nums">
                      {a.positionCm > 0 ? '+' : ''}{a.positionCm}cm
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAccessory(a.id)}
                      className="text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] label-caps text-[10px]"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-baseline flex-wrap gap-1.5">
              {ACCESSORY_PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => addAccessory(p)}
                  className="label-caps tracking-[0.10em] text-[10px] text-[color:var(--color-on-paper-muted)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-paper)] hover:border-[color:var(--color-brass)] rounded-[2px] px-2 py-1 transition-colors"
                >
                  + {p.label}
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* Output */}
        <aside className="space-y-3">
          <div
            className={`bg-[color:var(--color-paper-light)] border-l-2 px-5 py-4 ${
              overloaded
                ? 'border-[color:var(--color-coral-deep)]'
                : 'border-[color:var(--color-brass)]'
            }`}
          >
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-3 flex items-baseline gap-1.5">
              <Sparkles size={11} />
              recommendation
            </div>

            <ResultRow
              label="Total head weight"
              value={`${computation.totalWeight.toFixed(2)} kg`}
              hint={
                overloaded
                  ? `+ ${computation.recommendedRearWeight.toFixed(1)}kg rear = ${(computation.totalWeight + computation.recommendedRearWeight).toFixed(1)}kg total · OVER 25kg limit`
                  : 'cam + lens + accessories'
              }
              tone={overloaded ? 'coral' : undefined}
            />

            <ResultRow
              label="Front moment"
              value={`${computation.totalMoment.toFixed(1)} kg·cm`}
              hint="(positive = front-heavy)"
            />

            <div className="border-t-[0.5px] border-[color:var(--color-border-paper)] pt-3 mt-3">
              <ResultRow
                label="Rear counterweight"
                value={`${computation.recommendedRearWeight.toFixed(2)} kg`}
                hint={`at ${TRINITY_ARM_BACK_CM}cm rear arm position`}
                tone="brass-emphasis"
              />
            </div>

            <div className="border-t-[0.5px] border-[color:var(--color-border-paper)] pt-3 mt-3">
              <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                bias trim
              </div>
              <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] leading-relaxed">
                {computation.trimGuidance}
              </p>
            </div>
          </div>

          {/* Visualizer */}
          <BalanceVisual
            frontMoment={computation.totalMoment}
            rearWeight={computation.recommendedRearWeight}
          />

          {/* Math rationale */}
          <details className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-3">
            <summary className="cursor-pointer label-caps text-[color:var(--color-brass-deep)]">
              show math
            </summary>
            <div className="mt-2 prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] leading-relaxed space-y-1">
              <p>
                Camera at pivot+{computation.camPos}cm × {computation.camWeight.toFixed(2)}kg
                ={' '}
                {(computation.camWeight * computation.camPos).toFixed(1)} kg·cm
              </p>
              <p>
                Lens at pivot+{computation.lensPos}cm × {computation.lensWeight.toFixed(2)}kg
                ={' '}
                {(computation.lensWeight * computation.lensPos).toFixed(1)} kg·cm
              </p>
              {accessories.map((a) => (
                <p key={a.id}>
                  {a.label} at {a.positionCm > 0 ? '+' : ''}{a.positionCm}cm × {a.weightKg.toFixed(2)}kg
                  = {(a.weightKg * a.positionCm).toFixed(1)} kg·cm
                </p>
              ))}
              <p className="pt-1 border-t-[0.5px] border-[color:var(--color-border-paper)] text-[color:var(--color-on-paper)]">
                Σ moment = {computation.totalMoment.toFixed(1)} kg·cm · counterweight ={' '}
                {computation.totalMoment.toFixed(1)} ÷ {TRINITY_ARM_BACK_CM} ={' '}
                {computation.recommendedRearWeight.toFixed(2)} kg
              </p>
            </div>
          </details>
        </aside>
      </div>
    </section>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">{label}</div>
      {children}
    </div>
  );
}

function ResultRow({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'coral' | 'brass-emphasis';
}) {
  const valueClass =
    tone === 'coral'
      ? 'text-[color:var(--color-coral-deep)]'
      : tone === 'brass-emphasis'
      ? 'text-[color:var(--color-brass-deep)] text-[20px]'
      : 'text-[color:var(--color-on-paper)]';
  return (
    <div className="mb-2">
      <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mb-0.5">
        {label}
      </div>
      <div className={`display-italic text-[16px] tabular-nums leading-tight ${valueClass}`}>
        {value}
      </div>
      {hint && (
        <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] leading-tight">
          {hint}
        </div>
      )}
    </div>
  );
}

function BalanceVisual({
  frontMoment,
  rearWeight,
}: {
  frontMoment: number;
  rearWeight: number;
}) {
  const W = 320;
  const H = 100;
  const cx = W / 2;
  const cy = H / 2 + 6;
  const armLen = 100;

  /* Tilt angle based on imbalance (small visual exaggeration) */
  const tilt = Math.max(-12, Math.min(12, (frontMoment - rearWeight * TRINITY_ARM_BACK_CM) * 0.08));

  return (
    <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-4 py-3">
      <div className="label-caps text-[color:var(--color-brass-deep)] mb-2">
        balance preview
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Stand */}
        <line x1={cx} y1={cy} x2={cx} y2={cy + 18} stroke="rgba(14,30,54,0.5)" strokeWidth={2} />
        <circle cx={cx} cy={cy + 22} r={3} fill="rgba(14,30,54,0.6)" />

        {/* Arm — tilted by imbalance */}
        <g transform={`rotate(${tilt} ${cx} ${cy})`}>
          {/* Arm */}
          <line
            x1={cx - armLen}
            y1={cy}
            x2={cx + armLen}
            y2={cy}
            stroke="rgba(14,30,54,0.7)"
            strokeWidth={2.5}
          />
          {/* Camera (front) */}
          <rect
            x={cx + 70}
            y={cy - 10}
            width={28}
            height={20}
            fill="rgba(14,30,54,0.7)"
            rx={2}
          />
          <text
            x={cx + 84}
            y={cy + 30}
            textAnchor="middle"
            fontSize={9}
            fontFamily="var(--font-sans)"
            letterSpacing="0.10em"
            fill="rgba(14,30,54,0.55)"
          >
            CAM
          </text>
          {/* Counterweight (rear) */}
          {rearWeight > 0.05 && (
            <>
              <circle
                cx={cx - 70}
                cy={cy}
                r={Math.min(8 + rearWeight * 1.5, 16)}
                fill="rgba(201,169,97,0.85)"
              />
              <text
                x={cx - 70}
                y={cy + 30}
                textAnchor="middle"
                fontSize={9}
                fontFamily="var(--font-sans)"
                letterSpacing="0.10em"
                fill="rgba(168,136,74,0.85)"
              >
                {rearWeight.toFixed(1)}kg
              </text>
            </>
          )}
        </g>
      </svg>
      <p className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] mt-1 leading-tight">
        Tilt angle approximates imbalance · brass disc = recommended counterweight
      </p>
    </div>
  );
}
