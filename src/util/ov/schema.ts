import { z } from 'zod';

const StopSchema = z.object({
  Longitude: z.number(),
  Latitude: z.number(),
  TimingPointTown: z.string(),
  TimingPointName: z.string(),
  TimingPointCode: z.string(),
  StopAreaCode: z.string().nullable(),
  TimingPointWheelChairAccessible: z.string(),
  TimingPointVisualAccessible: z.string(),
});

export const PassSchema = z.object({
  IsTimingStop: z.boolean(),
  DestinationName50: z.string(),
  DataOwnerCode: z.string(),
  OperatorCode: z.string(),
  FortifyOrderNumber: z.number(),
  TransportType: z.string(),
  Latitude: z.number(),
  Longitude: z.number(),
  JourneyNumber: z.number(),
  JourneyPatternCode: z.number(),
  LocalServiceLevelCode: z.number(),
  LineDirection: z.number(),
  OperationDate: z.string(),
  TimingPointCode: z.string(),
  WheelChairAccessible: z.string(),
  LineName: z.string(),
  LinePublicNumber: z.string(),
  LastUpdateTimeStamp: z.string(),
  DestinationCode: z.string(),
  ExpectedDepartureTime: z.string(),
  UserStopOrderNumber: z.number(),
  ProductFormulaType: z.string(),
  TimingPointName: z.string(),
  LinePlanningNumber: z.string(),
  TimingPointDataOwnerCode: z.string(),
  TimingPointTown: z.string(),
  TripStopStatus: z.string(),
  UserStopCode: z.string(),
  JourneyStopType: z.string(),
  TargetArrivalTime: z.string(),
  TargetDepartureTime: z.string(),
  ExpectedArrivalTime: z.string(),
  NumberOfCoaches: z.number().optional(),
  TimingPointWheelChairAccessible: z.string(),
  TimingPointVisualAccessible: z.string(),
});

const GeneralMessagesSchema = z.object({});

export const TimingPointSchema = z.object({
  Stop: StopSchema,
  Passes: z.record(z.string(), PassSchema),
  GeneralMessages: GeneralMessagesSchema,
});

export const OVDataSchema = z.record(z.string(), TimingPointSchema);

// Example usage:
// const data = DataSchema.parse(yourData);
