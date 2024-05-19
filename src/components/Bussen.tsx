import { useQuery } from '@tanstack/react-query';
import { getOVData } from '../util/ov/fetch-ov';
import { z } from 'zod';
import { TimingPointSchema } from '../util/ov/schema';
import BusIcon from '../assets/Bus_stop_symbol.svg';
import { useEffect, useMemo, useState } from 'react';

type DataRaw = z.infer<typeof TimingPointSchema>;
type BusPass = ReturnType<typeof mapBusPass>[number];

function mapBusPass(data: DataRaw) {
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
    .filter((item) => item.ExpectedDepartureTime.getTime() > Date.now());
}

function timeDiff(diff: number) {
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (seconds < 100) return `${seconds} seconden`;
  if (minutes < 100) return `${minutes} minuten`;
  return `${hours} uur`;
}

function formatTime(date: Date) {
  const formatter = new Intl.DateTimeFormat(import.meta.env.VITE_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return formatter.format(date);
}

function getRiskClass(timeLeft: number) {
  if (timeLeft < 90000) return 'text-red-500 font-bold';
  if (timeLeft < 5 * 60 * 1000) return 'text-orange-500 font-bold';
  if (timeLeft < 15 * 60 * 1000) return 'text-yellow-500';
  if (timeLeft > 60 * 60 * 1000) return 'text-white opacity-50';
  return 'text-white';
}

const getTimeLeft = (departure: Date) => departure.getTime() - Date.now();

function Bus({ ExpectedDepartureTime }: BusPass) {
  const [timeLeft, setTimeleft] = useState(() =>
    getTimeLeft(ExpectedDepartureTime),
  );

  useEffect(() => {
    let delay = 60 * 60 * 1000; // 1 hour
    if (timeLeft < 100 * 1000)
      delay = (timeLeft % 1000) + 1; // < 100s = next second
    else if (timeLeft < 100 * 60000)
      delay = (timeLeft % 60000) + 1; // <100m = next minute
    else delay = (timeLeft % 3600000) + 1; // >100m = next hour

    const timeout = setTimeout(
      () => setTimeleft(() => getTimeLeft(ExpectedDepartureTime)),
      delay,
    );
    return () => clearTimeout(timeout);
  }, [ExpectedDepartureTime, timeLeft]);

  const { riskClassName, timeStr, remainingStr } = useMemo(() => {
    return {
      riskClassName: getRiskClass(timeLeft),
      timeStr: formatTime(ExpectedDepartureTime),
      remainingStr: timeDiff(timeLeft),
    };
  }, [timeLeft, ExpectedDepartureTime]);

  return (
    <div
      className={`${riskClassName} flex items-center text-4xl gap-2 text-nowrap`}
    >
      <img src={BusIcon} alt="" className="w-[60px]" />
      <div className="w-[10ch] text-center">{timeStr}</div>
      <div>{remainingStr}</div>
    </div>
  );
}

export function Bussen() {
  const {
    isLoading,
    isError,
    data: bussen,
  } = useQuery({
    queryKey: ['ovdata'],
    queryFn: getOVData,
    refetchInterval: 2 * 60 * 1000, // 2 minuten
    select: (data) => mapBusPass(data),
  });

  if (!bussen) {
    if (isError) return 'Er is een fout opgetreden bij het ophalen van de data';
    if (isLoading) return 'Bezig met ophalen van bus-ritten';
    return 'Geen error, maar ook geen data...';
  }

  return bussen.map((bus) => <Bus key={bus.Id} {...bus} />);
}
