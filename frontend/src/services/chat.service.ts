import { SendChatResponse } from "@common/types/chat";
import { apiClient } from "../lib/apiClient";

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
