import { useReducer, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import {createSession, listSessions, LocalSessionItem, Session} from "../services/sessions.service";


type State = {
  currentSessionId?: string;
  localSessions: LocalSessionItem[];
};

type Action =
  | { type: "select"; id?: string }
  | { type: "createLocal"; session: LocalSessionItem };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "select":
      return { ...state, currentSessionId: action.id };
    case "createLocal":
      return {
        ...state,
        currentSessionId: action.session.id,
        localSessions: [action.session, ...state.localSessions],
      };
    default:
      return state;
  }
}

const initialState: State = {
  currentSessionId: undefined,
  localSessions: [],
};

export function useSessions() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: queryKeys.sessions.list(),
    queryFn: listSessions,
  });

  const createSessionMutation = useMutation({
    mutationFn: (title?: string) => createSession(title),
    onSuccess: (session: Session) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.list(),
      });
      dispatch({ type: "select", id: session.id });
    },
  });

  const select = useCallback((id?: string) => {
    dispatch({ type: "select", id });
  }, []);

  const createLocal = useCallback((session: LocalSessionItem) => {
    dispatch({ type: "createLocal", session });
  }, []);

  return {
    state,
    serverSessions: sessionsQuery.data ?? [],
    isLoading: sessionsQuery.isLoading,
    actions: {
      select,
      createLocal,
      createSession: (title?: string) =>
        createSessionMutation.mutate(title),
    },
  } as const;
}
