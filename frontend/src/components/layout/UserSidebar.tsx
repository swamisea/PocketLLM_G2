// src/components/layout/Sidebar.tsx
import React from "react";
import { ScrollArea, Button, Stack, Text, Group } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

import { listSessions } from "../../services/sessions.service";
import { queryKeys } from "../../lib/queryKeys";
import type { RootState } from "../../store";

import {
  setSelectedSessionId,
} from "../../store/sessionsSlice";

const UserSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { selectedId } = useSelector(
    (state: RootState) => state.sessions
  );

  const { data: serverSessions = [], isLoading } = useQuery({
    queryKey: queryKeys.sessions.list(),
    queryFn: listSessions,
  });

  const handleSelect = (id: string) => {
    dispatch(setSelectedSessionId(id));
    navigate(id ? `/chat/${id}` : "/");
  };

  const handleNewChat = () => {
    dispatch(setSelectedSessionId(undefined));
    navigate(`/`);
  };

  return (
    <Stack h="100%">
      {/* NEW CHAT BUTTON */}
      <Button variant={"gradient"} size={"md"} radius={"md"} fullWidth onClick={() => handleNewChat()}>
        + New chat
      </Button>

      {/* SESSION LIST */}
      <ScrollArea style={{ flex: 1 }}>
        <Stack gap="xs" mt="sm">
          {isLoading && <Text size="sm">Loading sessions...</Text>}

          {serverSessions.map((s) => (
            <Button
              key={s.id}
              variant={selectedId === s.id ? "light" : "subtle"}
              justify="flex-start"
              onClick={() => handleSelect(s.id)}
              size={"lg"} radius={"md"}
              styles={{
                root: {
                  paddingLeft: 16,
                  borderLeft: selectedId === s.id ? "3px solid #2563eb" : ""
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

export default UserSidebar;
