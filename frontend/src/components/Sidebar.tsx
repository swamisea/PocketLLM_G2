import { useEffect, useState } from "react";
import type { SessionItem } from "@common/types/session";
import { listSessions } from "../services/sessions.service";
type LocalSessionItem = SessionItem & { local?: true };

export default function Sidebar({
  currentSessionId,
  onSelect,
  onNew,
  reloadKey,
  localSessions,
}: {
  currentSessionId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  reloadKey?: number;
  localSessions?: LocalSessionItem[];
}) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const items = await listSessions();
      setSessions(items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [reloadKey]);

  const handleNew = () => {
    try {
      onNew();
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <button onClick={handleNew} className="new-chat-btn">
          + New chat
        </button>
      </div>
      <div className="session-list">
        {loading && sessions.length === 0 && (
          <div className="muted">Loading...</div>
        )}
        {(localSessions || []).map((s: LocalSessionItem) => (
          <div
            key={s.id}
            className={`session-tile ${
              s.id === currentSessionId ? "active" : ""
            } local`}
            onClick={() => onSelect(s.id)}
          >
            <div className="session-title">{s.title}</div>
            <div className="session-meta">
              {new Date(s.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
        {sessions.map((s: SessionItem) => (
          <div
            key={s.id}
            className={`session-tile ${
              s.id === currentSessionId ? "active" : ""
            }`}
            onClick={() => onSelect(s.id)}
          >
            <div className="session-title">{s.title}</div>
            <div className="session-meta">
              {new Date(s.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
        {sessions.length + (localSessions || []).length === 0 && !loading && (
          <div className="muted">No sessions yet. Start a new chat.</div>
        )}
      </div>
    </aside>
  );
}
