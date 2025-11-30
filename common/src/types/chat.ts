export type Role = "user" | "assistant";

export interface ChatMessage {
  id?: string;
  role: Role;
  content: string;
  createdAt?: string; // ISO string
}

export interface SendChatResponse {
  reply: ChatMessage;
  sessionId?: string;
}

export interface ChatRequest {
  message: string;
  messageObj?: ChatMessage;
  sessionId?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
}