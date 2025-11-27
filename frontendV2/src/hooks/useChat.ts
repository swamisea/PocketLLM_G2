import {useEffect, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useDispatch} from "react-redux";
import {useNavigate} from "react-router";

import type {ChatMessage} from "@common/types/chat";
import {createSession, getSession} from "../services/sessions.service";
import {sendChat} from "../services/chat.service";
import {queryKeys} from "../lib/queryKeys";
import { setSelectedSessionId } from "../store/sessionsSlice";

interface UseChatArgs {
  effectiveSessionId?: string;
}

interface UseChatResult {
  messages: ChatMessage[];
  isThinking: boolean;
  isLoadingSession: boolean;
  sendMessage: (text: string) => Promise<void>;
}

export function useChat({
                          effectiveSessionId,
                        }: UseChatArgs): UseChatResult {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  // Load messages for persisted sessions
  const { data: sessionData, isLoading: isLoadingSession } = useQuery({
    queryKey:
      effectiveSessionId
        ? queryKeys.sessions.byId(effectiveSessionId)
        : ["session", "none"],
    queryFn: () => getSession(effectiveSessionId as string),
    enabled: !!effectiveSessionId,
  });

  useEffect(() => {
    if (!effectiveSessionId) {
      setMessages([]);
      return;
    }

    if (sessionData?.messages) {
      setMessages(sessionData.messages);
    }
  }, [effectiveSessionId, sessionData]);

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
      // Now send the chat message
      const result = await chatMutation.mutateAsync({
        message: trimmed,
        sessionId: effectiveSessionId,
      });

      setMessages((prev) => [...prev, result.reply]);

      if (!effectiveSessionId && result.sessionId) {
        dispatch(setSelectedSessionId(result.sessionId));
        navigate(`/chat/${result.sessionId}`, { replace: true });
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.list(),
        });
      }

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
