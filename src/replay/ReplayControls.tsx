import clsx from 'clsx';
import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from 'react';

import { getHighlights } from './highlights';
import { FIRST_AT, LAST_AT } from './history';
import { useReplay } from './replay-context';

const HOUR = 60 * 60 * 1000;
const pad = (value: number) => String(value).padStart(2, '0');
const toDateValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function addDays(at: number, days: number) {
  const date = new Date(at);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

function Button({
  children,
  onClick,
  active,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={clsx(
        'cursor-pointer rounded-md border border-white/25 px-3 py-1.5 whitespace-nowrap hover:bg-white/20',
        active ? 'bg-white text-black hover:bg-white/80' : 'bg-white/10',
      )}
    >
      {children}
    </button>
  );
}

/**
 * Pick the moment being replayed. Sits in the middle of the screen, which is the part the real
 * layout leaves empty. Arrow keys step an hour (with Shift a day), space plays, H hides this panel.
 */
export function ReplayControls() {
  const { at, setAt, playing, setPlaying } = useReplay();
  const [open, setOpen] = useState(true);
  const highlights = useMemo(getHighlights, []);

  const date = new Date(at);
  const minutes = date.getHours() * 60 + date.getMinutes();

  const step = (change: number) => {
    setPlaying(false);
    setAt(at + change);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        setPlaying(false);
        setAt(event.shiftKey ? addDays(at, direction) : at + direction * HOUR);
      } else if (event.key === 'h') {
        setOpen((current) => !current);
      } else if (event.key === ' ' && target.tagName !== 'BUTTON') {
        event.preventDefault();
        setPlaying(!playing);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [at, playing, setAt, setPlaying]);

  const onDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = event.target.value.split('-').map(Number);
    if (!year) return;
    setPlaying(false);
    setAt(new Date(year, month - 1, day, date.getHours(), date.getMinutes()).getTime());
  };

  const onTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPlaying(false);
    setAt(new Date(at).setHours(0, Number(event.target.value), 0, 0));
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-2 left-1/2 -translate-x-1/2 cursor-pointer text-sm text-white/30 hover:text-white/70"
      >
        Replay (h)
      </button>
    );
  }

  return (
    <section className="fixed top-1/2 left-1/2 flex w-[46rem] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border border-white/15 bg-neutral-900/95 p-5 text-base text-white">
      <header className="flex items-baseline justify-between">
        <h1 className="text-lg font-medium">Replay</h1>
        <span className="text-sm text-white/50">
          Opgenomen weer, geen live gegevens. Bussen zijn voorbeeldtijden.
        </span>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Button label="Vorige dag" onClick={() => step(addDays(at, -1) - at)}>
          ‹ dag
        </Button>
        <input
          type="date"
          aria-label="Datum"
          value={toDateValue(date)}
          min={toDateValue(new Date(FIRST_AT))}
          max={toDateValue(new Date(LAST_AT))}
          onChange={onDateChange}
          className="rounded-md border border-white/25 bg-white/10 px-2 py-1.5 scheme-dark"
        />
        <Button label="Volgende dag" onClick={() => step(addDays(at, 1) - at)}>
          dag ›
        </Button>
        <span className="w-4" />
        <Button label="Een uur terug" onClick={() => step(-HOUR)}>
          ‹ uur
        </Button>
        <Button label="Een uur vooruit" onClick={() => step(HOUR)}>
          uur ›
        </Button>
        <Button active={playing} onClick={() => setPlaying(!playing)}>
          {playing ? 'Pauze' : 'Afspelen'}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          aria-label="Tijd"
          min={0}
          max={1425}
          step={15}
          value={minutes - (minutes % 15)}
          onChange={onTimeChange}
          className="flex-1"
        />
        <span className="w-14 text-right tabular-nums">
          {pad(date.getHours())}:{pad(date.getMinutes())}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {highlights.map((highlight) => (
          <Button
            key={highlight.label}
            onClick={() => {
              setPlaying(false);
              setAt(highlight.at);
            }}
          >
            {highlight.label}
          </Button>
        ))}
      </div>

      <footer className="flex items-center justify-between text-sm text-white/50">
        <span>← → uur · Shift + ← → dag · spatie afspelen · h verbergen</span>
        <Button onClick={() => setOpen(false)}>Verberg</Button>
      </footer>
    </section>
  );
}
