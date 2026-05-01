import { OVDataSchema } from './schema';

export function getOVData() {
  const halteId = import.meta.env.VITE_OV_HALTE_ID;
  const targetUrl = `http://v0.ovapi.nl/tpc/${halteId}`
  const proxyUrl = `https://corsproxy.io/?${targetUrl}`

  return fetch(proxyUrl)
    .then((response) => response.json())
    .then((data) => OVDataSchema.parse(data))
    .then((data) => data[halteId]);
}
