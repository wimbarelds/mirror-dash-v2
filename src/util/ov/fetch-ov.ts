import { handleFetchError } from './ov-cors-error';
import { OVDataSchema } from './schema';

function getTimestamp() {
  const date = new Date();
  date.setSeconds(0, 0);
  return date.toISOString().replace(/[^0-9a-zA-Z-.]/g, '_');
}

export function getOVData() {
  const halteId = import.meta.env.VITE_OV_HALTE_ID;
  const apiUrl = import.meta.env.VITE_OV_API_URL ?? '//v0.ovapi.nl';
  const url = `${apiUrl}/tpc/${halteId}?t=${getTimestamp()}`;

  return fetch(url)
    .catch((error: unknown) => handleFetchError(url, error))
    .then((response) => response.json())
    .then((data) => OVDataSchema.parse(data))
    .then((data) => data[halteId]);
}
