import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { SessionItem } from "@common/types/session";

interface SessionsState {
  selectedId?: string;
}

const initialState: SessionsState = {
  selectedId: undefined,
};

const sessionsSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    setSelectedSessionId(state, action: PayloadAction<string | undefined>) {
      state.selectedId = action.payload;
    },
  },
});

export const {
  setSelectedSessionId,
} = sessionsSlice.actions;

export const sessionsReducer = sessionsSlice.reducer;
export type SessionsStateType = SessionsState;
