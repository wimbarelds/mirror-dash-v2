import { useEffect, useState } from 'react';

function getTime(date: Date) {
  const formatter = Intl.DateTimeFormat(import.meta.env.VITE_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return formatter.format(date);
}

function getDate(date: Date) {
  const formatter = Intl.DateTimeFormat(import.meta.env.VITE_LOCALE, {
    dateStyle: 'full',
  });
  return formatter.format(date);
}

export function CurrentDateTime() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const nextMinute = new Date(now.getTime());
    nextMinute.setMilliseconds(0);
    nextMinute.setSeconds(0);
    nextMinute.setMinutes(nextMinute.getMinutes() + 1);
    const delay = nextMinute.getTime() - now.getTime();

    const timeout = setTimeout(() => setNow(new Date()), delay);

    return () => clearTimeout(timeout);
  }, [now]);

  return (
    <div className="flex flex-col items-end">
      <div className="text-3xl">{getDate(now)}</div>
      <div className="text-8xl">{getTime(now)}</div>
    </div>
  );
}
