import React, { useState } from "react";
import type { ChatMessage } from "../../common/src/types/chat";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./components/SignUp/SignUpComponent";
import Login from "./components/Login/LoginComponent";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = (userData: { email: string }) => {
    setUser(userData.email);
  };

  const handleLogin = (userData: { email: string }) => {
    setUser(userData.email);
  };

  const handleLogout = () => {
    setUser(null);
  };

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
