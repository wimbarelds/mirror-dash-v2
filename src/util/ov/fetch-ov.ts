import { OVDataSchema } from './schema';

function getTimestamp() {
  const date = new Date();
  date.setSeconds(0, 0);
  return date.toISOString().replace(/[^0-9a-zA-Z-.]/g, '_');
}

export function getOVData() {
  const halteId = import.meta.env.VITE_OV_HALTE_ID;
  const targetUrl = `http://v0.ovapi.nl/tpc/${halteId}?t=${getTimestamp()}`;
  const proxyUrl = `https://corsproxy.io/?${targetUrl}`;

  return fetch(proxyUrl)
    .then((response) => response.json())
    .then((data) => OVDataSchema.parse(data))
    .then((data) => data[halteId]);
}
