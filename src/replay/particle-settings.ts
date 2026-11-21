import { createContext, useContext } from 'react';

import { PrecipitationConfig } from '../components/WeatherGraph/precipitation-config';

export interface ParticleSettings {
  config: PrecipitationConfig;
  update: (patch: Partial<PrecipitationConfig>) => void;
  reset: () => void;
}

export const ParticleSettingsContext = createContext<ParticleSettings | null>(null);

export function useParticleSettings() {
  const settings = useContext(ParticleSettingsContext);
  if (!settings)
    throw new Error('useParticleSettings must be used inside a ParticleSettingsProvider');
  return settings;
}
