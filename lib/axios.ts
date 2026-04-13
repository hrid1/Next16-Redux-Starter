// lib/apiSlice.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken, clearTokens, setTokens, getRefreshToken } from "@/lib/session";
import { extractTokensFromAuthPayload } from "@/lib/auth-tokens";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  prepareHeaders: async (headers) => {
    const token = await getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

// Wraps baseQuery with 401 refresh logic (replaces Axios interceptor)
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
      result = await baseQuery(args, api, extra); // retry original
    } else {
      await clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
});