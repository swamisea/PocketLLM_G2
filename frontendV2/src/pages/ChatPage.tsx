import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Container,
  Group,
  Paper,
  Text,
} from "@mantine/core";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router";

import type { RootState } from "../store";
import { setSelectedSessionId } from "../store/sessionsSlice";
import ChatMessages from "../components/chat/ChatMessages";
import ChatInput from "../components/chat/ChatInput";
import { useChat } from "../hooks/useChat";

const ChatPage: React.FC = () => {
  const dispatch = useDispatch();
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>();

  const { selectedId, draft } = useSelector(
    (state: RootState) => state.sessions
  );
  const effectiveSessionId = selectedId ?? urlSessionId;

  // Keep Redux selectedId in sync with URL
  useEffect(() => {
    if (urlSessionId) {
      dispatch(setSelectedSessionId(urlSessionId));
    } else {
      dispatch(setSelectedSessionId(undefined));
    }
  }, [dispatch, urlSessionId]);

  const { messages, isThinking, isLoadingSession, sendMessage } = useChat({
    effectiveSessionId,
    draft,
  });

  const [input, setInput] = useState("");

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    await sendMessage(trimmed);
  };

  const headerStatusLabel = useMemo(
    () => (isThinking ? "Thinking…" : "Idle"),
    [isThinking]
  );

  const canSend = input.trim().length > 0 && !isThinking;

  return (
    <Container
      size="sm"
      p={0}
      h="100%"
      style={{ display: "flex", flexDirection: "column" }}
    >
      {/* Header row - title + status pill */}
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Pocket LLM Chat</Text>
        <Badge
          radius="xl"
          variant="dot"
          color={isThinking ? "yellow" : "gray"}
          style={{ textTransform: "none" }}
        >
          {(isThinking ? "Thinking" : "Idle")}
        </Badge>
      </Group>

      {/* Chat body */}
      <Paper
        withBorder
        radius="md"
        p="md"
        pt={0}
        style={{
          flex: 1, // fill remaining vertical space
          display: "flex",
          flexDirection: "column",
          minHeight: 0, // allow ChatMessages ScrollArea to flex
        }}
      >
        <ChatMessages
          messages={messages}
          isThinking={isThinking}
          isLoading={isLoadingSession}
        />
      </Paper>

      {/* Input area pinned at the bottom */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={!canSend}
      />
    </Container>
  );
};

export default ChatPage;
