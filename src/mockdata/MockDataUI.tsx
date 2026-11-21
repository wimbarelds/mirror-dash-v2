import { ReactNode, useEffect, useState } from 'react';

import { BusPanel } from './BusPanel';
import { ClockPanel } from './ClockPanel';
import { useMockData } from './mockdata-context';
import { MockDataPanel } from './MockDataPanel';
import { addDays, Button, HOUR } from './ui';
import { WeatherPanel } from './WeatherPanel';

type PanelId = 'clock' | 'buses' | 'weather';

const PANELS: {
  id: PanelId;
  title: string;
  start: { x: number; y: number };
  width: number;
  content: ReactNode;
}[] = [
  { id: 'clock', title: 'Klok', start: { x: 0.3, y: 0.12 }, width: 24, content: <ClockPanel /> },
  { id: 'buses', title: 'Bussen', start: { x: 0.3, y: 0.42 }, width: 24, content: <BusPanel /> },
  {
    id: 'weather',
    title: 'Weer',
    start: { x: 0.52, y: 0.12 },
    width: 28,
    content: <WeatherPanel />,
  },
];

/**
 * The mock data page's controls: a small button per part of the screen opens a panel for it. Panels
 * can be moved and hidden again; none are open at first. The keyboard moves time: arrows an hour (with Shift a day), space
 * plays, H hides all of it.
 */
export function MockDataUI() {
  const { at, setAt, playing, setPlaying } = useMockData();
  const [open, setOpen] = useState<Record<PanelId, boolean>>({
    clock: false,
    buses: false,
    weather: false,
  });
  const [hidden, setHidden] = useState(false);

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
        {PANELS.map((panel) => (
          <Button
            key={panel.id}
            active={open[panel.id]}
            onClick={() => setOpen((current) => ({ ...current, [panel.id]: !current[panel.id] }))}
            className="px-2 py-0.5"
          >
            {panel.title}
          </Button>
        ))}
      </nav>

      {PANELS.filter((panel) => open[panel.id]).map((panel) => (
        <MockDataPanel
          key={panel.id}
          id={panel.id}
          title={panel.title}
          start={panel.start}
          width={panel.width}
          onHide={() => setOpen((current) => ({ ...current, [panel.id]: false }))}
        >
          {panel.content}
        </MockDataPanel>
      ))}
    </>
  );
}
