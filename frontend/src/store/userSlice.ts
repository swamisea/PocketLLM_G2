import { User } from "@common/types/account";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";


export interface UserState {
  user: User | null;
}

const initialState: UserState = {
  user: null,
};



const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
    clearUser(state) {
      state.user = null;
    },
    setUserPreferences(state, action: PayloadAction<User['preferences']>){
      if (state.user) {
        state.user = {
          ...state.user,
          preferences: action.payload
        };
      }
    }
  },
});

export const { setUser, clearUser, setUserPreferences } = userSlice.actions;
export const userReducer = userSlice.reducer;
