export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

const clock = new Intl.DateTimeFormat(import.meta.env.VITE_LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** 24-hour time, e.g. 08:05 */
export const formatTime = (time: Date | number) => clock.format(time);

/** The hour, e.g. 08:00 */
export const formatHour = (time: number) =>
  `${String(new Date(time).getHours()).padStart(2, '0')}:00`;
