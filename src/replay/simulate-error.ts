import { OVCorsError } from '../util/ov/ov-cors-error';
import { DataPart, SimulatedError } from './replay-context';

/**
 * A request that fails the way the real one can. Buses report a CORS block the way the app expects
 * (see ov-cors-error.ts); for the weather API, which sends CORS headers, the closest thing is a
 * network error, which browsers report as a TypeError.
 */
export function simulateError(part: DataPart, error: Exclude<SimulatedError, 'none'>) {
  if (error === 'cors') {
    return Promise.reject(
      part === 'buses' ? new OVCorsError() : new TypeError('Failed to fetch (simulated)'),
    );
  }
  return Promise.reject(new Error(`Request failed with status ${error} (simulated)`));
}
