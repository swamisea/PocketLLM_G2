import { configureStore } from "@reduxjs/toolkit";
import { userReducer } from "./userSlice";
import { getUserFromCookie } from "../utils/authCookies";
import { sessionsReducer } from "./sessionsSlice";

const preloadedUser = getUserFromCookie();

export const store = configureStore({
  reducer: {
    user: userReducer,
    sessions: sessionsReducer,
  },
  preloadedState: {
    user: { user: preloadedUser },
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
