import {Session, SessionItem } from "@common/types/session";
import { apiClient } from "../lib/apiClient";

export async function listSessions(): Promise<SessionItem[]> {
  const { data } = await apiClient.get<{ sessions: SessionItem[] }>(
    "/api/sessions"
  );
  return data.sessions ?? [];
}

export async function createSession(title?: string): Promise<Session> {
  const { data } = await apiClient.post<{ session: Session }>(
    "/api/sessions",
    { title }
  );
  return data.session;
}

export async function getSession(sessionId: string): Promise<Session> {
  const { data } = await apiClient.get<{ session: Session }>(
    `/api/sessions/${sessionId}`
  );
  return data.session;
}
