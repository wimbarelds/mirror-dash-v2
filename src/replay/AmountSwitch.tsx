import clsx from 'clsx';
import { ReactNode, useState } from 'react';

import { AmountStyle, AmountStyleContext } from '../components/WeatherGraph/precipitation-amount';

const OPTIONS: { value: AmountStyle; label: string }[] = [
  { value: 'none', label: 'Geen' },
  { value: 'size', label: 'Stipgrootte' },
  { value: 'steps', label: '3 maten' },
  { value: 'bars', label: 'Staafjes' },
  { value: 'labels', label: 'Hoeveelheid' },
];

/**
 * Temporary: lets the replay page switch how the amount of precipitation is shown, to compare
 * designs. Provides the choice to the graph.
 */
export function AmountSwitch({ children }: { children: ReactNode }) {
  const [style, setStyle] = useState<AmountStyle>('none');

  return (
    <AmountStyleContext.Provider value={style}>
      {children}
      <div className="fixed top-[24rem] left-8 flex flex-col gap-2 rounded-xl border border-white/15 bg-neutral-900/95 p-3 text-[0.9rem] text-white">
        <span className="text-white/60">Hoeveelheid neerslag</span>
        <div className="flex gap-2">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStyle(option.value)}
              className={clsx(
                'cursor-pointer rounded-md border border-white/25 px-3 py-1.5 whitespace-nowrap hover:bg-white/20',
                style === option.value ? 'bg-white text-black hover:bg-white/80' : 'bg-white/10',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </AmountStyleContext.Provider>
  );
}
