import {Session, SessionItem } from "@common/types/session";
import { apiClient } from "../lib/apiClient";
import type { ChatSessionExport } from "@common/types/export";

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

export async function exportSession(sessionId: string): Promise<ChatSessionExport> {
  const { data } = await apiClient.get<ChatSessionExport>(
    `/api/sessions/${sessionId}/export`
  );
  return data;
}

export async function importSession(payload: ChatSessionExport): Promise<Session> {
  const { data } = await apiClient.post<{ session: Session }>(
    `/api/sessions/import`,
    payload
  );
  return data.session;
}
