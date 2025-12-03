import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  ComboboxItem,
  Container,
  Group, NumberInput,
  Paper, Select,
  Menu,
  ActionIcon,
  Tooltip,
  FileButton,
  Loader,
} from "@mantine/core";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { IconDownload, IconUpload } from "@tabler/icons-react";

import type { RootState } from "../store";
import { setSelectedSessionId } from "../store/sessionsSlice";
import ChatMessages from "../components/chat/ChatMessages";
import ChatInput from "../components/chat/ChatInput";
import { useChat } from "../hooks/useChat";
import { exportSession as exportSessionApi, importSession as importSessionApi } from "../services/sessions.service";
import type { ChatSessionExport } from "@common/types/export";
import { queryKeys } from "../lib/queryKeys";
import type { SessionItem } from "@common/types/session";
import { useQuery } from "@tanstack/react-query";
import {apiClient} from "../lib/apiClient";
import {OllamaModel} from "@common/types/ollama";
import {env} from "../config/env";

const ChatPage: React.FC = () => {
  const dispatch = useDispatch();
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const resetImportRef = useRef<(() => void) | null>(null);
  const fileDialogRef = useRef<(() => void) | null>(null);

  const { selectedId } = useSelector(
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

  // Data
  const { messages, isThinking, isLoadingSession, sendMessage } = useChat({
    effectiveSessionId,
  });
  const {data: models} = useQuery({
    queryKey: queryKeys.models.all,
    queryFn: () => apiClient.get<OllamaModel[]>(
      "/api/chat/models"
    ).then(res => res.data)
  })
  const defaultModel = env.defaultModel;
  const defaultTemperature = env.defaultTemperature;

  // States
  const [input, setInput] = useState("");
  const modelOptions: ComboboxItem[] = useMemo(() => {
      return models?.map(model => ({value: model.name, label: model.name})) ?? []
    },
    [models]
  )
  const [modelParams, setModelParams] = useState<{model: string, temp: number}>({
    model: defaultModel,
    temp: defaultTemperature,
  })
  const [isImporting, setIsImporting] = useState(false);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    await sendMessage(trimmed, modelParams.model, modelParams.temp);
  };

  const canSend = input.trim().length > 0 && !isThinking;
  const importDisabled = Boolean(
    isImporting || effectiveSessionId || (messages?.length ?? 0) > 0
  );

  const handleExport = async () => {
    if (!effectiveSessionId) return;
    const data = await exportSessionApi(effectiveSessionId);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.meta.title || "chat"}-${data.meta.sessionId || effectiveSessionId}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File | null) => {
    if (importDisabled) return;
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as ChatSessionExport;
      const newSession = await importSessionApi(payload);

      dispatch(setSelectedSessionId(newSession.id));

      // Seed caches for instant UI updates
      queryClient.setQueryData(
        queryKeys.sessions.byId(newSession.id),
        newSession
      );
      queryClient.setQueryData(
        queryKeys.sessions.list(),
        (prev?: SessionItem[]) => {
          const existing = prev ?? [];
          const next: SessionItem[] = [
            {
              id: newSession.id,
              title: newSession.title,
              userId: newSession.userId,
              createdAt: newSession.createdAt,
            },
            ...existing.filter((s) => s.id !== newSession.id),
          ];
          return next;
        }
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.list(),
      });

      navigate(`/chat/${newSession.id}`, { replace: true });
    } catch (err) {
    } finally {
      setIsImporting(false);
      resetImportRef.current?.();
    }
  };

  return (
    <Container
      size="sm"
      p={0}
      h="100%"
      style={{ display: "flex", flexDirection: "column" }}
    >
      {/* Header row - title + status pill */}
      <Group justify="space-between" mb="sm">
        <Group>
          <Select
            label="Model"
            placeholder="Select a model"
            data={modelOptions}
            size={"xs"}
            style={{width: 200}}
            value={modelParams.model}
            onChange={(model) => setModelParams({...modelParams, model: model!})}
          />
          <NumberInput
            label="Temperature"
            min={0.0}
            max={2.0}
            step={0.1}
            decimalScale={1}
            size={"xs"}
            style={{width: 100}}
            value={modelParams.temp}
            onChange={(temp) => setModelParams({...modelParams, temp: temp as number})}
          />
        </Group>
        <Group gap="xs">
          <Badge
            radius="xl"
            variant="dot"
            color={isThinking ? "yellow" : "gray"}
            style={{ textTransform: "none" }}
          >
            {(isThinking ? "Thinking" : "Idle")}
          </Badge>
          <Menu shadow="md" width={180} withinPortal>
            <Menu.Target>
              <Tooltip label="Export / Import">
                <ActionIcon variant="subtle" aria-label="Export or import chat">
                  <IconDownload size={18} />
                </ActionIcon>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconDownload size={16} />}
                onClick={handleExport}
                disabled={!effectiveSessionId}
              >
                Export JSON
              </Menu.Item>
              <Menu.Item
                leftSection={<IconUpload size={16} />}
                disabled={importDisabled}
                rightSection={isImporting ? <Loader size="xs" /> : undefined}
                onClick={() => {
                  if (importDisabled) return;
                  fileDialogRef.current?.();
                }}
              >
                Import JSON
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Hidden FileButton kept mounted so menu closing doesn’t unmount the input */}
      <FileButton
        onChange={(file) => {
          handleImport(file);
        }}
        accept="application/json"
        disabled={importDisabled}
        resetRef={resetImportRef}
      >
        {(props) => {
          const { onClick, ...rest } = props;
          fileDialogRef.current = onClick || null;
          return <span {...rest} style={{ display: "none" }} />;
        }}
      </FileButton>

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
