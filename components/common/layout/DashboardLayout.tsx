"use client";

import React, { useState } from "react";
import Sidebar from "../sidebar/Sidebar";
import { Topbar } from "../topbar/Topbar";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full w-full bg-white">
      <div className="h-screen">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          variant="collapsible"
        />
      </div>
      <main className="flex-1 w-full overflow-auto bg-gray-50">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        {children}
      </main>
    </div>
  );
}