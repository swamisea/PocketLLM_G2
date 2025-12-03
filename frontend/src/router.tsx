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
import { getUserFromCookie } from "./utils/authCookies";
import TelemetryPage from "./pages/TelemetryPage";

async function authLoader() {
  const user = getUserFromCookie();
  if (!user) {
    throw redirect("/login");
  }
  return null;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/",
    // element: <div>Hello</div>,
    element: <AppLayout />,
    loader: authLoader,
    children: [
      // no session selected
      { index: true, element: <ChatPage /> },
      // specific session
      { path: "chat/:sessionId", element: <ChatPage /> },
      { path: "telemetry", element: <TelemetryPage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
