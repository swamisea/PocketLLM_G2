export type TelemetryEventType =
  | "cache_hit"
  | "cache_miss"
  | "chat_response"
  | "chat_error";

export interface TelemetryEvent {
  eventType: TelemetryEventType;
  userId?: string;
  sessionId?: string;
  model?: string;
  temperature?: number;
  cacheHit?: boolean;
  durationMs?: number;
  promptChars?: number;
  responseChars?: number;
  errorMessage?: string;
  createdAt: string; // ISO
}
