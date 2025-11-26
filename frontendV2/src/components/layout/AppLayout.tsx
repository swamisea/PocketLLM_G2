// src/components/layout/AppLayout.tsx
import React from "react";
import { AppShell, Burger, Group, Text, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet, useNavigate } from "react-router";
import Sidebar from "./Sidebar";
import { useAuth } from "../../hooks/useAuth";

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Mobile navbar open/close
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <AppShell
      // configure header & navbar (v7 style)
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
    >
      {/* HEADER */}
      <AppShell.Header>
        <Group justify="space-between" h="100%" px="md">
          <Group gap="xs">
            {/* mobile burger to toggle navbar */}
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
            />
            <Text fw={600}>PocketLLM Portal</Text>
          </Group>

          <Group gap="xs">
            {user && (
              <Text size="sm">
                Signed in as {user.username ?? user.email}
              </Text>
            )}
            <Button variant="light" size="xs" onClick={handleLogout}>
              Logout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      {/* NAVBAR */}
      <AppShell.Navbar p="sm">
        <Sidebar />
      </AppShell.Navbar>

      {/* MAIN CONTENT AREA */}
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};

export default AppLayout;
