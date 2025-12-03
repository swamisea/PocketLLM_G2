// src/components/layout/AppLayout.tsx
import React, { useEffect, useState } from "react";
import {
  AppShell,
  Group,
  Text,
  Button,
  ActionIcon, useMantineTheme,
} from "@mantine/core";
import { Outlet, useNavigate } from "react-router";
import { useHover, useMediaQuery } from "@mantine/hooks";
import { IconChevronLeft, IconLayoutSidebar } from "@tabler/icons-react";

import Sidebar from "./Sidebar";
import { useAuth } from "../../hooks/useAuth";
import UserPreferencesModal from '../modals/UserPreferencesModal';

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useMantineTheme()
  // Mantine's default "sm" breakpoint is 48em (~768px)
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);

  // Collapsed state: desktop -> expanded by default, mobile -> collapsed by default
  const [navbarCollapsed, setNavbarCollapsed] = useState<boolean>(true);

  useEffect(() => {
    // When breakpoint changes, reset default:
    //  - mobile: collapsed
    //  - desktop: expanded
    setNavbarCollapsed(isMobile ? true : false);
  }, [isMobile]);

  const toggleNavbar = () => {
    setNavbarCollapsed((prev) => !prev);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // useHover for the icon
  const { hovered, ref } = useHover();

  const IconNode = navbarCollapsed || !hovered
    ? <IconLayoutSidebar size={18} />
    : <IconChevronLeft size={18} />;

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: "xs",
        collapsed: {
          mobile: navbarCollapsed,
          desktop: navbarCollapsed,
        },
      }}
      padding="md"
    >
      {/* HEADER */}
      <AppShell.Header>
        <Group justify="space-between" h="100%" px="md">
          <Group gap="xs">
            {/* Collapse / expand icon */}
            <ActionIcon
              ref={ref}
              variant="subtle"
              radius="xl"
              aria-label="Toggle sidebar"
              onClick={toggleNavbar}
            >
              {IconNode}
            </ActionIcon>

            <Text fw={600}>PocketLLM Portal</Text>
          </Group>

          <Group gap="xs">
            {user && (
              <Text 
              size="sm"
              style={{ cursor: 'pointer' }}
              onClick={() => setPrefsOpen(true)}
              >
                Signed in as {user.username ?? user.email}
              </Text>
            )}

            <UserPreferencesModal opened={prefsOpen} onClose={() => setPrefsOpen(false)} />

            <Button variant="light" size="xs" onClick={handleLogout}>
              Logout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      {/* NAVBAR (collapsible sidebar) */}
      <AppShell.Navbar p="sm">
        <Sidebar />
      </AppShell.Navbar>

      {/* MAIN CONTENT */}
      <AppShell.Main
        style={{
          height: "calc(100vh - 60px)", // full viewport minus header
        }}
      >
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};

export default AppLayout;
