import { VariationStack } from '../primitives/VariationStack';

export function Lab() {
  return (
    <div className="space-y-9">
      <header>
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          Logline · title · synopsis lab
        </h3>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          Save multiple variants. Star the canonical one. Use the rest in pitches that need a different angle.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-10">
        <VariationStack
          category="logline"
          rows={2}
          heading="Loglines"
          emptyMessage="No loglines yet."
          placeholder="One line. The hook. Aim for ~25 words."
        />
        <VariationStack
          category="title"
          rows={1}
          heading="Title variants"
          emptyMessage="No alternates yet — Ribanje is the canonical for now."
          placeholder="An alternate title — for international, sponsor, or festival cuts"
        />
      </div>

      <section>
        <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-4 pb-2 border-b-[0.5px] border-[color:var(--color-border-brass)]">
          Synopsis · short
        </h4>
        <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mb-3">
          ~50 words. Used in EPK, press, sponsor cold-emails.
        </p>
        <VariationStack
          category="synopsis-short"
          rows={3}
          heading=""
          emptyMessage="No short synopsis variants yet."
          placeholder="50 words. The pitch in a breath."
        />
      </section>

      <section>
        <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-4 pb-2 border-b-[0.5px] border-[color:var(--color-border-brass)]">
          Synopsis · medium
        </h4>
        <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mb-3">
          ~200 words. Used in HRT pitch, festival applications, sales agent pitch.
        </p>
        <VariationStack
          category="synopsis-medium"
          rows={5}
          heading=""
          emptyMessage="No medium synopsis variants yet."
          placeholder="200 words. The world, the voyage, the form."
        />
      </section>

      <section>
        <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-4 pb-2 border-b-[0.5px] border-[color:var(--color-border-brass)]">
          Synopsis · long
        </h4>
        <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mb-3">
          ~500 words. Used in EU MEDIA, broadcaster decks, full investor materials.
        </p>
        <VariationStack
          category="synopsis-long"
          rows={10}
          heading=""
          emptyMessage="No long synopsis variants yet."
          placeholder="500 words. Episode-by-episode flavor, philosophical frame, comparable films."
        />
      </section>
    </div>
  );
}
