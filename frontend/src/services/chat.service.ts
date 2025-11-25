import type { ChatMessage } from "@common/types/chat";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function sendChat(
  message: string,
  sessionId?: string
): Promise<{ reply: ChatMessage; sessionId?: string }> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data as { reply: ChatMessage; sessionId?: string };
}
