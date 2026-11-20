import { createContext, useContext } from 'react';

export interface ReplayState {
  /** The simulated current time in ms */
  at: number;
  setAt: (at: number) => void;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
}

export const ReplayContext = createContext<ReplayState | null>(null);

export function useReplay() {
  const state = useContext(ReplayContext);
  if (!state) throw new Error('useReplay must be used inside a ReplayProvider');
  return state;
}
