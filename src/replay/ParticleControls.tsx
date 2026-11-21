import { useEffect, useState } from 'react';

import {
  defaultPrecipitationConfig,
  PrecipitationConfig,
} from '../components/WeatherGraph/precipitation-config';
import { useParticleSettings } from './particle-settings';

type NumericKey = {
  [K in keyof PrecipitationConfig]: PrecipitationConfig[K] extends number ? K : never;
}[keyof PrecipitationConfig];

interface Slider {
  key: NumericKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

const GROUPS: { title: string; sliders: Slider[] }[] = [
  {
    title: 'Grootte',
    sliders: [
      { key: 'drawScale', label: 'Deeltjesgrootte', min: 0.2, max: 1.4, step: 0.01 },
      { key: 'largestSize', label: 'Grootste ruimte', min: 3, max: 16, step: 0.1 },
      { key: 'smallestSize', label: 'Kleinste ruimte', min: 1, max: 6, step: 0.1 },
      { key: 'sizeVariation', label: 'Variatie per klasse', min: 0, max: 0.6, step: 0.01 },
      { key: 'maxSizeShare', label: 'Max. deel van breedte', min: 0.1, max: 0.6, step: 0.01 },
    ],
  },
  {
    title: 'Dichtheid',
    sliders: [
      { key: 'spacing', label: 'Tussenruimte', min: 0.8, max: 2, step: 0.01 },
      { key: 'edgeMargin', label: 'Randmarge', min: 0, max: 6, step: 0.1 },
      { key: 'fill', label: 'Opvulling', min: 0.3, max: 4, step: 0.1 },
    ],
  },
  {
    title: 'Streep',
    sliders: [
      { key: 'minThickness', label: 'Min. breedte', min: 4, max: 40, step: 1 },
      { key: 'maxThickness', label: 'Max. breedte', min: 20, max: 120, step: 1 },
      { key: 'thicknessPerRootMm', label: 'Breedte per √mm', min: 0, max: 80, step: 1 },
      { key: 'minChance', label: 'Min. kans (%)', min: 0, max: 80, step: 1 },
      { key: 'backgroundOpacity', label: 'Achtergrond', min: 0, max: 0.4, step: 0.01 },
    ],
  },
  {
    title: 'Vormen',
    sliders: [
      { key: 'speckBelow', label: 'Stipje tot', min: 1, max: 12, step: 0.1 },
      { key: 'asteriskBelow', label: 'Sterretje tot', min: 1, max: 12, step: 0.1 },
      { key: 'starBelow', label: 'Ster tot (daarna kristal)', min: 1, max: 14, step: 0.1 },
      { key: 'dropSpeckBelow', label: 'Druppel wordt stip tot', min: 1, max: 10, step: 0.1 },
      { key: 'dendriteShare', label: 'Aandeel dendriet (vs. varen)', min: 0, max: 1, step: 0.05 },
      { key: 'flakeLineWidth', label: 'Lijndikte vlok', min: 0.3, max: 3, step: 0.05 },
    ],
  },
];

const decimals = (step: number) => (step < 0.1 ? 2 : step < 1 ? 1 : 0);

/** The settings that differ from the defaults, ready to paste somewhere */
function changedSettings(config: PrecipitationConfig) {
  return Object.fromEntries(
    Object.entries(config).filter(
      ([key, value]) => value !== defaultPrecipitationConfig[key as keyof PrecipitationConfig],
    ),
  );
}

/**
 * A temporary panel for trying out how precipitation is drawn, on the replay page only. Press P to
 * show or hide it. Settings are remembered in this browser; "Kopieer" gives what differs from the
 * defaults.
 */
export function ParticleControls() {
  const { config, update, reset } = useParticleSettings();
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement).tagName;
      if (event.key === 'p' && tag !== 'INPUT' && tag !== 'TEXTAREA')
        setOpen((current) => !current);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const changed = JSON.stringify(changedSettings(config), null, 2);

  const copy = () => {
    navigator.clipboard?.writeText(changed).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => undefined,
    );
  };

  if (!open) return null;

  const button =
    'cursor-pointer rounded-md border border-white/25 bg-white/10 px-3 py-1 hover:bg-white/20';

  return (
    <aside className="fixed top-4 right-4 bottom-[26rem] flex w-[26rem] flex-col gap-3 overflow-y-auto rounded-xl border border-white/15 bg-neutral-900/95 p-4 text-[0.9rem] text-white">
      <header className="flex items-baseline justify-between">
        <h2 className="text-base font-medium">Deeltjes</h2>
        <span className="text-white/50">P verbergt dit paneel</span>
      </header>

      {GROUPS.map((group) => (
        <section key={group.title} className="flex flex-col gap-2">
          <h3 className="text-white/60">{group.title}</h3>
          {group.sliders.map((slider) => (
            <label key={slider.key} className="flex flex-col gap-0.5">
              <span className="flex justify-between">
                <span>{slider.label}</span>
                <span className="tabular-nums">
                  {config[slider.key].toFixed(decimals(slider.step))}
                </span>
              </span>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={config[slider.key]}
                onChange={(event) => update({ [slider.key]: Number(event.target.value) })}
              />
            </label>
          ))}
        </section>
      ))}

      <section className="flex flex-col gap-2">
        <h3 className="text-white/60">Kleuren en verdeling</h3>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            Regen
            <input
              type="color"
              value={config.rainColor}
              onChange={(event) => update({ rainColor: event.target.value })}
            />
          </label>
          <label className="flex items-center gap-2">
            Sneeuw
            <input
              type="color"
              value={config.snowColor}
              onChange={(event) => update({ snowColor: event.target.value })}
            />
          </label>
          <button
            type="button"
            className={button}
            onClick={() => update({ seed: config.seed + 1 })}
          >
            Nieuwe verdeling ({config.seed})
          </button>
        </div>
      </section>

      <footer className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button type="button" className={button} onClick={reset}>
            Standaard
          </button>
          <button type="button" className={button} onClick={copy}>
            {copied ? 'Gekopieerd' : 'Kopieer instellingen'}
          </button>
        </div>
        <details>
          <summary className="cursor-pointer text-white/60">Wat anders is dan standaard</summary>
          <pre className="mt-1 text-xs whitespace-pre-wrap text-white/70">{changed}</pre>
        </details>
      </footer>
    </aside>
  );
}
