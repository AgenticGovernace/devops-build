import { useEffect, useRef } from 'react';
import type { AppAction, AppState } from '../types';
import type { Dispatch } from 'react';
import { registerWebMcpTools } from './tools';

/** Registers top-level browser tools while keeping handlers bound to the latest store state. */
export function useWebMcpTools(state: AppState, dispatch: Dispatch<AppAction>): void {
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(
    () =>
      registerWebMcpTools({
        /**
         *
         */
        getState: () => stateRef.current,
        dispatch,
      }),
    [dispatch]
  );
}
