import { formatTime } from '../util/time';
import { useNow } from '../util/use-now';

const dateFormat = new Intl.DateTimeFormat(import.meta.env.VITE_LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export function CurrentDateTime() {
  const now = useNow();

  return (
    <div>
      <div className="text-[13.75rem] leading-none font-extralight tracking-tighter">
        {formatTime(now)}
      </div>
      <div className="mt-1.5 text-[2.75rem] font-light text-white/60">{dateFormat.format(now)}</div>
    </div>
  );
}
