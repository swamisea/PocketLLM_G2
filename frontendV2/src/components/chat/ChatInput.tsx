import React, { useState } from "react";
import { Group, Textarea, Button } from "@mantine/core";

interface Props {
  loading: boolean;
  onSend: (text: string) => void;
}

const ChatInput: React.FC<Props> = ({ loading, onSend }) => {
  const [value, setValue] = useState("");

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Group align="flex-end" mt="md">
      <Textarea
        autosize
        minRows={2}
        maxRows={6}
        style={{ flex: 1 }}
        placeholder="Send a message..."
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
      />
      <Button onClick={handleSend} disabled={loading || !value.trim()}>
        {loading ? "Sending..." : "Send"}
      </Button>
    </Group>
  );
};

export default ChatInput;
