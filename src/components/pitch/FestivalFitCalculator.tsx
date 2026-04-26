import { useState } from 'react';
import { Crosshair, Trophy } from 'lucide-react';
import type { FestivalSubmission } from '../../types';

interface FitCriterion {
  key: keyof FitScores;
  label: string;
  hint: string;
}

interface FitScores {
  programming: number;       // 1-5
  territory: number;
  timing: number;
  prestige: number;
  access: number;
}

const CRITERIA: FitCriterion[] = [
  {
    key: 'programming',
    label: 'Programming fit',
    hint: 'Curatorial — does this festival\'s slate match the show\'s tone?',
  },
  {
    key: 'territory',
    label: 'Territory fit',
    hint: 'Does the festival\'s reach match what we want to amplify?',
  },
  {
    key: 'timing',
    label: 'Timing fit',
    hint: 'Can we deliver before the deadline + against the festival rhythm?',
  },
  {
    key: 'prestige',
    label: 'Prestige fit',
    hint: 'Does the festival\'s brand level match the show\'s level?',
  },
  {
    key: 'access',
    label: 'Access',
    hint: 'Do we have a contact / reasonable shot at programming?',
  },
];

interface Props {
  festival: FestivalSubmission;
}

/* Festival fit calculator — score a festival on 5 criteria, see weighted total.
   Scores live on the Festival's existing `fitStars` field as the average; per-criterion
   scores are session-only since this is a thinking tool, not persisted state. */
export function FestivalFitCalculator({ festival }: Props) {
  /* Initialize all from the existing fitScore (1-5 average). */
  const initial = festival.fitScore ?? 3;
  const [scores, setScores] = useState<FitScores>({
    programming: initial,
    territory: initial,
    timing: initial,
    prestige: initial,
    access: initial,
  });

  const total = (Object.values(scores) as number[]).reduce((s, n) => s + n, 0);
  const max = CRITERIA.length * 5;
  const pct = (total / max) * 100;
  const verdict =
    pct >= 85
      ? { tone: 'success', label: 'submit · go to wall' }
      : pct >= 65
      ? { tone: 'brass', label: 'submit · solid candidate' }
      : pct >= 45
      ? { tone: 'warn', label: 'consider · weigh fee vs. fit' }
      : { tone: 'coral', label: 'pass · low ROI' };

  const verdictColor =
    verdict.tone === 'success'
      ? 'text-[color:var(--color-success)]'
      : verdict.tone === 'brass'
      ? 'text-[color:var(--color-brass-deep)]'
      : verdict.tone === 'warn'
      ? 'text-[color:var(--color-warn)]'
      : 'text-[color:var(--color-coral-deep)]';

  return (
    <section className="bg-[color:var(--color-paper)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-5 py-4">
      <header className="flex items-baseline justify-between mb-4">
        <div className="flex items-baseline gap-2">
          <Crosshair size={11} className="text-[color:var(--color-brass-deep)]" />
          <h4 className="display-italic text-[16px] text-[color:var(--color-on-paper)]">
            Fit calculator
          </h4>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="display-italic text-[24px] text-[color:var(--color-on-paper)] tabular-nums">
            {total}
            <span className="text-[color:var(--color-on-paper-muted)] text-[14px] ml-1">/ {max}</span>
          </span>
          <span className={`label-caps tracking-[0.12em] text-[10px] ${verdictColor}`}>
            <Trophy size={9} className="inline -mt-0.5 mr-1" />
            {verdict.label}
          </span>
        </div>
      </header>

      <ul className="space-y-2.5">
        {CRITERIA.map((c) => (
          <li key={c.key} className="grid grid-cols-[140px_1fr_140px] items-center gap-4">
            <div>
              <div className="display-italic text-[13px] text-[color:var(--color-on-paper)]">
                {c.label}
              </div>
              <div className="prose-body italic text-[10px] text-[color:var(--color-on-paper-faint)] leading-tight">
                {c.hint}
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={scores[c.key]}
              onChange={(e) =>
                setScores((s) => ({ ...s, [c.key]: parseInt(e.target.value, 10) }))
              }
              className="w-full accent-[color:var(--color-brass)]"
            />
            <div className="flex items-center gap-1 justify-end">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i <= scores[c.key]
                      ? 'bg-[color:var(--color-brass-deep)]'
                      : 'bg-[color:var(--color-paper-deep)]/40'
                  }`}
                />
              ))}
              <span className="display-italic text-[14px] text-[color:var(--color-on-paper)] tabular-nums ml-2">
                {scores[c.key]}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] mt-4 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)] leading-relaxed">
        Five-axis scoring beats the single-star average. The verdict is a heuristic — verdict
        80%+ usually means submit; below 50% the fee + effort rarely justifies the shot.
      </p>
    </section>
  );
}
