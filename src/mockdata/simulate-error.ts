import { OVCorsError } from '../util/ov/ov-cors-error';
import { DataPart, SimulatedError } from './mockdata-context';

/** A failing request. Weather has CORS headers, so a network error is the closest it gets. */
export function simulateError(part: DataPart, error: Exclude<SimulatedError, 'none'>) {
  if (error === 'cors') {
    return Promise.reject(
      part === 'busses' ? new OVCorsError() : new TypeError('Failed to fetch (simulated)'),
    );
  }
  return Promise.reject(new Error(`Request failed with status ${error} (simulated)`));
}
