import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useT } from '../../i18n';
import type { StringKey } from '../../i18n';
import type { SpeciesCard, SpeciesCategory } from '../../types';
import { SpeciesCardCompact } from './SpeciesCardCompact';

/* ---------- SpeciesCardsTab (Phase 14) ----------
   Browse 33+ Adriatic species with category filter + name search.
   Tap a card → full detail drawer (expanded SpeciesCardCompact). */

const CATEGORY_KEYS: { value: SpeciesCategory | 'all'; labelKey: StringKey }[] = [
  { value: 'all',         labelKey: 'almanac.species.filter.all' },
  { value: 'pelagic',     labelKey: 'almanac.species.cat.pelagic' },
  { value: 'demersal',    labelKey: 'almanac.species.cat.demersal' },
  { value: 'cephalopod',  labelKey: 'almanac.species.cat.cephalopod' },
  { value: 'crustacean',  labelKey: 'almanac.species.cat.crustacean' },
  { value: 'shellfish',   labelKey: 'almanac.species.cat.shellfish' },
];

export function SpeciesCardsTab() {
  const { state } = useApp();
  const t = useT();
  const [filter, setFilter] = useState<SpeciesCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const currentMonth = new Date().getMonth() + 1;

  const filtered = useMemo<SpeciesCard[]>(() => {
    return state.species.filter((s) => {
      if (filter !== 'all' && s.category !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        const dialectMatch = s.dialects?.some((d) => d.name.toLowerCase().includes(q));
        if (
          !s.nameCro.toLowerCase().includes(q) &&
          !s.nameEng.toLowerCase().includes(q) &&
          !s.scientific.toLowerCase().includes(q) &&
          !dialectMatch
        ) {
          return false;
        }
      }
      return true;
    });
  }, [state.species, filter, query]);

  const opened = openId ? state.species.find((s) => s.id === openId) : null;

  return (
    <div className="space-y-5">
      <header>
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)] leading-tight">
          {t('almanac.species.title')}
        </h3>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          {t('almanac.species.subtitle')}
        </p>
      </header>

      {/* Search + filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search
            size={12}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-[color:var(--color-on-paper-muted)]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('almanac.species.search')}
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

        <div className="flex flex-wrap gap-1">
          {CATEGORY_KEYS.map((c) => (
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

        <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] tabular-nums ml-auto">
          {filtered.length} / {state.species.length}
        </span>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((sp) => (
          <SpeciesCardCompact
            key={sp.id}
            species={sp}
            highlightMonth={currentMonth}
            onClick={() => setOpenId(sp.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] py-12 border-[0.5px] border-dashed border-[color:var(--color-border-paper)] rounded-[3px]">
          No species match — try a different filter or clear the search.
        </div>
      )}

      {/* Detail drawer */}
      {opened && (
        <div
          className="fixed inset-0 z-50 bg-[color:var(--color-chrome)]/40 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setOpenId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto"
          >
            <SpeciesCardCompact
              species={opened}
              expanded
              highlightMonth={currentMonth}
            />
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="mt-3 mx-auto block prose-body italic text-[12px] text-[color:var(--color-paper-light)] hover:text-[color:var(--color-paper)] transition-colors"
            >
              close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
