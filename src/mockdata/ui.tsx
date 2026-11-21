import clsx from 'clsx';
import { ReactNode } from 'react';

export const MONTHS = [
  'jan',
  'feb',
  'mrt',
  'apr',
  'mei',
  'jun',
  'jul',
  'aug',
  'sep',
  'okt',
  'nov',
  'dec',
];

export const pad = (value: number) => String(value).padStart(2, '0');

export const HOUR = 60 * 60 * 1000;

export function addDays(at: number, days: number) {
  const date = new Date(at);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

export function Button({
  children,
  onClick,
  active,
  label,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        'cursor-pointer rounded-md border border-white/25 px-3 py-1.5 whitespace-nowrap hover:bg-white/20',
        active ? 'bg-white text-black hover:bg-white/80' : 'bg-white/10',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Buttons joined into one block, of which one is chosen */
export function ButtonGroup<T extends string>({
  options,
  value,
  onChange,
  columns,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Wraps into rows of this many; by default everything is on one row */
  columns?: number;
}) {
  return (
    <div
      className="grid gap-px overflow-hidden rounded-md border border-white/25 bg-white/25"
      style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={clsx(
            'cursor-pointer px-2 py-1.5 text-center',
            option.value === value ? 'bg-white text-black' : 'bg-neutral-800 hover:bg-neutral-700',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm text-white/55">{title}</h3>
      {children}
    </section>
  );
}
