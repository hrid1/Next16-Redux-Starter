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