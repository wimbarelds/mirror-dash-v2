import { Bussen } from './components/Bussen';
import { CurrentDateTime } from './components/CurrentDateTime';
import { WeatherDay } from './components/WeatherDay';
import { WeatherForecast } from './components/WeatherForecast';

function App() {
  return (
    <div className="absolute inset-4">
      <div className="absolute top-0 left-0">
        <Bussen />
      </div>
      <div className="absolute top-0 right-0">
        <CurrentDateTime />
      </div>
      <div className="absolute bottom-0 left-0 flex w-full items-end gap-4">
        <WeatherDay />
        <WeatherDay dayOffset={1} />
        <div className="relative flex-1 text-xs">
          <div className="absolute right-0 bottom-0 left-0">
            <WeatherForecast />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
