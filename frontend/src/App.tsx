import React, { useCallback, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSessions, LocalSessionItem } from "./hooks/useSessions";
import SignUp from "./components/SignUp/SignUpComponent";
import Login from "./components/Login/LoginComponent";
import Sidebar from "./components/Sidebar";
import ChatPage from "./pages/ChatPage";
import {User} from "@common/types/account";

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const { state, actions } = useSessions();

  const handleSelect = useCallback(
    (id: string) => {
      actions.select(id);
    },
    [actions]
  );

  const handleSignUp = (userData: { email: string; username: string; }) => {
    setUser({
      email: userData.email,
      username: userData.username,
      id: "", // You may want to get this from the signup response,
      theme: "dark",
      createdAt: new Date().toISOString(),
    });
  };

  const handleLogin = (userData: { email: string; username: string; id: string }) => {
    setUser({
      email: userData.email,
      username: userData.username,
      id: userData.id,
      theme: "dark",
      createdAt: new Date().toISOString(), // You may want to fetch this
    });
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleNew = useCallback(() => {
    // If there is any existing local draft (a local session with no messages),
    // select and clear that draft rather than creating a new one. This prevents
    // multiple empty sessions from being created.
    const emptyLocal = state.localSessions.find(
      (s) => !state.localSessionHasMessages[s.id]
    );
    if (emptyLocal) {
      if (state.currentSessionId !== emptyLocal.id) {
        actions.select(emptyLocal.id);
      }
      actions.bumpClearSignal();
      return;
    }

    const tempId = `local-${crypto.randomUUID()}`;
    const temp: LocalSessionItem = {
      id: tempId,
      title: "New chat",
      createdAt: new Date().toISOString(),
      local: true,
    };
    actions.createLocal(temp);
    // No need to reload the backend when a local session is created
  }, [state, actions]);

  const handleSessionCreated = useCallback(
    (tempId: string | undefined, serverId: string) => {
      actions.persisted(tempId, serverId);
    },
    [actions]
  );

  const handleActivity = useCallback(() => {
    // notify sidebar to reload if desired by bumping key
    actions.bumpReload();
  }, [actions]);

  const handleDraftStateChange = useCallback(
    (sessionId?: string, hasMessages?: boolean) => {
      if (!sessionId || !sessionId.startsWith("local-")) return;
      actions.markDraftHasMessages(sessionId, !!hasMessages);
    },
    [actions]
  );

  return (
      <BrowserRouter>
        <Routes>
          <Route path="/signup" 
          element={
            user ? <Navigate to="/" replace /> : <SignUp onSignUp={handleSignUp} />
            } 
            />

          <Route path="/login" 
          element={
            user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
          } 
          />

        <Route
          path="/"
          element={
            user ? (
              <div className="app layout-with-sidebar">
                <Sidebar
                  reloadKey={state.sessionsReloadKey}
                  localSessions={state.localSessions}
                  currentSessionId={state.currentSessionId}
                  onSelect={handleSelect}
                  onNew={handleNew}
                />
                <ChatPage
                  sessionId={state.currentSessionId}
                  onSessionActivity={handleActivity}
                  onSessionCreated={handleSessionCreated}
                  onDraftStateChange={handleDraftStateChange}
                  clearSignal={state.clearSignal}
                />
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
  );
};

export default App;
