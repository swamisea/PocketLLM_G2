import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";

import type { ChatMessage } from "@common/types/chat";
import { createSession, getSession } from "../services/sessions.service";
import { sendChat } from "../services/chat.service";
import { queryKeys } from "../lib/queryKeys";
import {clearDraftSession, SessionListItem, setSelectedSessionId} from "../store/sessionsSlice";

type DraftSession = {
  id: string;
  title?: string;
  local?: boolean;
} | null;

interface UseChatArgs {
  effectiveSessionId?: string;
  draft?: SessionListItem | null;
}

interface UseChatResult {
  messages: ChatMessage[];
  isThinking: boolean;
  isLoadingSession: boolean;
  sendMessage: (text: string) => Promise<void>;
}

export function useChat({
                          effectiveSessionId,
                          draft,
                        }: UseChatArgs): UseChatResult {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isDraftSession =
    !!draft && effectiveSessionId === draft.id && draft.local;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  // Load messages for persisted sessions
  const { data: sessionData, isLoading: isLoadingSession } = useQuery({
    queryKey:
      effectiveSessionId && !isDraftSession
        ? queryKeys.sessions.byId(effectiveSessionId)
        : ["session", "none"],
    queryFn: () => getSession(effectiveSessionId as string),
    enabled: !!effectiveSessionId && !isDraftSession,
  });

  useEffect(() => {
    if (!effectiveSessionId) {
      setMessages([]);
      return;
    }

    if (isDraftSession) {
      setMessages([]);
      return;
    }

    if (sessionData?.messages) {
      setMessages(sessionData.messages);
    }
  }, [effectiveSessionId, isDraftSession, sessionData]);

  const createSessionMutation = useMutation({
    mutationFn: (title?: string) => createSession(title),
  });

  const chatMutation = useMutation({
    mutationFn: ({
                   message,
                   sessionId,
                 }: {
      message: string;
      sessionId?: string;
    }) => sendChat(message, sessionId),
  });

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmed,
    };

    // Show user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    try {
      let targetSessionId = effectiveSessionId;

      // If this is a draft / no-session yet, create it first
      if (!targetSessionId || isDraftSession) {
        const titleFromMessage =
          trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed;
        const session = await createSessionMutation.mutateAsync(
          draft?.title || titleFromMessage
        );
        targetSessionId = session.id;

        // Clear draft and update selection + URL and sessions list
        dispatch(clearDraftSession());
        dispatch(setSelectedSessionId(session.id));
        navigate(`/sessions/${session.id}`, { replace: true });
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.list(),
        });
      }

      // Now send the chat message
      const result = await chatMutation.mutateAsync({
        message: trimmed,
        sessionId: targetSessionId,
      });

      setMessages((prev) => [...prev, result.reply]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsThinking(false);
    }
  };

  return {
    messages,
    isThinking,
    isLoadingSession,
    sendMessage,
  };
}
