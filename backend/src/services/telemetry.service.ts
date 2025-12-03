import { TelemetryEvent, TelemetryEventType } from "@common/types/telemetry";
import { getCollection } from "./database.service";

type TelemetryInput = Omit<TelemetryEvent, "createdAt">;

export async function logTelemetry(event: TelemetryInput) {
  try {
    const telemetry = getCollection<TelemetryEvent>("telemetry");
    const doc: TelemetryEvent = {
      ...event,
      createdAt: new Date().toISOString(),
    };
    await telemetry.insertOne(doc as any);
  } catch (err) {
    console.error("Telemetry log failed:", err);
  }
}

export async function recentTelemetry(limit = 50) {
  const telemetry = getCollection<TelemetryEvent>("telemetry");
  return telemetry
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}
