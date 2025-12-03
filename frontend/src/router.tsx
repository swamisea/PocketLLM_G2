import React from "react";
import {
  createBrowserRouter,
  Navigate,
  redirect,
} from "react-router";

import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ChatPage from "./pages/ChatPage";
import {clearUserCookie, getUserFromCookie} from "./utils/authCookies";
import TelemetryPage from "./pages/TelemetryPage";
import {AccessForbiddenPage} from "./pages/AccessForbiddenPage";
import CacheManagementPage from "./pages/CacheManagementPage";
import ModelConfigPage from "./pages/ModelConfigPage";

async function isUser() {
  const user = getUserFromCookie();
  if (!user) {
    throw redirect("/login");
  }
  if (user.isAdmin) {
    throw redirect("/admin");
  }
  return null;
}

async function isAdmin() {
  const user = getUserFromCookie();
  if (!user) {
    throw redirect("/login");
  }
  if (!user.isAdmin) {
    throw redirect("/403");
  }
  return null;
}

async function logout() {
  clearUserCookie();
  return redirect("/login");
}

export const router = createBrowserRouter([
  {
    path: "/403",
    element: <AccessForbiddenPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/logout",
    loader: logout
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/admin",
    loader: isAdmin,
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to={"/admin/telemetry"} replace />},
      { path: "models", element: <ModelConfigPage /> },
      { path: "cache", element: <CacheManagementPage /> },
      { path: "telemetry", element: <TelemetryPage /> },
    ],
  },
  {
    path: "/",
    element: <AppLayout />,
    loader: isUser,
    children: [
      // no session selected
      { index: true, element: <ChatPage /> },
      { path: "chat", element: <ChatPage /> },
      // specific session
      { path: "chat/:sessionId", element: <ChatPage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
