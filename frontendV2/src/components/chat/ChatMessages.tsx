import React from "react";
import { ScrollArea, Stack, Paper, Text } from "@mantine/core";
import type { ChatMessage } from "../../hooks/useChat";

interface Props {
  messages: ChatMessage[];
}

const ChatMessages: React.FC<Props> = ({ messages }) => {
  return (
    <ScrollArea style={{ flex: 1 }}>
      <Stack>
        {messages.map((m, idx) => (
          <Paper key={idx} shadow="xs" p="sm" radius="md" withBorder>
            <Text fw={m.role === "user" ? 600 : 400}>
              {m.role === "user" ? "You" : "Model"}
            </Text>
            <Text size="sm">{m.content}</Text>
          </Paper>
        ))}
      </Stack>
    </ScrollArea>
  );
};

export default ChatMessages;
