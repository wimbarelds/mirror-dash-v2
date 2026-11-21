import { createContext, useContext } from 'react';

/** A failure to simulate */
export type SimulatedError = 'none' | 'cors' | '404' | '500';

/** Parts of the screen with their own data source */
export type DataPart = 'weather' | 'busses';

export interface MockDataState {
  /** Simulated time in ms */
  at: number;
  setAt: (at: number) => void;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  errors: Record<DataPart, SimulatedError>;
  setError: (part: DataPart, error: SimulatedError) => void;
}

export const MockDataContext = createContext<MockDataState | null>(null);

export function useMockData() {
  const state = useContext(MockDataContext);
  if (!state) throw new Error('useMockData must be used inside a MockDataProvider');
  return state;
}
