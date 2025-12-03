import {Alert, Button, Stack, Text} from "@mantine/core";
import { apiClient } from "../lib/apiClient";
import {useMutation} from "@tanstack/react-query";
import {IconInfoCircle, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

export async function invalidateAllCaches(): Promise<any> {
  await apiClient.delete("/api/admin/cache/all");
}

export default function CacheManagementPage() {
  const mutation = useMutation({
    mutationFn: invalidateAllCaches,
    onSuccess: () => {
      setDeleted(true);
    }
  });
  const [deleted, setDeleted] = useState<boolean>(false);
  return (
    <Stack gap="md">
      <Text fw={700} size="xl">
        Cache Management
      </Text>

      <Button
        onClick={() => mutation.mutateAsync()}
        loading={mutation.isPending}
        size={"sm"}
        w={300}
        leftSection={<IconTrash size={20}/>}
      >
        Reset Cache
      </Button>

      {deleted && <Alert  variant="light" color="blue" radius={"lg"} title="Cache reset successfully" icon={<IconInfoCircle />} w={300}/>}
    </Stack>
  )
}