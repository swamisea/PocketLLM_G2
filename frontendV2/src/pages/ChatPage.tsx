import React, {useEffect, useMemo, useRef, useState,} from "react";
import {Badge, Button, Group, Paper, ScrollArea, Stack, Text, Textarea,} from "@mantine/core";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useDispatch, useSelector} from "react-redux";
import {useNavigate, useParams} from "react-router";

import type {ChatMessage} from "@common/types/chat";
import {createSession, getSession} from "../services/sessions.service";
import {sendChat} from "../services/chat.service";
import {queryKeys} from "../lib/queryKeys";
import type {RootState} from "../store";
import {clearDraftSession, setSelectedSessionId,} from "../store/sessionsSlice";

type Status = "idle" | "thinking";

const ChatPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {sessionId: urlSessionId} = useParams<{ sessionId?: string }>();

  const {selectedId, draft} = useSelector(
    (state: RootState) => state.sessions
  );
  const effectiveSessionId = selectedId ?? urlSessionId;

  const isDraftSession =
    !!draft && effectiveSessionId === draft.id && draft.local;

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [showThinkingBubble, setShowThinkingBubble] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Keep Redux selectedId in sync with URL
  useEffect(() => {
    if (urlSessionId) {
      dispatch(setSelectedSessionId(urlSessionId));
    } else {
      dispatch(setSelectedSessionId(undefined));
    }
  }, [dispatch, urlSessionId]);

  // Load messages when a persisted session is selected
  const {data: sessionData, isLoading: loadingSession} = useQuery({
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
      // For a new draft, start empty
      setMessages([]);
      return;
    }

    if (sessionData?.messages) {
      setMessages(sessionData.messages);
    }
  }, [effectiveSessionId, isDraftSession, sessionData]);

  // Auto-scroll to bottom whenever messages change or session changes
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, effectiveSessionId]);

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

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setInput("");

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmed,
    };

    // Show user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setStatus("thinking");
    setShowThinkingBubble(true);

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
        navigate(`/sessions/${session.id}`, {replace: true});
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessions.list(),
        });
      }

      // Now send the chat message
      const result = await chatMutation.mutateAsync({
        message: trimmed,
        sessionId: targetSessionId,
      });

      setShowThinkingBubble(false);
      setMessages((prev) => [...prev, result.reply]);
    } catch (e) {
      // On error, hide thinking bubble but keep user message in history
      setShowThinkingBubble(false);
      console.error(e);
    } finally {
      setStatus("idle");
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLoading = loadingSession || createSessionMutation.isPending;

  const headerStatusLabel = useMemo(
    () => (status === "idle" ? "Idle" : "Thinking…"),
    [status]
  );

  const headerStatusColor = status === "idle" ? "gray" : "yellow";

  const canSend = input.trim().length > 0 && status !== "thinking";

  return (
    <Paper
      shadow="sm"
      radius="md"
      p="md"
      style={{height: "100%", display: "flex", flexDirection: "column"}}
    >
      {/* Header row - title + status pill */}
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Pocket LLM Chat</Text>
        <Badge
          radius="xl"
          variant={status === "idle" ? "light" : "filled"}
          color={headerStatusColor}
        >
          {headerStatusLabel}
        </Badge>
      </Group>

      {/* Chat body */}
      <Paper
        withBorder
        radius="md"
        p="md"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <ScrollArea style={{flex: 1}} viewportRef={viewportRef}>
          <Stack>
            {isLoading && !messages.length && (
              <Text size="sm" c="dimmed">
                Loading conversation…
              </Text>
            )}

            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <Group
                  key={idx}
                  justify={isUser ? "flex-end" : "flex-start"}
                >
                  <Paper
                    radius="lg"
                    px="md"
                    py="xs"
                    shadow="xs"
                    withBorder={!isUser}
                    bg={isUser ? "blue.6" : "gray.1"}
                    c={isUser ? "white" : "dark"}
                    maw="75%"
                  >
                    <Text size="sm">{m.content}</Text>
                  </Paper>
                </Group>
              );
            })}

            {/* 3-dot loading bubble when model is thinking */}
            {showThinkingBubble && (
              <Group justify="flex-start">
                <Paper
                  radius="lg"
                  px="md"
                  py="xs"
                  shadow="xs"
                  withBorder
                  bg="gray.1"
                  maw="40%"
                >
                  <Text size="lg">...</Text>
                </Paper>
              </Group>
            )}
          </Stack>
        </ScrollArea>

        {/* Input area, similar positioning to old page */}
        <Group align="flex-end" mt="md">
          <Textarea
            autosize
            minRows={2}
            maxRows={4}
            style={{flex: 1}}
            placeholder="Send a message..."
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
          />
          <Button onClick={handleSend} disabled={!canSend}>
            Send
          </Button>
        </Group>
      </Paper>
    </Paper>
  );
};

export default ChatPage;
