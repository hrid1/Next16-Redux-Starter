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