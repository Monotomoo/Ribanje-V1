import { useEffect } from 'react';
import { Anchor, Printer, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Episode } from '../../types';
import { PrintLayout } from '../primitives/PrintLayout';

interface Props {
  episode: Episode;
  onClose: () => void;
}

/* Episode make-sheet — printable A4 per episode summarising everything
   the team needs in a single page. Triggered from EpisodesView card. */
export function EpisodeMakeSheet({ episode, onClose }: Props) {
  const { state } = useApp();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const extras = state.episodeExtras[episode.id];

  /* Beats from anti-script moments, ordered. */
  const beats = state.antiScriptMoments
    .filter((m) => m.episodeId === episode.id)
    .sort((a, b) => a.orderIdx - b.orderIdx);

  /* Shots in this episode, grouped by status. */
  const shots = state.shots.filter((s) => s.episodeId === episode.id);
  const captured = shots.filter((s) => s.status === 'captured').length;
  const totalEstMin = shots.reduce((sum, s) => sum + (s.durationEstMin ?? 0), 0);

  /* Top 6 shots by description length / featured-look. */
  const featuredShots = shots
    .filter((s) => s.description)
    .sort((a, b) => (b.durationEstMin ?? 0) - (a.durationEstMin ?? 0))
    .slice(0, 6);

  /* Anchorages used by this episode. */
  const locations = state.locations.filter((l) => l.episodeId === episode.id);

  /* Talents for this episode. */
  const talents = state.talents.filter((t) => t.episodeId === episode.id);

  /* Targets — catch + meal */
  const catches = state.catches.filter((c) => c.episodeId === episode.id);
  const meals = state.meals.filter((m) => m.episodeId === episode.id);

  /* Sponsor anchor — find a tier-1 sponsor tied to this episode if extended. */
  const sponsorAnchor = state.sponsors.find(
    (s) => s.tier === 1 && (s as { episodeIds?: string[] }).episodeIds?.includes?.(episode.id)
  );

  /* Top 3 risks ranked by score (probability × impact if extended schema). */
  const topRisks = [...state.risks]
    .map((r) => {
      const p = r.probabilityScale ?? 0;
      const i = r.impactScale ?? 0;
      return { risk: r, score: p * i };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  /* Kit summary by category. */
  const kitByCat = new Map<string, number>();
  for (const k of state.dopKit) {
    kitByCat.set(k.category, (kitByCat.get(k.category) ?? 0) + 1);
  }

  return (
    <div className="fixed inset-0 z-40 bg-[color:var(--color-chrome-deep)]/85 backdrop-blur-sm overflow-y-auto print:relative print:bg-transparent print:overflow-visible print:p-0">
      {/* Toolbar (screen-only) */}
      <div className="sticky top-0 left-0 right-0 z-10 bg-[color:var(--color-chrome)] border-b-[0.5px] border-[color:var(--color-border-chrome-strong)] px-6 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-baseline gap-4">
          <h2 className="display-italic text-[20px] text-[color:var(--color-on-chrome)]">
            Episode make-sheet
          </h2>
          <span className="prose-body italic text-[12px] text-[color:var(--color-on-chrome-muted)]">
            Ep {episode.number} · {episode.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 label-caps text-[color:var(--color-chrome)] bg-[color:var(--color-brass)] hover:bg-[color:var(--color-brass-deep)] px-3 py-1.5 rounded-[2px] transition-colors"
          >
            <Printer size={12} />
            <span>print A4</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[color:var(--color-on-chrome-muted)] hover:text-[color:var(--color-on-chrome)] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Print body */}
      <div className="py-10 print:py-0">
        <PrintLayout
          header={`Episode ${episode.number} · ${episode.title}`}
          footer={`Ribanje 2026 · episode make-sheet · ${episode.theme || 'theme tbd'}`}
        >
          {/* Hero */}
          <section className="mb-7">
            <div className="flex items-start justify-between gap-7 mb-3">
              <div className="flex-1">
                <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                  Episode {episode.number} of {state.episodes.length} · {episode.runtime} min
                </div>
                <h1 className="display-italic text-[44px] text-[color:var(--color-on-paper)] leading-tight">
                  {episode.title}
                </h1>
                <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] mt-1.5 flex items-center gap-2">
                  <Anchor size={11} />
                  {episode.anchor || 'anchor tbd'} · {episode.theme || 'theme tbd'}
                </p>
              </div>
              <div className="text-right">
                <div className="label-caps text-[color:var(--color-on-paper-faint)]">
                  status
                </div>
                <div className="display-italic text-[18px] text-[color:var(--color-on-paper)] mt-0.5">
                  {episode.status}
                </div>
              </div>
            </div>
            <p className="prose-body text-[14px] text-[color:var(--color-on-paper)] leading-relaxed mt-3 max-w-[640px]">
              {episode.synopsis || 'Synopsis tbd.'}
            </p>
          </section>

          {/* Beats */}
          {beats.length > 0 && (
            <section className="mb-7">
              <SectionLabel>Beats ({beats.length})</SectionLabel>
              <ol className="space-y-2 mt-3">
                {beats.map((b, i) => (
                  <li key={b.id} className="grid grid-cols-[24px_1fr_60px] gap-3 items-baseline">
                    <span className="prose-body italic text-[12px] text-[color:var(--color-brass-deep)] tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="display-italic text-[14px] text-[color:var(--color-on-paper)]">
                        {b.title}
                      </div>
                      {(b.who || b.where) && (
                        <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
                          {b.who}
                          {b.where && ` · ${b.where}`}
                        </div>
                      )}
                    </div>
                    <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] text-right tabular-nums">
                      {b.expectedDurationMin ? `${b.expectedDurationMin}m` : '—'}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Two-up: shots + anchorages */}
          <section className="mb-7 grid grid-cols-2 gap-7">
            <div>
              <SectionLabel>
                Shot highlights ({captured}/{shots.length} captured)
              </SectionLabel>
              {featuredShots.length === 0 ? (
                <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-2">
                  No shots logged yet.
                </p>
              ) : (
                <ul className="space-y-1.5 mt-3">
                  {featuredShots.map((s) => (
                    <li
                      key={s.id}
                      className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
                    >
                      <span className="text-[color:var(--color-brass-deep)] tabular-nums mr-2">
                        {s.number}
                      </span>
                      {s.description}
                      {s.cameraSlot && (
                        <span className="text-[color:var(--color-on-paper-muted)]">
                          {' · '}cam {s.cameraSlot}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {totalEstMin > 0 && (
                <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] mt-3 tabular-nums">
                  estimated {totalEstMin}m total runtime in shots
                </p>
              )}
            </div>

            <div>
              <SectionLabel>Anchorages ({locations.length})</SectionLabel>
              {locations.length === 0 ? (
                <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-2">
                  No anchorages assigned.
                </p>
              ) : (
                <ul className="space-y-1.5 mt-3">
                  {locations.map((l) => (
                    <li key={l.id} className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]">
                      <Anchor size={9} className="inline mr-1.5 -mt-0.5" />
                      {l.label}
                      <span className="text-[color:var(--color-on-paper-muted)] ml-2 tabular-nums">
                        {l.lat.toFixed(2)}°N · {l.lng.toFixed(2)}°E
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Three-up: talents · catch · meal */}
          <section className="mb-7 grid grid-cols-3 gap-7">
            <div>
              <SectionLabel>Talents ({talents.length})</SectionLabel>
              {talents.length === 0 ? (
                <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-2">—</p>
              ) : (
                <ul className="space-y-1.5 mt-3">
                  {talents.slice(0, 6).map((t) => (
                    <li
                      key={t.id}
                      className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
                    >
                      {t.name}
                      <span className="text-[color:var(--color-on-paper-muted)]">
                        {' · '}
                        {t.role}
                      </span>
                      {t.status && (
                        <span className="text-[color:var(--color-brass-deep)] ml-2 label-caps tracking-[0.10em] text-[9px]">
                          {t.status}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <SectionLabel>Catch target</SectionLabel>
              {catches.length === 0 ? (
                <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-2">—</p>
              ) : (
                <ul className="space-y-1.5 mt-3">
                  {catches.slice(0, 4).map((c) => (
                    <li
                      key={c.id}
                      className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
                    >
                      {c.fishCro || c.fishEng}
                      {c.method && (
                        <span className="text-[color:var(--color-on-paper-muted)]">
                          {' · '}
                          {c.method}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <SectionLabel>Meal target</SectionLabel>
              {meals.length === 0 ? (
                <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-2">—</p>
              ) : (
                <ul className="space-y-1.5 mt-3">
                  {meals.slice(0, 4).map((m) => (
                    <li
                      key={m.id}
                      className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
                    >
                      {m.dish}
                      {m.wineProducer && (
                        <span className="text-[color:var(--color-on-paper-muted)]">
                          {' · '}
                          {m.wineProducer}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Hektorović verse */}
          {extras && (extras.hektorovicVerseCro || extras.hektorovicVerseEng) && (
            <section className="mb-7">
              <SectionLabel>Hektorović spine</SectionLabel>
              <div
                className="grid grid-cols-2 gap-7 mt-3 px-5 py-4 bg-[color:var(--color-paper)] border-l-2 border-[color:var(--color-brass)]"
                style={{ background: 'rgba(201,169,97,0.04)' }}
              >
                {extras.hektorovicVerseCro && (
                  <div>
                    <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                      Hrvatski 1568
                    </div>
                    <p className="display-italic text-[14px] text-[color:var(--color-on-paper)] leading-relaxed">
                      {extras.hektorovicVerseCro}
                    </p>
                  </div>
                )}
                {extras.hektorovicVerseEng && (
                  <div>
                    <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
                      English working translation
                    </div>
                    <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper)] leading-relaxed">
                      {extras.hektorovicVerseEng}
                    </p>
                  </div>
                )}
              </div>
              {extras.hektorovicParallel && (
                <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-2 leading-relaxed max-w-[640px]">
                  Modern parallel: {extras.hektorovicParallel}
                </p>
              )}
            </section>
          )}

          {/* Sponsor anchor + risks + kit (compact 3-up) */}
          <section className="mt-8 pt-5 border-t-[0.5px] border-[color:var(--color-border-paper-strong)] grid grid-cols-3 gap-7">
            <div>
              <SectionLabel>Sponsor anchor</SectionLabel>
              {sponsorAnchor ? (
                <div className="mt-3">
                  <div className="display-italic text-[16px] text-[color:var(--color-on-paper)]">
                    {sponsorAnchor.name}
                  </div>
                  <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5 tabular-nums">
                    {sponsorAnchor.expectedAmount}k € · {sponsorAnchor.status}
                  </div>
                </div>
              ) : (
                <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-2">
                  No tier-I anchor tied to this episode yet.
                </p>
              )}
            </div>
            <div>
              <SectionLabel>Top risks</SectionLabel>
              {topRisks.length === 0 ? (
                <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-faint)] mt-2">—</p>
              ) : (
                <ul className="space-y-1 mt-3">
                  {topRisks.map(({ risk, score }) => (
                    <li
                      key={risk.id}
                      className="prose-body italic text-[12px] text-[color:var(--color-on-paper)]"
                    >
                      {risk.title}
                      <span className="text-[color:var(--color-coral-deep)] ml-2 tabular-nums">
                        {score}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <SectionLabel>Kit ({state.dopKit.length})</SectionLabel>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-3">
                {Array.from(kitByCat.entries()).map(([cat, count]) => (
                  <li
                    key={cat}
                    className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] flex items-baseline justify-between"
                  >
                    <span>{cat}</span>
                    <span className="text-[color:var(--color-brass-deep)] tabular-nums">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </PrintLayout>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="label-caps text-[color:var(--color-brass-deep)]">{children}</span>
      <span className="flex-1 h-px bg-[color:var(--color-border-brass)]/60" />
    </div>
  );
}
