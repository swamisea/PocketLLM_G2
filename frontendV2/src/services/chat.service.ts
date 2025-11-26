import { apiClient } from "../lib/apiClient";
import type { ChatMessage } from "../hooks/useChat";

export interface SendChatResponse {
  reply: ChatMessage;
  sessionId?: string;
}

export async function sendChat(
  message: string,
  sessionId?: string
): Promise<SendChatResponse> {
  const { data } = await apiClient.post<SendChatResponse>("/api/chat", {
    message,
    sessionId,
  });
  return data;
}
