import { Pass, TimingPoint } from '../util/ov/schema';

const STOP_CODE = '10155730';
const STOP = {
  Longitude: 6.5393,
  Latitude: 53.2013,
  TimingPointTown: 'Groningen',
  TimingPointName: 'Winkelcentrum West',
  TimingPointCode: STOP_CODE,
  StopAreaCode: null,
  TimingPointWheelChairAccessible: 'ACCESSIBLE',
  TimingPointVisualAccessible: 'ACCESSIBLE',
};

const pad = (value: number) => String(value).padStart(2, '0');

/** Local time without a timezone, which is how the bus API reports its times */
const localIso = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
  `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

function buildPass(departure: Date, journey: number): Pass {
  const time = localIso(departure);
  return {
    IsTimingStop: true,
    DestinationName50: 'Roden',
    DataOwnerCode: 'QBUZZ',
    OperatorCode: 'QBUZZ',
    FortifyOrderNumber: 0,
    TransportType: 'BUS',
    Latitude: STOP.Latitude,
    Longitude: STOP.Longitude,
    JourneyNumber: journey,
    JourneyPatternCode: 1,
    LocalServiceLevelCode: 1,
    LineDirection: 1,
    OperationDate: time.slice(0, 10),
    TimingPointCode: STOP_CODE,
    WheelChairAccessible: 'ACCESSIBLE',
    LineName: 'Beijum - Roden',
    LinePublicNumber: '4',
    LastUpdateTimeStamp: time,
    DestinationCode: '833',
    ExpectedDepartureTime: time,
    UserStopOrderNumber: 1,
    ProductFormulaType: '0',
    TimingPointName: STOP.TimingPointName,
    LinePlanningNumber: 'Q004',
    TimingPointDataOwnerCode: 'QBUZZ',
    TimingPointTown: STOP.TimingPointTown,
    TripStopStatus: 'PLANNED',
    UserStopCode: STOP_CODE,
    JourneyStopType: 'INTERMEDIATE',
    TargetArrivalTime: time,
    TargetDepartureTime: time,
    ExpectedArrivalTime: time,
    TimingPointWheelChairAccessible: 'ACCESSIBLE',
    TimingPointVisualAccessible: 'ACCESSIBLE',
  };
}

/** A bus at :24 and :53 past every hour from 05:24 until 00:53, so nights show the next morning's bus */
export function buildBusData(at: number): TimingPoint {
  const now = new Date(at);
  const passes: TimingPoint['Passes'] = {};

  for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
    for (let hour = 5; hour <= 24; hour++) {
      for (const minute of [24, 53]) {
        if (hour === 24 && minute > 53) continue;
        const departure = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + dayOffset,
          hour,
          minute,
        );
        if (departure.getTime() <= at || Object.keys(passes).length >= 4) continue;
        passes[`replay_${localIso(departure)}`] = buildPass(departure, Object.keys(passes).length);
      }
    }
  }

  return { Stop: STOP, Passes: passes, GeneralMessages: {} };
}
