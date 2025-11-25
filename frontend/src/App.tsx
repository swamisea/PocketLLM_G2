import React, { useCallback } from "react";
import { useSessions, LocalSessionItem } from "./hooks/useSessions";
import Sidebar from "./components/Sidebar";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./components/SignUp/SignUpComponent";
import Login from "./components/Login/LoginComponent";
import ChatPage from "./pages/ChatPage";

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const { state, actions } = useSessions();

  const handleSelect = useCallback(
    (id: string) => {
      actions.select(id);
    },
    [actions]
  );

  const handleSignUp = (userData: { email: string }) => {
    setUser(userData.email);
  };

  const handleLogin = (userData: { email: string }) => {
    setUser(userData.email);
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
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          history: messages,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply: ChatMessage = data.reply;
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      console.error("Failed to send message", err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, something went wrong talking to the model.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleDraftStateChange = useCallback(
    (sessionId?: string, hasMessages?: boolean) => {
      if (!sessionId || !sessionId.startsWith("local-")) return;
      actions.markDraftHasMessages(sessionId, !!hasMessages);
    },
    [actions]
  );
  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) {
        sendMessage();
      }
    }
  };

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
    <div className="app">
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<SignUp onSignUp={handleSignUp} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          {/*<Route
          path="/"
          element={
            user ? (
              <Home user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/signup" />
            )
          }
        />*/}

          <Route
            path="/chat"
            element={
              <div className="chat-container">
                <header className="chat-header">
                  <h1>Pocket LLM Chat</h1>
                  <span className="status-pill">
                    {loading ? "Thinking..." : "Idle"}
                  </span>
                </header>
                <main className="chat-body">
                  {messages.length === 0 && (
                    <div style={{ color: "#F9F6EE", fontSize: "0.9rem" }}>
                      Start a conversation by typing a message below. This goes
                      through:
                      <br />
                      <strong>
                        Frontend → Backend API → LangChain (ChatOllama) → Ollama
                        Container
                      </strong>
                    </div>
                  )}
                  {messages.map((m) => (
                    <div key={m.id} className={`message ${m.role}`}>
                      {m.content}
                    </div>
                  ))}
                </main>
                <footer className="chat-footer">
                  <textarea
                    placeholder="Ask something..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button onClick={sendMessage} disabled={loading}>
                    {loading ? "Sending..." : "Send"}
                  </button>
                </footer>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
