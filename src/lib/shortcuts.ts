import type { ScenarioKey, ViewKey } from '../types';

export function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function isMod(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey;
}

/* Sidebar order matches the visible nav grouping (Plan × 5 / Make × 5 / Tell × 6).
   ⌘1–9 maps to the first nine entries; the rest are reachable via ⌘K. */
export const VIEW_ORDER: ViewKey[] = [
  /* PLAN */
  'overview',
  'schedule',
  'sponsors',
  'crew',
  'risks',
  /* MAKE */
  'episodes',
  'production',
  'dop',
  'sound',
  'map',
  /* TELL — production lifecycle: pitch → produce → contracts → post → distribute → market */
  'pitch',
  'journal',
  'contracts',
  'post',
  'distribution',
  'marketing',
  /* LIBRARY — cultural backbone of the show */
  'research',
];

export const SCENARIO_KEYS: Record<string, ScenarioKey> = {
  '1': 'lean',
  '2': 'realistic',
  '3': 'ambitious',
};
