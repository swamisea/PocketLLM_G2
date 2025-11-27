import { apiClient } from "../lib/apiClient";
import {ChatMessage} from "@common/types/chat";

export interface SessionItem {
  id: string;
  title?: string;
  createdAt?: string;
}

export interface Session extends SessionItem {
  messages?: ChatMessage[];
}

export type LocalSessionItem = SessionItem & { local?: true };

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
