import React, { useState } from "react";
import { Paper, Stack } from "@mantine/core";
import ChatMessages from "../components/chat/ChatMessages";
import ChatInput from "../components/chat/ChatInput";
import { useChat } from "../hooks/useChat";

const ChatPage: React.FC = () => {
  const [sessionId] = useState<string | undefined>(undefined);
  const { messages, sendMessage, isLoading } = useChat([]);

  return (
    <Paper shadow="sm" radius="md" p="md" style={{ height: "100%" }}>
      <Stack style={{ height: "100%" }}>
        <ChatMessages messages={messages} />
        <ChatInput
          loading={isLoading}
          onSend={(text) => sendMessage(text, sessionId)}
        />
      </Stack>
    </Paper>
  );
};

export default ChatPage;
