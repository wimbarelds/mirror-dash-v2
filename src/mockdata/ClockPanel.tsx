import { ChangeEvent } from 'react';

import { useMockData } from './mockdata-context';
import { addDays, Button, HOUR, pad, Section } from './ui';

/** The clock the whole screen runs on: step, set the time of day, or let it run */
export function ClockPanel() {
  const { at, setAt, playing, setPlaying } = useMockData();
  const date = new Date(at);
  const minutes = date.getHours() * 60 + date.getMinutes();

  const step = (change: number) => {
    setPlaying(false);
    setAt(at + change);
  };

  const onTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPlaying(false);
    setAt(new Date(at).setHours(0, Number(event.target.value), 0, 0));
  };

  return (
    <>
      <Section title="Tijd van de dag">
        <label className="flex items-center gap-3">
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
        </label>
      </Section>

      <Section title="Stappen">
        <div className="flex flex-wrap gap-2">
          <Button label="Vorige dag" onClick={() => step(addDays(at, -1) - at)}>
            ‹ dag
          </Button>
          <Button label="Volgende dag" onClick={() => step(addDays(at, 1) - at)}>
            dag ›
          </Button>
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
      </Section>

      <p className="text-sm text-white/50">← → een uur, Shift + ← → een dag, spatie afspelen</p>
    </>
  );
}
