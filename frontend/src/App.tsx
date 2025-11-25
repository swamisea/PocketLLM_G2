import React, { useCallback } from "react";
import { useSessions, LocalSessionItem } from "./hooks/useSessions";
import Sidebar from "./components/Sidebar";
import ChatPage from "./pages/ChatPage";

const App: React.FC = () => {
  const { state, actions } = useSessions();

  const handleSelect = useCallback(
    (id: string) => {
      actions.select(id);
    },
    [actions]
  );

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
  );
};

export default App;
