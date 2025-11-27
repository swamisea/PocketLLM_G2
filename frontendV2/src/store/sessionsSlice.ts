import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { SessionItem } from "@common/types/session";

export type SessionListItem = SessionItem & { local?: boolean };

interface SessionsState {
  selectedId?: string;
  draft?: SessionListItem | null; // local temporary session
}

const initialState: SessionsState = {
  selectedId: undefined,
  draft: null,
};

const sessionsSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    setSelectedSessionId(state, action: PayloadAction<string | undefined>) {
      state.selectedId = action.payload;
    },
    startDraftSession(state, action: PayloadAction<SessionListItem>) {
      state.draft = action.payload;
      state.selectedId = action.payload.id;
    },
    clearDraftSession(state) {
      state.draft = null;
    },
  },
});

export const {
  setSelectedSessionId,
  startDraftSession,
  clearDraftSession,
} = sessionsSlice.actions;

export const sessionsReducer = sessionsSlice.reducer;
export type SessionsStateType = SessionsState;
