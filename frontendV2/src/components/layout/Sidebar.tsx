// src/components/layout/Sidebar.tsx
import React from "react";
import { ScrollArea, Button, Stack, Text } from "@mantine/core";
import { useSessions } from "../../hooks/useSessions";

const Sidebar: React.FC = () => {
  const { state, serverSessions, isLoading, actions } = useSessions();

  return (
    <Stack h="100%">
      {/* NEW CHAT BUTTON */}
      <Button variant={"gradient"} size={"md"} radius={"md"} fullWidth onClick={() => actions.createSession()}>
        + New chat
      </Button>

      {/* SESSION LIST */}
      <ScrollArea style={{ flex: 1 }}>
        <Stack gap="xs" mt="sm">
          {isLoading && <Text size="sm">Loading sessions...</Text>}

          {serverSessions.map((s) => (
            <Button
              key={s.id}
              variant={state.currentSessionId === s.id ? "light" : "subtle"}
              justify="flex-start"
              onClick={() => actions.select(s.id)}
              size={"lg"} radius={"md"}
              styles={{
                root: {
                  paddingLeft: 16,
                  borderLeft: state.currentSessionId === s.id ? "3px solid #2563eb" : ""
                },
              }}
            >
              <Stack gap={0} align={"flex-start"}>
                <Text size="sm" style={{ flex: 1 }} lineClamp={1}>
                  {s.title || "Untitled"}
                </Text>
                <Text size="sm" c="dimmed" style={{ flex: 1 }} lineClamp={1}>
                  {s.createdAt ? new Date(s.createdAt).toLocaleString() : ""}
                </Text>
              </Stack>
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
