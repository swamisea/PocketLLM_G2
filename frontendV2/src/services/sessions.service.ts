import { apiClient } from "../lib/apiClient";

export interface SessionItem {
  id: string;
  title?: string;
  createdAt?: string;
}

export interface Session extends SessionItem {
  messages?: unknown[];
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
