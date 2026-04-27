import { useApp } from '../../state/AppContext';
import type { DOPKitItem } from '../../types';
import { LensCharacterMatrix } from './LensCharacterMatrix';
import { PerBeatLensPrescription } from './PerBeatLensPrescription';

export function LensLibrary() {
  const { state } = useApp();
  const lenses = state.dopKit.filter((k) => k.category === 'lens');
  if (lenses.length === 0) {
    return (
      <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
        No lenses in kit yet — add some on the Kit tab.
      </p>
    );
  }
  return (
    <div className="space-y-10">
      {/* Lens character matrix — 2D scatter plot */}
      <LensCharacterMatrix />

      {/* Per-beat lens prescription — every beat → recommended lens */}
      <PerBeatLensPrescription />

      <section>
        <header>
          <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
            Lens library
          </h3>
          <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            Each lens with its character notes and specs. Edit specs on the Kit tab.
          </p>
        </header>

        <ul className="space-y-3 mt-4">
          {lenses.map((lens) => (
            <LensRow key={lens.id} lens={lens} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function LensRow({ lens }: { lens: DOPKitItem }) {
  const specs = Object.entries(lens.specs ?? {});
  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
      <header className="flex items-baseline justify-between mb-3">
        <h4 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          {lens.label}
        </h4>
        {lens.dailyRateK !== undefined && (
          <span className="label-caps text-[color:var(--color-brass-deep)]">
            {lens.dailyRateK}k €/day
          </span>
        )}
      </header>
      {specs.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-3 pb-3 border-b-[0.5px] border-[color:var(--color-border-paper)]">
          {specs.map(([k, v]) => (
            <div key={k}>
              <div className="label-caps text-[color:var(--color-on-paper-faint)] mb-0.5">
                {k}
              </div>
              <div className="display-italic text-[15px] text-[color:var(--color-on-paper)] tabular-nums">
                {v}
              </div>
            </div>
          ))}
        </div>
      )}
      {lens.characterNotes && (
        <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper)] leading-[1.55]">
          {lens.characterNotes}
        </p>
      )}
    </article>
  );
}
