import { useCallback, useReducer } from "react";
import type { SessionItem } from "@common/types/session";

export type LocalSessionItem = SessionItem & { local?: true };

type State = {
  currentSessionId?: string;
  localSessions: LocalSessionItem[];
  localSessionHasMessages: Record<string, boolean>;
  sessionsReloadKey: number;
  clearSignal: number;
};

type Action =
  | { type: "select"; id?: string }
  | { type: "createLocal"; session: LocalSessionItem }
  | { type: "clearDraft" }
  | { type: "persisted"; tempId?: string; serverId: string }
  | { type: "markDraftHasMessages"; id: string; hasMessages: boolean }
  | { type: "bumpReload" }
  | { type: "bumpClearSignal" };

const initial: State = {
  currentSessionId: undefined,
  localSessions: [],
  localSessionHasMessages: {},
  sessionsReloadKey: 0,
  clearSignal: 0,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "select":
      return { ...state, currentSessionId: action.id };
    case "createLocal":
      return {
        ...state,
        localSessions: [action.session, ...state.localSessions],
        currentSessionId: action.session.id,
      };
    case "clearDraft":
      return { ...state, clearSignal: state.clearSignal + 1 };
    case "persisted": {
      const nextLocal = action.tempId
        ? state.localSessions.filter((s) => s.id !== action.tempId)
        : state.localSessions;
      const nextHasMessages = { ...state.localSessionHasMessages };
      if (action.tempId) delete nextHasMessages[action.tempId];
      const nextCurrent =
        !action.tempId || state.currentSessionId === action.tempId
          ? action.serverId
          : state.currentSessionId;
      return {
        ...state,
        localSessions: nextLocal,
        localSessionHasMessages: nextHasMessages,
        currentSessionId: nextCurrent,
        sessionsReloadKey: state.sessionsReloadKey + 1,
      };
    }
    case "markDraftHasMessages":
      return {
        ...state,
        localSessionHasMessages: {
          ...state.localSessionHasMessages,
          [action.id]: action.hasMessages,
        },
      };
    case "bumpReload":
      return { ...state, sessionsReloadKey: state.sessionsReloadKey + 1 };
    case "bumpClearSignal":
      return { ...state, clearSignal: state.clearSignal + 1 };
    default:
      return state;
  }
}

export function useSessions() {
  const [state, dispatch] = useReducer(reducer, initial);

  const select = useCallback(
    (id?: string) => dispatch({ type: "select", id }),
    []
  );
  const createLocal = useCallback(
    (session: LocalSessionItem) => dispatch({ type: "createLocal", session }),
    []
  );
  const clearDraft = useCallback(() => dispatch({ type: "clearDraft" }), []);
  const persisted = useCallback(
    (tempId: string | undefined, serverId: string) =>
      dispatch({ type: "persisted", tempId, serverId }),
    []
  );
  const markDraftHasMessages = useCallback(
    (id: string, hasMessages: boolean) =>
      dispatch({ type: "markDraftHasMessages", id, hasMessages }),
    []
  );
  const bumpReload = useCallback(() => dispatch({ type: "bumpReload" }), []);
  const bumpClearSignal = useCallback(
    () => dispatch({ type: "bumpClearSignal" }),
    []
  );

  return {
    state,
    actions: {
      select,
      createLocal,
      clearDraft,
      persisted,
      markDraftHasMessages,
      bumpReload,
      bumpClearSignal,
    },
  } as const;
}
