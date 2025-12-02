import { useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store";
import { setUser, clearUser } from "../store/userSlice";
import { setUserCookie, clearUserCookie } from "../utils/authCookies";
import { queryKeys } from "../lib/queryKeys";
import {createUser, loginUser, guestLogin, guestAvailable } from "../services/account.service";

export function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);

  const loginMutation = useMutation({
    mutationKey: [queryKeys.account.me],
    mutationFn: loginUser,
    onSuccess: (data) => {
      if (data.success && data.user) {
        const userObj = data.user
        setUserCookie(userObj, data.token);
        dispatch(setUser(userObj));
      }
    },
  });

  const guestLoginMutation = useMutation({
    mutationKey: [queryKeys.account.me],
    mutationFn: guestLogin,
    onSuccess: (data) => {
      if (data.success && data.user) {
        const userObj = data.user
        setUserCookie(userObj, data.token);
        dispatch(setUser(userObj));
      }
    },
  });

  const guestAvailableQuery = useQuery({
    queryKey: queryKeys.account.guestAvailable,
    queryFn: guestAvailable,
  });

  const signupMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (data) => {
      if (data.success && data.user) {
        const userObj = data.user
        setUserCookie(userObj, data.token);
        dispatch(setUser(userObj));
      }
    },
  });

  const logout = useCallback(() => {
    clearUserCookie();
    dispatch(clearUser());
  }, [dispatch]);

  return {
    user,
    isAuthenticated: !!user,
    loginMutation,
    guestLoginMutation,
    guestAvailableQuery,
    signupMutation,
    logout,
  };
}
