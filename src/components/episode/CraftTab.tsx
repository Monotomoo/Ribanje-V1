import { useApp } from '../../state/AppContext';
import { EditableText } from '../primitives/EditableText';
import { Field, SectionHeader } from './shared';
import { EPISODE_COLORS } from '../map/AdriaticChart';

export function CraftTab({ episodeId }: { episodeId: string }) {
  const { state, dispatch } = useApp();
  const extras = state.episodeExtras[episodeId];
  const palettes = state.colorPalettes.filter(
    (p) => p.episodeId === episodeId || p.episodeId === 'general'
  );
  const accent = EPISODE_COLORS[episodeId] ?? '#2D4A6B';

  return (
    <div className="grid grid-cols-2 gap-10">
      <section>
        <SectionHeader title="Cinematography" />
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5 space-y-5">
          <Field label="Lens choices · lighting · framing">
            <EditableText
              value={extras?.dopNotes ?? ''}
              onChange={(v) =>
                dispatch({
                  type: 'UPDATE_EPISODE_EXTRAS',
                  episodeId,
                  patch: { dopNotes: v },
                })
              }
              multiline
              rows={6}
              placeholder="What does Tom shoot wide here? Where do we want anamorphic? What's the natural light pattern?"
              className="prose-body text-[14px] text-[color:var(--color-on-paper)] leading-[1.55]"
            />
          </Field>
          <div className="pt-4 border-t-[0.5px] border-[color:var(--color-border-paper)]">
            <Field label="Episode palette">
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-[3px] border-[0.5px] border-[color:var(--color-border-paper-strong)]"
                  style={{ background: accent }}
                />
                <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
                  Voyage accent ·{' '}
                  <span className="font-mono not-italic text-[color:var(--color-on-paper)]">
                    {accent.toUpperCase()}
                  </span>
                </span>
              </div>
            </Field>
          </div>
          <div className="pt-2">
            <Field label="Saved palettes">
              {palettes.length === 0 ? (
                <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-faint)]">
                  Color palette generator lands in Phase 5 — drop a still image and pull a 5-color palette.
                </p>
              ) : (
                <ul className="space-y-2">
                  {palettes.map((p) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <div className="flex">
                        {p.colors.map((col, i) => (
                          <span
                            key={i}
                            className="w-5 h-5 first:rounded-l-[2px] last:rounded-r-[2px]"
                            style={{ background: col }}
                          />
                        ))}
                      </div>
                      <span className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]">
                        {p.label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Field>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Sound" />
        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5 space-y-5">
          <Field label="Music · dialect · ambient · klapa references">
            <EditableText
              value={extras?.soundNotes ?? ''}
              onChange={(v) =>
                dispatch({
                  type: 'UPDATE_EPISODE_EXTRAS',
                  episodeId,
                  patch: { soundNotes: v },
                })
              }
              multiline
              rows={6}
              placeholder="Which klapa songs land here? What dialect should we capture? Where does silence carry?"
              className="prose-body text-[14px] text-[color:var(--color-on-paper)] leading-[1.55]"
            />
          </Field>
        </div>
      </section>
    </div>
  );
}
