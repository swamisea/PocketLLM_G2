import {useState} from "react";
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import {IconInfoCircle, IconRefresh, IconTrash} from "@tabler/icons-react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import type {OllamaModel} from "@common/types/ollama";
import {apiClient} from "../lib/apiClient";
import {env} from "../config/env";

const ADMIN_MODELS_URL = "/api/admin/models";
const DEFAULT_MODEL = env.defaultModel || "gemma3:270m"

interface ApiMessageResponse {
  success: boolean;
  message: string;
  modelName?: string;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  // Fallback if date is invalid
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function getErrorMessage(err: any): string {
  const message =
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong while talking to the server.";
  return message;
}

function isModelNotFoundError(err: any): boolean {
  const status = err?.response?.status;
  const message: string | undefined = err?.response?.data?.message;
  if (status === 404) return true;
  if (typeof message === "string") {
    return /not found/i.test(message) || /doesn't exist/i.test(message);
  }
  return false;
}

export default function ModelConfigPage() {
  const queryClient = useQueryClient();
  const [newModelName, setNewModelName] = useState("");

  const {
    data: models,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<OllamaModel[], Error>({
    queryKey: ["admin", "models"],
    queryFn: async () => {
      const res = await apiClient.get<OllamaModel[]>(ADMIN_MODELS_URL);
      return res.data;
    },
  });

  const addModelMutation = useMutation<
    ApiMessageResponse,
    any,
    { modelName: string }
  >({
    mutationFn: async ({modelName}) => {
      const res = await apiClient.post<ApiMessageResponse>(ADMIN_MODELS_URL, {
        modelName,
      });
      return res.data;
    },
    onSuccess: () => {
      // The pull is async; refetch won't necessarily show it immediately,
      // but it's harmless and may pick it up if pull was fast.
      queryClient.invalidateQueries({queryKey: ["admin", "models"]});
      setNewModelName("");
    },
  });

  const deleteModelMutation = useMutation<ApiMessageResponse, any, string>({
    mutationFn: async (modelName) => {
      const encoded = encodeURIComponent(modelName);
      const res = await apiClient.delete<ApiMessageResponse>(
        `${ADMIN_MODELS_URL}/${encoded}`
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["admin", "models"]});
    },
  });

  const handleAddModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim()) return;
    addModelMutation.mutate({modelName: newModelName.trim()});
  };

  const handleDelete = (modelName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete model '${modelName}'?\nThis will remove it from Ollama and cannot be undone.`
      )
    ) {
      return;
    }
    deleteModelMutation.mutate(modelName);
  };

  const addError = addModelMutation.isError
    ? addModelMutation.error
    : undefined;

  return (
    <Stack gap="md">
      <Title order={2}>AI Models</Title>

      <Text c="dimmed" size="sm">
        Manage the models available in your local Ollama server. Deleting a
        model frees disk space. Adding a model will start a background download
        – it may take a while before it appears here.
      </Text>

      {/* Add model section */}
      <Card withBorder radius="md" padding="md">
        <Stack gap="xs">
          <Text fw={500}>Add model</Text>
          <Text size="sm" c="dimmed">
            Enter an Ollama model name (for example{" "}
            <Text component="span" fw={500}>
              llama3.1:8b
            </Text>
            ). The download runs in the background; check back on this page
            after a few minutes.
          </Text>

          <form onSubmit={handleAddModel}>
            <Group align="flex-end" gap="sm">
              <TextInput
                style={{flex: 1}}
                label="Model name"
                placeholder="llama3.1:8b"
                value={newModelName}
                onChange={(event) => setNewModelName(event.currentTarget.value)}
                disabled={addModelMutation.isPending}
              />
              <Button
                type="submit"
                loading={addModelMutation.isPending}
                variant="filled"
              >
                Add model
              </Button>
            </Group>
          </form>

          <Group gap="xs">
            <Text size="xs" c="dimmed">
              Not sure about the exact model name?
            </Text>
            <Anchor
              size="xs"
              href="https://ollama.com/library"
              target="_blank"
              rel="noreferrer"
            >
              Browse Ollama model library
            </Anchor>
          </Group>

          {addError && (
            <Alert
              icon={<IconInfoCircle size={16}/>}
              color="red"
              variant="light"
              mt="xs"
            >
              <Text size="sm">{getErrorMessage(addError)}</Text>
              {isModelNotFoundError(addError) && (
                <Text size="xs" mt={4}>
                  It looks like this model name doesn&apos;t exist. Please check
                  the spelling or pick a model from the{" "}
                  <Anchor
                    href="https://ollama.com/library"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ollama model library
                  </Anchor>
                  .
                </Text>
              )}
            </Alert>
          )}

          {addModelMutation.isSuccess && (
            <Alert
              icon={<IconInfoCircle size={16}/>}
              color="blue"
              variant="light"
              mt="xs"
            >
              <Text size="sm">
                {addModelMutation.data?.message ??
                  "Model download started. It may take several minutes to complete. Refresh this page later to see it in the list."}
              </Text>
            </Alert>
          )}
        </Stack>
      </Card>

      {/* Models table */}
      <Card withBorder radius="md" padding="md">
        <Group justify="space-between" mb="sm">
          <Text fw={500}>Available models</Text>
          <Button
            variant="subtle"
            size="xs"
            leftSection={
              isFetching ? <Loader size={14}/> : <IconRefresh size={16}/>
            }
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </Group>

        {isLoading ? (
          <Group justify="center" py="md">
            <Loader/>
          </Group>
        ) : isError ? (
          <Alert
            icon={<IconInfoCircle size={16}/>}
            color="red"
            variant="light"
          >
            {error?.message ??
              "Failed to load models. Please try refreshing the page."}
          </Alert>
        ) : !models || models.length === 0 ? (
          <Text size="sm" c="dimmed">
            No models found on this Ollama instance.
          </Text>
        ) : (
          <Box style={{overflowX: "auto"}}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Family</Table.Th>
                  <Table.Th>Parameters</Table.Th>
                  <Table.Th>Size</Table.Th>
                  <Table.Th>Modified</Table.Th>
                  <Table.Th style={{width: 120}}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {models.map((model) => {
                  const isDefault = model.name === DEFAULT_MODEL;
                  const family =
                    model.details?.family ??
                    model.details?.families?.[0] ??
                    "-";
                  const params =
                    model.details?.parameter_size ||
                    model.details?.quantization_level ||
                    "-";

                  return (
                    <Table.Tr key={model.digest || model.name}>
                      <Table.Td>
                        <Group gap="xs">
                          <Text size="sm" fw={500}>
                            {model.name}
                          </Text>
                          {isDefault && (
                            <Badge size="xs" color="green" variant="light">
                              Default
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>{family}</Table.Td>
                      <Table.Td>{params}</Table.Td>
                      <Table.Td>{formatBytes(model.size)}</Table.Td>
                      <Table.Td>{formatDate(model.modified_at)}</Table.Td>
                      <Table.Td>
                        <Group gap="xs" justify="flex-start">
                          {isDefault ? (
                            <Tooltip label="Default model cannot be deleted">
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="gray"
                                disabled
                              >
                                <IconTrash size={16}/>
                              </ActionIcon>
                            </Tooltip>
                          ) : (
                            <Tooltip label="Delete model from Ollama">
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="red"
                                onClick={() => handleDelete(model.name)}
                                loading={
                                  deleteModelMutation.isPending &&
                                  deleteModelMutation.variables === model.name
                                }
                              >
                                <IconTrash size={16}/>
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Box>
        )}
      </Card>
    </Stack>
  );
}
