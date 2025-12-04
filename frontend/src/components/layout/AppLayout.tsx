// src/components/layout/AppLayout.tsx
import React, { useEffect, useState } from "react";
import {
  AppShell,
  Group,
  Text,
  ActionIcon, useMantineTheme,
  Menu,
  Avatar,
} from "@mantine/core";
import { Outlet, useNavigate } from "react-router";
import {useDisclosure, useHover, useMediaQuery} from "@mantine/hooks";
import {IconChevronLeft, IconLayoutSidebar, IconLogout, IconSettings, IconUser} from "@tabler/icons-react";

import UserSidebar from "./UserSidebar";
import { useAuth } from "../../hooks/useAuth";
import AdminSidebar from "./AdminSidebar";
import UserPreferencesModal from '../modals/UserPreferencesModal';

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? (parts[0]?.[1] ?? "");
  return (first+second).toUpperCase();
}

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [prefModalOpen, {open: openModal, close: closeModal}] = useDisclosure(false)
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
              <Menu trigger="hover" closeDelay={200}>
                <Menu.Target>
                  <Avatar radius="xl" color="gray">
                    {getInitials(user.username)}
                  </Avatar>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label><Group gap={'xs'}><IconUser size={14}/><Text>{user.username}</Text></Group></Menu.Label>
                  {!user.isAdmin && (<Menu.Item leftSection={<IconSettings size={14}/>} onClick={openModal} >Preferences</Menu.Item>)}
                  <Menu.Item leftSection={<IconLogout size={14} />} onClick={handleLogout}>Logout</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}

            <UserPreferencesModal opened={prefModalOpen} onClose={closeModal} />
          </Group>
        </Group>
      </AppShell.Header>

      {/* NAVBAR (collapsible sidebar) */}
      <AppShell.Navbar p="sm">
        {user ? user.isAdmin ? <AdminSidebar /> : <UserSidebar /> : <></>}
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
