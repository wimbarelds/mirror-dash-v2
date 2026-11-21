import { DataPart, SimulatedError, useMockData } from './mockdata-context';
import { ButtonGroup, Section } from './ui';

const OPTIONS: { value: SimulatedError; label: string }[] = [
  { value: 'none', label: 'Geen' },
  { value: 'cors', label: 'CORS' },
  { value: '404', label: '404' },
  { value: '500', label: '500' },
];

/** Makes requests for a part of the screen fail */
export function ErrorPicker({ part }: { part: DataPart }) {
  const { errors, setError } = useMockData();

  return (
    <Section title="Fout simuleren">
      <ButtonGroup
        options={OPTIONS}
        value={errors[part]}
        onChange={(error) => setError(part, error)}
      />
    </Section>
  );
}
