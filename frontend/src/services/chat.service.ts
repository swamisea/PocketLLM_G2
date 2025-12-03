import {type ChatRequest, SendChatResponse} from "@common/types/chat";
import { apiClient } from "../lib/apiClient";

export async function sendChat(
  payload: ChatRequest
): Promise<SendChatResponse> {
  const { data } = await apiClient.post<SendChatResponse>("/api/chat", payload);
  return data;
}
