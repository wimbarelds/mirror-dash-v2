import { useEffect, useState } from 'react';

import { HOUR } from '../util/time';
import { ClockPanel } from './ClockPanel';
import { ErrorPicker } from './ErrorPicker';
import { useMockData } from './mockdata-context';
import { MockDataPanel } from './MockDataPanel';
import { addDays, Button } from './ui';
import { WeatherPanel } from './WeatherPanel';

type PanelId = 'clock' | 'busses' | 'weather';

/** Buttons to open a panel per part of the screen, and keys to move time. H hides it all. */
export function MockDataUI() {
  const { at, setAt, playing, setPlaying } = useMockData();
  const [open, setOpen] = useState<Record<PanelId, boolean>>({
    clock: false,
    busses: false,
    weather: false,
  });
  const [hidden, setHidden] = useState(false);

  const toggle = (id: PanelId) => setOpen((current) => ({ ...current, [id]: !current[id] }));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        setPlaying(false);
        setAt(event.shiftKey ? addDays(at, direction) : at + direction * HOUR);
      } else if (event.key === 'h') {
        setHidden((current) => !current);
      } else if (event.key === ' ' && target.tagName !== 'BUTTON') {
        event.preventDefault();
        setPlaying(!playing);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [at, playing, setAt, setPlaying]);

  if (hidden) return null;

  return (
    <>
      <nav className="fixed top-2 left-1/2 z-[100] flex -translate-x-1/2 gap-1 text-sm opacity-50 hover:opacity-100">
        <Button active={open.clock} onClick={() => toggle('clock')} className="px-2 py-0.5">
          Klok
        </Button>
        <Button active={open.busses} onClick={() => toggle('busses')} className="px-2 py-0.5">
          Bussen
        </Button>
        <Button active={open.weather} onClick={() => toggle('weather')} className="px-2 py-0.5">
          Weer
        </Button>
      </nav>

      {open.clock && (
        <MockDataPanel
          id="clock"
          title="Klok"
          start={{ x: 0.3, y: 0.12 }}
          width={24}
          onHide={() => toggle('clock')}
        >
          <ClockPanel />
        </MockDataPanel>
      )}

      {open.busses && (
        <MockDataPanel
          id="busses"
          title="Bussen"
          start={{ x: 0.3, y: 0.42 }}
          width={24}
          onHide={() => toggle('busses')}
        >
          <p className="text-sm text-white/60">
            Bussen zijn voorbeeldtijden: twee per uur, vanaf het gekozen moment.
          </p>
          <ErrorPicker part="busses" />
        </MockDataPanel>
      )}

      {open.weather && (
        <MockDataPanel
          id="weather"
          title="Weer"
          start={{ x: 0.52, y: 0.12 }}
          width={28}
          onHide={() => toggle('weather')}
        >
          <WeatherPanel />
        </MockDataPanel>
      )}
    </>
  );
}
