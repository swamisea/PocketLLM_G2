import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Group, SimpleGrid, Stack, Text, Progress, Paper } from "@mantine/core";
import { queryKeys } from "../lib/queryKeys";
import { fetchTelemetry } from "../services/telemetry.service";
import type { TelemetryEvent } from "@common/types/telemetry";

function summarize(events: TelemetryEvent[]) {
  const total = events.length;
  const cacheHits = events.filter((e) => e.eventType === "cache_hit").length;
  const cacheMiss =
    events.filter((e) => e.eventType === "cache_miss").length +
    events.filter((e) => e.eventType === "chat_response" && e.cacheHit === false).length;
  const responses = events.filter((e) => e.eventType === "chat_response");
  const errors = events.filter((e) => e.eventType === "chat_error").length;

  const avgDuration =
    responses.reduce((acc, e) => acc + (e.durationMs || 0), 0) /
    (responses.length || 1);

  const avgPromptChars =
    responses.reduce((acc, e) => acc + (e.promptChars || 0), 0) /
    (responses.length || 1);

  const avgRespChars =
    responses.reduce((acc, e) => acc + (e.responseChars || 0), 0) /
    (responses.length || 1);

  const cacheTotal = cacheHits + cacheMiss;
  const cacheHitRate = cacheTotal ? Math.round((cacheHits / cacheTotal) * 100) : 0;

  return {
    total,
    cacheHits,
    cacheMiss,
    cacheHitRate,
    responses: responses.length,
    errors,
    avgDuration: Math.round(avgDuration),
    avgPromptChars: Math.round(avgPromptChars),
    avgRespChars: Math.round(avgRespChars),
  };
}

export default function TelemetryPage() {
  const { data = [], isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: queryKeys.telemetry.recent,
    queryFn: () => fetchTelemetry(200),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const [lastChecked, setLastChecked] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return localStorage.getItem("telemetryLastChecked") || undefined;
  });

  useEffect(() => {
    if (dataUpdatedAt) {
      const ts = new Date(dataUpdatedAt).toLocaleString();
      setLastChecked(ts);
      if (typeof window !== "undefined") {
        localStorage.setItem("telemetryLastChecked", ts);
      }
    }
  }, [dataUpdatedAt]);

  const stats = useMemo(() => summarize(data), [data]);

  const cards = [
    { label: "Total events", value: stats.total },
    { label: "Chat responses", value: stats.responses },
    { label: "Cache hits", value: stats.cacheHits },
    { label: "Errors", value: stats.errors },
  ];

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text fw={700} size="xl">
          Telemetry
        </Text>
        <Text size="sm" c="dimmed">
          Last checked: {lastChecked ?? "—"}
        </Text>
      </Group>

      {isLoading && <Text>Loading telemetry...</Text>}
      {isError && <Text c="red">Failed to load telemetry.</Text>}

      {!isLoading && !isError && (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
            {cards.map((c) => (
              <Card key={c.label} withBorder radius="md" padding="md">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {c.label}
                </Text>
                <Text fw={700} size="xl">
                  {c.value}
                </Text>
              </Card>
            ))}
          </SimpleGrid>

          <Card withBorder radius="md" padding="md">
            <Group justify="space-between" mb="xs">
              <Text fw={600}>Cache hit rate</Text>
              <Text fw={700}>{stats.cacheHitRate}%</Text>
            </Group>
            <Progress value={stats.cacheHitRate} size="lg" radius="xl" />
            <Text size="sm" c="dimmed" mt="xs">
              Hits: {stats.cacheHits} / Miss: {stats.cacheMiss}
            </Text>
          </Card>

          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Paper withBorder p="md" radius="md">
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                Avg duration (ms)
              </Text>
              <Text fw={700} size="xl">
                {stats.avgDuration}
              </Text>
            </Paper>
            <Paper withBorder p="md" radius="md">
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                Avg prompt length
              </Text>
              <Text fw={700} size="xl">
                {stats.avgPromptChars} chars
              </Text>
            </Paper>
            <Paper withBorder p="md" radius="md">
              <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                Avg response length
              </Text>
              <Text fw={700} size="xl">
                {stats.avgRespChars} chars
              </Text>
            </Paper>
          </SimpleGrid>

          <Card withBorder radius="md" padding="md">
            <Text fw={600} mb="sm">
              Recent events
            </Text>
            <Stack gap="xs">
              {data.slice(0, 15).map((e, idx) => (
                <Group key={idx} justify="space-between">
                  <Text size="sm" fw={600}>
                    {e.eventType}
                  </Text>
                  <Group gap="xs">
                    <Text size="xs" c="dimmed">
                      {e.model || "-"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {new Date(e.createdAt).toLocaleTimeString()}
                    </Text>
                  </Group>
                </Group>
              ))}
              {data.length === 0 && (
                <Text size="sm" c="dimmed">
                  No telemetry yet.
                </Text>
              )}
            </Stack>
          </Card>
        </>
      )}
    </Stack>
  );
}
