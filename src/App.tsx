import { Bussen } from './components/Bussen';
import { CurrentDateTime } from './components/CurrentDateTime';
import { WeatherForecast } from './components/WeatherForecast';
import { WeatherDay } from './components/WeatherDay';

function App() {
  return (
    <div className="absolute inset-4">
      <div className="absolute top-0 left-0">
        <Bussen />
      </div>
      <div className="absolute top-0 right-0">
        <CurrentDateTime />
      </div>
      <div className="absolute bottom-0 left-0 w-full flex gap-4 items-end">
        <WeatherDay />
        <WeatherDay dayOffset={1} />
        <div className="flex-1 text-xs relative">
          <div className="absolute left-0 right-0 bottom-0">
            <WeatherForecast />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
