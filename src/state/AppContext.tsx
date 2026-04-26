import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { AppState } from '../types';
import { makeInitialState } from '../lib/seed';
import { loadState, saveState } from '../lib/storage';
import { type Action } from './reducer';
import { historyReducer, makeHistory } from './history';

interface ContextShape {
  state: AppState;
  dispatch: Dispatch<Action>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const AppContext = createContext<ContextShape | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [history, internalDispatch] = useReducer(
    historyReducer,
    null,
    () => makeHistory(loadState() ?? makeInitialState())
  );

  const dispatch = useCallback<Dispatch<Action>>(
    (action) => internalDispatch(action),
    []
  );
  const undo = useCallback(() => internalDispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => internalDispatch({ type: 'REDO' }), []);

  /* Persist `present` only — past/future stay in memory. */
  const firstMountRef = useRef(true);
  useEffect(() => {
    if (firstMountRef.current) {
      firstMountRef.current = false;
      return;
    }
    saveState(history.present);
  }, [history.present]);

  return (
    <AppContext.Provider
      value={{
        state: history.present,
        dispatch,
        undo,
        redo,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): ContextShape {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
