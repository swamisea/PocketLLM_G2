import type { TelemetryEvent } from "@common/types/telemetry";
import { apiClient } from "../lib/apiClient";

export async function fetchTelemetry(limit = 100): Promise<TelemetryEvent[]> {
  const { data } = await apiClient.get<{ events: TelemetryEvent[] }>(
    `/api/telemetry`,
    { params: { limit } }
  );
  return data.events || [];
}
