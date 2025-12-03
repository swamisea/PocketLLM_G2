// src/components/layout/AdminSidebar.tsx
import React from "react";
import { Button, Stack, Text, Group } from "@mantine/core";
import {useLocation, useNavigate} from "react-router";
import { IconChartHistogram } from "@tabler/icons-react";

const navItems = [
  {
    label: "Telemetry",
    href: "/admin/telemetry",
    icon: IconChartHistogram,
  },
]

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const loc = useLocation();

  const handleTelemetry = () => {
    navigate(`/telemetry`);
  };

  return (
    <Stack h="100%">
      {/* TELEMETRY LINK */}
      {navItems.map((item) => {
        const isActive = loc.pathname === item.href;
        const Icon = item.icon;
        return (<Button
          variant={isActive ? "filled" : "subtle"}
          size="sm"
          radius="md"
          fullWidth
          onClick={() => navigate(item.href)}
        >
          <Group gap={6} justify="center">
            <Icon size={16} />
            <Text size="sm">{item.label}</Text>
          </Group>
        </Button>)
      })
      }

    </Stack>
  );
};

export default AdminSidebar;
