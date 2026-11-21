import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import {
  defaultPrecipitationConfig,
  PrecipitationConfig,
  PrecipitationConfigContext,
} from '../components/WeatherGraph/precipitation-config';
import { ParticleSettingsContext } from './particle-settings';

const STORAGE_KEY = 'mirror-dash-particle-settings';

function load(): PrecipitationConfig {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultPrecipitationConfig, ...JSON.parse(stored) };
  } catch {
    // Storage can be unavailable or hold something unreadable; the defaults are fine then
  }
  return defaultPrecipitationConfig;
}

/**
 * Lets the replay page change how precipitation is drawn while it runs, and remembers the values in
 * this browser. The graph reads them through the same context it reads its defaults from.
 */
export function ParticleSettingsProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(load);

  const update = useCallback(
    (patch: Partial<PrecipitationConfig>) => setConfig((current) => ({ ...current, ...patch })),
    [],
  );
  const reset = useCallback(() => setConfig(defaultPrecipitationConfig), []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // The settings just aren't remembered
    }
  }, [config]);

  const settings = useMemo(() => ({ config, update, reset }), [config, update, reset]);

  return (
    <PrecipitationConfigContext.Provider value={config}>
      <ParticleSettingsContext.Provider value={settings}>
        {children}
      </ParticleSettingsContext.Provider>
    </PrecipitationConfigContext.Provider>
  );
}
