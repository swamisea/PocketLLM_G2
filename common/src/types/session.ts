import { ChatMessage } from "./chat";

export interface SessionItem {
  id: string;
  title: string;
  userId: string;
  createdAt?: string; // ISO string
}

export interface Session extends SessionItem {
  messages: ChatMessage[];
}
