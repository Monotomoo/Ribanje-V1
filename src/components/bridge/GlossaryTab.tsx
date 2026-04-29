import { useMemo, useState } from 'react';
import { BookOpen, Search, Volume2, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import type { GlossaryCategory, GlossaryTerm } from '../../types';
import type { StringKey as I18nKey } from '../../i18n';

/* ---------- GlossaryTab (Phase 15) ----------
   Maritime + fishing glossary browser. Croatian term as headline,
   English explanation, optional pronunciation, optional example.
   Filter by category, search by term + definition. */

const CATEGORIES: { value: GlossaryCategory | 'all'; labelKey: I18nKey }[] = [
  { value: 'all',         labelKey: 'bridge.glossary.cat.all' },
  { value: 'wind',        labelKey: 'bridge.glossary.cat.wind' },
  { value: 'maneuver',    labelKey: 'bridge.glossary.cat.maneuver' },
  { value: 'anchor',      labelKey: 'bridge.glossary.cat.anchor' },
  { value: 'sail',        labelKey: 'bridge.glossary.cat.sail' },
  { value: 'boat',        labelKey: 'bridge.glossary.cat.boat' },
  { value: 'weather',     labelKey: 'bridge.glossary.cat.weather' },
  { value: 'navigation',  labelKey: 'bridge.glossary.cat.navigation' },
  { value: 'fishing',     labelKey: 'bridge.glossary.cat.fishing' },
  { value: 'place',       labelKey: 'bridge.glossary.cat.place' },
  { value: 'other',       labelKey: 'bridge.glossary.cat.other' },
];

export function GlossaryTab() {
  const { state } = useApp();
  const t = useT();
  const [filter, setFilter] = useState<GlossaryCategory | 'all'>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo<GlossaryTerm[]>(() => {
    return state.glossaryTerms.filter((g) => {
      if (filter !== 'all' && g.category !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !g.termCro.toLowerCase().includes(q) &&
          !(g.termEng?.toLowerCase().includes(q) ?? false) &&
          !g.definition.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [state.glossaryTerms, filter, query]);

  /* Group by category for display. */
  const grouped = useMemo(() => {
    const m = new Map<GlossaryCategory, GlossaryTerm[]>();
    filtered.forEach((g) => {
      if (!m.has(g.category)) m.set(g.category, []);
      m.get(g.category)?.push(g);
    });
    return m;
  }, [filtered]);

  return (
    <div className="space-y-5">
      <header>
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] leading-tight flex items-center gap-2">
          <BookOpen size={14} className="text-[color:var(--color-brass)]" />
          {t('bridge.glossary.title')}
        </h3>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          {t('bridge.glossary.subtitle')}
        </p>
      </header>

      {/* Search + filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-[360px]">
          <Search
            size={12}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-[color:var(--color-on-paper-muted)]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('bridge.glossary.search')}
            className="w-full pl-7 pr-2 py-1.5 rounded-[3px] bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[12px] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brass)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral-deep)]"
            >
              <X size={11} />
            </button>
          )}
        </div>
        <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums ml-auto">
          {filtered.length} / {state.glossaryTerms.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setFilter(c.value)}
            className={`label-caps text-[10px] px-2 py-1 rounded-[2px] transition-colors ${
              filter === c.value
                ? 'bg-[color:var(--color-on-paper)] text-[color:var(--color-paper-light)]'
                : 'bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] text-[color:var(--color-on-paper-muted)] hover:bg-[color:var(--color-brass)]/15'
            }`}
          >
            {t(c.labelKey)}
          </button>
        ))}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="text-center prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)] py-12 border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px]">
          no terms match
        </div>
      )}

      {/* Grouped term list */}
      {Array.from(grouped.entries()).map(([cat, terms]) => (
        <section key={cat}>
          <div className="flex items-baseline gap-3 mb-3 pb-1 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
            <span className="label-caps text-[10px] text-[color:var(--color-brass-deep)]">
              {t(`bridge.glossary.cat.${cat}` as I18nKey)}
            </span>
            <span className="prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums">
              {terms.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {terms.map((g) => (
              <TermCard key={g.id} term={g} t={t} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TermCard({ term, t }: { term: GlossaryTerm; t: ReturnType<typeof useT> }) {
  return (
    <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] p-3 hover:border-[color:var(--color-brass)] transition-colors">
      <header className="flex items-baseline gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <div className="display-italic text-[18px] text-[color:var(--color-on-paper)] leading-tight">
            {term.termCro}
          </div>
          {term.termEng && (
            <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
              {term.termEng}
            </div>
          )}
        </div>
        {term.pronunciation && (
          <span
            className="flex items-center gap-1 prose-body italic text-[10px] text-[color:var(--color-brass-deep)] tabular-nums shrink-0"
            title={t('bridge.glossary.pronunciation')}
          >
            <Volume2 size={9} />
            {term.pronunciation}
          </span>
        )}
      </header>
      <p className="prose-body text-[13px] text-[color:var(--color-on-paper)] leading-snug italic mt-2">
        {term.definition}
      </p>
      {term.example && (
        <div className="mt-3 pt-2 border-t-[0.5px] border-[color:var(--color-border-paper)] prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] leading-snug">
          <span className="label-caps text-[9px] text-[color:var(--color-brass-deep)] mr-1.5">
            {t('bridge.glossary.example')}
          </span>
          "{term.example}"
        </div>
      )}
    </article>
  );
}

