import { ErrorPicker } from './ErrorPicker';

/** The bus board only has the simulated errors; its times are made up around the clock */
export function BusPanel() {
  return (
    <>
      <p className="text-sm text-white/60">
        Bussen zijn voorbeeldtijden: twee per uur, vanaf het gekozen moment.
      </p>
      <ErrorPicker part="buses" />
    </>
  );
}
