"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useLoginMutation, useLogoutMutation } from "@/redux/features/auth/authApi";
import { clearAuth, selectIsAuthenticated, selectIsHydrated, selectUser, setUser } from "@/redux/features/auth/authSlice";
import type { LoginCredentials } from "@/redux/features/auth/authTypes";

const useAuth = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectUser);
  const isHydrated = useAppSelector(selectIsHydrated);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [loginMutation, { isLoading: isLoginLoading, error: loginError }] =
    useLoginMutation();
  const [logoutMutation, { isLoading: isLogoutLoading }] = useLogoutMutation();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const user = await loginMutation(credentials).unwrap();
      dispatch(setUser(user));
      router.push("/dashboard");
    },
    [loginMutation, dispatch, router]
  );

  const logout = useCallback(async () => {
    await logoutMutation().unwrap();
    dispatch(clearAuth());
    router.push("/login");
  }, [logoutMutation, dispatch, router]);

  return {
    user,
    isHydrated,
    isAuthenticated,
    isLoading: isLoginLoading || isLogoutLoading,
    loginError,
    login,
    logout,
  };
};

export default useAuth;