import React, { useEffect, useState, useRef } from "react";
import type { ChatMessage } from "@common/types/chat";
import { getSession } from "../services/sessions.service";
import { sendChat } from "../services/chat.service";

export default function ChatPage({
  sessionId,
  onSessionActivity,
  onSessionCreated,
  onDraftStateChange,
  clearSignal,
}: {
  sessionId?: string;
  onSessionActivity?: () => void;
  onSessionCreated?: (tempId: string | undefined, serverId: string) => void;
  onDraftStateChange?: (sessionId?: string, hasMessages?: boolean) => void;
  clearSignal?: number;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!sessionId || sessionId?.startsWith("local-")) {
        setMessages([]);
        return;
      }
      try {
        const s = await getSession(sessionId);
        setMessages(s.messages || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [sessionId]);

  useEffect(() => {
    // notify parent whether the current session has messages (draft started)
    if (onDraftStateChange) onDraftStateChange(sessionId, messages.length > 0);
  }, [messages, sessionId, onDraftStateChange]);

  // react to clearSignal to clear messages in the current chat
  useEffect(() => {
    if (clearSignal === undefined) return;
    // only clear when a clearSignal is updated
    setMessages([]);
    if (onDraftStateChange) onDraftStateChange(sessionId, false);
  }, [clearSignal]);

  // When messages change, auto-scroll the chat body to the bottom.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    // Scroll to bottom smoothly.
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

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
      // If we're working with a local (client-only) session id, send undefined
      // so the server creates and persists the session on first message.
      const sessionIdToSend =
        sessionId && !sessionId?.startsWith("local-") ? sessionId : undefined;

      const data = await sendChat(trimmed, sessionIdToSend);
      const reply: ChatMessage = data.reply;
      setMessages((prev) => [...prev, reply]);

      // If the server created a session (i.e., we used a temp id), notify the
      // parent so it can update its state and refresh the sessions list.
      if (onSessionCreated && (!sessionId || sessionId?.startsWith("local-"))) {
        const serverSid = data.sessionId;
        try {
          if (serverSid) onSessionCreated(sessionId, serverSid);
        } catch (e) {
          // ignore
        }
      }

      // Notify parent to refresh sessions list (so last-updated sorts correctly)
      // Only refresh if we're operating on a persisted sessionId (not a local draft).
      if (onSessionActivity && sessionIdToSend) onSessionActivity();
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
      if (!loading && input.trim().length > 0) sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>Pocket LLM Chat</h1>
        <span className="status-pill">{loading ? "Thinking..." : "Idle"}</span>
      </header>
      <main className="chat-body" ref={bodyRef}>
        {messages.length === 0 && (
          <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            Start a conversation by typing a message below.
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

        <button
          onClick={sendMessage}
          disabled={loading || input.trim().length === 0}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </footer>
    </div>
  );
}
