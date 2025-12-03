// src/components/layout/AdminSidebar.tsx
import React from "react";
import { Button, Stack, Text, Group } from "@mantine/core";
import { useNavigate } from "react-router";
import { IconChartHistogram } from "@tabler/icons-react";

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleTelemetry = () => {
    navigate(`/telemetry`);
  };

  return (
    <Stack h="100%">
      {/* TELEMETRY LINK */}
      <Button
        variant="subtle"
        size="sm"
        radius="md"
        fullWidth
        onClick={handleTelemetry}
      >
        <Group gap={6} justify="center">
          <IconChartHistogram size={16} />
          <Text size="sm">Telemetry</Text>
        </Group>
      </Button>
    </Stack>
  );
};

export default AdminSidebar;
