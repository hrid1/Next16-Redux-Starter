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