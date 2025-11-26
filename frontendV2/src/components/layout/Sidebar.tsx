// src/components/layout/Sidebar.tsx
import React from "react";
import { AppShell, ScrollArea, Button, Stack, Text } from "@mantine/core";
import { useSessions } from "../../hooks/useSessions";

const Sidebar: React.FC = () => {
  const { state, serverSessions, isLoading, actions } = useSessions();

  return (
    <Stack h="100%">
      {/* NEW CHAT BUTTON */}
      <Button fullWidth onClick={() => actions.createSession()}>
        + New chat
      </Button>

      {/* SESSION LIST */}
      <ScrollArea style={{ flex: 1 }}>
        <Stack gap="xs" mt="sm">
          {isLoading && <Text size="sm">Loading sessions...</Text>}

          {serverSessions.map((s) => (
            <Button
              key={s.id}
              variant={state.currentSessionId === s.id ? "filled" : "subtle"}
              justify="space-between"
              onClick={() => actions.select(s.id)}
            >
              <Text size="sm" style={{ flex: 1 }} lineClamp={1}>
                {s.title || "Untitled"}
              </Text>
            </Button>
          ))}

          {!isLoading && serverSessions.length === 0 && (
            <Text size="xs" c="dimmed">
              No sessions yet. Start a new chat.
            </Text>
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
};

export default Sidebar;
