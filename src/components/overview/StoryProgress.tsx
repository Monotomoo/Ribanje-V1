import { useApp } from '../../state/AppContext';
import type { MomentStatus } from '../../types';

const MOMENT_COLOR: Record<MomentStatus, string> = {
  planned: 'rgba(168,136,74,0.55)',
  captured: 'var(--color-success)',
  cut: 'rgba(194,106,74,0.55)',
};

export function StoryProgress() {
  const { state } = useApp();

  /* Aggregate counts */
  const totalMoments = state.antiScriptMoments.length;
  const captured = state.antiScriptMoments.filter(
    (m) => m.status === 'captured'
  ).length;
  const planned = state.antiScriptMoments.filter(
    (m) => m.status === 'planned'
  ).length;
  const cut = state.antiScriptMoments.filter((m) => m.status === 'cut').length;

  const totalCatches = state.catches.length;
  const totalMeals = state.meals.length;
  const totalRefs = state.references.length;

  /* Hektorović verses confirmed (anything other than the [draft] placeholder) */
  const verseConfirmed = Object.values(state.episodeExtras).filter(
    (e) => e.hektorovicVerseCro && !e.hektorovicVerseCro.startsWith('[draft')
  ).length;
  const totalEpisodesForVerse = state.episodes.length;

  return (
    <section className="grid grid-cols-3 gap-5">
      <Block
        heading="Anti-script moments"
        primary={`${totalMoments}`}
        primaryHint={
          totalMoments === 0
            ? 'no beats yet — drag templates from Episodes'
            : `${planned} planned · ${captured} captured · ${cut} cut`
        }
      >
        <SegmentBar
          total={totalMoments}
          segments={[
            { color: MOMENT_COLOR.planned, count: planned, label: 'planned' },
            { color: MOMENT_COLOR.captured, count: captured, label: 'captured' },
            { color: MOMENT_COLOR.cut, count: cut, label: 'cut' },
          ]}
          empty="add moments inside an episode's Story tab"
        />
        <PerEpisodeBars metric="moments" />
      </Block>

      <Block
        heading="Subject log"
        primary={`${totalCatches + totalMeals}`}
        primaryHint={`${totalCatches} catches · ${totalMeals} meals · ${totalRefs} references`}
      >
        <PerEpisodeBars metric="subject" />
      </Block>

      <Block
        heading="Hektorović spine"
        primary={`${verseConfirmed}/${totalEpisodesForVerse}`}
        primaryHint={
          verseConfirmed === 0
            ? 'all 6 verses are draft placeholders'
            : verseConfirmed < totalEpisodesForVerse
            ? `${totalEpisodesForVerse - verseConfirmed} still draft`
            : 'all six verses confirmed'
        }
      >
        <ul className="space-y-1.5">
          {state.episodes.map((ep) => {
            const ex = state.episodeExtras[ep.id];
            const confirmed =
              !!ex?.hektorovicVerseCro &&
              !ex.hektorovicVerseCro.startsWith('[draft');
            return (
              <li
                key={ep.id}
                className="flex items-baseline gap-2 prose-body text-[12px] text-[color:var(--color-on-paper-muted)]"
              >
                <span
                  className={
                    confirmed
                      ? 'text-[color:var(--color-success)]'
                      : 'text-[color:var(--color-on-paper-faint)]'
                  }
                >
                  {confirmed ? '◆' : '◇'}
                </span>
                <span className="italic flex-1 truncate">
                  Ep {ep.number} · {ep.theme}
                </span>
                {!confirmed && (
                  <span className="label-caps text-[color:var(--color-on-paper-faint)]">
                    draft
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Block>
    </section>
  );
}

function Block({
  heading,
  primary,
  primaryHint,
  children,
}: {
  heading: string;
  primary: string;
  primaryHint?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5 flex flex-col">
      <header className="mb-4 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40 flex items-baseline justify-between">
        <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
          {heading}
        </h3>
        <span className="display-italic text-[24px] text-[color:var(--color-on-paper)] tabular-nums">
          {primary}
        </span>
      </header>
      {primaryHint && (
        <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mb-3 leading-snug">
          {primaryHint}
        </p>
      )}
      <div className="flex-1">{children}</div>
    </article>
  );
}

function SegmentBar({
  total,
  segments,
  empty,
}: {
  total: number;
  segments: { count: number; color: string; label: string }[];
  empty?: string;
}) {
  if (total === 0) {
    return (
      <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] py-3">
        {empty}
      </p>
    );
  }
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-[color:var(--color-paper-deep)]/40 mb-3">
      {segments
        .filter((s) => s.count > 0)
        .map((s) => (
          <div
            key={s.label}
            style={{ width: `${(s.count / total) * 100}%`, background: s.color }}
            title={`${s.label}: ${s.count}`}
          />
        ))}
    </div>
  );
}

function PerEpisodeBars({
  metric,
}: {
  metric: 'moments' | 'subject';
}) {
  const { state } = useApp();
  const max = state.episodes.reduce((m, ep) => {
    const v =
      metric === 'moments'
        ? state.antiScriptMoments.filter((x) => x.episodeId === ep.id).length
        : state.catches.filter((x) => x.episodeId === ep.id).length +
          state.meals.filter((x) => x.episodeId === ep.id).length;
    return Math.max(m, v);
  }, 1);

  return (
    <ul className="space-y-1.5 mt-1">
      {state.episodes.map((ep) => {
        const v =
          metric === 'moments'
            ? state.antiScriptMoments.filter((x) => x.episodeId === ep.id)
                .length
            : state.catches.filter((x) => x.episodeId === ep.id).length +
              state.meals.filter((x) => x.episodeId === ep.id).length;
        return (
          <li
            key={ep.id}
            className="grid grid-cols-[60px_1fr_30px] items-center gap-2"
          >
            <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
              ep {ep.number}
            </span>
            <div className="h-1.5 bg-[color:var(--color-paper-deep)]/55 rounded-full overflow-hidden">
              <div
                className="h-full bg-[color:var(--color-brass)] rounded-full transition-all duration-300"
                style={{ width: `${(v / max) * 100}%` }}
              />
            </div>
            <span className="display-italic text-[12px] text-[color:var(--color-on-paper)] tabular-nums text-right">
              {v}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

