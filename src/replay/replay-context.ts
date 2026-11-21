import { createContext, useContext } from 'react';

/** A failure to simulate: nothing, a CORS block, or an HTTP error */
export type SimulatedError = 'none' | 'cors' | '404' | '500';

/** The parts of the screen that get their data from somewhere else */
export type DataPart = 'weather' | 'buses';

export interface ReplayState {
  /** The simulated current time in ms */
  at: number;
  setAt: (at: number) => void;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  errors: Record<DataPart, SimulatedError>;
  setError: (part: DataPart, error: SimulatedError) => void;
}

export const ReplayContext = createContext<ReplayState | null>(null);

export function useReplay() {
  const state = useContext(ReplayContext);
  if (!state) throw new Error('useReplay must be used inside a ReplayProvider');
  return state;
}
