import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  ComboboxItem,
  Container,
  Group, NumberInput,
  Paper, Select,
} from "@mantine/core";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router";

import type { RootState } from "../store";
import { setSelectedSessionId } from "../store/sessionsSlice";
import ChatMessages from "../components/chat/ChatMessages";
import ChatInput from "../components/chat/ChatInput";
import { useChat } from "../hooks/useChat";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import {apiClient} from "../lib/apiClient";
import {OllamaModel} from "@common/types/ollama";
import {env} from "../config/env";

const ChatPage: React.FC = () => {
  const dispatch = useDispatch();
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>();

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

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    await sendMessage(trimmed, modelParams.model, modelParams.temp);
  };

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
