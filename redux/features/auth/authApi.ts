import { baseApi } from "@/redux/features/api/baseApi";

import { extractTokensFromAuthPayload } from "@/lib/auth-tokens";
import { clearTokens, setTokens } from "@/lib/session";

import type { LoginCredentials, LoginResponseBody, MeResponseBody, User } from "./authTypes";

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        login: builder.mutation<User, LoginCredentials>({
            async queryFn(credentials, _api, _extra, baseQuery) {
                // Step 1: login
                const loginRes = await baseQuery({
                    url: "/auth/login",
                    method: "POST",
                    body: credentials,
                });

                if (loginRes.error) return { error: loginRes.error };

                const body = loginRes.data as LoginResponseBody;
                if (body.success === false) {
                    return {
                        error: { status: "CUSTOM_ERROR", error: body.message ?? "Login failed" },
                    };
                }

                // Step 2: extract and save tokens
                const tokens = extractTokensFromAuthPayload(body);
                if (!tokens) {
                    return { error: { status: "CUSTOM_ERROR", error: "Invalid login response" } };
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

                // Step 3: fetch user profile (send Bearer here so we do not rely on a second
                // Server Action getAccessToken right after setTokens — that sequence can
                // throw "An unexpected response was received from the server" in Next.js 16.)
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
                    return { error: { status: "CUSTOM_ERROR", error: "Failed to load profile" } };
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

        // Optional: only if backend supports it
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