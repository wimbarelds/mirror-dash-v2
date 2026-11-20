import { Bussen } from './components/Bussen';
import { CurrentDateTime } from './components/CurrentDateTime';
import { WeatherCurrent } from './components/WeatherCurrent';
import { WeatherDay } from './components/WeatherDay';
import { WeatherForecast } from './components/WeatherForecast';

/**
 * Anything unused stays black: the screen sits behind a two-way mirror, so black is transparent.
 * Content hugs the edges and the middle is left empty for the reflection.
 */
function App() {
  return (
    <main className="fixed inset-0 grid grid-cols-[auto_1fr] grid-rows-[auto_1fr_auto] px-18 pt-9 pb-13">
      <CurrentDateTime />
      <div className="justify-self-end pt-7">
        <Bussen />
      </div>
      <div className="col-span-2 row-start-3 flex items-end justify-between gap-16">
        <div className="w-[35rem]">
          <WeatherCurrent />
          <div className="mt-[1.875rem] flex gap-[3.75rem]">
            <WeatherDay />
            <WeatherDay dayOffset={1} />
          </div>
        </div>
        <div className="w-[71.875rem]">
          <WeatherForecast />
        </div>
      </div>
    </main>
  );
}

export default App;
