import { useMemo, useState } from 'react';
import { Aperture, Sparkles, Wand2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { AntiScriptMoment, DOPKitItem } from '../../types';
import { EditableText } from '../primitives/EditableText';

/* Per-beat Lens Prescription — every beat in every episode gets a recommended
   lens with reasoning. Tom curates his vocabulary; new crew gets a brief
   on "what Tom would reach for."

   Pre-fills smart defaults from beat title keywords (interview → 75mm,
   wide establish → 24mm, etc.). Tom can override per beat. */

/* Heuristic: keyword → lens-character profile match */
interface LensRule {
  keywords: string[];
  prefersFocal: 'wide' | 'normal' | 'tele' | 'macro';
  prefersCharacter: 'warm-soft' | 'warm-sharp' | 'cool-soft' | 'cool-sharp' | 'any';
  reasoning: string;
}

const LENS_RULES: LensRule[] = [
  {
    keywords: ['interview', 'elder', 'portrait', 'face', 'talking head'],
    prefersFocal: 'tele',
    prefersCharacter: 'warm-soft',
    reasoning: 'Compression flatters the face; warm-soft falloff for skin tones.',
  },
  {
    keywords: ['establish', 'establishing', 'wide', 'vista', 'landscape', 'sweeping'],
    prefersFocal: 'wide',
    prefersCharacter: 'cool-sharp',
    reasoning: 'Wide angle for scale; sharper character holds detail at distance.',
  },
  {
    keywords: ['hands', 'detail', 'close', 'fish in hand', 'rope', 'knot', 'macro'],
    prefersFocal: 'macro',
    prefersCharacter: 'warm-sharp',
    reasoning: 'Close-focus capability needed; sharp lens reveals texture, warmth keeps it tactile.',
  },
  {
    keywords: ['catch', 'haul', 'net', 'fishing', 'action', 'spear'],
    prefersFocal: 'normal',
    prefersCharacter: 'any',
    reasoning: 'Versatile focal length; lens character secondary to operator agility.',
  },
  {
    keywords: ['meal', 'wine', 'food', 'plate', 'cooking'],
    prefersFocal: 'normal',
    prefersCharacter: 'warm-soft',
    reasoning: 'Standard focal for food framing; warm-soft for the convivial register.',
  },
  {
    keywords: ['sunset', 'sunrise', 'golden hour', 'magic hour', 'dawn', 'dusk'],
    prefersFocal: 'wide',
    prefersCharacter: 'warm-sharp',
    reasoning: 'Wide for the sky; warm character lifts the golden register.',
  },
  {
    keywords: ['klapa', 'singing', 'song', 'verse', 'recitation'],
    prefersFocal: 'normal',
    prefersCharacter: 'warm-soft',
    reasoning: 'Standard focal for ensemble framing; soft character for the lyric mood.',
  },
  {
    keywords: ['homecoming', 'arrival', 'mooring', 'departure'],
    prefersFocal: 'wide',
    prefersCharacter: 'warm-sharp',
    reasoning: 'Wide context shot of boat + harbor; sharp for the geometry of port.',
  },
  {
    keywords: ['observational', 'silent', 'pillow', 'quiet'],
    prefersFocal: 'normal',
    prefersCharacter: 'warm-soft',
    reasoning: 'Standard focal for unobtrusive observation; soft character for atmosphere.',
  },
  {
    keywords: ['dream', 'memory', 'flashback', 'reverie', 'meditation'],
    prefersFocal: 'tele',
    prefersCharacter: 'warm-soft',
    reasoning: 'Long lens compresses for dream-like flatness; warm-soft for nostalgia.',
  },
];

interface LensCharacter {
  warmth: number;
  sharpness: number;
}

function getLensCharacter(lens: DOPKitItem): LensCharacter {
  return {
    warmth: lens.lensWarmth ?? 0,
    sharpness: lens.lensSharpness ?? 6,
  };
}

function getFocalCategory(label: string): 'wide' | 'normal' | 'tele' | 'macro' | 'unknown' {
  /* Extract first number from label (e.g., "Cooke S4i 32mm" → 32) */
  const match = label.match(/(\d+)\s*mm/i);
  if (!match) return 'unknown';
  const mm = parseInt(match[1], 10);
  if (label.toLowerCase().includes('macro')) return 'macro';
  if (mm <= 28) return 'wide';
  if (mm <= 60) return 'normal';
  return 'tele';
}

function characterMatch(lens: LensCharacter, target: LensRule['prefersCharacter']): number {
  if (target === 'any') return 0.5;
  let score = 0;
  if (target.includes('warm') && lens.warmth >= 1) score += 0.5;
  if (target.includes('cool') && lens.warmth <= -1) score += 0.5;
  if (target.includes('soft') && lens.sharpness <= 6) score += 0.5;
  if (target.includes('sharp') && lens.sharpness >= 6) score += 0.5;
  return score;
}

function recommendLensForBeat(
  beat: AntiScriptMoment,
  lenses: DOPKitItem[]
): { lens: DOPKitItem | null; reasoning: string; ruleMatched: LensRule | null } {
  const text = `${beat.title} ${beat.what} ${beat.who} ${beat.where}`.toLowerCase();
  /* Find first matching rule */
  const matchedRule = LENS_RULES.find((r) =>
    r.keywords.some((kw) => text.includes(kw))
  );

  if (!matchedRule || lenses.length === 0) {
    return { lens: lenses[0] ?? null, reasoning: 'No specific match — defaulting to first lens.', ruleMatched: null };
  }

  /* Score each lens */
  const scored = lenses.map((l) => {
    const focal = getFocalCategory(l.label);
    const focalScore = focal === matchedRule.prefersFocal ? 1 : 0;
    const charScore = characterMatch(getLensCharacter(l), matchedRule.prefersCharacter);
    return { lens: l, score: focalScore + charScore };
  });
  scored.sort((a, b) => b.score - a.score);

  return {
    lens: scored[0]?.lens ?? lenses[0],
    reasoning: matchedRule.reasoning,
    ruleMatched: matchedRule,
  };
}

export function PerBeatLensPrescription() {
  const { state, dispatch } = useApp();
  const lenses = state.dopKit.filter((k) => k.category === 'lens');
  const [selectedEpId, setSelectedEpId] = useState<string>(
    state.episodes[0]?.id ?? ''
  );

  const beats = useMemo(
    () =>
      state.antiScriptMoments
        .filter((b) => b.episodeId === selectedEpId)
        .sort((a, b) => a.orderIdx - b.orderIdx),
    [state.antiScriptMoments, selectedEpId]
  );

  /* For each beat, derive recommendation OR use Tom's override */
  const beatsWithRec = useMemo(() => {
    return beats.map((b) => {
      if (b.recommendedLensId) {
        const lens = lenses.find((l) => l.id === b.recommendedLensId);
        return {
          beat: b,
          lens,
          reasoning: b.lensReasoning ?? 'Tom-set override',
          isOverride: true,
        };
      }
      const rec = recommendLensForBeat(b, lenses);
      return {
        beat: b,
        lens: rec.lens,
        reasoning: rec.reasoning,
        isOverride: false,
      };
    });
  }, [beats, lenses]);

  function setOverride(beatId: string, lensId: string) {
    dispatch({
      type: 'UPDATE_ANTI_SCRIPT',
      id: beatId,
      patch: { recommendedLensId: lensId || undefined },
    });
  }

  function clearOverride(beatId: string) {
    dispatch({
      type: 'UPDATE_ANTI_SCRIPT',
      id: beatId,
      patch: { recommendedLensId: undefined, lensReasoning: undefined },
    });
  }

  function setReasoning(beatId: string, reasoning: string) {
    dispatch({
      type: 'UPDATE_ANTI_SCRIPT',
      id: beatId,
      patch: { lensReasoning: reasoning || undefined },
    });
  }

  if (lenses.length === 0) {
    return (
      <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
        Add lenses on the Kit tab to enable per-beat prescription.
      </p>
    );
  }

  /* Roll-up: how many beats have explicit overrides vs derived */
  const totalBeats = beatsWithRec.length;
  const overriddenCount = beatsWithRec.filter((b) => b.isOverride).length;

  return (
    <section>
      <header className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] flex items-baseline gap-2">
            <Wand2 size={16} className="text-[color:var(--color-brass-deep)]" />
            Per-beat lens prescription
          </h3>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Every beat gets a recommended lens with reasoning. Smart defaults from
            keyword analysis · Tom can override per beat.
          </p>
        </div>
        <select
          value={selectedEpId}
          onChange={(e) => setSelectedEpId(e.target.value)}
          className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none prose-body italic text-[14px] text-[color:var(--color-on-paper)] py-0.5"
        >
          {state.episodes.map((ep) => (
            <option key={ep.id} value={ep.id}>
              Ep {ep.number} · {ep.title}
            </option>
          ))}
        </select>
      </header>

      {/* Roll-up */}
      {totalBeats > 0 && (
        <div className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mb-3 tabular-nums">
          {totalBeats} beats · {overriddenCount} Tom-set · {totalBeats - overriddenCount} auto-derived
        </div>
      )}

      {beatsWithRec.length === 0 ? (
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)] bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-5 py-10 text-center">
          No beats in this episode yet. Add anti-script moments in Episodes view.
        </p>
      ) : (
        <ul className="space-y-2">
          {beatsWithRec.map(({ beat, lens, reasoning, isOverride }) => (
            <li
              key={beat.id}
              className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4 md:gap-5"
            >
              {/* Beat */}
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="display-italic text-[15px] text-[color:var(--color-on-paper)]">
                    {beat.title}
                  </span>
                  {beat.expectedDurationMin && (
                    <span className="prose-body italic text-[10px] text-[color:var(--color-brass-deep)] tabular-nums">
                      ~{beat.expectedDurationMin}m
                    </span>
                  )}
                  <span className="label-caps tracking-[0.10em] text-[9px] text-[color:var(--color-on-paper-faint)]">
                    {beat.status}
                  </span>
                </div>
                {beat.what && (
                  <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] leading-relaxed mt-1">
                    {beat.what}
                  </p>
                )}
                {(beat.who || beat.where) && (
                  <div className="flex items-baseline gap-3 mt-1.5 prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)]">
                    {beat.who && <span>· who: {beat.who}</span>}
                    {beat.where && <span>· where: {beat.where}</span>}
                  </div>
                )}
              </div>

              {/* Recommendation */}
              <aside
                className="border-l-2 pl-4"
                style={{
                  borderColor: isOverride
                    ? 'var(--color-brass)'
                    : 'rgba(201,169,97,0.40)',
                }}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="label-caps text-[color:var(--color-brass-deep)] flex items-baseline gap-1">
                    <Aperture size={10} />
                    {isOverride ? 'tom-set' : 'recommend'}
                  </span>
                  {isOverride && (
                    <button
                      type="button"
                      onClick={() => clearOverride(beat.id)}
                      className="label-caps text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)] text-[9px]"
                    >
                      reset
                    </button>
                  )}
                </div>
                <select
                  value={beat.recommendedLensId ?? lens?.id ?? ''}
                  onChange={(e) => setOverride(beat.id, e.target.value)}
                  className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper)] focus:border-[color:var(--color-brass)] outline-none display-italic text-[14px] text-[color:var(--color-on-paper)] py-0.5"
                >
                  <option value="">— pick lens —</option>
                  {lenses.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
                {isOverride ? (
                  <EditableText
                    value={beat.lensReasoning ?? ''}
                    onChange={(v) => setReasoning(beat.id, v)}
                    placeholder="Tom's reasoning for this lens choice…"
                    multiline
                    rows={2}
                    className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] block w-full mt-1.5 leading-relaxed"
                  />
                ) : (
                  <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-1.5 leading-relaxed flex items-baseline gap-1">
                    <Sparkles
                      size={9}
                      className="text-[color:var(--color-brass-deep)] shrink-0 translate-y-[1px]"
                    />
                    {reasoning}
                  </p>
                )}
              </aside>
            </li>
          ))}
        </ul>
      )}

      <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] mt-4 leading-relaxed max-w-[800px]">
        Auto-recommendations match beat keywords ("interview", "establish", "hands", etc.)
        against lens focal-length category + character profile from the Lens Matrix.
        Tom-set overrides save to the beat permanently.
      </p>
    </section>
  );
}
