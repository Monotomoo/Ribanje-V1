import { useApp } from '../state/AppContext';
import { en, type StringKey, type Strings } from './en';
import { hr } from './hr';

export type Locale = 'en' | 'hr';

const DICTS: Record<Locale, Strings> = { en, hr };

/* ---------- Translation hook ----------
   Usage:
     const t = useT();
     <button>{t('common.add')}</button>

   Returns the active-locale string. Falls back to English if a key is
   missing in Croatian (compile-time enforced by `Strings` type, but
   defensive at runtime too). */

export function useT(): (key: StringKey) => string {
  const { state } = useApp();
  const locale = state.locale ?? 'en';
  const dict = DICTS[locale] ?? en;
  return (key: StringKey) => dict[key] ?? en[key] ?? key;
}

/* Direct lookup helper for non-hook contexts (selectors, formatters). */
export function tFor(locale: Locale, key: StringKey): string {
  return (DICTS[locale] ?? en)[key] ?? en[key] ?? key;
}

/* ---------- Locale-aware formatters ----------

   Croatian conventions:
     • Date:     dd.MM.yyyy.   (with trailing dot)
     • Number:   1.234,56      (period thousands, comma decimal)
     • Currency: 1.234,56 €    (space, then symbol, after the number)

   English conventions:
     • Date:     27 Apr 2026  (en-GB short month)
     • Number:   1,234.56
     • Currency: €1,234.56     (symbol prefix) */

export function fmtDate(iso: string, locale: Locale): string {
  if (!iso) return '';
  const d = parseISODate(iso);
  if (locale === 'hr') {
    const dd = d.getDate().toString().padStart(2, '0');
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}.`;
  }
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function fmtDateLong(iso: string, locale: Locale): string {
  if (!iso) return '';
  const d = parseISODate(iso);
  if (locale === 'hr') {
    return d.toLocaleDateString('hr-HR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function fmtNumber(n: number, locale: Locale, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(localeTag(locale), opts).format(n);
}

export function fmtCurrency(amountEur: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTag(locale), {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amountEur);
}

export function fmtPercent(ratio: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTag(locale), {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(ratio);
}

/* Croatian has 3 plural forms (one / few / many).
   Use Intl.PluralRules for principled selection. */
export function plural(n: number, locale: Locale, forms: { one: string; few: string; many: string; other?: string }): string {
  const rules = new Intl.PluralRules(localeTag(locale));
  const cat = rules.select(n);
  return forms[cat as keyof typeof forms] ?? forms.other ?? forms.many;
}

/* ---------- Hook bundles for the common case ----------
   Combines t() + locale + formatters in one call. */

export function useI18n() {
  const { state } = useApp();
  const locale = (state.locale ?? 'en') as Locale;
  const dict = DICTS[locale] ?? en;
  return {
    locale,
    t: (key: StringKey) => dict[key] ?? en[key] ?? key,
    fmtDate: (iso: string) => fmtDate(iso, locale),
    fmtDateLong: (iso: string) => fmtDateLong(iso, locale),
    fmtNumber: (n: number, opts?: Intl.NumberFormatOptions) => fmtNumber(n, locale, opts),
    fmtCurrency: (n: number) => fmtCurrency(n, locale),
    fmtPercent: (ratio: number) => fmtPercent(ratio, locale),
  };
}

/* ---------- Internal helpers ---------- */

function localeTag(locale: Locale): string {
  return locale === 'hr' ? 'hr-HR' : 'en-GB';
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

export type { StringKey } from './en';
export { en, hr };
