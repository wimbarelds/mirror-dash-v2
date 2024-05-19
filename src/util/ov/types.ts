export interface Halte {
  Longitude: number;
  Latitude: number;
  TimingPointTown: string;
  TimingPointName: string;
  TimingPointCode: string;
  StopAreaCode: string | null;
  TimingPointWheelChairAccessible: string;
  TimingPointVisualAccessible: string;
}

export interface Pass {
  IsTimingStop: boolean;
  DestinationName50: string;
  DataOwnerCode: string;
  OperatorCode: string;
  FortifyOrderNumber: number;
  TransportType: string;
  Latitude: number;
  Longitude: number;
  JourneyNumber: number;
  JourneyPatternCode: number;
  LocalServiceLevelCode: number;
  LineDirection: number;
  OperationDate: string;
  TimingPointCode: string;
  WheelChairAccessible: string;
  LineName: string;
  LinePublicNumber: string;
  LastUpdateTimeStamp: string;
  DestinationCode: string;
  ExpectedDepartureTime: string;
  UserStopOrderNumber: number;
  ProductFormulaType: string;
  TimingPointName: string;
  LinePlanningNumber: string;
  TimingPointDataOwnerCode: string;
  TimingPointTown: string;
  TripStopStatus: string;
  UserStopCode: string;
  JourneyStopType: string;
  TargetArrivalTime: string;
  TargetDepartureTime: string;
  ExpectedArrivalTime: string;
  NumberOfCoaches?: number;
  TimingPointWheelChairAccessible: string;
  TimingPointVisualAccessible: string;
}

export interface TimingPoint {
  Stop: Halte;
  Passes: Record<string, Pass>;
  GeneralMessages: unknown;
}

export interface OVData {
  [key: string]: TimingPoint;
}
