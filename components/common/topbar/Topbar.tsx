"use client";

import { Bell, Menu, User } from "lucide-react";
import useAuth from "@/hooks/useAuth";

type Props = {
  onMenuClick?: () => void;
};

export const Topbar = ({ onMenuClick }: Props) => {
  const { user } = useAuth();

  const email = user?.email ?? "—";
  const role = user?.type ?? "—";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#EAECF0] bg-white px-4 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-1.5 hover:bg-gray-100 md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            className="rounded-full border border-solid border-white/10 bg-gray-100 p-2 transition-colors hover:border-[#F6D642]/40"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <span className="absolute right-2.5 top-2.5 h-2 w-2 shrink-0 rounded-[14px] bg-[#EB3D4D]" />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-solid border-white/10 bg-gray-100 p-2 transition-colors hover:border-[#F6D642]/40"
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </button>
          <div>
            <p className="text-sm font-semibold leading-[150%]">{email}</p>
            <p className="text-xs font-normal leading-[150%] text-gray-500">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};