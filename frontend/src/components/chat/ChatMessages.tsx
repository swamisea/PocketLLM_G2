import React, { useEffect, useRef } from "react";
import { Loader, Paper, ScrollArea, Stack, Text, Group } from "@mantine/core";
import type { ChatMessage } from "@common/types/chat";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isThinking: boolean;
  isLoading: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
                                                     messages,
                                                     isThinking,
                                                     isLoading,
                                                   }) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const firstScrollRef = useRef(true);

  // Auto-scroll with smooth animation
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const behavior: ScrollBehavior = firstScrollRef.current ? "auto" : "smooth";
    firstScrollRef.current = false;

    requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      });
    });
  }, [messages, isThinking]);

  return (
    <ScrollArea
      style={{ flex: 1, minHeight: 0 }}
      viewportRef={viewportRef}
    >
      <Stack mt="sm">
        {isLoading && !messages.length && (
          <Text size="sm" mt="sm" c="dimmed">
            Loading conversation…
          </Text>
        )}

        {!isLoading && !messages.length && (
          <Text size="sm" mt="sm" c="dimmed">
            Start a conversation by typing a message below.
          </Text>
        )}

        {messages.map((m, idx) => {
          const isUser = m.role === "user";

          const bubbleStyle = isUser
            ? {
              backgroundColor: "var(--mantine-color-blue-6)",
              color: "white",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 4,
            }
            : {
              backgroundColor: "var(--mantine-color-gray-1)",
              color: "var(--mantine-color-dark-8)",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderBottomLeftRadius: 4,
              borderBottomRightRadius: 16,
            };

          return (
            <Group
              key={idx}
              justify={isUser ? "flex-end" : "flex-start"}
            >
              <Paper
                px="md"
                py="xs"
                shadow="xs"
                withBorder={!isUser}
                style={{
                  maxWidth: "75%",
                  ...bubbleStyle,
                }}
              >
                <Text size="sm">{m.content}</Text>
              </Paper>
            </Group>
          );
        })}

        {/* 3-dot loading bubble when model is thinking */}
        {isThinking && (
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
              <Loader color="gray" size="sm" type="dots" />
            </Paper>
          </Group>
        )}
      </Stack>
    </ScrollArea>
  );
};

export default ChatMessages;
