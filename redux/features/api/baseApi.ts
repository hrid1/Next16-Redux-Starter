import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
    
import { extractTokensFromAuthPayload } from "@/lib/auth-tokens";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/session";

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

    const goLogin = () => {
      if (typeof window === "undefined") return;
      const p = window.location.pathname;
      if (p === "/login" || p.startsWith("/login/")) return;
      window.location.href = "/login";
    };

    if (!refreshEnabled) {
      await clearTokens();
      goLogin();
      return result;
    }

    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      await clearTokens();
      goLogin();
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
      goLogin();
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