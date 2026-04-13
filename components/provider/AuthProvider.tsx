"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { useFetchMeQuery } from "@/redux/features/auth/authApi";
import { clearAuth, setHydrated, setUser } from "@/redux/features/auth/authSlice";

const PUBLIC_AUTH_PATH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-otp",
  "/set-password",
];

function isPublicAuthPath(pathname: string | null) {
  if (!pathname) return false;
  return PUBLIC_AUTH_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const skipFetchMe = isPublicAuthPath(pathname);

  const { data: user, isSuccess, isError, isLoading } = useFetchMeQuery(
    undefined,
    {
      skip: skipFetchMe,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  useEffect(() => {
    if (skipFetchMe) {
      dispatch(setHydrated(true));
      return;
    }
    if (isSuccess && user) {
      dispatch(setUser(user));
      dispatch(setHydrated(true));
    }
    if (isError) {
      dispatch(clearAuth());
      dispatch(setHydrated(true));
    }
  }, [skipFetchMe, isSuccess, isError, user, dispatch]);

  if (!skipFetchMe && isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}


// // ======================== NEW AUTH PROVIDER ========================
// "use client";

// import { useEffect } from "react";
// import { useAppDispatch } from "@/redux/hooks";
// import { useFetchMeQuery } from "@/redux/features/auth/authApi";
// import {
//   clearAuth,
//   setHydrated,
//   setUser,
// } from "@/redux/features/auth/authSlice";

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const dispatch = useAppDispatch();
//   const { data: user, isSuccess, isError, isLoading } = useFetchMeQuery();

//   useEffect(() => {
//     if (isSuccess && user) {
//       dispatch(setUser(user));
//       dispatch(setHydrated(true));
//     }
//     if (isError) {
//       dispatch(clearAuth());
//       dispatch(setHydrated(true));
//     }
//   }, [isSuccess, isError, user, dispatch]);

//   if (isLoading) {
//     return (
//       <div className="flex min-h-screen w-full items-center justify-center">
//         <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
//         <p>Loading...</p>
//       </div>
//     );
//   }

//   return <>{children}</>;
// }