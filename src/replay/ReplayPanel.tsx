import { PointerEvent, ReactNode, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'mirror-dash-replay-panels';

interface Position {
  x: number;
  y: number;
}

/** Whichever panel was used last is on top */
let topLayer = 50;

function readPositions(): Record<string, Position> {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, Position>;
  } catch {
    return {};
  }
}

function savePosition(id: string, position: Position) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...readPositions(), [id]: position }),
    );
  } catch {
    // The position just isn't remembered
  }
}

interface Props {
  id: string;
  title: string;
  /** Where the panel starts, as a share of the window, until it has been moved */
  start: { x: number; y: number };
  /** Width in rem */
  width: number;
  children: ReactNode;
}

/**
 * A panel with a title bar to drag it by, and a button to fold it up to just that bar. Shown and
 * hidden from the toolbar. Where it was put is remembered.
 */
export function ReplayPanel({ id, title, start, width, children }: Props) {
  const [position, setPosition] = useState<Position>(
    () =>
      readPositions()[id] ?? { x: start.x * window.innerWidth, y: start.y * window.innerHeight },
  );
  const [minimized, setMinimized] = useState(false);
  const [layer, setLayer] = useState(() => ++topLayer);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const panel = useRef<HTMLElement>(null);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    drag.current = { dx: event.clientX - position.x, dy: event.clientY - position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!drag.current || !panel.current) return;
    // Keep at least a part of the title bar on screen
    setPosition({
      x: Math.min(
        window.innerWidth - 80,
        Math.max(80 - panel.current.offsetWidth, event.clientX - drag.current.dx),
      ),
      y: Math.min(window.innerHeight - 30, Math.max(0, event.clientY - drag.current.dy)),
    });
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  useEffect(() => savePosition(id, position), [id, position]);

  return (
    <section
      ref={panel}
      onPointerDown={() => setLayer(++topLayer)}
      style={{ left: position.x, top: position.y, width: `${width}rem`, zIndex: layer }}
      className="fixed flex flex-col overflow-hidden rounded-xl border border-white/15 bg-neutral-900/95 text-base text-white shadow-2xl"
    >
      <header
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex cursor-grab touch-none items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2 select-none active:cursor-grabbing"
      >
        <h2 className="font-medium">{title}</h2>
        <button
          type="button"
          aria-label={minimized ? 'Uitklappen' : 'Inklappen'}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => setMinimized((current) => !current)}
          className="flex size-6 cursor-pointer items-center justify-center rounded hover:bg-white/20"
        >
          {minimized ? '+' : '–'}
        </button>
      </header>
      {!minimized && <div className="flex flex-col gap-4 p-4">{children}</div>}
    </section>
  );
}
