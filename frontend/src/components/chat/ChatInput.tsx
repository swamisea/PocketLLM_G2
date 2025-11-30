import React from "react";
import { Button, Group, Textarea } from "@mantine/core";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
                                               value,
                                               onChange,
                                               onSend,
                                               disabled,
                                             }) => {
  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Group align="flex-end" mt="md">
      <Textarea
        autosize
        minRows={1}
        maxRows={6}
        style={{ flex: 1 }}
        placeholder="Send a message..."
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
      />
      <Button onClick={onSend} disabled={disabled}>
        Send
      </Button>
    </Group>
  );
};

export default ChatInput;
