import { HealthDataType } from "open-wearables";

const PRIORITY_HEALTH_TYPES = [
  HealthDataType.Workout,
  HealthDataType.Sleep,
  HealthDataType.DistanceWalkingRunning,
  HealthDataType.HeartRate,
  HealthDataType.RestingHeartRate,
  HealthDataType.HeartRateVariabilitySDNN,
  HealthDataType.ActiveEnergy,
  HealthDataType.BasalEnergy,
  HealthDataType.DistanceCycling,
  HealthDataType.FlightsClimbed,
  HealthDataType.Steps,
];

export const SLEEP_AND_WORKOUT_TYPES = [
  HealthDataType.Workout,
  HealthDataType.Sleep,
];

export const ORDERED_HEALTH_TYPES = [
  ...PRIORITY_HEALTH_TYPES,
  ...Object.values(HealthDataType).filter(
    (type) => !PRIORITY_HEALTH_TYPES.includes(type)
  ),
];
