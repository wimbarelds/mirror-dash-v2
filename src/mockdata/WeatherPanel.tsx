import { useMemo, useState } from 'react';

import { DateTimePicker } from './DateTimePicker';
import { ErrorPicker } from './ErrorPicker';
import { getHighlights, seasonOf, SEASONS } from './highlights';
import { useMockData } from './mockdata-context';
import { Button, ButtonGroup, MONTHS, Section } from './ui';

const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString();

/** Pick a notable day in a season, or an exact date and time */
export function WeatherPanel() {
  const { at, setAt, setPlaying } = useMockData();
  const [exact, setExact] = useState(false);
  const [season, setSeason] = useState(() => seasonOf(new Date(at).getMonth()));
  const highlights = useMemo(() => getHighlights(), []);

  const choose = (next: number) => {
    setPlaying(false);
    setAt(next);
  };

  return (
    <>
      <ButtonGroup
        options={[
          { value: 'seasons', label: 'Seizoenen' },
          { value: 'exact', label: 'Datum en tijd' },
        ]}
        value={exact ? 'exact' : 'seasons'}
        onChange={(value) => setExact(value === 'exact')}
      />

      {exact ? (
        <DateTimePicker at={at} onChange={choose} />
      ) : (
        <>
          <ButtonGroup
            options={SEASONS.map(({ id, label }) => ({ value: id, label }))}
            value={season}
            onChange={setSeason}
          />
          <Section title={`Opvallende dagen · ${SEASONS.find((s) => s.id === season)?.months}`}>
            <div className="grid grid-cols-2 gap-2">
              {highlights[season].map((highlight) => {
                const date = new Date(highlight.at);
                return (
                  <Button
                    key={highlight.label}
                    active={sameDay(highlight.at, at)}
                    onClick={() => choose(highlight.at)}
                    className="flex flex-col items-start leading-tight"
                  >
                    {highlight.label}
                    <small className="opacity-60">
                      {date.getDate()} {MONTHS[date.getMonth()]}
                    </small>
                  </Button>
                );
              })}
            </div>
          </Section>
        </>
      )}

      <ErrorPicker part="weather" />
    </>
  );
}
