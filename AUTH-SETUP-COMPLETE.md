# Complete auth setup (copy-paste reference)

This document is a **standalone guide** with **full source code** for the Next.js + Redux Toolkit + RTK Query + httpOnly cookie (Server Actions) pattern used in this repo. Use it to recreate the same setup in another project.

**Prerequisites:** `tsconfig.json` paths alias `@/*` → project root (or replace `@/` imports with your paths).

**Dependencies:**

```json
{
  "dependencies": {
    "@reduxjs/toolkit": "^2.11.2",
    "next": "16.x",
    "react": "19.x",
    "react-dom": "19.x",
    "react-redux": "^9.2.0"
  }
}
```

**Environment (`.env.local`):**

```bash
NEXT_PUBLIC_API_URL=https://your-api.example.com
NEXT_PUBLIC_ENABLE_REFRESH=false
```

---

## 1. `lib/session.ts`

HttpOnly cookies via Server Actions. Cookie names: `access-token`, optional `refresh-token`.

```ts
"use server";
import { cookies } from "next/headers";

const ACCESS_TOKEN_MAX_AGE = 24 * 60 * 60; // 24 hours — adjust as needed
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

const refreshFlowEnabled = () =>
  process.env.NEXT_PUBLIC_ENABLE_REFRESH === "true";

export async function setTokens(
  accessToken: string,
  refreshToken?: string | null
) {
  const cookieStore = await cookies();

  cookieStore.set("access-token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: "/",
  });

  if (refreshFlowEnabled() && refreshToken) {
    cookieStore.set("refresh-token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_MAX_AGE,
      path: "/",
    });
  } else {
    cookieStore.delete("refresh-token");
  }
}

export async function clearTokens() {
  const cookieStore = await cookies();
  cookieStore.delete("access-token");
  cookieStore.delete("refresh-token");
}

export async function getAccessToken() {
  return (await cookies()).get("access-token")?.value;
}

export async function getRefreshToken() {
  return (await cookies()).get("refresh-token")?.value;
}
```

---

## 2. `lib/auth-tokens.ts`

```ts
/** Normalize token fields from API payloads (login / refresh). */
export function extractTokensFromAuthPayload(payload: unknown): {
  accessToken: string;
  refreshToken: string;
} | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const auth = p.authorization;
  if (auth && typeof auth === "object") {
    const a = auth as Record<string, unknown>;
    if (
      typeof a.access_token === "string" &&
      typeof a.refresh_token === "string"
    ) {
      return {
        accessToken: a.access_token,
        refreshToken: a.refresh_token,
      };
    }
  }
  if (
    typeof p.access_token === "string" &&
    typeof p.refresh_token === "string"
  ) {
    return { accessToken: p.access_token, refreshToken: p.refresh_token };
  }
  if (
    typeof p.accessToken === "string" &&
    typeof p.refreshToken === "string"
  ) {
    return { accessToken: p.accessToken, refreshToken: p.refreshToken };
  }
  return null;
}
```

---

## 3. `redux/features/auth/authTypes.ts`

Adjust `User` and response types to match your API.

```ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  country_code: string | null;
  phone_number: string | null;
  type: string;
  gender: string | null;
  date_of_birth: string | null;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponseBody {
  success?: boolean;
  message?: string;
  authorization?: {
    type?: string;
    access_token: string;
    refresh_token: string;
  };
  access_token?: string;
  refresh_token?: string;
}

export interface MeResponseBody {
  success?: boolean;
  data?: User;
  message?: string;
}

export interface AuthState {
  user: User | null;
  isHydrated: boolean;
}
```

---

## 4. `redux/features/auth/authSlice.ts`

```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, User } from "./authTypes";

const initialState: AuthState = {
  user: null,
  isHydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
    setHydrated(state, action: PayloadAction<boolean>) {
      state.isHydrated = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.isHydrated = false;
    },
  },
});

export const { setUser, setHydrated, clearAuth } = authSlice.actions;

export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsHydrated = (state: { auth: AuthState }) =>
  state.auth.isHydrated;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.user !== null;

export default authSlice.reducer;
```

---

## 5. `redux/features/api/baseApi.ts`

```ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { extractTokensFromAuthPayload } from "@/lib/auth-tokens";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/lib/session";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  prepareHeaders: async (headers) => {
    if (!headers.has("Authorization")) {
      const token = await getAccessToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: typeof baseQuery = async (args, api, extra) => {
  let result = await baseQuery(args, api, extra);

  if (result.error?.status === 401) {
    const refreshEnabled = process.env.NEXT_PUBLIC_ENABLE_REFRESH === "true";

    if (!refreshEnabled) {
      await clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      return result;
    }

    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      await clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      return result;
    }

    const refreshResult = await baseQuery(
      { url: "/auth/refresh", method: "POST", body: { refreshToken } },
      api,
      extra
    );

    const parsed = extractTokensFromAuthPayload(refreshResult.data);
    if (parsed) {
      await setTokens(parsed.accessToken, parsed.refreshToken);
      result = await baseQuery(args, api, extra);
    } else {
      await clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User", "Auth"],
  endpoints: () => ({}),
});
```

---

## 6. `redux/features/auth/authApi.ts`

```ts
import { baseApi } from "@/redux/features/api/baseApi";

import { extractTokensFromAuthPayload } from "@/lib/auth-tokens";
import { clearTokens, setTokens } from "@/lib/session";

import type {
  LoginCredentials,
  LoginResponseBody,
  MeResponseBody,
  User,
} from "./authTypes";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<User, LoginCredentials>({
      async queryFn(credentials, _api, _extra, baseQuery) {
        const loginRes = await baseQuery({
          url: "/auth/login",
          method: "POST",
          body: credentials,
        });

        if (loginRes.error) return { error: loginRes.error };

        const body = loginRes.data as LoginResponseBody;
        if (body.success === false) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: body.message ?? "Login failed",
            },
          };
        }

        const tokens = extractTokensFromAuthPayload(body);
        if (!tokens) {
          return {
            error: { status: "CUSTOM_ERROR", error: "Invalid login response" },
          };
        }
        try {
          await setTokens(tokens.accessToken, tokens.refreshToken);
        } catch (e) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error:
                e instanceof Error
                  ? e.message
                  : "Failed to persist session",
            },
          };
        }

        const meRes = await baseQuery({
          url: "/auth/me",
          method: "GET",
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
        if (meRes.error) {
          await clearTokens();
          return { error: meRes.error };
        }

        const user = (meRes.data as MeResponseBody)?.data;
        if (!user) {
          return {
            error: { status: "CUSTOM_ERROR", error: "Failed to load profile" },
          };
        }

        return { data: user };
      },
      invalidatesTags: ["Auth", "User"],
    }),

    fetchMe: builder.query<User, void>({
      query: () => ({ url: "/auth/me", method: "GET" }),
      transformResponse: (res: MeResponseBody) => res.data!,
      providesTags: ["User"],
    }),

    logout: builder.mutation<void, void>({
      async queryFn() {
        await clearTokens();
        return { data: undefined };
      },
      invalidatesTags: ["Auth", "User"],
    }),

    refreshToken: builder.mutation<void, { refreshToken: string }>({
      query: (body) => ({
        url: "/auth/refresh",
        method: "POST",
        body,
      }),
    }),
  }),

  overrideExisting: false,
});

export const {
  useLoginMutation,
  useFetchMeQuery,
  useLogoutMutation,
  useRefreshTokenMutation,
} = authApi;
```

---

## 7. `redux/store.ts`

```ts
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/redux/features/api/baseApi";
import authReducer from "@/redux/features/auth/authSlice";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

## 8. `redux/hooks.ts`

```ts
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);
```

---

## 9. `redux/ReduxProvider.tsx`

```tsx
"use client";

import { store } from "@/redux/store";
import { Provider } from "react-redux";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
```

---

## 10. `hooks/useAuth.ts`

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  useLoginMutation,
  useLogoutMutation,
} from "@/redux/features/auth/authApi";
import {
  clearAuth,
  selectIsAuthenticated,
  selectIsHydrated,
  selectUser,
  setUser,
} from "@/redux/features/auth/authSlice";
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
```

---

## 11. `components/provider/AuthProvider.tsx`

Runs `useFetchMeQuery()` on every page; syncs Redux and blocks UI until resolved.

```tsx
"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { useFetchMeQuery } from "@/redux/features/auth/authApi";
import {
  clearAuth,
  setHydrated,
  setUser,
} from "@/redux/features/auth/authSlice";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { data: user, isSuccess, isError, isLoading } = useFetchMeQuery();

  useEffect(() => {
    if (isSuccess && user) {
      dispatch(setUser(user));
      dispatch(setHydrated(true));
    }
    if (isError) {
      dispatch(clearAuth());
      dispatch(setHydrated(true));
    }
  }, [isSuccess, isError, user, dispatch]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <p>Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
```

---

## 12. `components/provider/Providers.tsx`

```tsx
"use client";

import { ReduxProvider } from "@/redux/ReduxProvider";
import { AuthProvider } from "./AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <AuthProvider>{children}</AuthProvider>
    </ReduxProvider>
  );
}
```

---

## 13. `app/layout.tsx` (root — must wrap with `Providers`)

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/provider/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## 14. `proxy.ts` (optional route guard)

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-otp",
  "/set-password",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("access-token")?.value;

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(token ? "/dashboard" : "/login", request.url)
    );
  }

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
```

---

## 15. `middleware.ts` (project root — wires `proxy`)

Create next to `app/`:

```ts
import type { NextRequest } from "next/server";
import { proxy } from "./proxy";

export function middleware(request: NextRequest) {
  return proxy(request);
}

export { config } from "./proxy";
```

---

## 16. Example login page and form

**`app/(auth)/login/page.tsx`**

```tsx
import React from "react";
import LoginForm from "./_components/LoginForm";

export default function page() {
  return (
    <div>
      <LoginForm />
    </div>
  );
}
```

**`app/(auth)/login/_components/LoginForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import useAuth from "@/hooks/useAuth";

export default function LoginForm() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("12345678");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      await login({ email, password });
    } catch (err) {
      console.log(err);
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const loading = isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 mt-2">
            Enter your credentials to access your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <a
                href="#"
                className="text-xs text-blue-600 hover:underline"
              >
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Logging in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-8">
          Don&apos;t have an account?{" "}
          <a href="#" className="text-blue-600 font-semibold hover:underline">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
```

---

## 17. Example dashboard page

**`app/(dashboard)/dashboard/page.tsx`**

```tsx
"use client";

import React from "react";
import useAuth from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <div>
      <h1>This is dashboard</h1>
      <h1>Hi, {user?.name}</h1>
    </div>
  );
}
```

---

## 18. `tsconfig.json` paths (typical)

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## Notes for other projects

1. **Login + `/auth/me`:** The explicit `Authorization` header on the profile request avoids calling `getAccessToken()` immediately after `setTokens` (helps with Next.js 16 Server Action sequencing).

2. **`AuthProvider`:** Calls `/auth/me` on every route; for marketing pages you may want to move it under a `(app)` layout instead of root, or skip `fetchMe` on public routes.

3. **Selectors:** `authSlice` selectors in this doc use `(state: { auth: AuthState })`; with `RootState` you can change them to `(state: RootState) => state.auth.user` once `RootState` includes `auth`.

4. **Duplicate types:** If your repo’s `authTypes.ts` still has duplicated blocks, replace the file with section **3** above once.

---

End of **AUTH-SETUP-COMPLETE.md**.
