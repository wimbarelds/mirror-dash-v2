import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { ReactNode, useEffect, useReducer } from 'react';

import { useDataSources } from '../data-sources';
import { FETCH_INTERVAL, FILTER_MAX_TIME_ELAPSED, MAX_BUSSES } from '../util/ov/constants';
import { isOVCorsError } from '../util/ov/ov-cors-error';
import { TimingPoint } from '../util/ov/schema';
import { formatTime } from '../util/time';

type BusPass = ReturnType<typeof mapBusPass>[number];

function mapBusPass(data: TimingPoint, now: number) {
  return Object.entries(data.Passes)
    .map(([id, pass]) => ({ Id: id, ...pass }))
    .sort((a, b) => a.ExpectedArrivalTime.localeCompare(b.ExpectedArrivalTime))
    .map((bus) => ({
      ...bus,
      ExpectedArrivalTime: new Date(bus.ExpectedArrivalTime),
      ExpectedDepartureTime: new Date(bus.ExpectedDepartureTime),
      TargetArrivalTime: new Date(bus.TargetArrivalTime),
      TargetDepartureTime: new Date(bus.TargetDepartureTime),
    }))
    .filter((item) => item.ExpectedDepartureTime.getTime() > now)
    .slice(0, MAX_BUSSES);
}

function timeDiff(diff: number) {
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (seconds < 100) return { value: seconds, unit: 'sec' };
  if (minutes < 100) return { value: minutes, unit: 'min' };
  return { value: hours, unit: 'uur' };
}

function getRiskClass(timeLeft: number) {
  if (timeLeft < 90000) return 'text-red-500';
  if (timeLeft < 5 * 60 * 1000) return 'text-orange-500';
  if (timeLeft < 15 * 60 * 1000) return 'text-yellow-500';
  if (timeLeft > 60 * 60 * 1000) return 'text-white opacity-50';
  return 'text-white';
}

function Bus({
  ExpectedDepartureTime,
  LinePublicNumber,
  DestinationName50,
  next,
}: BusPass & { next: boolean }) {
  const { now } = useDataSources();
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const timeLeft = ExpectedDepartureTime.getTime() - now();

  useEffect(() => {
    let delay = 60 * 60 * 1000; // 1 hour
    if (timeLeft < 100 * 1000) delay = (timeLeft % 1000) + 1; // < 100s = next second
    else if (timeLeft < 100 * 60000) delay = (timeLeft % 60000) + 1; // <100m = next minute
    else delay = (timeLeft % 3600000) + 1; // >100m = next hour

    const timeout = setTimeout(refresh, delay);
    return () => clearTimeout(timeout);
  }, [timeLeft]);

  if (timeLeft < FILTER_MAX_TIME_ELAPSED) return null;

  const riskClassName = getRiskClass(timeLeft);
  const remaining = timeDiff(timeLeft);

  return (
    <div className={clsx(riskClassName, 'flex items-center gap-7 text-nowrap')}>
      <span className="flex h-16 min-w-16 items-center justify-center rounded-2xl border-[3px] px-2 text-[2.125rem] font-normal">
        {LinePublicNumber}
      </span>
      <span className="min-w-[10.625rem] text-[2.125rem] text-white/70">{DestinationName50}</span>
      <span className="w-[6.875rem] text-right text-[2.125rem] text-white/55">
        {formatTime(ExpectedDepartureTime)}
      </span>
      <span
        className={clsx(
          'w-[16.25rem] text-right',
          next ? 'text-[5.75rem] font-normal' : 'text-6xl',
        )}
      >
        {remaining.value}
        <small className="ml-2.5 text-[.42em] opacity-70">{remaining.unit}</small>
      </span>
    </div>
  );
}

function Message({ children }: { children: ReactNode }) {
  return <p className="text-[1.75rem] font-light text-white/50">{children}</p>;
}

export function Bussen() {
  const { key, live, now, fetchBusses } = useDataSources();
  const queryKey = ['ovdata', key];
  const queryClient = useQueryClient();
  const corsBlocked = isOVCorsError(queryClient.getQueryState(queryKey)?.error);

  const {
    isLoading,
    isError,
    data: bussen,
  } = useQuery({
    queryKey,
    queryFn: fetchBusses,
    enabled: !corsBlocked,
    retry: (failureCount, error) => live && !isOVCorsError(error) && failureCount < 3,
    refetchInterval: FETCH_INTERVAL,
    refetchIntervalInBackground: true,
    staleTime: FETCH_INTERVAL,
    // Mock data changes the key for every moment; keep showing the last one meanwhile
    placeholderData: keepPreviousData,
    select: (data) => mapBusPass(data, now()),
  });

  if (corsBlocked)
    return <Message>OV-data kan niet worden opgehaald: geblokkeerd door CORS</Message>;

  if (!bussen) {
    if (isError) return <Message>Er is een fout opgetreden bij het ophalen van de data</Message>;
    if (isLoading) return <Message>Bezig met ophalen van bus-ritten</Message>;
    return <Message>Geen error, maar ook geen data...</Message>;
  }

  return (
    <div className="flex flex-col items-end gap-[1.875rem]">
      {bussen.map((bus, index) => (
        <Bus key={bus.Id} next={index === 0} {...bus} />
      ))}
    </div>
  );
}
