import { OVDataSchema } from './schema';

export function getOVData() {
  const halteId = import.meta.env.VITE_OV_HALTE_ID;
  return fetch(`http://v0.ovapi.nl/tpc/${halteId}`)
    .then((response) => response.json())
    .then((data) => OVDataSchema.parse(data))
    .then((data) => data[halteId]);
}
