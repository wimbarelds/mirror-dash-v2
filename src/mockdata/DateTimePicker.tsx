import { ButtonGroup, MONTHS, Section } from './ui';

interface Props {
  at: number;
  onChange: (at: number) => void;
}

const daysIn = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

/** Month as a block of buttons, day and hour as sliders. The year is that of the dataset. */
export function DateTimePicker({ at, onChange }: Props) {
  const date = new Date(at);
  const [year, month, day, hour] = [
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
  ];

  const change = (patch: { month?: number; day?: number; hour?: number }) => {
    const nextMonth = patch.month ?? month;
    const nextDay = Math.min(patch.day ?? day, daysIn(year, nextMonth));
    onChange(new Date(year, nextMonth, nextDay, patch.hour ?? hour, date.getMinutes()).getTime());
  };

  return (
    <div className="flex flex-col gap-4">
      <Section title={`Maand (${year})`}>
        <ButtonGroup
          columns={6}
          options={MONTHS.map((label, index) => ({ value: String(index), label }))}
          value={String(month)}
          onChange={(value) => change({ month: Number(value) })}
        />
      </Section>
      <Section title="Dag">
        <label className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={daysIn(year, month)}
            value={day}
            onChange={(event) => change({ day: Number(event.target.value) })}
            className="flex-1"
          />
          <span className="w-8 text-right tabular-nums">{day}</span>
        </label>
      </Section>
      <Section title="Uur">
        <label className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={23}
            value={hour}
            onChange={(event) => change({ hour: Number(event.target.value) })}
            className="flex-1"
          />
          <span className="w-8 text-right tabular-nums">{hour}</span>
        </label>
      </Section>
    </div>
  );
}
