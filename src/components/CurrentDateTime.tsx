import { useNow } from '../util/use-now';

const locale = import.meta.env.VITE_LOCALE;
const timeFormat = new Intl.DateTimeFormat(locale, {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const dateFormat = new Intl.DateTimeFormat(locale, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export function CurrentDateTime() {
  const now = useNow();

  return (
    <div>
      <div className="text-[13.75rem] leading-none font-extralight tracking-tighter">
        {timeFormat.format(now)}
      </div>
      <div className="mt-1.5 text-[2.75rem] font-light text-white/60">{dateFormat.format(now)}</div>
    </div>
  );
}
