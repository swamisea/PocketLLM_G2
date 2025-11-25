import type { SessionItem, Session } from "@common/types/session";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function listSessions(): Promise<SessionItem[]> {
  const res = await fetch(`${API_URL}/api/sessions`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.sessions || [];
}

export async function createSession(title?: string): Promise<Session> {
  const res = await fetch(`${API_URL}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.session as Session;
}

export async function getSession(sessionId: string): Promise<Session> {
  const res = await fetch(`${API_URL}/api/sessions/${sessionId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.session as Session;
}
