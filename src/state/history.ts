import type { AppState } from '../types';
import { reducer as baseReducer, type Action } from './reducer';

/* Undo/redo wrapper around the base reducer.
   Maintains 30 steps of history. UI-only and transient actions skip history. */

export interface History {
  past: AppState[];
  present: AppState;
  future: AppState[];
}

export type HistoryAction = Action | { type: 'UNDO' } | { type: 'REDO' };

const HISTORY_LIMIT = 30;

const SKIP: ReadonlySet<string> = new Set([
  'SET_VIEW',
  'SELECT_EPISODE',
  'OPEN_PALETTE',
  'OPEN_CAPTURE',
  'SET_PRINT_MODE',
  'HYDRATE',
]);

export function makeHistory(initial: AppState): History {
  return { past: [], present: initial, future: [] };
}

export function historyReducer(
  state: History,
  action: HistoryAction
): History {
  if (action.type === 'UNDO') {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    return {
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future],
    };
  }
  if (action.type === 'REDO') {
    if (state.future.length === 0) return state;
    const [next, ...rest] = state.future;
    return {
      past: [...state.past, state.present],
      present: next,
      future: rest,
    };
  }
  const newPresent = baseReducer(state.present, action);
  if (newPresent === state.present) return state;
  if (SKIP.has(action.type)) {
    return { ...state, present: newPresent };
  }
  return {
    past: [...state.past, state.present].slice(-HISTORY_LIMIT),
    present: newPresent,
    future: [],
  };
}
