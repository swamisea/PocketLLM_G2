import type { ChatMessage } from "./chat";

export interface ChatSessionExportMeta {
  format: "pocketllm.chat";
  version: "1.0";
  exportedAt: string; // ISO
  sessionId?: string;
  title?: string;
  userId?: string;
  model?: string;
  temperature?: number;
  createdAt?: string;
}

export interface ChatSessionExport {
  meta: ChatSessionExportMeta;
  messages: ChatMessage[];
}
