import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { sendChat } from "../services/chat.service";

export interface ChatMessage {
  role: "user" | "assistant" | string;
  content: string;
}

export function useChat(initialMessages: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const chatMutation = useMutation({
    mutationKey: queryKeys.chat.bySession("new"),
    mutationFn: (params: { message: string; sessionId?: string }) =>
      sendChat(params.message, params.sessionId),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, data.reply]);
    },
  });

  const sendMessage = useCallback(
    (message: string, sessionId?: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      setMessages((prev) => [
        ...prev,
        { role: "user", content: trimmed } as ChatMessage,
      ]);
      chatMutation.mutate({ message: trimmed, sessionId });
    },
    [chatMutation]
  );

  return {
    messages,
    sendMessage,
    isLoading: chatMutation.isPending,
  };
}
